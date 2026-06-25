#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════════╗
║  MOTORSPORT HUB — TELEMETRY FETCHER                                    ║
║  Fetches race telemetry via free/open-source APIs and exports JSON     ║
║  for the Next.js frontend to replay.                                    ║
╚══════════════════════════════════════════════════════════════════════════╝

DATA SOURCES (all free & open-source):
──────────────────────────────────────
  F1 / F2 / F3:
    Library:  FastF1 (https://github.com/theOehrly/Fast-F1)
    License:  MIT
    Data:     Official F1 live timing data (free, no API key needed)
    Coverage: F1 since 2018, F2 since 2019, F3 since 2019
    Install:  pip install fastf1

  Formula E:
    No free open-source API with telemetry exists.
    → Uses client-side simulation in the frontend.

  NASCAR:
    No free open-source telemetry API exists.
    Community project: https://github.com/dmamontov/nascar-live (limited)
    → Uses client-side simulation in the frontend.

  GT World Challenge:
    No free open-source telemetry API exists.
    → Uses client-side simulation in the frontend.

  Top Fuel / NHRA:
    No free open-source telemetry API exists.
    → Uses client-side simulation in the frontend.

USAGE:
  python scripts/fetch_telemetry.py --series f1 --year 2024 --round 1
  python scripts/fetch_telemetry.py --series f2 --year 2024 --round 1
  python scripts/fetch_telemetry.py --series f1 --year 2024 --round 1 --session sprint
  python scripts/fetch_telemetry.py --list-races --year 2024 --series f1

OUTPUT:
  public/replay-data/{series}/{year}_round{round}_{session}.json
"""

import argparse
import json
import math
import os
import sys
from datetime import timedelta
from pathlib import Path

import fastf1
import numpy as np
import pandas as pd

# ═══════════════════════════════════════════════════════════════════════
# CONFIG
# ═══════════════════════════════════════════════════════════════════════

FPS = 25
DT = 1.0 / FPS

# FastF1 cache directory
CACHE_DIR = os.path.join(os.path.dirname(__file__), ".fastf1-cache")

# Output directory (relative to project root)
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "replay-data")

# Series → FastF1 session type mapping
SERIES_SESSION_MAP = {
    "f1": {"race": "R", "sprint": "S", "qualifying": "Q"},
    "f2": {"race": "R", "sprint": "S", "qualifying": "Q"},
    "f3": {"race": "R", "sprint": "S", "qualifying": "Q"},
}

SUPPORTED_SERIES = list(SERIES_SESSION_MAP.keys())


# ═══════════════════════════════════════════════════════════════════════
# CACHE SETUP
# ═══════════════════════════════════════════════════════════════════════

def enable_cache():
    os.makedirs(CACHE_DIR, exist_ok=True)
    fastf1.Cache.enable_cache(CACHE_DIR)
    print(f"✓ FastF1 cache enabled at: {CACHE_DIR}")


# ═══════════════════════════════════════════════════════════════════════
# TYRE COMPOUND MAPPING
# ═══════════════════════════════════════════════════════════════════════

TYRE_COMPOUND_MAP = {
    "SOFT": "SOFT",
    "MEDIUM": "MEDIUM",
    "HARD": "HARD",
    "INTERMEDIATE": "INTER",
    "WET": "WET",
    "SUPERSOFT": "SOFT",
    "ULTRASOFT": "SOFT",
    "HYPERSOFT": "SOFT",
    "TEST_UNKNOWN": "MEDIUM",
    "UNKNOWN": "MEDIUM",
}

def map_tyre_compound(compound: str) -> str:
    if compound is None or pd.isna(compound):
        return "MEDIUM"
    return TYRE_COMPOUND_MAP.get(str(compound).upper(), "MEDIUM")


# ═══════════════════════════════════════════════════════════════════════
# DRIVER COLOR EXTRACTION
# ═══════════════════════════════════════════════════════════════════════

def get_driver_colors(session) -> dict:
    """Extract driver team colors as hex strings."""
    try:
        color_mapping = fastf1.plotting.get_driver_color_mapping(session)
        return {driver: f"#{hex_color.lstrip('#')}" for driver, hex_color in color_mapping.items()}
    except Exception as e:
        print(f"  ⚠ Could not get driver colors: {e}")
        return {}


# ═══════════════════════════════════════════════════════════════════════
# TRACK GEOMETRY EXTRACTION
# ═══════════════════════════════════════════════════════════════════════

def extract_track_geometry(session) -> dict:
    """Extract track edges and racing line from the session's fastest lap."""
    try:
        fastest_lap = session.laps.pick_fastest()
        if fastest_lap is None:
            return None

        tel = fastest_lap.get_telemetry()
        if tel is None or tel.empty:
            return None

        # Get circuit info for rotation
        circuit_info = session.get_circuit_info()
        rotation = float(circuit_info.rotation) if circuit_info else 0.0

        # Racing line from telemetry
        x_ref = tel["X"].to_numpy().astype(float)
        y_ref = tel["Y"].to_numpy().astype(float)

        # Offset for inner/outer edges
        dx = np.gradient(x_ref)
        dy = np.gradient(y_ref)
        norm = np.sqrt(dx ** 2 + dy ** 2)
        norm[norm == 0] = 1.0
        nx = -dy / norm
        ny = dx / norm

        track_width = 12.0  # metres (approximate)
        x_inner = x_ref + nx * track_width
        y_inner = y_ref + ny * track_width
        x_outer = x_ref - nx * track_width
        y_outer = y_ref - ny * track_width

        # Subsample for smaller JSON (every 5th point)
        step = 5
        return {
            "referenceLine": [
                {"x": round(float(x_ref[i]), 1), "y": round(float(y_ref[i]), 1)}
                for i in range(0, len(x_ref), step)
            ],
            "innerEdge": [
                {"x": round(float(x_inner[i]), 1), "y": round(float(y_inner[i]), 1)}
                for i in range(0, len(x_inner), step)
            ],
            "outerEdge": [
                {"x": round(float(x_outer[i]), 1), "y": round(float(y_outer[i]), 1)}
                for i in range(0, len(x_outer), step)
            ],
            "rotation": rotation,
        }
    except Exception as e:
        print(f"  ⚠ Track geometry extraction failed: {e}")
        return None


# ═══════════════════════════════════════════════════════════════════════
# SINGLE DRIVER TELEMETRY PROCESSING
# ═══════════════════════════════════════════════════════════════════════

def process_driver(driver_no, session, driver_code):
    """Process telemetry for a single driver. Returns a dict or None."""
    try:
        laps_driver = session.laps.pick_drivers(driver_no)
        if laps_driver.empty:
            return None

        driver_max_lap = int(laps_driver.LapNumber.max()) if not laps_driver.empty else 0

        t_all, x_all, y_all = [], [], []
        dist_all, rel_dist_all = [], []
        lap_numbers, tyre_compounds, tyre_life_all = [], [], []
        speed_all, gear_all, drs_all = [], [], []
        throttle_all, brake_all = [], []

        for _, lap in laps_driver.iterlaps():
            lap_tel = lap.get_telemetry()
            if lap_tel.empty:
                continue

            lap_number = lap.LapNumber
            compound = map_tyre_compound(lap.Compound)
            tyre_life = float(lap.TyreLife) if pd.notna(lap.TyreLife) else 0

            t = lap_tel["SessionTime"].dt.total_seconds().to_numpy()
            x = lap_tel["X"].to_numpy()
            y = lap_tel["Y"].to_numpy()
            d = lap_tel["Distance"].to_numpy()
            rd = lap_tel["RelativeDistance"].to_numpy()
            speed = lap_tel["Speed"].to_numpy()
            gear = lap_tel["nGear"].to_numpy()
            drs = lap_tel["DRS"].to_numpy()
            throttle = lap_tel["Throttle"].to_numpy()
            brake = lap_tel["Brake"].to_numpy().astype(float)

            t_all.append(t)
            x_all.append(x)
            y_all.append(y)
            dist_all.append(d)
            rel_dist_all.append(rd)
            lap_numbers.append(np.full_like(t, lap_number))
            # Store compound as string index for each sample
            tyre_compounds.append(np.full(len(t), compound, dtype=object))
            tyre_life_all.append(np.full_like(t, tyre_life))
            speed_all.append(speed)
            gear_all.append(gear)
            drs_all.append(drs)
            throttle_all.append(throttle)
            brake_all.append(brake)

        if not t_all:
            return None

        # Concatenate and sort by time
        t_all = np.concatenate(t_all)
        order = np.argsort(t_all)

        return {
            "code": driver_code,
            "t": t_all[order],
            "x": np.concatenate(x_all)[order],
            "y": np.concatenate(y_all)[order],
            "dist": np.concatenate(dist_all)[order],
            "rel_dist": np.concatenate(rel_dist_all)[order],
            "lap": np.concatenate(lap_numbers)[order],
            "tyre": np.concatenate(tyre_compounds)[order],
            "tyre_life": np.concatenate(tyre_life_all)[order],
            "speed": np.concatenate(speed_all)[order],
            "gear": np.concatenate(gear_all)[order],
            "drs": np.concatenate(drs_all)[order],
            "throttle": np.concatenate(throttle_all)[order],
            "brake": np.concatenate(brake_all)[order],
            "t_min": float(t_all.min()),
            "t_max": float(t_all.max()),
            "max_lap": driver_max_lap,
        }
    except Exception as e:
        print(f"  ⚠ Failed processing {driver_code}: {e}")
        return None


# ═══════════════════════════════════════════════════════════════════════
# PIT STOP DETECTION
# ═══════════════════════════════════════════════════════════════════════

def detect_pit_windows(session, drivers, global_t_min):
    """Build per-driver pit stop time windows."""
    pit_windows = {}
    laps = session.laps

    for driver_no in drivers:
        drv = session.get_driver(driver_no)["Abbreviation"]
        driver_laps = laps.pick_drivers(drv)
        windows = []

        for _, lap in driver_laps.iterrows():
            pit_in = lap.get("PitInTime")
            pit_out = lap.get("PitOutTime")

            if pd.notna(pit_in):
                start = pit_in.total_seconds() - global_t_min
                end = (pit_out.total_seconds() - global_t_min) if pd.notna(pit_out) else start + 40
                windows.append((start, end))

        pit_windows[drv] = windows

    return pit_windows


# ═══════════════════════════════════════════════════════════════════════
# MAIN TELEMETRY EXTRACTION
# ═══════════════════════════════════════════════════════════════════════

def extract_race_telemetry(session, series, session_type_code):
    """
    Extract complete race telemetry and build frame-by-frame replay data.
    Returns a dict ready for JSON serialization.
    """
    print("  → Extracting telemetry...")

    drivers = session.drivers
    driver_codes = {num: session.get_driver(num)["Abbreviation"] for num in drivers}

    # Process each driver
    driver_data = {}
    global_t_min = None
    global_t_max = None
    max_lap_number = 0

    for driver_no in drivers:
        code = driver_codes[driver_no]
        print(f"    Processing {code}...", end=" ", flush=True)
        result = process_driver(driver_no, session, code)

        if result is None:
            print("SKIP")
            continue

        print("OK")
        driver_data[code] = result
        t_min = result["t_min"]
        t_max = result["t_max"]
        max_lap_number = max(max_lap_number, result["max_lap"])

        global_t_min = t_min if global_t_min is None else min(global_t_min, t_min)
        global_t_max = t_max if global_t_max is None else max(global_t_max, t_max)

    if global_t_min is None:
        raise ValueError("No valid telemetry found for any driver")

    print(f"  → {len(driver_data)} drivers processed, {max_lap_number} laps")

    # Create common timeline
    timeline = np.arange(global_t_min, global_t_max, DT) - global_t_min

    # Resample each driver onto the common timeline
    resampled = {}
    for code, data in driver_data.items():
        t = data["t"] - global_t_min
        order = np.argsort(t)
        t_sorted = t[order]

        # Resample numeric arrays
        x_r = np.interp(timeline, t_sorted, data["x"][order])
        y_r = np.interp(timeline, t_sorted, data["y"][order])
        dist_r = np.interp(timeline, t_sorted, data["dist"][order])
        rel_dist_r = np.interp(timeline, t_sorted, data["rel_dist"][order])
        lap_r = np.interp(timeline, t_sorted, data["lap"][order])
        tyre_life_r = np.interp(timeline, t_sorted, data["tyre_life"][order])
        speed_r = np.interp(timeline, t_sorted, data["speed"][order])
        gear_r = np.interp(timeline, t_sorted, data["gear"][order])
        drs_r = np.interp(timeline, t_sorted, data["drs"][order])
        throttle_r = np.interp(timeline, t_sorted, data["throttle"][order])
        brake_r = np.interp(timeline, t_sorted, data["brake"][order])

        # Tyre compound: forward-fill (step function)
        tyre_sorted = data["tyre"][order]
        tyre_indices = np.searchsorted(t_sorted, timeline, side="right") - 1
        tyre_indices = np.clip(tyre_indices, 0, len(t_sorted) - 1)
        tyre_r = tyre_sorted[tyre_indices]

        resampled[code] = {
            "x": x_r, "y": y_r, "dist": dist_r, "rel_dist": rel_dist_r,
            "lap": lap_r, "tyre": tyre_r, "tyre_life": tyre_life_r,
            "speed": speed_r, "gear": gear_r, "drs": drs_r,
            "throttle": throttle_r, "brake": brake_r,
        }

    # Detect pit windows
    pit_windows = detect_pit_windows(session, drivers, global_t_min)

    # Track status periods
    track_statuses = []
    for status in session.track_status.to_dict("records"):
        seconds = status["Time"].total_seconds() - global_t_min
        if track_statuses:
            track_statuses[-1]["endTime"] = round(seconds, 3)
        track_statuses.append({
            "status": str(status["Status"]),
            "startTime": round(seconds, 3),
            "endTime": None,
        })

    # Build frames (subsample for JSON size: every 2nd frame = ~12.5 FPS)
    frame_step = 2
    frames = []
    driver_codes_list = list(resampled.keys())

    print(f"  → Building {len(timeline) // frame_step} frames...")

    for i in range(0, len(timeline), frame_step):
        t = float(timeline[i])
        snapshot = {}

        for code in driver_codes_list:
            d = resampled[code]

            lap_val = int(round(d["lap"][i]))
            dist_val = float(d["dist"][i])

            # Pit detection
            in_pit = False
            for start, end in pit_windows.get(code, []):
                if start <= t <= end:
                    in_pit = True
                    break

            snapshot[code] = {
                "x": round(float(d["x"][i]), 1),
                "y": round(float(d["y"][i]), 1),
                "position": 0,  # computed below
                "lap": lap_val,
                "dist": round(dist_val, 1),
                "relDist": round(float(d["rel_dist"][i]), 4),
                "speed": round(float(d["speed"][i])),
                "gear": int(round(d["gear"][i])),
                "tyre": str(d["tyre"][i]),
                "tyreLife": round(float(d["tyre_life"][i])),
                "drs": int(round(d["drs"][i])),
                "throttle": round(float(d["throttle"][i])),
                "brake": round(float(d["brake"][i])),
                "inPit": in_pit,
                "retired": False,
            }

        # Sort by (lap desc, dist desc) for positions
        sorted_codes = sorted(
            snapshot.keys(),
            key=lambda c: (snapshot[c]["lap"], snapshot[c]["dist"]),
            reverse=True
        )
        for idx, code in enumerate(sorted_codes):
            snapshot[code]["position"] = idx + 1

        leader_lap = snapshot[sorted_codes[0]]["lap"] if sorted_codes else 1

        # Current track status
        current_status = "1"
        for ts in track_statuses:
            if t >= ts["startTime"] and (ts["endTime"] is None or t < ts["endTime"]):
                current_status = ts["status"]
                break

        frames.append({
            "t": round(t, 3),
            "lap": leader_lap,
            "drivers": snapshot,
            "trackStatus": current_status,
        })

    # Extract track geometry
    track_geom = extract_track_geometry(session)

    # Driver info
    driver_colors = get_driver_colors(session)
    driver_info_list = []
    for driver_no in drivers:
        drv = session.get_driver(driver_no)
        code = drv["Abbreviation"]
        if code in driver_data:
            driver_info_list.append({
                "code": code,
                "name": drv.get("FullName", code),
                "number": int(drv.get("DriverNumber", 0)),
                "team": drv.get("TeamName", "Unknown"),
                "color": driver_colors.get(code, "#FFFFFF"),
            })

    # Session metadata
    event = session.event
    session_info = {
        "seriesId": series,
        "seriesName": {"f1": "Formula 1", "f2": "Formula 2", "f3": "Formula 3"}.get(series, series.upper()),
        "eventName": str(event.EventName),
        "circuitName": str(event.get("Location", event.EventName)),
        "country": str(event.Country),
        "year": int(event.EventDate.year),
        "round": int(event.RoundNumber),
        "sessionType": {"R": "Race", "S": "Sprint", "Q": "Qualifying"}.get(session_type_code, "Race"),
    }

    return {
        "frames": frames,
        "trackGeometry": track_geom,
        "drivers": driver_info_list,
        "driverColors": driver_colors,
        "trackStatuses": track_statuses,
        "totalLaps": max_lap_number,
        "sessionInfo": session_info,
    }


# ═══════════════════════════════════════════════════════════════════════
# LIST RACES
# ═══════════════════════════════════════════════════════════════════════

def list_races(year, series):
    """Print all races for a given year and series."""
    enable_cache()
    schedule = fastf1.get_event_schedule(year)

    print(f"\n{'─' * 60}")
    print(f"  {series.upper()} Schedule — {year}")
    print(f"{'─' * 60}")

    for _, event in schedule.iterrows():
        if event.is_testing():
            continue
        round_num = event["RoundNumber"]
        name = event["EventName"]
        country = event["Country"]
        date = str(event["EventDate"].date())
        fmt = event["EventFormat"]
        sprint = " [SPRINT]" if "sprint" in str(fmt).lower() else ""
        print(f"  Round {round_num:>2}: {name:<35} {country:<15} {date}{sprint}")

    print(f"{'─' * 60}\n")


# ═══════════════════════════════════════════════════════════════════════
# MAIN CLI
# ═══════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description="Motorsport Hub Telemetry Fetcher — Extracts race data via FastF1",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python fetch_telemetry.py --series f1 --year 2024 --round 1
  python fetch_telemetry.py --series f2 --year 2024 --round 3
  python fetch_telemetry.py --series f1 --year 2024 --round 5 --session sprint
  python fetch_telemetry.py --list-races --year 2024 --series f1
        """,
    )

    parser.add_argument("--series", choices=SUPPORTED_SERIES, default="f1",
                        help="Racing series (default: f1)")
    parser.add_argument("--year", type=int, default=2024,
                        help="Season year (default: 2024)")
    parser.add_argument("--round", type=int, default=1,
                        help="Round number (default: 1)")
    parser.add_argument("--session", choices=["race", "sprint", "qualifying"], default="race",
                        help="Session type (default: race)")
    parser.add_argument("--list-races", action="store_true",
                        help="List all races for the given year and series")

    args = parser.parse_args()

    if args.list_races:
        list_races(args.year, args.series)
        return

    # Validate series support
    if args.series not in SERIES_SESSION_MAP:
        print(f"✗ Series '{args.series}' is not supported for data fetching.")
        print(f"  Supported: {', '.join(SUPPORTED_SERIES)}")
        print(f"  Other series use client-side simulation.")
        sys.exit(1)

    enable_cache()

    session_type_code = SERIES_SESSION_MAP[args.series][args.session]

    print(f"\n{'═' * 60}")
    print(f"  Motorsport Hub — Telemetry Fetcher")
    print(f"  Series: {args.series.upper()} | Year: {args.year} | Round: {args.round}")
    print(f"  Session: {args.session} ({session_type_code})")
    print(f"{'═' * 60}\n")

    # Load session via FastF1
    print("  → Loading session from FastF1...")
    try:
        session = fastf1.get_session(args.year, args.round, session_type_code)
        session.load(telemetry=True, weather=True)
    except Exception as e:
        print(f"\n✗ Failed to load session: {e}")
        print("  Check that the year/round/session combination is valid.")
        sys.exit(1)

    print(f"  ✓ Session loaded: {session}")

    # Extract telemetry
    data = extract_race_telemetry(session, args.series, session_type_code)

    # Save to JSON
    output_dir = os.path.join(OUTPUT_DIR, args.series)
    os.makedirs(output_dir, exist_ok=True)

    filename = f"{args.year}_round{args.round}_{args.session}.json"
    output_path = os.path.join(output_dir, filename)

    print(f"  → Saving to {output_path}...")

    with open(output_path, "w") as f:
        json.dump(data, f, separators=(",", ":"))  # compact JSON

    file_size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"\n  ✓ Saved! ({file_size_mb:.1f} MB)")
    print(f"  ✓ {len(data['frames'])} frames, {len(data['drivers'])} drivers")
    print(f"  ✓ {data['totalLaps']} laps")

    if data.get("trackGeometry"):
        n_pts = len(data["trackGeometry"]["referenceLine"])
        print(f"  ✓ Track geometry: {n_pts} reference points")

    print(f"\n{'═' * 60}")
    print(f"  Done! Replay data is ready for the frontend.")
    print(f"{'═' * 60}\n")


if __name__ == "__main__":
    main()
