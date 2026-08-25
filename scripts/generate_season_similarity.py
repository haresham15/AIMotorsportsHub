"""
Generates 2D embeddings of F1 Driver Seasons using UMAP/t-SNE and KMeans.
"""

import os
import json
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
import umap

OUTPUT_FILE = os.path.join("public", "models", "driver_season_clusters.json")

def generate_similarity_map():
    # In a production environment, this would pull from the Kaggle F1 DB.
    # For demonstration, we'll simulate a dataset of driver-seasons.
    print("Generating simulated driver-season feature vectors...")
    
    np.random.seed(42)
    # 200 driver-seasons
    n_samples = 200
    
    # Features: points_per_race, win_rate, podium_rate, dnf_rate, teammate_delta
    features = np.random.rand(n_samples, 5)
    
    # Normalize
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(features)
    
    # UMAP Dimensionality Reduction (to 2D)
    print("Running UMAP dimensionality reduction...")
    reducer = umap.UMAP(n_neighbors=15, min_dist=0.1, n_components=2, random_state=42)
    embedding = reducer.fit_transform(X_scaled)
    
    # Clustering
    print("Running KMeans clustering...")
    kmeans = KMeans(n_clusters=5, random_state=42)
    clusters = kmeans.fit_predict(X_scaled)
    
    # Prepare export payload
    results = []
    drivers = ["Max Verstappen", "Lewis Hamilton", "Fernando Alonso", "Sebastian Vettel", "Charles Leclerc"]
    
    for i in range(n_samples):
        driver_name = np.random.choice(drivers)
        year = np.random.randint(2010, 2024)
        
        results.append({
            "id": f"{driver_name.replace(' ', '_').lower()}_{year}",
            "name": driver_name,
            "year": year,
            "x": float(embedding[i, 0]),
            "y": float(embedding[i, 1]),
            "cluster": int(clusters[i]),
            "stats": {
                "points_per_race": float(features[i, 0] * 25),
                "win_rate": float(features[i, 1])
            }
        })
        
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w") as f:
        json.dump(results, f, indent=2)
        
    print(f"Driver season clusters exported to {OUTPUT_FILE}")

if __name__ == "__main__":
    generate_similarity_map()
