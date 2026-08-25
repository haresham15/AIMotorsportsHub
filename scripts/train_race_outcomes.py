"""
Probabilistic Race Outcomes Model Training Pipeline
Uses FastF1 to fetch historical race results and trains a Logistic Regression
model to predict the probability of a podium finish based on starting grid position.

Requirements:
pip install fastf1 pandas scikit-learn numpy
"""

import fastf1
import pandas as pd
import numpy as np
import json
import os
from sklearn.linear_model import LogisticRegression

# Setup FastF1 caching (creates a cache folder)
if not os.path.exists('fastf1_cache'):
    os.makedirs('fastf1_cache')
fastf1.Cache.enable_cache('fastf1_cache')

def fetch_race_results(year, round_idx):
    print(f"Fetching results for {year} Round {round_idx}...")
    try:
        session = fastf1.get_session(year, round_idx, 'R')
        session.load(telemetry=False, weather=False, laps=False)
        
        results = session.results
        
        # We need GridPosition and FinalPosition
        df = results[['GridPosition', 'Position']].dropna()
        # Clean up DNS/DNF positions that might not be numeric
        df = df[df['Position'] > 0]
        return df
    except Exception as e:
        print(f"Error fetching {year} R{round_idx}: {e}")
        return pd.DataFrame()

def train_model():
    print("Gathering historical grid data...")
    # Gather data from 2022 and 2023 seasons
    data_frames = []
    for year in [2022, 2023]:
        for r in range(1, 23):  
            df = fetch_race_results(year, r)
            if not df.empty:
                data_frames.append(df)
            
    if not data_frames:
        print("No data fetched. Aborting.")
        return
        
    full_data = pd.concat(data_frames)
    
    # Feature: Grid Position
    X = full_data[['GridPosition']].values
    
    # Target: Podium (1 if Position <= 3, else 0)
    y = (full_data['Position'] <= 3).astype(int).values
    
    print(f"Training Logistic Regression on {len(X)} race entries...")
    clf = LogisticRegression()
    clf.fit(X, y)
    
    accuracy = clf.score(X, y)
    print(f"Training Accuracy: {accuracy:.2f}")
    
    # Export weights for frontend usage
    output = {
        "coef": float(clf.coef_[0][0]),
        "intercept": float(clf.intercept_[0])
    }
        
    os.makedirs('public/models', exist_ok=True)
    with open('public/models/podium_probability_weights.json', 'w') as f:
        json.dump(output, f, indent=2)
        
    print("Model weights exported to public/models/podium_probability_weights.json")
    print("In frontend, probability = 1 / (1 + exp(-(intercept + coef * grid_position)))")

if __name__ == "__main__":
    train_model()
