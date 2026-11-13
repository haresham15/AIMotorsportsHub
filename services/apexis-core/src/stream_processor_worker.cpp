#include "stream_processor_worker.hpp"
#include <chrono>
#include <iostream>

#if !defined(_WIN32)
#include <pthread.h>
#endif

namespace apexis::stream {

StreamProcessorWorker::StreamProcessorWorker(
    size_t shard_id,
    concurrency::SPSCRingBuffer<protocol::TelemetryFrame, 65536>& ring,
    storage::MmapTimeSeriesDB& tsdb,
    metrics::PrometheusExporter& metrics,
    AnomalyCallback anomaly_callback
)
    : shard_id_(shard_id)
    , ring_(ring)
    , tsdb_(tsdb)
    , metrics_(metrics)
    , anomaly_callback_(std::move(anomaly_callback))
{
    car_states_.resize(48);
    for (size_t i = 0; i < car_states_.size(); ++i) {
        car_states_[i].car_id = static_cast<uint32_t>(i);
    }
}

StreamProcessorWorker::~StreamProcessorWorker() {
    stop();
}

void StreamProcessorWorker::start() {
    if (running_.exchange(true)) return;
    worker_thread_ = std::thread(&StreamProcessorWorker::run_worker_loop, this);
}

void StreamProcessorWorker::stop() {
    if (!running_.exchange(false)) return;
    if (worker_thread_.joinable()) {
        worker_thread_.join();
    }
}

void StreamProcessorWorker::run_worker_loop() {
#if !defined(_WIN32)
    // Core pinning: Core 1..8 for workers
    cpu_set_t cpuset;
    CPU_ZERO(&cpuset);
    CPU_SET((shard_id_ + 1) % std::thread::hardware_concurrency(), &cpuset);
    pthread_setaffinity_np(pthread_self(), sizeof(cpu_set_t), &cpuset);
#endif

    protocol::TelemetryFrame frame;
    std::vector<AnomalyRecord> anomalies;
    anomalies.reserve(8);

    constexpr size_t kBatchSize = 64;
    protocol::TelemetryFrame batch[kBatchSize];
    size_t batch_count = 0;

    auto last_metrics_sync = std::chrono::steady_clock::now();

    while (running_.load(std::memory_order_relaxed)) {
        if (ring_.try_pop(frame)) {
            // Run anomaly engine on this frame
            anomalies.clear();
            const size_t car_slot = frame.car_id < car_states_.size() ? frame.car_id : 0;
            anomaly_engine_.evaluate_frame(car_states_[car_slot], frame, anomalies);

            if (!anomalies.empty()) {
                metrics_.record_anomaly(anomalies.size());
                if (anomaly_callback_) {
                    for (const auto& a : anomalies) {
                        anomaly_callback_(a);
                    }
                }
            }

            // Micro-batch append to mmap WAL
            batch[batch_count++] = frame;
            if (batch_count >= kBatchSize) {
                tsdb_.append_batch(batch, batch_count);
                batch_count = 0;
            }
        } else {
            // Spin-wait or short yield
            std::this_thread::yield();
        }

        // Sync Prometheus gauges every 250ms
        const auto now = std::chrono::steady_clock::now();
        if (std::chrono::duration_cast<std::chrono::milliseconds>(now - last_metrics_sync).count() > 250) {
            metrics_.set_shard_occupancy(shard_id_, ring_.occupancy_ratio());
            last_metrics_sync = now;
        }
    }

    if (batch_count > 0) {
        tsdb_.append_batch(batch, batch_count);
    }
}

} // namespace apexis::stream
