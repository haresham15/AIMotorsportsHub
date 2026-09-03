"""
Tire Degradation Model Training Pipeline
Uses FastF1 to fetch historical stint data and trains a linear regression model
to predict lap time degradation per tire compound (Soft, Medium, Hard).

Requirements:
pip install fastf1 pandas scikit-learn numpy tfjs-graph-converter
"""

import fastf1
import pandas as pd
import numpy as np
import json
import os
from sklearn.linear_model import LinearRegression

# Setup FastF1 caching (creates a cache folder)
if not os.path.exists('fastf1_cache'):
    os.makedirs('fastf1_cache')
fastf1.Cache.enable_cache('fastf1_cache')

def fetch_tire_data(year, round_idx):
    print(f"Fetching data for {year} Round {round_idx}...")
    try:
        session = fastf1.get_session(year, round_idx, 'R')
        session.load(telemetry=False, weather=False)
        laps = session.laps
        
        # Filter for valid racing laps (no safety cars, in/out laps)
        laps = laps.pick_quicklaps().copy()
        
        # Convert LapTime timedelta to seconds
        laps['LapTime (s)'] = laps['LapTime'].dt.total_seconds()
        
        # We need Stint length, LapTime, and LapNumber for fuel correction
        df = laps[['Compound', 'TyreLife', 'LapNumber', 'LapTime (s)']].dropna()
        return df
    except Exception as e:
        print(f"Error fetching {year} R{round_idx}: {e}")
        return pd.DataFrame()

def train_model():
    print("Gathering historical data...")
    # Gather data from the 2023 season as a baseline
    data_frames = []
    for r in range(1, 23):  
        df = fetch_tire_data(2023, r)
        if not df.empty:
            data_frames.append(df)
            
    if not data_frames:
        print("No data fetched. Aborting.")
        return
        
    full_data = pd.concat(data_frames)
    
    # We want to predict lap time drop-off (slope) based on TyreLife
    # We will train a simple model for each compound
    models = {}
    compounds = ['SOFT', 'MEDIUM', 'HARD']
    
    output = {}
    
    for compound in compounds:
        c_data = full_data[full_data['Compound'] == compound]
        if c_data.empty:
            continue
            
        X = c_data[['TyreLife']].values
        
        # Fuel burn makes the car ~0.06s faster per lap.
        # We add 0.06s for every lap completed to normalize to a heavy car.
        lap_numbers = c_data['LapNumber'].values
        fuel_correction = (lap_numbers - 1) * 0.06
        y = c_data['LapTime (s)'].values + fuel_correction
        
        reg = LinearRegression()
        reg.fit(X, y)
        
        # reg.coef_[0] represents the seconds lost per lap of tire age
        # reg.intercept_ is the baseline pace on new tires
        output[compound] = {
            "degradation_rate_per_lap": float(reg.coef_[0]),
            "base_lap_time": float(reg.intercept_)
        }
        print(f"[{compound}] Deg rate: {reg.coef_[0]:.3f}s / lap")
        
    # Export weights for frontend usage (since it's a simple linear model, 
    # we don't need full TF.js export, just the coefficients)
    os.makedirs('public/models', exist_ok=True)
    with open('public/models/tire_degradation_weights.json', 'w') as f:
        json.dump(output, f, indent=2)
        
    print("Model weights exported to public/models/tire_degradation_weights.json")

if __name__ == "__main__":
    train_model()
