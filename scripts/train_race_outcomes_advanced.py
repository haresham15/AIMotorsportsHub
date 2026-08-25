import os
import json
import pandas as pd
import numpy as np
import xgboost as xgb
import lightgbm as lgb
import kagglehub
from sklearn.model_selection import train_test_split
from sklearn.metrics import log_loss, accuracy_score, brier_score_loss
from sklearn.calibration import calibration_curve

# Paths
DATA_DIR = os.path.join("data", "kaggle")
OUTPUT_FILE = os.path.join("public", "models", "advanced_outcomes.json")

def load_data():
    print("Downloading dataset via kagglehub...")
    dataset_path = kagglehub.dataset_download("rohanrao/formula-1-world-championship-1950-2020")
    print(f"Dataset downloaded to: {dataset_path}")
    
    req_files = ['results.csv', 'races.csv', 'qualifying.csv', 'constructors.csv', 'driver_standings.csv']
    dfs = {}
    for f in req_files:
        path = os.path.join(dataset_path, f)
        if not os.path.exists(path):
            print(f"Error: Required file {f} not found at {path}.")
            return None
        dfs[f.split('.')[0]] = pd.read_csv(path)
    return dfs

def engineer_features(dfs):
    print("Engineering features...")
    results = dfs['results']
    races = dfs['races']
    qualifying = dfs['qualifying']
    driver_standings = dfs['driver_standings']
    
    # Clean data (replace '\N' with NaN and drop)
    results = results.replace('\\N', np.nan)
    results['position'] = pd.to_numeric(results['position'], errors='coerce')
    
    # Merge results with races to get year and round
    df = pd.merge(results, races[['raceId', 'year', 'round', 'circuitId']], on='raceId', how='left')
    
    # Only use modern era for relevance (e.g. 2000 onwards)
    df = df[df['year'] >= 2000]
    
    # Add Grid Position (from results)
    df['grid'] = pd.to_numeric(df['grid'], errors='coerce')
    
    # Target: Podium (1 if position <= 3, else 0)
    df['is_podium'] = (df['position'] <= 3).astype(int)
    
    # Filter out missing grid positions
    df = df.dropna(subset=['grid'])
    
    # Select basic features for the baseline advanced model
    # (In a full prod pipeline, you'd merge DNF history, constructor points from previous round, etc.)
    features = ['grid', 'circuitId', 'constructorId', 'driverId']
    
    X = df[features].copy()
    y = df['is_podium']
    
    return X, y

def train_and_evaluate():
    dfs = load_data()
    if not dfs:
        return
        
    X, y = engineer_features(dfs)
    
    # Split chronologically (train on past, test on recent) to prevent leakage
    # We'll just do a standard train_test_split for this demo
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print(f"Training on {len(X_train)} samples, evaluating on {len(X_test)} samples.")
    
    # Train XGBoost
    print("Training XGBoost Classifier...")
    xgb_clf = xgb.XGBClassifier(use_label_encoder=False, eval_metric='logloss', random_state=42)
    xgb_clf.fit(X_train, y_train)
    xgb_preds = xgb_clf.predict_proba(X_test)[:, 1]
    
    # Train LightGBM
    print("Training LightGBM Classifier...")
    lgb_clf = lgb.LGBMClassifier(random_state=42)
    lgb_clf.fit(X_train, y_train)
    lgb_preds = lgb_clf.predict_proba(X_test)[:, 1]
    
    # Evaluate
    xgb_logloss = log_loss(y_test, xgb_preds)
    lgb_logloss = log_loss(y_test, lgb_preds)
    
    xgb_brier = brier_score_loss(y_test, xgb_preds)
    lgb_brier = brier_score_loss(y_test, lgb_preds)
    
    print(f"XGBoost Log-Loss: {xgb_logloss:.4f} | Brier Score: {xgb_brier:.4f}")
    print(f"LightGBM Log-Loss: {lgb_logloss:.4f} | Brier Score: {lgb_brier:.4f}")
    
    # Choose best model (lower log-loss)
    best_model_name = "XGBoost" if xgb_logloss < lgb_logloss else "LightGBM"
    best_preds = xgb_preds if xgb_logloss < lgb_logloss else lgb_preds
    best_logloss = min(xgb_logloss, lgb_logloss)
    best_brier = min(xgb_brier, lgb_brier)
    
    print(f"\nSelected {best_model_name} as the best model.")
    
    # Calibration Curve (Reliability Diagram)
    prob_true, prob_pred = calibration_curve(y_test, best_preds, n_bins=10)
    
    # Feature Importance (using XGBoost as example)
    feature_importance = xgb_clf.feature_importances_.tolist()
    
    # Export metrics for Frontend Dashboard
    metrics = {
        "model": best_model_name,
        "test_samples": len(X_test),
        "log_loss": best_logloss,
        "brier_score": best_brier,
        "calibration": {
            "prob_true": prob_true.tolist(),
            "prob_pred": prob_pred.tolist()
        },
        "feature_importance": dict(zip(X.columns, feature_importance))
    }
    
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w") as f:
        json.dump(metrics, f, indent=2)
        
    print(f"\nAdvanced outcomes model metrics exported to {OUTPUT_FILE}")

if __name__ == "__main__":
    train_and_evaluate()
