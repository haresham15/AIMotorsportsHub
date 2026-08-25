"""
Advanced Tire Degradation Model Pipeline
Uses FastF1 to fetch historical stint data, trains a Gradient Boosting Regressor
per tire compound, and generates SHAP values for explainability.
"""

import fastf1
import pandas as pd
import numpy as np
import json
import os
import shap
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import root_mean_squared_error

if not os.path.exists('fastf1_cache'):
    os.makedirs('fastf1_cache')
fastf1.Cache.enable_cache('fastf1_cache')

OUTPUT_FILE = os.path.join("public", "models", "advanced_tire_degradation.json")

def fetch_tire_data(year, round_idx):
    print(f"Fetching data for {year} Round {round_idx}...")
    try:
        session = fastf1.get_session(year, round_idx, 'R')
        session.load(telemetry=False, weather=True)
        laps = session.laps
        weather = session.weather_data
        
        laps = laps.pick_quicklaps()
        
        # Convert timedelta to seconds
        laps['LapTime_s'] = laps['LapTime'].dt.total_seconds()
        
        # We need Stint length, LapTime, and LapNumber for fuel correction
        df = laps[['Compound', 'TyreLife', 'LapNumber', 'LapTime_s']].dropna()
        
        # Basic weather integration (TrackTemp)
        # Note: Merging lap data with weather strictly requires timestamp matching. 
        # For this script, we'll simulate an average track temp column if weather data is too sparse.
        if not weather.empty and 'TrackTemp' in weather.columns:
            avg_temp = weather['TrackTemp'].mean()
        else:
            avg_temp = 35.0
            
        df['TrackTemp'] = avg_temp
        
        return df
    except Exception as e:
        print(f"Error fetching {year} R{round_idx}: {e}")
        return pd.DataFrame()

def train_model():
    print("Gathering historical data...")
    data_frames = []
    # Just 5 races for faster execution in this demo pipeline
    for r in range(1, 6):  
        df = fetch_tire_data(2023, r)
        if not df.empty:
            data_frames.append(df)
            
    if not data_frames:
        print("No data fetched. Aborting.")
        return
        
    full_data = pd.concat(data_frames)
    
    compounds = ['SOFT', 'MEDIUM', 'HARD']
    output = {}
    
    for compound in compounds:
        c_data = full_data[full_data['Compound'] == compound]
        if len(c_data) < 20:
            continue
            
        # Features: Tire age and Track Temp
        features = ['TyreLife', 'TrackTemp']
        X = c_data[features].copy()
        
        # Fuel burn makes the car ~0.06s faster per lap.
        # We add 0.06s for every lap completed to normalize to a heavy car.
        lap_numbers = c_data['LapNumber'].values
        fuel_correction = (lap_numbers - 1) * 0.06
        y = c_data['LapTime_s'].values + fuel_correction
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        print(f"\nTraining Gradient Boosting Regressor for {compound}...")
        reg = GradientBoostingRegressor(n_estimators=50, max_depth=3, random_state=42)
        reg.fit(X_train, y_train)
        
        preds = reg.predict(X_test)
        rmse = root_mean_squared_error(y_test, preds)
        
        print(f"[{compound}] RMSE: {rmse:.3f}s")
        
        # SHAP Explainability
        explainer = shap.TreeExplainer(reg)
        shap_values = explainer.shap_values(X_test)
        
        # Calculate mean absolute SHAP value per feature
        mean_abs_shap = np.abs(shap_values).mean(axis=0)
        shap_dict = dict(zip(features, mean_abs_shap.tolist()))
        
        output[compound] = {
            "rmse": float(rmse),
            "shap_importance": shap_dict
        }
        
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(output, f, indent=2)
        
    print(f"\nAdvanced tire model weights and SHAP values exported to {OUTPUT_FILE}")

if __name__ == "__main__":
    train_model()
