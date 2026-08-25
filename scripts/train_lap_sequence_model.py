"""
Trains an LSTM model on sequence lap data to forecast the next lap time.
Exports the trained model to TensorFlow.js format.
"""

import os
import numpy as np
import pandas as pd
import fastf1
from keras.models import Sequential
from keras.layers import LSTM, Dense, Dropout
import tfjs_graph_converter.api as tfjs

if not os.path.exists('fastf1_cache'):
    os.makedirs('fastf1_cache')
fastf1.Cache.enable_cache('fastf1_cache')

SEQ_LENGTH = 3
MODEL_OUTPUT_DIR = os.path.join("public", "models", "lap_sequence_model")

def fetch_lap_sequences(year, round_idx):
    try:
        session = fastf1.get_session(year, round_idx, 'R')
        session.load(telemetry=False, weather=False)
        laps = session.laps.pick_quicklaps().dropna(subset=['LapTime', 'TyreLife'])
        
        # Convert LapTime to seconds float
        laps['LapTime_s'] = laps['LapTime'].dt.total_seconds()
        
        sequences = []
        targets = []
        
        # Group by driver to ensure sequence continuity
        for driver in laps['Driver'].unique():
            driver_laps = laps[laps['Driver'] == driver].sort_values('LapNumber')
            times = driver_laps['LapTime_s'].values
            ages = driver_laps['TyreLife'].values
            
            for i in range(len(times) - SEQ_LENGTH):
                # Features: LapTime and TyreLife for last N laps
                seq = []
                for j in range(SEQ_LENGTH):
                    seq.append([times[i+j], ages[i+j]])
                sequences.append(seq)
                targets.append(times[i + SEQ_LENGTH])
                
        return np.array(sequences), np.array(targets)
    except Exception as e:
        print(f"Error processing {year} R{round_idx}: {e}")
        return np.array([]), np.array([])

def train_and_export():
    print("Fetching lap sequences (2023 season)...")
    X_list, y_list = [], []
    for r in range(1, 6): # First 5 races for speed
        X_r, y_r = fetch_lap_sequences(2023, r)
        if len(X_r) > 0:
            X_list.append(X_r)
            y_list.append(y_r)
            
    if not X_list:
        print("No sequence data found.")
        return
        
    X = np.concatenate(X_list)
    y = np.concatenate(y_list)
    
    print(f"Training LSTM on {len(X)} sequences of length {SEQ_LENGTH}...")
    
    # Define Model
    model = Sequential([
        LSTM(32, activation='relu', input_shape=(SEQ_LENGTH, 2), return_sequences=False),
        Dropout(0.2),
        Dense(16, activation='relu'),
        Dense(1, activation='linear')
    ])
    
    model.compile(optimizer='adam', loss='mse')
    model.fit(X, y, epochs=10, batch_size=32, validation_split=0.2, verbose=1)
    
    # Save to Keras H5
    os.makedirs(MODEL_OUTPUT_DIR, exist_ok=True)
    h5_path = os.path.join(MODEL_OUTPUT_DIR, "model.h5")
    model.save(h5_path)
    print(f"Saved Keras model to {h5_path}")
    
    # Export to TF.js Layers Model
    # CLI command equivalent: tensorflowjs_converter --input_format keras model.h5 tfjs_model
    # Note: tfjs-graph-converter or tensorflowjs must be installed
    print("Converting to TF.js format...")
    try:
        import subprocess
        subprocess.run(["tensorflowjs_converter", "--input_format", "keras", h5_path, MODEL_OUTPUT_DIR], check=True)
        print(f"Successfully exported TF.js model to {MODEL_OUTPUT_DIR}")
    except Exception as e:
        print(f"Failed to run tensorflowjs_converter. Please run it manually: {e}")

if __name__ == "__main__":
    train_and_export()
