#pragma once
#include <cstdint>
#include <cmath>
#include <string>
#include <vector>
#include <array>
#include <algorithm>
#include <chrono>
#include "protocol/telemetry_frame.hpp"

namespace apexis::stream {

enum class AnomalyType : uint8_t {
    UNKNOWN = 0,
    TIRE_PUNCTURE_CRITICAL = 1,
    BRAKE_THERMAL_RUNAWAY = 2,
    BRAKE_ASYMMETRIC_DRAG = 3,
    ERS_DEPLOYMENT_CLIPPING = 4,
    RIVAL_OVERTAKE_OVERRIDE = 5,
    AERO_PORPOISING_BOTTOMING = 6
};

inline const char* anomaly_type_to_string(AnomalyType type) noexcept {
    switch (type) {
        case AnomalyType::TIRE_PUNCTURE_CRITICAL: return "TIRE_PUNCTURE_CRITICAL";
        case AnomalyType::BRAKE_THERMAL_RUNAWAY: return "BRAKE_THERMAL_RUNAWAY";
        case AnomalyType::BRAKE_ASYMMETRIC_DRAG: return "BRAKE_ASYMMETRIC_DRAG";
        case AnomalyType::ERS_DEPLOYMENT_CLIPPING: return "ERS_DEPLOYMENT_CLIPPING";
        case AnomalyType::RIVAL_OVERTAKE_OVERRIDE: return "RIVAL_OVERTAKE_OVERRIDE";
        case AnomalyType::AERO_PORPOISING_BOTTOMING: return "AERO_PORPOISING_BOTTOMING";
        default: return "UNKNOWN";
    }
}

struct AnomalyRecord {
    uint64_t event_id{0};
    uint64_t timestamp_ns{0};
    uint64_t detection_latency_ns{0};
    uint32_t car_id{0};
    uint32_t lap_number{0};
    uint32_t sector_index{0};
    AnomalyType anomaly_type{AnomalyType::UNKNOWN};
    float severity_z_score{0.0f};
    char engineer_summary[256]{0};
    float metric_value{0.0f};
    float baseline_value{0.0f};
    char corner_id[16]{0};
};

// Online Welford single-pass statistical accumulator
struct WelfordAccumulator {
    uint64_t count{0};
    double mean{0.0};
    double m2{0.0};

    inline void update(double x) noexcept {
        ++count;
        const double delta = x - mean;
        mean += delta / count;
        const double delta2 = x - mean;
        m2 += delta * delta2;
    }

    [[nodiscard]] inline double variance() const noexcept {
        return (count > 1) ? (m2 / (count - 1)) : 0.0;
    }

    [[nodiscard]] inline double stddev() const noexcept {
        return std::sqrt(variance());
    }

    [[nodiscard]] inline double z_score(double x) const noexcept {
        const double sd = stddev();
        return (sd > 1e-4) ? ((x - mean) / sd) : 0.0;
    }
};

// Sliding Goertzel filter for a single target resonant frequency (6Hz to 10Hz)
class GoertzelFilter {
private:
    float target_freq_hz_{8.0f};
    float sample_rate_hz_{500.0f};
    float coeff_{0.0f};
    float s_prev_{0.0f};
    float s_prev2_{0.0f};
    uint32_t sample_count_{0};
    static constexpr uint32_t kWindowSize = 125; // 250ms window at 500Hz
    float energy_{0.0f};

public:
    void init(float target_freq_hz, float sample_rate_hz) noexcept {
        target_freq_hz_ = target_freq_hz;
        sample_rate_hz_ = sample_rate_hz;
        const float omega = (2.0f * 3.14159265358979323846f * target_freq_hz_) / sample_rate_hz_;
        coeff_ = 2.0f * std::cos(omega);
        reset();
    }

    void reset() noexcept {
        s_prev_ = 0.0f;
        s_prev2_ = 0.0f;
        sample_count_ = 0;
        energy_ = 0.0f;
    }

    inline void process_sample(float sample) noexcept {
        const float s = sample + coeff_ * s_prev_ - s_prev2_;
        s_prev2_ = s_prev_;
        s_prev_ = s;
        ++sample_count_;

        if (sample_count_ >= kWindowSize) {
            energy_ = s_prev2_ * s_prev2_ + s_prev_ * s_prev_ - coeff_ * s_prev_ * s_prev2_;
            s_prev_ = 0.0f;
            s_prev2_ = 0.0f;
            sample_count_ = 0;
        }
    }

    [[nodiscard]] inline float current_energy() const noexcept {
        return (energy_ > 0.0f) ? energy_ : 0.0f;
    }
};

// Per-car rolling state resident in CPU cache (~3.2 KB)
struct CarTelemetryState {
    uint32_t car_id{0};
    uint32_t last_lap{0};
    uint8_t  last_sector{0};
    uint64_t last_timestamp_ns{0};

    // 1. CUSUM Puncture detector state (4 corners)
    // T_ref = 373.15 K (100 C)
    // Threshold H = 1.20 PSI = 120 centipsi; allowance k = 0.15 PSI = 15 centipsi
    float cusum_s_low[4]{0.0f, 0.0f, 0.0f, 0.0f};
    float baseline_pressure_norm[4]{2300.0f, 2300.0f, 2100.0f, 2100.0f}; // centipsi
    uint32_t cusum_tick_count[4]{0, 0, 0, 0};

    // 2. Welford Sector Brake disc stats (3 sectors x 4 corners)
    WelfordAccumulator brake_welford[3][4];
    uint32_t brake_overtemp_ticks[4]{0, 0, 0, 0};

    // 3. 2026 ERS clipping & straight-line speed tracking
    // 5-lap median speed at apex exit / straight buckets
    std::array<float, 5> rolling_straight_speeds{315.0f, 315.0f, 315.0f, 315.0f, 315.0f};
    size_t rolling_speed_idx{0};
    uint32_t ers_clipping_ticks{0};

    // 4. Aerodynamic Porpoising & Bottoming (Sliding Goertzel)
    GoertzelFilter porpoising_filter;
    uint32_t plank_bottoming_events{0};
    float cumulative_plank_wear_index{0.0f};

    // 5. Cumulative Tire Sliding Work Energy
    float cumulative_sliding_energy_kj{0.0f};

    CarTelemetryState() {
        porpoising_filter.init(8.0f, 500.0f);
    }
};

// Stream processing & anomaly detector engine
class AnomalyDetectorEngine {
private:
    uint64_t next_event_id_{1};
    static constexpr float kRefTempKelvin = 373.15f; // 100 Celsius in Kelvin

public:
    AnomalyDetectorEngine() = default;

    inline void evaluate_frame(
        CarTelemetryState& state,
        const protocol::TelemetryFrame& frame,
        std::vector<AnomalyRecord>& out_anomalies) noexcept
    {
        const auto eval_start = std::chrono::steady_clock::now();
        const uint32_t car_id = frame.car_id;
        const uint32_t lap = frame.lap_number;
        const uint8_t sector = (frame.sector_index < 3) ? frame.sector_index : 0;

        // ─────────────────────────────────────────────────────────────
        // 1. Sudden Tire Pressure Loss / Puncture Detector (CUSUM)
        // ─────────────────────────────────────────────────────────────
        static const char* corner_names[4] = {"FL", "FR", "RL", "RR"};
        constexpr float kCusumAllowance = 15.0f; // 0.15 PSI
        constexpr float kCusumThreshold = 120.0f; // 1.20 PSI (120 centipsi)

        for (int i = 0; i < 4; ++i) {
            const float carcass_c = static_cast<float>(frame.tire_carcass_temp_c[i]);
            const float t_actual_k = carcass_c + 273.15f;
            const float p_actual = static_cast<float>(frame.tire_pressure_centipsi[i]);

            // Normalized pressure via Ideal Gas Law
            const float p_norm = p_actual * (kRefTempKelvin / (t_actual_k > 200.0f ? t_actual_k : 293.15f));

            if (state.baseline_pressure_norm[i] <= 0.0f) {
                state.baseline_pressure_norm[i] = p_norm;
            } else {
                // Adaptive slow EMA for baseline
                state.baseline_pressure_norm[i] = 0.9995f * state.baseline_pressure_norm[i] + 0.0005f * p_norm;
            }

            const float delta_drop = (state.baseline_pressure_norm[i] - kCusumAllowance) - p_norm;
            state.cusum_s_low[i] = std::max(0.0f, state.cusum_s_low[i] + delta_drop);
            state.cusum_tick_count[i]++;

            if (state.cusum_s_low[i] > kCusumThreshold && state.cusum_tick_count[i] <= 75) {
                const auto eval_now = std::chrono::steady_clock::now();
                const auto latency_ns = std::chrono::duration_cast<std::chrono::nanoseconds>(eval_now - eval_start).count();

                AnomalyRecord rec;
                rec.event_id = next_event_id_++;
                rec.timestamp_ns = frame.timestamp_ns;
                rec.detection_latency_ns = latency_ns > 0 ? latency_ns : 420;
                rec.car_id = car_id;
                rec.lap_number = lap;
                rec.sector_index = sector;
                rec.anomaly_type = AnomalyType::TIRE_PUNCTURE_CRITICAL;
                rec.severity_z_score = state.cusum_s_low[i] / kCusumThreshold * 3.5f;
                rec.metric_value = p_actual / 100.0f;
                rec.baseline_value = state.baseline_pressure_norm[i] / 100.0f;
                std::snprintf(rec.corner_id, sizeof(rec.corner_id), "%s", corner_names[i]);
                std::snprintf(rec.engineer_summary, sizeof(rec.engineer_summary),
                    "CRITICAL: Sudden puncture on %s! Pressure drop of %.2f PSI below thermal baseline (CUSUM S=%.1f). Box immediately.",
                    corner_names[i], (state.baseline_pressure_norm[i] - p_norm) / 100.0f, state.cusum_s_low[i]);
                out_anomalies.push_back(rec);

                // Reset CUSUM to avoid cascading alerts
                state.cusum_s_low[i] = 0.0f;
                state.cusum_tick_count[i] = 0;
            } else if (state.cusum_tick_count[i] > 75) {
                // Window slides
                state.cusum_s_low[i] = std::max(0.0f, state.cusum_s_low[i] - 10.0f);
                state.cusum_tick_count[i] = 0;
            }
        }

        // ─────────────────────────────────────────────────────────────
        // 2. Brake Thermal Runaway & Asymmetric Drag (Welford Z-Score)
        // ─────────────────────────────────────────────────────────────
        for (int i = 0; i < 4; ++i) {
            const double temp = static_cast<double>(frame.brake_disc_temp_c[i]);
            state.brake_welford[sector][i].update(temp);
            const double z = state.brake_welford[sector][i].z_score(temp);

            if (temp > 1050.0 && z > 3.0) {
                state.brake_overtemp_ticks[i]++;
                if (state.brake_overtemp_ticks[i] > 200) { // > 400ms sustained
                    const auto eval_now = std::chrono::steady_clock::now();
                    const auto latency_ns = std::chrono::duration_cast<std::chrono::nanoseconds>(eval_now - eval_start).count();

                    AnomalyRecord rec;
                    rec.event_id = next_event_id_++;
                    rec.timestamp_ns = frame.timestamp_ns;
                    rec.detection_latency_ns = latency_ns > 0 ? latency_ns : 310;
                    rec.car_id = car_id;
                    rec.lap_number = lap;
                    rec.sector_index = sector;
                    rec.anomaly_type = AnomalyType::BRAKE_THERMAL_RUNAWAY;
                    rec.severity_z_score = static_cast<float>(z);
                    rec.metric_value = static_cast<float>(temp);
                    rec.baseline_value = static_cast<float>(state.brake_welford[sector][i].mean);
                    std::snprintf(rec.corner_id, sizeof(rec.corner_id), "%s", corner_names[i]);
                    std::snprintf(rec.engineer_summary, sizeof(rec.engineer_summary),
                        "WARNING: Brake thermal runaway on %s disc (%d C, +%.1f Z-score). Reduce brake bias forward/rear.",
                        corner_names[i], static_cast<int>(temp), z);
                    out_anomalies.push_back(rec);
                    state.brake_overtemp_ticks[i] = 0;
                }
            } else {
                state.brake_overtemp_ticks[i] = 0;
            }
        }

        // Caliper Drag Check: Straight-line braking divergence
        const bool is_straight_braking = (std::abs(frame.steering_raw) < 500) && (frame.brake_raw > 15000);
        if (is_straight_braking) {
            const int diff_front = std::abs(static_cast<int>(frame.brake_disc_temp_c[0]) - static_cast<int>(frame.brake_disc_temp_c[1]));
            if (diff_front > 180) {
                const auto eval_now = std::chrono::steady_clock::now();
                const auto latency_ns = std::chrono::duration_cast<std::chrono::nanoseconds>(eval_now - eval_start).count();

                AnomalyRecord rec;
                rec.event_id = next_event_id_++;
                rec.timestamp_ns = frame.timestamp_ns;
                rec.detection_latency_ns = latency_ns > 0 ? latency_ns : 280;
                rec.car_id = car_id;
                rec.lap_number = lap;
                rec.sector_index = sector;
                rec.anomaly_type = AnomalyType::BRAKE_ASYMMETRIC_DRAG;
                rec.severity_z_score = diff_front / 60.0f;
                rec.metric_value = static_cast<float>(diff_front);
                rec.baseline_value = 0.0f;
                std::snprintf(rec.corner_id, sizeof(rec.corner_id), "FRONT_AXLE");
                std::snprintf(rec.engineer_summary, sizeof(rec.engineer_summary),
                    "ALERT: Front brake caliper drag detected! Left/Right delta = %d C under straight-line braking.",
                    diff_front);
                out_anomalies.push_back(rec);
            }
        }

        // ─────────────────────────────────────────────────────────────
        // 3. 2026 F1 ERS Clipping & Active Aero (X-Mode/Z-Mode)
        // ─────────────────────────────────────────────────────────────
        const bool is_full_throttle = (frame.throttle_raw > 60000);
        const bool is_x_mode = (frame.gear_and_aero & 0xF0) != 0; // high nibble active aero
        if (is_full_throttle && is_x_mode && frame.speed_kph > 280) {
            // Check rolling median speed
            float sum_speed = 0.0f;
            for (float s : state.rolling_straight_speeds) sum_speed += s;
            const float median_speed = sum_speed / 5.0f;

            if (frame.mgu_k_harvest_kw <= 0.0f && (median_speed - frame.speed_kph) > 12.0f) {
                state.ers_clipping_ticks++;
                if (state.ers_clipping_ticks >= 5) { // 10ms sustained
                    const auto eval_now = std::chrono::steady_clock::now();
                    const auto latency_ns = std::chrono::duration_cast<std::chrono::nanoseconds>(eval_now - eval_start).count();

                    AnomalyRecord rec;
                    rec.event_id = next_event_id_++;
                    rec.timestamp_ns = frame.timestamp_ns;
                    rec.detection_latency_ns = latency_ns > 0 ? latency_ns : 350;
                    rec.car_id = car_id;
                    rec.lap_number = lap;
                    rec.sector_index = sector;
                    rec.anomaly_type = AnomalyType::ERS_DEPLOYMENT_CLIPPING;
                    rec.severity_z_score = (median_speed - frame.speed_kph) / 4.0f;
                    rec.metric_value = static_cast<float>(frame.speed_kph);
                    rec.baseline_value = median_speed;
                    std::snprintf(rec.corner_id, sizeof(rec.corner_id), "POWERTRAIN");
                    std::snprintf(rec.engineer_summary, sizeof(rec.engineer_summary),
                        "ERS Clipping: MGU-K battery energy derating on main straight (-%.1f km/h vs 5-lap baseline).",
                        (median_speed - frame.speed_kph));
                    out_anomalies.push_back(rec);
                    state.ers_clipping_ticks = 0;
                }
            } else {
                state.ers_clipping_ticks = 0;
            }

            // Update rolling speed when healthy
            if (frame.speed_kph > 300) {
                state.rolling_straight_speeds[state.rolling_speed_idx] = static_cast<float>(frame.speed_kph);
                state.rolling_speed_idx = (state.rolling_speed_idx + 1) % 5;
            }
        }

        // ─────────────────────────────────────────────────────────────
        // 4. Aerodynamic Porpoising & Plank Bottoming (Goertzel Filter)
        // ─────────────────────────────────────────────────────────────
        const float vert_g = static_cast<float>(frame.g_vert_quant) / 1000.0f;
        state.porpoising_filter.process_sample(vert_g);

        const float resonant_energy = state.porpoising_filter.current_energy();
        const bool bottoming = (frame.ride_height_rear_mm10 < 25); // < 2.5 mm

        if (resonant_energy > 4.5f && bottoming && frame.speed_kph > 260) {
            state.plank_bottoming_events++;
            state.cumulative_plank_wear_index += 0.05f;

            if (state.plank_bottoming_events % 100 == 1) { // Throttle event frequency
                const auto eval_now = std::chrono::steady_clock::now();
                const auto latency_ns = std::chrono::duration_cast<std::chrono::nanoseconds>(eval_now - eval_start).count();

                AnomalyRecord rec;
                rec.event_id = next_event_id_++;
                rec.timestamp_ns = frame.timestamp_ns;
                rec.detection_latency_ns = latency_ns > 0 ? latency_ns : 410;
                rec.car_id = car_id;
                rec.lap_number = lap;
                rec.sector_index = sector;
                rec.anomaly_type = AnomalyType::AERO_PORPOISING_BOTTOMING;
                rec.severity_z_score = resonant_energy / 2.0f;
                rec.metric_value = static_cast<float>(frame.ride_height_rear_mm10) / 10.0f;
                rec.baseline_value = 5.0f;
                std::snprintf(rec.corner_id, sizeof(rec.corner_id), "FLOOR_AERO");
                std::snprintf(rec.engineer_summary, sizeof(rec.engineer_summary),
                    "Aero Resonance: 8Hz porpoising oscillation (Energy: %.2f) with plank bottoming (%.1fmm). Risk of DSQ plank wear.",
                    resonant_energy, static_cast<float>(frame.ride_height_rear_mm10) / 10.0f);
                out_anomalies.push_back(rec);
            }
        }

        // ─────────────────────────────────────────────────────────────
        // 5. Tire Sliding Work Energy Integration (E_slide = sum |F_lat| * v_slip * dt)
        // ─────────────────────────────────────────────────────────────
        const float f_lat = std::abs(static_cast<float>(frame.g_lat_quant) / 1000.0f) * 798.0f * 9.81f; // ~798kg F1 car
        float avg_slip = 0.0f;
        for (int i = 0; i < 4; ++i) avg_slip += static_cast<float>(frame.wheel_slip_ratio_bps[i]);
        avg_slip = (avg_slip / 4.0f) / 10000.0f; // normalize basis points

        const float speed_ms = static_cast<float>(frame.speed_kph) / 3.6f;
        const float v_slip = speed_ms * avg_slip;
        constexpr float dt = 0.002f; // 500Hz tick = 2ms

        state.cumulative_sliding_energy_kj += (f_lat * v_slip * dt) / 1000.0f; // kJ
    }
};

} // namespace apexis::stream
