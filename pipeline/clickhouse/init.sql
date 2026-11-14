-- ClickHouse Initialization Script for F1 Telemetry Lakehouse

CREATE DATABASE IF NOT EXISTS f1_telemetry;

-- Raw streaming telemetry buffer table (ReplacingMergeTree for idempotency)
CREATE TABLE IF NOT EXISTS f1_telemetry.raw_stream (
    session_id LowCardinality(String),
    event_time DateTime64(3, 'UTC'),
    ingest_time DateTime64(3, 'UTC') DEFAULT now64(3),
    car_number LowCardinality(String),
    driver LowCardinality(String),
    lap_number UInt16,
    stint UInt8,
    speed_kph Float32,
    rpm UInt16,
    throttle Float32,
    brake UInt8,
    drs UInt8,
    is_late UInt8
) ENGINE = ReplacingMergeTree()
PARTITION BY (session_id, toYYYYMM(event_time))
ORDER BY (session_id, car_number, lap_number, event_time);

-- Per-lap window aggregates computed by Flink
CREATE TABLE IF NOT EXISTS f1_telemetry.lap_aggregates (
    session_id LowCardinality(String),
    car_number LowCardinality(String),
    driver LowCardinality(String),
    lap_number UInt16,
    window_start DateTime64(3, 'UTC'),
    window_end DateTime64(3, 'UTC'),
    samples_count UInt32,
    max_speed_kph Float32,
    avg_speed_kph Float32,
    avg_rpm Float32,
    avg_throttle_pct Float32,
    heavy_braking_count UInt16,
    late_events_corrected UInt16,
    computed_at DateTime64(3, 'UTC') DEFAULT now64(3)
) ENGINE = ReplacingMergeTree()
PARTITION BY session_id
ORDER BY (session_id, car_number, lap_number);

-- Side-output audit table for events arriving after watermark
CREATE TABLE IF NOT EXISTS f1_telemetry.late_events_audit (
    session_id LowCardinality(String),
    event_time DateTime64(3, 'UTC'),
    watermark_at_arrival DateTime64(3, 'UTC'),
    delay_ms Int64,
    car_number LowCardinality(String),
    driver LowCardinality(String),
    lap_number UInt16,
    speed_kph Float32,
    reconciled UInt8 DEFAULT 0,
    recorded_at DateTime64(3, 'UTC') DEFAULT now64(3)
) ENGINE = MergeTree()
PARTITION BY session_id
ORDER BY (session_id, event_time, car_number);
