import json
import urllib.request
import time
import os
import math

NASCAR_TRACKS = [
  "Bowman Gray Stadium",
  "Daytona International Speedway",
  "Atlanta Motor Speedway",
  "Las Vegas Motor Speedway",
  "Phoenix Raceway",
  "Bristol Motor Speedway",
  "Richmond Raceway",
  "Talladega Superspeedway",
  "Texas Motor Speedway",
  "Dover Motor Speedway",
  "Kansas Speedway",
  "Darlington Raceway",
  "North Wilkesboro Speedway",
  "Charlotte Motor Speedway ROVAL",
  "Charlotte Motor Speedway",
  "World Wide Technology Raceway",
  "Sonoma Raceway",
  "Iowa Speedway",
  "New Hampshire Motor Speedway",
  "Chicago Street Course",
  "Indianapolis Motor Speedway",
  "Pocono Raceway",
  "Michigan International Speedway",
  "Watkins Glen International",
  "Homestead-Miami Speedway",
  "Martinsville Speedway",
  "Nashville Superspeedway",
  "Rockingham Speedway",
  "Lime Rock Park",
  "Portland International Raceway",
  "Lucas Oil Indianapolis Raceway Park",
  "Milwaukee Mile"
]

def lat_lon_to_meters(lat, lon, lat0):
    R = 6378137
    lat_rad = math.radians(lat)
    lon_rad = math.radians(lon)
    lat0_rad = math.radians(lat0)
    
    x = R * lon_rad * math.cos(lat0_rad)
    y = R * lat_rad
    return {"x": x, "y": y}

def stitch_ways(ways):
    if not ways: return []
    if len(ways) == 1: return ways[0]
    
    current_path = ways[0][:]
    remaining = [w[:] for w in ways[1:]]
    
    while remaining:
        end_pt = current_path[-1]
        best_idx = -1
        reverse = False
        min_dist = float('inf')
        
        for i, w in enumerate(remaining):
            d_start = math.hypot(w[0]["x"] - end_pt["x"], w[0]["y"] - end_pt["y"])
            d_end = math.hypot(w[-1]["x"] - end_pt["x"], w[-1]["y"] - end_pt["y"])
            if d_start < min_dist:
                min_dist = d_start
                best_idx = i
                reverse = False
            if d_end < min_dist:
                min_dist = d_end
                best_idx = i
                reverse = True
                
        if best_idx != -1:
            next_w = remaining[best_idx]
            if reverse: next_w.reverse()
            if min_dist < 5: next_w = next_w[1:]
            current_path.extend(next_w)
            remaining.pop(best_idx)
        else:
            break
            
    return current_path

def catmull_rom_loop(control_points, points_per_segment=5):
    points = []
    n = len(control_points)
    for i in range(n):
        p0 = control_points[(i - 1 + n) % n]
        p1 = control_points[i]
        p2 = control_points[(i + 1) % n]
        p3 = control_points[(i + 2) % n]
        
        for j in range(points_per_segment):
            t = j / points_per_segment
            t2 = t * t
            t3 = t2 * t
            
            x = 0.5 * (
                (2 * p1["x"]) +
                (-p0["x"] + p2["x"]) * t +
                (2 * p0["x"] - 5 * p1["x"] + 4 * p2["x"] - p3["x"]) * t2 +
                (-p0["x"] + 3 * p1["x"] - 3 * p2["x"] + p3["x"]) * t3
            )
            y = 0.5 * (
                (2 * p1["y"]) +
                (-p0["y"] + p2["y"]) * t +
                (2 * p0["y"] - 5 * p1["y"] + 4 * p2["y"] - p3["y"]) * t2 +
                (-p0["y"] + 3 * p1["y"] - 3 * p2["y"] + p3["y"]) * t3
            )
            points.append({"x": x, "y": y})
    return points

def normalize_coordinates(points):
    if not points: return []
    min_x = min(p["x"] for p in points)
    max_x = max(p["x"] for p in points)
    min_y = min(p["y"] for p in points)
    max_y = max(p["y"] for p in points)
    
    width = max_x - min_x
    height = max_y - min_y
    max_dim = max(width, height) or 1
    scale = 800 / max_dim
    
    scaled = [{"x": (p["x"] - min_x) * scale, "y": (p["y"] - min_y) * scale} for p in points]
    
    scaled_w = width * scale
    scaled_h = height * scale
    offset_x = 500 - (scaled_w / 2)
    offset_y = 500 - (scaled_h / 2)
    
    centered = [{"x": p["x"] + offset_x, "y": p["y"] + offset_y} for p in scaled]
    
    lookahead = max(1, int(len(centered) * 0.05))
    dx = centered[lookahead]["x"] - centered[0]["x"]
    dy = centered[lookahead]["y"] - centered[0]["y"]
    angle = math.atan2(dy, dx)
    rot_angle = -angle
    cos_th = math.cos(rot_angle)
    sin_th = math.sin(rot_angle)
    
    rotated = []
    for p in centered:
        rx = p["x"] - 500
        ry = p["y"] - 500
        rotated.append({
            "x": 500 + (rx * cos_th - ry * sin_th),
            "y": 500 + (rx * sin_th + ry * cos_th)
        })
    return rotated

def get_track_data():
    results = {}
    for name in NASCAR_TRACKS:
        print(f"Processing {name}...")
        short_name = name.split(" ")[0]
        if "World Wide" in name: short_name = "Gateway"
        if "Charlotte Motor Speedway ROVAL" in name: short_name = "ROVAL"
        if "Charlotte Motor Speedway" == name: short_name = "Charlotte Motor Speedway"
        
        query = f'[out:json];(way["highway"="raceway"]["name"~"{short_name}",i];way["sport"="motor"]["name"~"{short_name}",i];);out geom;'
        url = "https://overpass-api.de/api/interpreter?data=" + urllib.parse.quote(query)
        req = urllib.request.Request(url, headers={"User-Agent": "AIMotorsportsHub/1.0", "Accept": "application/json"})
        
        try:
            with urllib.request.urlopen(req) as response:
                data = json.loads(response.read().decode())
                
            elements = [e for e in data.get("elements", []) if "geometry" in e]
            elements = [e for e in elements if "kart" not in e.get("tags", {}).get("name", "").lower() and "drag" not in e.get("tags", {}).get("name", "").lower()]
            
            if name == "Charlotte Motor Speedway ROVAL":
                elements = [e for e in elements if "roval" in e.get("tags", {}).get("name", "").lower()]
            elif name == "Charlotte Motor Speedway":
                elements = [e for e in elements if "roval" not in e.get("tags", {}).get("name", "").lower()]
                
            if not elements:
                print(f"  No elements for {name}")
                continue
                
            ref_lat = elements[0]["geometry"][0]["lat"]
            ways = []
            for e in elements:
                ways.append([lat_lon_to_meters(g["lat"], g["lon"], ref_lat) for g in e["geometry"]])
                
            stitched = stitch_ways(ways)
            smoothed = catmull_rom_loop(stitched, 5)
            normalized = normalize_coordinates(smoothed)
            results[name] = normalized
            print(f"  Generated {len(normalized)} points.")
        except Exception as e:
            print(f"  Failed: {e}")
            
        time.sleep(2)
        
    with open("lib/generatedNascarTracks.json", "w") as f:
        json.dump(results, f, indent=2)
    print("Done!")

if __name__ == "__main__":
    get_track_data()
