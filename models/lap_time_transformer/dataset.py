"""
FastF1 Sequence Dataset for Lap Time Forecasting.
Provides strict chronological / temporal train-test splitting:
Trains on earlier season rounds and evaluates on held-out subsequent rounds.
"""

import os
import numpy as np
import pandas as pd
import fastf1

COMPOUND_MAP = {
    'SOFT': 1.0,
    'MEDIUM': 2.0,
    'HARD': 3.0,
    'INTERMEDIATE': 4.0,
    'WET': 5.0,
    'UNKNOWN': 0.0
}

def get_compound_code(compound_name):
    if not isinstance(compound_name, str):
        return 0.0
    return COMPOUND_MAP.get(compound_name.strip().upper(), 0.0)

def extract_session_sequences(year: int, round_idx: int, seq_length: int = 5, cache_dir: str = 'fastf1_cache'):
    """
    Loads quicklaps for a session from FastF1 cache, sorts chronologically per driver,
    and constructs sliding sequences of shape [seq_length, n_features] -> target next LapTime.
    """
    if os.path.exists(cache_dir):
        fastf1.Cache.enable_cache(cache_dir)
        
    try:
        session = fastf1.get_session(year, round_idx, 'R')
        session.load(telemetry=False, weather=False)
        laps = session.laps.pick_quicklaps().dropna(subset=['LapTime', 'TyreLife'])
        
        # Lap time to float seconds
        laps['LapTime_s'] = laps['LapTime'].dt.total_seconds()
        
        sequences = []
        targets = []
        meta = []
        
        for driver in laps['Driver'].unique():
            driver_laps = laps[laps['Driver'] == driver].sort_values('LapNumber')
            times = driver_laps['LapTime_s'].values
            tyre_life = driver_laps['TyreLife'].values
            compounds = [get_compound_code(c) for c in driver_laps['Compound'].values]
            stints = driver_laps['Stint'].fillna(1).values
            lap_numbers = driver_laps['LapNumber'].values
            
            n_laps = len(times)
            for i in range(n_laps - seq_length):
                # Features per lap: [LapTime_s, TyreLife, Compound, Stint]
                seq_features = []
                for step in range(seq_length):
                    idx = i + step
                    seq_features.append([
                        times[idx],
                        tyre_life[idx],
                        compounds[idx],
                        stints[idx]
                    ])
                sequences.append(seq_features)
                targets.append(times[i + seq_length])
                meta.append({
                    'year': year,
                    'round': round_idx,
                    'driver': driver,
                    'target_lap': lap_numbers[i + seq_length]
                })
                
        return np.array(sequences, dtype=np.float32), np.array(targets, dtype=np.float32), meta
    except Exception as e:
        print(f"Warning: Could not process {year} R{round_idx}: {e}")
        return np.empty((0, seq_length, 4), dtype=np.float32), np.empty((0,), dtype=np.float32), []

def get_temporal_split_data(seq_length: int = 5, cache_dir: str = 'fastf1_cache'):
    """
    Strict temporal split:
    Training set: 2023 Season Rounds 1 to 4 (Bahrain, Saudi Arabia, Australia, Azerbaijan)
    Held-out Test set: 2023 Season Round 5 (Miami Grand Prix)
    """
    train_rounds = [1, 2, 3, 4]
    test_rounds = [5]
    
    X_train_list, y_train_list, meta_train = [], [], []
    for r in train_rounds:
        X_r, y_r, meta_r = extract_session_sequences(2023, r, seq_length, cache_dir)
        if len(X_r) > 0:
            X_train_list.append(X_r)
            y_train_list.append(y_r)
            meta_train.extend(meta_r)
            
    X_test_list, y_test_list, meta_test = [], [], []
    for r in test_rounds:
        X_r, y_r, meta_r = extract_session_sequences(2023, r, seq_length, cache_dir)
        if len(X_r) > 0:
            X_test_list.append(X_r)
            y_test_list.append(y_r)
            meta_test.extend(meta_r)
            
    X_train = np.concatenate(X_train_list, axis=0) if X_train_list else np.empty((0, seq_length, 4))
    y_train = np.concatenate(y_train_list, axis=0) if y_train_list else np.empty((0,))
    
    X_test = np.concatenate(X_test_list, axis=0) if X_test_list else np.empty((0, seq_length, 4))
    y_test = np.concatenate(y_test_list, axis=0) if y_test_list else np.empty((0,))
    
    # Feature scaling: compute mean and std from TRAIN split only (prevent temporal data leakage!)
    feature_mean = np.mean(X_train, axis=(0, 1), keepdims=True)
    feature_std = np.std(X_train, axis=(0, 1), keepdims=True) + 1e-6
    
    target_mean = np.mean(y_train)
    target_std = np.std(y_train) + 1e-6
    
    X_train_norm = (X_train - feature_mean) / feature_std
    X_test_norm = (X_test - feature_mean) / feature_std
    
    stats = {
        'feature_mean': feature_mean.tolist(),
        'feature_std': feature_std.tolist(),
        'target_mean': float(target_mean),
        'target_std': float(target_std),
        'train_samples': len(X_train),
        'test_samples': len(X_test),
        'seq_length': seq_length,
        'train_rounds': train_rounds,
        'test_rounds': test_rounds
    }
    
    return {
        'X_train_raw': X_train,
        'y_train': y_train,
        'X_train_norm': X_train_norm.astype(np.float32),
        'X_test_raw': X_test,
        'y_test': y_test,
        'X_test_norm': X_test_norm.astype(np.float32),
        'stats': stats,
        'meta_train': meta_train,
        'meta_test': meta_test
    }
