"""
Gradient-Boosted Decision Tree (GBDT) Baseline for Lap Time Forecasting.
Trained on the exact same temporal split as the Transformer model to provide
an honest, empirical baseline comparison.
"""

import numpy as np
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score

class LapTimeGBDTBaseline:
    def __init__(self, max_iter: int = 200, learning_rate: float = 0.05, max_depth: int = 5):
        self.model = HistGradientBoostingRegressor(
            max_iter=max_iter,
            learning_rate=learning_rate,
            max_depth=max_depth,
            random_state=42
        )
        
    def fit(self, X_train: np.ndarray, y_train: np.ndarray):
        """
        X_train: shape (N, seq_len, n_features) or (N, seq_len * n_features)
        y_train: shape (N,) target lap times in seconds
        """
        if len(X_train.shape) == 3:
            N, L, F = X_train.shape
            X_flat = X_train.reshape(N, L * F)
        else:
            X_flat = X_train
            
        self.model.fit(X_flat, y_train)
        return self
        
    def predict(self, X: np.ndarray) -> np.ndarray:
        if len(X.shape) == 3:
            N, L, F = X.shape
            X_flat = X.reshape(N, L * F)
        else:
            X_flat = X
        return self.model.predict(X_flat)
        
    def evaluate(self, X_test: np.ndarray, y_test: np.ndarray) -> dict:
        preds = self.predict(X_test)
        mae = float(mean_absolute_error(y_test, preds))
        rmse = float(root_mean_squared_error(y_test, preds))
        r2 = float(r2_score(y_test, preds))
        
        return {
            'mae': mae,
            'rmse': rmse,
            'r2': r2,
            'predictions': preds.tolist()
        }
