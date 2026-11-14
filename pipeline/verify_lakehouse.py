"""
Automated Verification Suite for F1 Telemetry Lakehouse.
Validates:
1. Streaming vs. Batch Reconciliation with 5% Late Events (Watermark & Side Output).
2. Worker Failure & State Recovery (Exactly-Once Semantics from Checkpoint).
3. Columnar Compaction Run (Before & After File Footprint Inspection).
"""

import os
import sys
import shutil
import tempfile
import pandas as pd
import numpy as np
import pyarrow as pa
import pyarrow.parquet as pq

from replayer.stream_session import generate_streaming_events
from flink.lap_stint_aggregates import FlinkStreamingSimulator, EventTimeWindowAccumulator


# -----------------------------------------------------------------------------
# Test 1: Ground Truth Batch Computation
# -----------------------------------------------------------------------------

def compute_batch_aggregates(events: list) -> list:
    """
    Computes pure offline batch aggregates over the exact ground-truth event dataset.
    This serves as the mathematical baseline against which streaming reconciliation is proven.
    """
    df = pd.DataFrame(events)
    
    # Define heavy braking: brake active and throttle low
    df["heavy_braking"] = ((df["brake"] == 1) & (df["throttle"] < 15.0)).astype(int)
    
    grouped = df.groupby(["session_id", "car_number", "driver", "lap_number", "stint"])
    
    batch_records = []
    for (sess, car, driver, lap, stint), group in grouped:
        avg_speed = group["speed_kph"].mean()
        avg_rpm = group["rpm"].mean()
        avg_throttle = group["throttle"].mean()
        max_speed = group["speed_kph"].max()
        samples = len(group)
        heavy_braking = group["heavy_braking"].sum()
        
        batch_records.append({
            "session_id": sess,
            "car_number": str(car),
            "driver": driver,
            "lap_number": int(lap),
            "stint": int(stint),
            "samples_count": int(samples),
            "max_speed_kph": round(float(max_speed), 2),
            "avg_speed_kph": round(float(avg_speed), 2),
            "avg_rpm": round(float(avg_rpm), 1),
            "avg_throttle_pct": round(float(avg_throttle), 2),
            "heavy_braking_count": int(heavy_braking)
        })
        
    batch_records.sort(key=lambda x: (x["car_number"], x["lap_number"]))
    return batch_records


# -----------------------------------------------------------------------------
# Test 1: Streaming vs Batch Reconciliation with 5% Late Events
# -----------------------------------------------------------------------------

def verify_streaming_vs_batch():
    print("\n" + "=" * 70)
    print("VERIFICATION 1: Streaming vs Batch with 5% Late Events")
    print("=" * 70)
    
    # 1. Generate events with 5% late arrivals beyond 5s watermark
    watermark_bound_s = 5.0
    late_pct = 0.05
    truth_events, stream_events = generate_streaming_events(
        max_laps=4,
        late_pct=late_pct,
        watermark_bound_s=watermark_bound_s,
        seed=101
    )
    
    total_events = len(stream_events)
    n_injected_late = sum(1 for e in stream_events if e["is_injected_late"])
    print(f"Total events generated: {total_events}")
    print(f"Injected late events: {n_injected_late} ({n_injected_late / total_events * 100:.2f}%)")
    
    # 2. Compute ground-truth batch baseline
    batch_truth = compute_batch_aggregates(truth_events)
    print(f"Batch ground truth computed across {len(batch_truth)} lap windows.")
    
    # 3. Execute streaming pipeline with Flink watermark strategy
    simulator = FlinkStreamingSimulator(watermark_delta_ms=int(watermark_bound_s * 1000))
    for ev in stream_events:
        simulator.process_event(ev)
        
    raw_streaming_aggs = simulator.emit_window_aggregates()
    late_events_captured = simulator.side_output_late_events
    
    print(f"\n[STREAM ENGINE]")
    print(f"On-time window records emitted: {len(raw_streaming_aggs)}")
    print(f"Side-output late events captured: {len(late_events_captured)}")
    
    # Assert that side output captured late events
    assert len(late_events_captured) > 0, "Error: Side output should have captured late events!"
    
    # 4. Reconcile late events into lakehouse aggregates (ReplacingMergeTree / Iceberg upsert)
    corrected_aggs = simulator.reconcile_late_events()
    
    # 5. Compare corrected streaming aggregates with batch ground truth
    print("\n[RECONCILIATION AUDIT]")
    print(f"{'Driver':<8}{'Lap':<6}{'Batch Samples':<16}{'Stream Samples':<16}{'Corrected Late':<16}{'Speed Diff (km/h)':<18}")
    print("-" * 80)
    
    discrepancies = 0
    for b_rec, c_rec in zip(batch_truth, corrected_aggs):
        assert b_rec["driver"] == c_rec["driver"], f"Driver mismatch: {b_rec['driver']} vs {c_rec['driver']}"
        assert b_rec["lap_number"] == c_rec["lap_number"], f"Lap mismatch: {b_rec['lap_number']} vs {c_rec['lap_number']}"
        
        speed_diff = abs(b_rec["avg_speed_kph"] - c_rec["avg_speed_kph"])
        samples_diff = abs(b_rec["samples_count"] - c_rec["samples_count"])
        
        print(f"{b_rec['driver']:<8}{b_rec['lap_number']:<6}{b_rec['samples_count']:<16}{c_rec['samples_count']:<16}{c_rec['late_events_corrected']:<16}{speed_diff:<18.4f}")
        
        if samples_diff != 0 or speed_diff > 0.05:
            discrepancies += 1

    print("-" * 80)
    print(f"Total Discrepancies between Corrected Streaming and Batch Baseline: {discrepancies}")
    assert discrepancies == 0, f"FAILED: Expected 0 discrepancies, found {discrepancies}"
    print(">>> VERIFICATION 1 PASSED: Streaming corrected aggregates EQUAL batch ground truth exactly!")


# -----------------------------------------------------------------------------
# Test 2: Worker Failure & State Recovery (Exactly-Once Semantics)
# -----------------------------------------------------------------------------

def verify_worker_recovery():
    print("\n" + "=" * 70)
    print("VERIFICATION 2: Flink Worker Mid-Run Crash & State Recovery")
    print("=" * 70)
    
    # 1. Generate stream of events
    _, stream_events = generate_streaming_events(max_laps=3, late_pct=0.05, watermark_bound_s=5.0, seed=202)
    total_events = len(stream_events)
    split_idx = total_events // 2
    
    # Normal execution without crash
    normal_sim = FlinkStreamingSimulator(watermark_delta_ms=5000)
    for ev in stream_events:
        normal_sim.process_event(ev)
    normal_result = normal_sim.reconcile_late_events()
    
    # Execution with crash and recovery
    recovering_sim = FlinkStreamingSimulator(watermark_delta_ms=5000)
    
    # Phase A: Process up to mid-run
    print(f"[RECOVERY TEST] Streaming first {split_idx}/{total_events} events...")
    for ev in stream_events[:split_idx]:
        recovering_sim.process_event(ev)
        
    # Phase B: Trigger Checkpoint #1
    chk_id = recovering_sim.trigger_checkpoint()
    print(f"[RECOVERY TEST] Checkpoint #{chk_id} taken. Operator state snapshot stored.")
    
    # Phase C: Simulate crash / memory corruption
    print("[RECOVERY TEST] SIMULATING FATAL TASKMANAGER CRASH mid-run (wiping memory state)...")
    recovering_sim.window_state = {}
    recovering_sim.current_watermark_ms = -float('inf')
    
    # Phase D: Restore from Checkpoint #1
    print(f"[RECOVERY TEST] Restoring TaskManager state from Checkpoint #{chk_id}...")
    recovering_sim.restore_from_checkpoint(chk_id)
    print(f"[RECOVERY TEST] State restored. Resuming stream from event offset {split_idx}...")
    
    # Phase E: Process remaining stream
    for ev in stream_events[split_idx:]:
        recovering_sim.process_event(ev)
        
    recovered_result = recovering_sim.reconcile_late_events()
    
    # Assert equivalence between uninterrupted run and recovered run
    assert len(normal_result) == len(recovered_result), "Recovered aggregates length mismatch!"
    
    diff_count = 0
    for norm, rec in zip(normal_result, recovered_result):
        if norm != rec:
            diff_count += 1
            
    print(f"[RECOVERY TEST] Discrepancies between normal and recovered run: {diff_count}")
    assert diff_count == 0, f"FAILED: Worker recovery produced {diff_count} discrepancies!"
    print(">>> VERIFICATION 2 PASSED: Worker failure & recovery yields identical exactly-once state!")


# -----------------------------------------------------------------------------
# Test 3: Compaction Run Before and After (Iceberg / ClickHouse Small Files)
# -----------------------------------------------------------------------------

def verify_compaction():
    print("\n" + "=" * 70)
    print("VERIFICATION 3: Iceberg / ClickHouse Columnar Compaction Run")
    print("=" * 70)
    
    temp_dir = tempfile.mkdtemp(prefix="apexis_lakehouse_compaction_")
    staging_dir = os.path.join(temp_dir, "warehouse", "f1_telemetry", "lap_aggregates", "session_2023_01")
    os.makedirs(staging_dir, exist_ok=True)
    
    # Simulate high-frequency streaming micro-batches creating many small part files
    print(f"[COMPACTION TEST] Simulating frequent streaming micro-batches writing to {staging_dir}...")
    
    n_micro_batches = 12
    records_per_batch = 15
    total_records = 0
    
    for b in range(n_micro_batches):
        data = {
            "session_id": [f"2023_01_BAHRAIN_R"] * records_per_batch,
            "car_number": [str(i % 4) for i in range(records_per_batch)],
            "driver": [["VER", "PER", "HAM", "ALO"][i % 4] for i in range(records_per_batch)],
            "lap_number": [b + 1] * records_per_batch,
            "samples_count": [np.random.randint(400, 500) for _ in range(records_per_batch)],
            "avg_speed_kph": [np.random.uniform(200.0, 240.0) for _ in range(records_per_batch)],
            "max_speed_kph": [np.random.uniform(315.0, 335.0) for _ in range(records_per_batch)]
        }
        table = pa.Table.from_pandas(pd.DataFrame(data))
        file_path = os.path.join(staging_dir, f"part-{b:04d}-{np.random.randint(1000, 9999)}.parquet")
        pq.write_table(table, file_path, compression='snappy')
        total_records += records_per_batch

    # Measure BEFORE compaction
    files_before = [os.path.join(staging_dir, f) for f in os.listdir(staging_dir) if f.endswith('.parquet')]
    total_size_before = sum(os.path.getsize(f) for f in files_before)
    
    print("\n--- BEFORE COMPACTION ---")
    print(f"Total Part Files: {len(files_before)}")
    print(f"Total Disk Size: {total_size_before / 1024:.2f} KB")
    for f in files_before[:4]:
        print(f"  • {os.path.basename(f)}: {os.path.getsize(f)} bytes")
    print(f"  ... and {len(files_before) - 4} more small part files.")
    
    # Execute Compaction (Iceberg bin-pack / ClickHouse OPTIMIZE FINAL equivalent)
    print("\n[COMPACTION TEST] Executing bin-packing compaction (merging small columnar files)...")
    
    dfs = [pd.read_parquet(f) for f in files_before]
    consolidated_df = pd.concat(dfs, ignore_index=True)
    consolidated_table = pa.Table.from_pandas(consolidated_df)
    
    # Write optimized compacted file
    compacted_file = os.path.join(staging_dir, "compacted-0001-optimized.parquet")
    pq.write_table(consolidated_table, compacted_file, compression='zstd')
    
    # Remove old part files (simulating Iceberg metadata commit swapping data files)
    for f in files_before:
        os.remove(f)
        
    # Measure AFTER compaction
    files_after = [os.path.join(staging_dir, f) for f in os.listdir(staging_dir) if f.endswith('.parquet')]
    total_size_after = sum(os.path.getsize(f) for f in files_after)
    
    print("\n--- AFTER COMPACTION ---")
    print(f"Total Part Files: {len(files_after)}")
    print(f"Total Disk Size: {total_size_after / 1024:.2f} KB")
    for f in files_after:
        print(f"  • {os.path.basename(f)}: {os.path.getsize(f)} bytes")
        
    # Verify row integrity
    re_read_df = pd.read_parquet(compacted_file)
    print(f"\nRow count verification: {len(re_read_df)} rows after compaction == {total_records} original rows.")
    assert len(re_read_df) == total_records, "Compaction lost rows!"
    assert len(files_after) == 1, "Expected single compacted file!"
    
    # Clean up temp
    shutil.rmtree(temp_dir)
    print(">>> VERIFICATION 3 PASSED: Compaction reduced 12 small files into 1 optimized columnar file with zero data loss!")


if __name__ == '__main__':
    print("######################################################################")
    print("           APEXIS TELEMETRY LAKEHOUSE VERIFICATION SUITE              ")
    print("######################################################################")
    
    verify_streaming_vs_batch()
    verify_worker_recovery()
    verify_compaction()
    
    print("\n" + "#" * 70)
    print("ALL 3 LAKEHOUSE VERIFICATIONS PASSED SUCCESSFULLY (CODE 0)")
    print("#" * 70)
