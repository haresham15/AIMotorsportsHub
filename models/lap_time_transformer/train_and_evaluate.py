"""
Training and Evaluation Pipeline for Lap-Time Forecasting.
Compares Custom PyTorch Transformer against GBDT Baseline on Held-Out Test Season.
Exports PyTorch Model to ONNX for browser deployment.
"""

import os
import json
import torch
import torch.nn as nn
from torch.utils.data import TensorDataset, DataLoader
import numpy as np
import onnxruntime as ort

from models.lap_time_transformer.dataset import get_temporal_split_data
from models.lap_time_transformer.transformer import LapTimeTransformer
from models.lap_time_transformer.baseline import LapTimeGBDTBaseline

def train_transformer(
    model: nn.Module,
    X_train: np.ndarray,
    y_train_norm: np.ndarray,
    epochs: int = 25,
    batch_size: int = 32,
    lr: float = 1e-3
):
    dataset = TensorDataset(
        torch.tensor(X_train, dtype=torch.float32),
        torch.tensor(y_train_norm, dtype=torch.float32).unsqueeze(-1)
    )
    loader = DataLoader(dataset, batch_size=batch_size, shuffle=True)
    
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-5)
    criterion = nn.MSELoss()
    
    model.train()
    for epoch in range(epochs):
        total_loss = 0.0
        for batch_x, batch_y in loader:
            optimizer.zero_grad()
            pred = model(batch_x)
            loss = criterion(pred, batch_y)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()
            total_loss += loss.item() * len(batch_x)
            
        scheduler.step()
        if (epoch + 1) % 5 == 0 or epoch == epochs - 1:
            avg_loss = total_loss / len(dataset)
            print(f"Epoch {epoch+1:02d}/{epochs} - Train MSE: {avg_loss:.5f}")
            
    return model

def evaluate_transformer(
    model: nn.Module,
    X_test_norm: np.ndarray,
    y_test_raw: np.ndarray,
    target_mean: float,
    target_std: float
):
    model.eval()
    with torch.no_grad():
        x_tensor = torch.tensor(X_test_norm, dtype=torch.float32)
        norm_preds = model(x_tensor).squeeze(-1).numpy()
        
    # Un-normalize predictions back to raw seconds
    preds_raw = norm_preds * target_std + target_mean
    
    mae = float(np.mean(np.abs(preds_raw - y_test_raw)))
    rmse = float(np.sqrt(np.mean((preds_raw - y_test_raw) ** 2)))
    ss_tot = np.sum((y_test_raw - np.mean(y_test_raw)) ** 2)
    ss_res = np.sum((y_test_raw - preds_raw) ** 2)
    r2 = float(1 - (ss_res / (ss_tot + 1e-8)))
    
    return {
        'mae': mae,
        'rmse': rmse,
        'r2': r2,
        'predictions': preds_raw.tolist()
    }

def export_onnx(model: nn.Module, seq_len: int, n_features: int, output_path: str):
    model.eval()
    dummy_input = torch.randn(1, seq_len, n_features, dtype=torch.float32)
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    torch.onnx.export(
        model,
        dummy_input,
        output_path,
        export_params=True,
        opset_version=14,
        do_constant_folding=True,
        input_names=['lap_sequence'],
        output_names=['predicted_next_lap'],
        dynamic_axes={
            'lap_sequence': {0: 'batch_size'},
            'predicted_next_lap': {0: 'batch_size'}
        },
        dynamo=False
    )
    print(f"Exported ONNX model successfully to {output_path}")
    
    # Verify inference using onnxruntime
    session = ort.InferenceSession(output_path)
    ort_inputs = {session.get_inputs()[0].name: dummy_input.numpy()}
    ort_outs = session.run(None, ort_inputs)
    
    with torch.no_grad():
        torch_out = model(dummy_input).numpy()
        
    np.testing.assert_allclose(torch_out, ort_outs[0], rtol=1e-3, atol=1e-4)
    print("Verified ONNX Runtime equivalence with PyTorch model output.")

def run_benchmark():
    print("=" * 60)
    print("Apexis Lap-Time Benchmark: PyTorch Transformer vs GBDT Baseline")
    print("Strict Temporal Split: Train on R1-R4, Held-Out Test on R5")
    print("=" * 60)
    
    data = get_temporal_split_data(seq_length=5)
    stats = data['stats']
    print(f"Dataset extracted: {stats['train_samples']} train sequences, {stats['test_samples']} held-out test sequences.")
    
    y_train_norm = (data['y_train'] - stats['target_mean']) / stats['target_std']
    
    # 1. Train & Evaluate GBDT Baseline
    print("\n--- Training GBDT Baseline ---")
    gbdt = LapTimeGBDTBaseline(max_iter=200, learning_rate=0.05, max_depth=5)
    gbdt.fit(data['X_train_raw'], data['y_train'])
    gbdt_metrics = gbdt.evaluate(data['X_test_raw'], data['y_test'])
    print(f"GBDT Held-Out MAE:  {gbdt_metrics['mae']:.3f} s")
    print(f"GBDT Held-Out RMSE: {gbdt_metrics['rmse']:.3f} s")
    print(f"GBDT Held-Out R2:   {gbdt_metrics['r2']:.4f}")
    
    # 2. Train & Evaluate PyTorch Transformer
    print("\n--- Training PyTorch Lap-Time Transformer (Custom MHA) ---")
    model = LapTimeTransformer(
        in_features=4,
        d_model=64,
        n_heads=4,
        n_layers=2,
        d_ff=128,
        max_seq_len=16,
        dropout=0.1
    )
    
    train_transformer(model, data['X_train_norm'], y_train_norm, epochs=25, batch_size=32, lr=1e-3)
    tf_metrics = evaluate_transformer(
        model,
        data['X_test_norm'],
        data['y_test'],
        stats['target_mean'],
        stats['target_std']
    )
    
    print(f"Transformer Held-Out MAE:  {tf_metrics['mae']:.3f} s")
    print(f"Transformer Held-Out RMSE: {tf_metrics['rmse']:.3f} s")
    print(f"Transformer Held-Out R2:   {tf_metrics['r2']:.4f}")
    
    # 3. Honest Comparison Verdict
    if tf_metrics['mae'] < gbdt_metrics['mae']:
        winner = "Transformer"
        verdict = f"Transformer outperforms GBDT baseline by {gbdt_metrics['mae'] - tf_metrics['mae']:.3f}s MAE."
    else:
        winner = "GBDT Baseline"
        verdict = f"GBDT Baseline outperforms Transformer by {tf_metrics['mae'] - gbdt_metrics['mae']:.3f}s MAE on tabular lap sequences."
        
    print(f"\nHonest Evaluation Verdict: {verdict}")
    
    # 4. Export ONNX
    onnx_path = os.path.join("public", "models", "lap_time_transformer.onnx")
    export_onnx(model, seq_len=5, n_features=4, output_path=onnx_path)
    
    # 5. Save Benchmark JSON
    benchmark_payload = {
        'task': 'lap_time_forecasting',
        'temporal_split': {
            'train_season': 2023,
            'train_rounds': stats['train_rounds'],
            'train_samples': stats['train_samples'],
            'test_season': 2023,
            'test_rounds': stats['test_rounds'],
            'test_samples': stats['test_samples'],
            'held_out_race': 'Miami Grand Prix 2023'
        },
        'comparison': {
            'winner': winner,
            'verdict': verdict,
            'margin_mae_seconds': round(abs(tf_metrics['mae'] - gbdt_metrics['mae']), 4)
        },
        'transformer': {
            'architecture': 'PyTorch Autoregressive Transformer (Custom MHA)',
            'custom_attention_from_scratch': True,
            'n_parameters': sum(p.numel() for p in model.parameters()),
            'd_model': 64,
            'n_heads': 4,
            'n_layers': 2,
            'held_out_mae': round(tf_metrics['mae'], 4),
            'held_out_rmse': round(tf_metrics['rmse'], 4),
            'held_out_r2': round(tf_metrics['r2'], 4)
        },
        'baseline_gbdt': {
            'architecture': 'HistGradientBoosting (GBDT)',
            'max_iter': 200,
            'learning_rate': 0.05,
            'held_out_mae': round(gbdt_metrics['mae'], 4),
            'held_out_rmse': round(gbdt_metrics['rmse'], 4),
            'held_out_r2': round(gbdt_metrics['r2'], 4)
        },
        'normalization': {
            'target_mean': round(stats['target_mean'], 4),
            'target_std': round(stats['target_std'], 4),
            'seq_length': stats['seq_length']
        }
    }
    
    json_path = os.path.join("public", "models", "lap_time_benchmark.json")
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(benchmark_payload, f, indent=2)
    print(f"Saved benchmark results to {json_path}")
    print("=" * 60)

if __name__ == '__main__':
    run_benchmark()
