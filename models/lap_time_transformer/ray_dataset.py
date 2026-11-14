"""
WS3: Ray Data Distributed Feature Pipeline for Lap Sequence Model.
Scales FastF1 lap feature preparation across distributed workers using Ray Data (ray.data).
Extracts sliding temporal sequences [seq_len, n_features] and targets [1] with batch transformations.
Includes seamless local execution harness when running outside a distributed Ray cluster.
"""

import os
import sys
import argparse
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple

# Ray Data import with fallback
try:
    import ray
    import ray.data
    RAY_AVAILABLE = True
except ImportError:
    RAY_AVAILABLE = False

from .dataset import COMPOUND_MAP, get_compound_code, extract_session_sequences


class RayLapSequenceTransformer:
    """
    Ray Data batch mapping transformer for vectorized lap sequence generation.
    Takes micro-batches of tabular lap records and produces normalized sequence tensors.
    """
    def __init__(self, seq_length: int = 5, feature_means=None, feature_stds=None):
        self.seq_length = seq_length
        self.means = feature_means or [95.0, 10.0, 2.0, 95.0]
        self.stds = feature_stds or [8.0, 6.0, 1.0, 8.0]

    def __call__(self, batch: Dict[str, np.ndarray]) -> Dict[str, np.ndarray]:
        """
        Transforms a columnar batch from Ray Data into sequence arrays.
        """
        drivers = batch["Driver"]
        lap_times = batch["LapTime_s"]
        tyre_life = batch["TyreLife"]
        compounds = batch["Compound_code"]
        
        # Build DataFrame for per-driver window grouping
        df = pd.DataFrame({
            "Driver": drivers,
            "LapTime_s": lap_times,
            "TyreLife": tyre_life,
            "Compound_code": compounds
        })
        
        sequences = []
        targets = []
        
        for driver, group in df.groupby("Driver"):
            n = len(group)
            if n <= self.seq_length:
                continue
                
            times = group["LapTime_s"].values
            t_life = group["TyreLife"].values
            comps = group["Compound_code"].values
            
            for i in range(n - self.seq_length):
                seq_times = times[i:i + self.seq_length]
                seq_life = t_life[i:i + self.seq_length]
                seq_comp = comps[i:i + self.seq_length]
                
                # Rolling delta from prior lap
                deltas = np.zeros(self.seq_length, dtype=np.float32)
                deltas[1:] = seq_times[1:] - seq_times[:-1]
                
                feat = np.column_stack([
                    (seq_times - self.means[0]) / self.stds[0],
                    (seq_life - self.means[1]) / self.stds[1],
                    (seq_comp - self.means[2]) / self.stds[2],
                    (deltas - self.means[3]) / self.stds[3]
                ])
                sequences.append(feat)
                targets.append((times[i + self.seq_length] - self.means[0]) / self.stds[0])
                
        if not sequences:
            return {
                "sequence": np.empty((0, self.seq_length, 4), dtype=np.float32),
                "target": np.empty((0,), dtype=np.float32)
            }
            
        return {
            "sequence": np.array(sequences, dtype=np.float32),
            "target": np.array(targets, dtype=np.float32)
        }


def build_ray_dataset(
    year: int = 2023,
    rounds: List[int] = None,
    seq_length: int = 5,
    cache_dir: str = 'fastf1_cache'
):
    """
    Constructs a distributed Ray Data Dataset from raw FastF1 sessions.
    If Ray is not available, executes via the vectorized batch transform harness.
    """
    if rounds is None:
        rounds = [1, 2, 3, 4]

    raw_dfs = []
    
    # Ingest sessions into tabular dataframes
    for r in rounds:
        try:
            import fastf1
            if os.path.exists(cache_dir):
                fastf1.Cache.enable_cache(cache_dir)
            session = fastf1.get_session(year, r, 'R')
            session.load(telemetry=False, weather=False)
            laps = session.laps.pick_quicklaps().dropna(subset=['LapTime', 'TyreLife'])
            laps['LapTime_s'] = laps['LapTime'].dt.total_seconds()
            laps['Compound_code'] = [get_compound_code(c) for c in laps['Compound'].values]
            laps['Round'] = r
            raw_dfs.append(laps[['Round', 'Driver', 'LapNumber', 'LapTime_s', 'TyreLife', 'Compound_code']])
        except Exception as e:
            print(f"[RAY DATA] Cache read note for round {r}: {e}")
            
    if not raw_dfs:
        print("[RAY DATA] Generating synthetic session partitions for pipeline demonstration...")
        for r in rounds:
            dummy_rows = []
            for d in ["VER", "PER", "ALO", "HAM"]:
                for l in range(1, 30):
                    dummy_rows.append({
                        "Round": r,
                        "Driver": d,
                        "LapNumber": l,
                        "LapTime_s": 95.0 + np.random.normal(0, 0.4) + l * 0.08,
                        "TyreLife": float(l),
                        "Compound_code": 2.0
                    })
            raw_dfs.append(pd.DataFrame(dummy_rows))

    combined_df = pd.concat(raw_dfs, ignore_index=True)
    transformer = RayLapSequenceTransformer(seq_length=seq_length)

    if RAY_AVAILABLE:
        print(f"[RAY DATA] Initializing Ray cluster and building ray.data.Dataset...")
        if not ray.is_initialized():
            ray.init(ignore_reinit_error=True)
            
        ray_ds = ray.data.from_pandas(combined_df)
        transformed_ds = ray_ds.map_batches(
            transformer,
            batch_format="numpy",
            batch_size=256
        )
        print(f"[RAY DATA] Ray Dataset successfully built: {transformed_ds}")
        return transformed_ds
    else:
        print("[RAY DATA] Ray is not installed on host Python; running Ray Data batch transform harness locally...")
        dict_batch = {col: combined_df[col].values for col in combined_df.columns}
        out_batch = transformer(dict_batch)
        print(f"[RAY DATA] Processed {len(out_batch['sequence'])} sequences of shape {out_batch['sequence'].shape[1:]}")
        return out_batch


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Apexis Ray Data Feature Pipeline")
    parser.add_argument('--rounds', nargs='+', type=int, default=[1, 2, 3, 4], help="Rounds to process")
    parser.add_argument('--seq-len', type=int, default=5, help="Sliding sequence length")
    args = parser.parse_args()

    print("=== Apexis Ray Data Feature Building Pipeline (WS3) ===")
    result = build_ray_dataset(rounds=args.rounds, seq_length=args.seq_len)
    if isinstance(result, dict):
        print(f"Generated {len(result['target'])} training sequence targets.")
        print("Sample sequence (first step):")
        print(result["sequence"][0][0])
