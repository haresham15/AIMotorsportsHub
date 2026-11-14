# What is a Watermark and What Happens to an Event That Arrives After It?

## 1. The Core Problem: The Temporal Trinity in Streaming Telemetry

In high-throughput, distributed streaming systems such as Formula 1 telemetry ingestion, time is not a single scalar. Every telemetry record exists within a **Temporal Trinity**:

1. **Event Time ($t_e$)**: The exact instant the physical measurement occurred on the vehicle. Captured by the car's Engine Control Unit (ECU) or telemetry data logger (e.g., Bosch / McLaren Applied TAG-320 ECU) using GPS-synchronized hardware timers.
2. **Ingestion Time ($t_i$)**: The instant the telemetry packet was received by the edge gateway or Kafka broker at the circuit pit wall.
3. **Processing Time ($t_p$)**: The wall-clock time of the machine executing the stream processing operator (e.g., Apache Flink TaskManager) when the record is read and transformed.

Because wireless radio networks across race tracks experience variable attenuation, transmission queues, dropped packets, and bursty retransmissions, the network delay $\Delta = t_p - t_e$ is **non-deterministic, non-monotonic, and unbounded**. 

```text
[Car ECU (Event Time: 15:00:01.200)]
               │
               ▼ (RF packet dropped in Monaco Tunnel)
[Onboard FIFO Buffer Holds Packet (5.4s delay)]
               │
               ▼ (Car exits tunnel; burst retransmit)
[Pit Wall Antenna / Kafka (Ingest Time: 15:00:06.600)]
               │
               ▼ (TCP backpressure / broker routing)
[Flink Stream Engine (Processing Time: 15:00:06.850)]
```

If an analytics system groups and aggregates data using **Processing Time**, results are completely untruthful: a car buffering 5 seconds of telemetry in a dead-zone that flushes in 100 milliseconds would register an impossible, physics-violating speed burst of 15,000 km/h or a completed lap in 0.1 seconds. 

Therefore, mission-critical analytics must execute in **Event Time**. But executing in event time introduces a fundamental dilemma: *when has all the data for Lap $N$ arrived so we can close the window and publish the lap aggregate?*

---

## 2. Mathematical Definition of a Watermark

A **Watermark** is a specialized, in-band stream metadata element that measures **progress in event time**.

Mathematically, a watermark is a monotonically non-decreasing metric function $W(t)$ emitted into the stream. When an operator receives a watermark with timestamp $T$:

$$W(t) = T$$

It constitutes a formal temporal assertion:

$$\mathbf{P}\left(\exists \, e_k \mid t_e(e_k) \le T\right) \approx 0$$

> *"The system asserts that, to the best of its tolerance policy, no subsequent events with event timestamp $t_e \le T$ will ever arrive."*

### The Bounded Out-of-Orderness Watermark Strategy

The standard, industry-proven watermark generator implemented in our Flink pipeline is **Bounded Out-of-Orderness** with latency slack $\delta$:

$$W(t) = \max_{1 \le i \le k}\left(t_e(e_i)\right) - \delta$$

Where:
- $\max_{1 \le i \le k}(t_e(e_i))$ is the maximum event timestamp observed by the operator across all processed events $e_1, \dots, e_k$.
- $\delta$ is the bounded out-of-orderness tolerance (in Apexis: $\delta = 5.0\text{ seconds}$).

```text
Event Stream:  (e1: 15:00:02) ──► (e2: 15:00:06) ──► (e3: 15:00:04) ──► [Watermark W=15:00:01]
               max_event = 2s     max_event = 6s     max_event = 6s       W = 6s - 5s = 1s
```

### Window Firing Semantics
When an event-time window covers the interval $[W_{\text{start}}, W_{\text{end}})$ (for example, Lap 1 from `15:00:00` to `15:01:36`):
- Telemetry events with $t_e \in [W_{\text{start}}, W_{\text{end}})$ are routed to that window's accumulator state.
- The window is **fired** (triggering aggregation computation and downstream emission to ClickHouse/Iceberg) as soon as the advancing watermark reaches or exceeds the window boundary:

$$W(t) \ge W_{\text{end}}$$

---

## 3. What Happens to an Event That Arrives After the Watermark?

Because $\delta$ is a finite heuristic (e.g., 5 seconds), real-world distributed networks can and will violate it. An event $e_{\text{late}}$ that arrives at an operator with:

$$t_e(e_{\text{late}}) < W(t)$$

is formally classified as a **Late Event**. The watermark has already advanced past the event's timestamp, and any window that was responsible for $t_e(e_{\text{late}})$ may have already fired, produced its output, and evicted its state from memory.

In modern stream architectures, four strategies exist to handle late events:

```text
                               ┌─────────────────────────────┐
                               │  Event Arrives: te < W(t)   │
                               └──────────────┬──────────────┘
                                              │
                      ┌───────────────────────┼───────────────────────┐
                      ▼                       ▼                       ▼
            [Strategy 1: Drop]     [Strategy 2: Lateness]    [Strategy 3: Side Output]
            • Silently discarded   • Window state kept       • Routed to Dead-Letter
            • Under-counts data      for duration L            audit stream
            • High data loss       • Emits retraction        • Zero data loss
                                   • High memory bloat       • Used in Apexis!
                                                                      │
                                                                      ▼
                                                         [Strategy 4: Lakehouse Merge]
                                                         • ClickHouse ReplacingMergeTree
                                                         • Iceberg MERGE INTO upsert
                                                         • Exact batch reconciliation
```

### Strategy 1: Silent Discard (Default Flink Behavior)
If no handling strategy is configured, Flink's window operator drops the event. The operator increments the `numLateRecordsDropped` internal counter.
- **Consequence**: Data loss. In motorsport, a discarded telemetry packet could contain a critical brake pressure peak or gear failure signature.

### Strategy 2: Allowed Lateness ($L > 0$)
The developer configures `.allowedLateness(Time.seconds(L))`.
- The operator does **not** purge the window state when $W(t) \ge W_{\text{end}}$. Instead, it retains the window state in memory (or RocksDB) until $W(t) \ge W_{\text{end}} + L$.
- When a late event arrives before $L$ expires, the window re-evaluates and emits an updated result (or a retraction record followed by a revised record in changelog streams).
- **Consequence**: High memory footprint. If hundreds of cars generate thousands of windows, keeping stale window states open degrades throughput and risks Out-Of-Memory (OOM) crashes.

### Strategy 3 & 4: Side Output Routing & Lakehouse Reconciliation (The Apexis Architecture)
In our production pipeline (`pipeline/flink/lap_stint_aggregates.py` and `pipeline/clickhouse/init.sql`), we deploy the enterprise standard: **Side-Output Routing coupled with Lakehouse Asynchronous Upserting**.

1. **Clean Window Purge**: On-time windows fire promptly when $W(t) \ge W_{\text{end}}$ and evict their high-memory accumulators to maintain low latency and low memory overhead.
2. **Side Output Branching**: Any event where $t_e < W(t)$ is tagged with `OutputTag("late-telemetry")` and emitted onto an isolated side-output DataStream:
   ```python
   # Flink Operator Logic:
   if event_time_ms < current_watermark_ms:
       ctx.output(late_telemetry_tag, event)
   ```
3. **Audit Ingestion**: The side-output stream is ingested into `f1_telemetry.late_events_audit` in ClickHouse and logged to object storage.
4. **Lakehouse Compaction & Upsert**:
   - In ClickHouse, `f1_telemetry.lap_aggregates` is partitioned by `session_id` and backed by the `ReplacingMergeTree` engine ordered by `(session_id, car_number, lap_number)`.
   - A reconciliation micro-batch merges the late events audit log into the aggregate table.
   - When ClickHouse executes background part compaction (`OPTIMIZE TABLE f1_telemetry.lap_aggregates FINAL`) or when Iceberg performs partition compaction, older partial aggregates are replaced by the corrected aggregates.
   - As proven in our verification suite (`pipeline/verify_lakehouse.py`), **100% of late events are recovered**, and the streaming corrected aggregates equal offline batch computation down to the exact sample count and $0.0000\text{ km/h}$ speed discrepancy.

---

## 4. Why Telemetry Watermarking is Mandatory in Formula 1

Formula 1 telemetry is one of the most hostile streaming environments in existence:

1. **RF Attenuation & Track Topology**:
   - Circuits like Monaco (the Fairmount Hairpin into the Tunnel), Baku (narrow Old City castle walls), and Spa-Francorchamps (deep Ardennes forest valleys) cause severe electromagnetic shielding.
   - While in the tunnel, the car's 868MHz / 2.4GHz radio link to trackside base stations is completely severed.
2. **Onboard ECU FIFO Buffering**:
   - Modern F1 cars continue collecting sensor data at 10Hz to 1kHz into volatile FIFO memory buffers while radio contact is lost.
   - When the car exits the tunnel at Portier, the radio reconnects. The vehicle dumps an 8-second backlog of hundreds of telemetry packets in a high-bandwidth burst lasting only 100 milliseconds.
3. **Pit Lane Antenna Handoffs**:
   - Telemetry systems switch from trackside transceivers to pit gantry ultra-wideband antennas when entering the pit box, creating latency spikes and packet interleaving.

Without event-time watermarking with bounded out-of-orderness and side-output reconciliation, any real-time race analytics platform will either:
- **Corrupt race physics** by mistaking delayed burst packets for instantaneous real-world velocity spikes, or
- **Drop the data entirely**, blinding race engineers to tyre degradation, brake wear, and engine temperature anomalies when the car re-enters radio coverage.

By combining BoundedOutOfOrderness watermarks ($\delta = 5.0\text{s}$), side-output capturing, and Iceberg/ClickHouse columnar compaction, Apexis guarantees deterministic, mathematically verifiable accuracy across live race operations.
