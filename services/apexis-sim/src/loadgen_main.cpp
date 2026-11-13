#include <iostream>
#include <vector>
#include <thread>
#include <atomic>
#include <chrono>
#include <cmath>
#include <cstring>
#include <csignal>
#include <iomanip>
#include "../../apexis-core/include/protocol/telemetry_frame.hpp"

#if defined(_WIN32)
#include <winsock2.h>
#include <ws2tcpip.h>
#pragma comment(lib, "ws2_32.lib")
#else
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <unistd.h>
#endif

using apexis::protocol::TelemetryFrame;
using apexis::protocol::calculate_frame_crc32c;

static std::atomic<bool> g_sim_running{true};
static std::atomic<bool> g_chaos_burst{false};

void handle_signal(int) {
    g_sim_running.store(false);
}

struct CarSimState {
    uint8_t car_id;
    uint8_t series_id;
    float track_length_m;
    float distance_m;
    float speed_kph;
    float battery_joules;
    uint32_t lap;
    uint64_t seq;
    float brake_temp[4];
    float tire_temp[4];
    float tire_pressure[4];
    float ride_height_front;
    float ride_height_rear;
    bool has_puncture;
    bool has_drag;
    bool has_clipping;
};

void run_car_cluster(
    size_t cluster_id,
    uint8_t start_car,
    uint8_t car_count,
    const std::string& target_host,
    uint16_t target_port,
    std::atomic<uint64_t>& sent_counter
) {
    (void)cluster_id;
#if defined(_WIN32)
    SOCKET s = socket(AF_INET, SOCK_DGRAM, IPPROTO_UDP);
    sockaddr_in dest{};
    dest.sin_family = AF_INET;
    dest.sin_port = htons(target_port);
    dest.sin_addr.s_addr = inet_addr(target_host.c_str());
#else
    int s = socket(AF_INET, SOCK_DGRAM, 0);
    sockaddr_in dest{};
    dest.sin_family = AF_INET;
    dest.sin_port = htons(target_port);
    inet_pton(AF_INET, target_host.c_str(), &dest.sin_addr);
#endif

    std::vector<CarSimState> cars(car_count);
    for (uint8_t i = 0; i < car_count; ++i) {
        cars[i].car_id = start_car + i;
        cars[i].series_id = 1; // F1 2026
        cars[i].track_length_m = 7004.0f; // Spa Francorchamps length
        cars[i].distance_m = (7004.0f / car_count) * i;
        cars[i].speed_kph = 240.0f + (i % 5) * 15.0f;
        cars[i].battery_joules = 3800000.0f;
        cars[i].lap = 1;
        cars[i].seq = 0;
        for (int k = 0; k < 4; ++k) {
            cars[i].brake_temp[k] = 480.0f + (k * 20.0f);
            cars[i].tire_temp[k] = 98.0f;
            cars[i].tire_pressure[k] = 22.80f; // 22.80 PSI
        }
        cars[i].ride_height_front = 12.0f;
        cars[i].ride_height_rear = 18.0f;
        cars[i].has_puncture = (cars[i].car_id == 4);   // Norris simulated incident
        cars[i].has_drag = (cars[i].car_id == 16);      // Leclerc simulated caliper drag
        cars[i].has_clipping = (cars[i].car_id == 63);  // Russell simulated clipping
    }

    TelemetryFrame frame{};
    frame.magic_and_version = 0xA260;

    // 500Hz = 2ms tick interval
    const auto tick_interval = std::chrono::microseconds(2000);
    auto next_tick = std::chrono::steady_clock::now();

    while (g_sim_running.load(std::memory_order_relaxed)) {
        const bool chaos = g_chaos_burst.load(std::memory_order_relaxed);
        const auto now_ns = std::chrono::duration_cast<std::chrono::nanoseconds>(
            std::chrono::steady_clock::now().time_since_epoch()
        ).count();

        for (auto& car : cars) {
            car.seq++;
            const float dt = 0.002f; // 2ms

            // Advance car distance
            car.distance_m += (car.speed_kph / 3.6f) * dt;
            if (car.distance_m >= car.track_length_m) {
                car.distance_m -= car.track_length_m;
                car.lap++;
            }

            const float spline_fraction = car.distance_m / car.track_length_m;
            const uint8_t sector = (spline_fraction < 0.33f) ? 0 : (spline_fraction < 0.66f ? 1 : 2);

            // Straight vs braking zone dynamics
            const bool is_kemmel_straight = (car.distance_m > 1200.0f && car.distance_m < 2600.0f);
            const bool is_heavy_braking = (car.distance_m > 2600.0f && car.distance_m < 2800.0f);

            if (is_kemmel_straight) {
                car.speed_kph = std::min(345.0f, car.speed_kph + 45.0f * dt);
                car.ride_height_rear = 2.1f; // Aerodynamic downforce squats rear plank
            } else if (is_heavy_braking) {
                car.speed_kph = std::max(90.0f, car.speed_kph - 220.0f * dt);
                car.ride_height_rear = 22.0f;
            } else {
                car.speed_kph = 210.0f + 60.0f * std::sin(spline_fraction * 12.56f);
                car.ride_height_rear = 14.0f;
            }

            // Populate 128-byte frame
            frame.series_id = car.series_id;
            frame.car_id = car.car_id;
            frame.sequence_num = car.seq;
            frame.timestamp_ns = now_ns;

            frame.lap_distance_m = car.distance_m;
            frame.world_pos_x = std::cos(spline_fraction * 6.28318f) * 1200.0f;
            frame.world_pos_y = std::sin(spline_fraction * 6.28318f) * 800.0f;
            frame.world_pos_z = 15.0f * std::sin(spline_fraction * 18.0f);

            frame.vel_x_quant = static_cast<int16_t>((car.speed_kph / 3.6f) * 100);
            frame.vel_y_quant = 0;
            frame.vel_z_quant = 0;

            const float lat_g = is_kemmel_straight ? 0.05f : (2.5f * std::sin(spline_fraction * 12.0f));
            frame.g_lat_quant = static_cast<int16_t>(lat_g * 1000.0f);
            frame.g_lon_quant = is_heavy_braking ? -4200 : (is_kemmel_straight ? 1100 : 0);

            // Resonant vertical porpoising on Kemmel straight
            if (is_kemmel_straight) {
                const float porpoise_osc = 1.8f * std::sin(static_cast<float>(car.seq) * 0.10f); // 8Hz
                frame.g_vert_quant = static_cast<int16_t>((1.0f + porpoise_osc) * 1000.0f);
            } else {
                frame.g_vert_quant = 1000;
            }

            frame.speed_kph = static_cast<uint16_t>(car.speed_kph);
            frame.rpm = static_cast<uint16_t>(11500 + car.speed_kph * 10);
            frame.throttle_raw = is_heavy_braking ? 0 : 65535;
            frame.brake_raw = is_heavy_braking ? 58000 : 0;
            frame.steering_raw = is_kemmel_straight ? 0 : static_cast<int16_t>(lat_g * 4000.0f);

            // Active Aero: X-Mode on straight (0x10), Z-Mode in corners (0x20)
            const uint8_t aero_mode = is_kemmel_straight ? 0x10 : 0x20;
            const uint8_t gear = (car.speed_kph > 300) ? 8 : ((car.speed_kph > 250) ? 7 : 5);
            frame.gear_and_aero = (aero_mode | (gear & 0x0F));

            frame.ers_deploy_mode = 2; // Hotlap
            frame.ers_battery_joules = car.battery_joules;
            frame.mgu_k_harvest_kw = is_heavy_braking ? 320.0f : (is_kemmel_straight ? -350.0f : 0.0f);
            frame.fuel_remaining_centikg = 4500; // 45.00 kg

            // Corner temps & pressures
            for (int k = 0; k < 4; ++k) {
                if (is_heavy_braking) car.brake_temp[k] += 8.5f;
                else car.brake_temp[k] = std::max(400.0f, car.brake_temp[k] - 2.5f);

                // Caliper Drag Anomaly trigger on car 16
                if (car.has_drag && k == 0 && is_heavy_braking) {
                    car.brake_temp[0] = 1080.0f; // Asymmetric FL spike
                }

                // Tire puncture trigger on car 4
                if (car.has_puncture && k == 3 && car.lap >= 2) {
                    car.tire_pressure[3] = std::max(12.0f, car.tire_pressure[3] - 0.04f); // Rapid drop
                }

                frame.tire_pressure_centipsi[k] = static_cast<uint16_t>(car.tire_pressure[k] * 100.0f);
                frame.tire_surface_temp_c[k] = static_cast<uint8_t>(car.tire_temp[k]);
                frame.tire_carcass_temp_c[k] = static_cast<uint8_t>(car.tire_temp[k] + 8.0f);
                frame.brake_disc_temp_c[k] = static_cast<uint16_t>(car.brake_temp[k]);
                frame.tire_wear_basis_pts[k] = static_cast<uint16_t>(car.lap * 140);
                frame.wheel_slip_ratio_bps[k] = is_heavy_braking ? 650 : 120;
            }

            frame.ride_height_front_mm10 = static_cast<uint16_t>(car.ride_height_front * 10.0f);
            frame.ride_height_rear_mm10 = static_cast<uint16_t>(car.ride_height_rear * 10.0f);
            frame.lap_number = static_cast<uint16_t>(car.lap);
            frame.sector_index = sector;
            frame.flags = 0; // Green flag

            // Calculate Hardware CRC32C
            frame.crc32c = calculate_frame_crc32c(frame);

            // Send raw binary datagram
#if defined(_WIN32)
            sendto(s, reinterpret_cast<const char*>(&frame), sizeof(frame), 0,
                   reinterpret_cast<sockaddr*>(&dest), sizeof(dest));
#else
            sendto(s, &frame, sizeof(frame), 0,
                   reinterpret_cast<sockaddr*>(&dest), sizeof(dest));
#endif
            sent_counter.fetch_add(1, std::memory_order_relaxed);

            // If chaos burst is active, emit 1.5x additional packets to induce stress
            if (chaos) {
                frame.timestamp_ns += 500;
#if defined(_WIN32)
                sendto(s, reinterpret_cast<const char*>(&frame), sizeof(frame), 0,
                       reinterpret_cast<sockaddr*>(&dest), sizeof(dest));
#else
                sendto(s, &frame, sizeof(frame), 0,
                       reinterpret_cast<sockaddr*>(&dest), sizeof(dest));
#endif
                sent_counter.fetch_add(1, std::memory_order_relaxed);
            }
        }

        next_tick += tick_interval;
        std::this_thread::sleep_until(next_tick);
    }

#if defined(_WIN32)
    closesocket(s);
#else
    close(s);
#endif
}

int main(int argc, char* argv[]) {
    std::signal(SIGINT, handle_signal);
    std::signal(SIGTERM, handle_signal);

    std::string target_host = "127.0.0.1";
    uint16_t target_port = 20777;
    size_t num_cars = 40;
    size_t num_threads = 4;

    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        if (arg == "--host" && i + 1 < argc) target_host = argv[++i];
        else if (arg == "--port" && i + 1 < argc) target_port = static_cast<uint16_t>(std::stoi(argv[++i]));
        else if (arg == "--cars" && i + 1 < argc) num_cars = std::stoi(argv[++i]);
        else if (arg == "--threads" && i + 1 < argc) num_threads = std::stoi(argv[++i]);
        else if (arg == "--chaos") g_chaos_burst.store(true);
    }

    std::cout << "=================================================================\n";
    std::cout << "  Apexis v2.0 - Synthetic 500Hz UDP Telemetry Load Generator     \n";
    std::cout << "  Target: " << target_host << ":" << target_port << " | Cars: " << num_cars
              << " @ 500Hz (Baseline: " << (num_cars * 500) << " msgs/sec) \n";
    std::cout << "=================================================================\n";

    std::atomic<uint64_t> total_sent{0};
    std::vector<std::thread> cluster_threads;
    const uint8_t cars_per_thread = static_cast<uint8_t>(num_cars / num_threads);

    for (size_t t = 0; t < num_threads; ++t) {
        const uint8_t start = static_cast<uint8_t>(t * cars_per_thread);
        const uint8_t count = (t == num_threads - 1) ? static_cast<uint8_t>(num_cars - start) : cars_per_thread;
        cluster_threads.emplace_back(run_car_cluster, t, start, count, target_host, target_port, std::ref(total_sent));
    }

    auto last_time = std::chrono::steady_clock::now();
    uint64_t last_sent = 0;

    while (g_sim_running.load()) {
        std::this_thread::sleep_for(std::chrono::seconds(1));
        const auto now = std::chrono::steady_clock::now();
        const double dt = std::chrono::duration<double>(now - last_time).count();
        last_time = now;

        const uint64_t current = total_sent.load(std::memory_order_relaxed);
        const double rate = (current - last_sent) / dt;
        last_sent = current;

        std::cout << "[apexis-sim] Transmitting at " << std::fixed << std::setprecision(0) << rate
                  << " msg/sec | Total Frames: " << current
                  << (g_chaos_burst.load() ? " [CHAOS BURST ACTIVE (1.5x)]" : "") << "\n";
    }

    for (auto& th : cluster_threads) {
        if (th.joinable()) th.join();
    }

    std::cout << "[apexis-sim] Stopped. Total datagrams transmitted: " << total_sent.load() << "\n";
    return 0;
}
