"""Build a 2D map from real Jolpica F1 driver-season results."""

import json
import os
from urllib.request import urlopen

import numpy as np
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler

OUTPUT_FILE = os.path.join("public", "models", "driver_season_clusters.json")
YEARS = range(2018, 2025)
RACE_COUNTS = {2018: 21, 2019: 21, 2020: 17, 2021: 22, 2022: 22, 2023: 22, 2024: 24}


def fetch_json(url):
    with urlopen(url, timeout=30) as response:
        return json.load(response)


def load_driver_seasons():
    seasons = []
    for year in YEARS:
        payload = fetch_json(f"https://api.jolpi.ca/ergast/f1/{year}/driverstandings.json")
        race_count = RACE_COUNTS[year]
        lists = payload["MRData"]["StandingsTable"].get("StandingsLists", [])
        if not lists:
            continue
        for row in lists[0]["DriverStandings"]:
            if not str(row.get("position", "")).isdigit():
                continue
            driver = row["Driver"]
            seasons.append({
                "id": f'{driver["driverId"]}_{year}',
                "name": f'{driver["givenName"]} {driver["familyName"]}',
                "year": year,
                "points": float(row["points"]),
                "wins": int(row["wins"]),
                "position": int(row["position"]),
                "race_count": race_count,
            })
    return seasons


def generate_similarity_map():
    seasons = load_driver_seasons()
    if not seasons:
        raise RuntimeError("No historical standings returned by Jolpica")
    features = np.array([[s["points"] / s["race_count"], s["wins"] / s["race_count"], 1 / s["position"], s["points"]] for s in seasons])
    scaled = StandardScaler().fit_transform(features)
    embedding = PCA(n_components=2, random_state=42).fit_transform(scaled)
    clusters = KMeans(n_clusters=5, random_state=42, n_init=10).fit_predict(scaled)
    results = []
    for index, season in enumerate(seasons):
        results.append({
            "id": season["id"], "name": season["name"], "year": season["year"],
            "x": float(embedding[index, 0]), "y": float(embedding[index, 1]), "cluster": int(clusters[index]),
            "stats": {"points_per_race": season["points"] / season["race_count"], "win_rate": season["wins"] / season["race_count"]},
        })
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as output:
        json.dump(results, output, indent=2)
    print(f"Exported {len(results)} real driver-seasons to {OUTPUT_FILE}")


if __name__ == "__main__":
    generate_similarity_map()
