#pragma once
#include <cstdint>
#include <cstddef>
#include <cstring>

#if defined(__SSE4_2__) || defined(__x86_64__) || defined(_M_X64)
#include <nmmintrin.h>
#define APEXIS_HAS_SSE42 1
#endif

namespace apexis::protocol {

#pragma pack(push, 1)
struct TelemetryFrame {
    uint16_t magic_and_version;      // 0xA260 (Apexis v2.6 Binary Protocol)          [2B]
    uint8_t  series_id;              // 1=F1_2026, 2=NASCAR_CUP, 3=FE, 4=GTWC         [1B]
    uint8_t  car_id;                 // Vehicle slot index (0..23 F1, 0..39 NASCAR)   [1B]
    uint64_t sequence_num;           // Per-car monotonic sequence for gap detection  [8B]
    uint64_t timestamp_ns;           // Producer CLOCK_MONOTONIC_RAW in nanoseconds   [8B]
    
    // Spatial & Kinematics (28 Bytes)
    float    lap_distance_m;         // Spline distance along circuit in meters       [4B]
    float    world_pos_x;            // World X coordinate (meters)                   [4B]
    float    world_pos_y;            // World Y coordinate (meters)                   [4B]
    float    world_pos_z;            // World Z coordinate (meters)                   [4B]
    int16_t  vel_x_quant;            // Velocity X (m/s * 100)                        [2B]
    int16_t  vel_y_quant;            // Velocity Y (m/s * 100)                        [2B]
    int16_t  vel_z_quant;            // Velocity Z (m/s * 100)                        [2B]
    int16_t  g_lat_quant;            // Lateral G * 1000 (2026 F1 UDP spec format)    [2B]
    int16_t  g_lon_quant;            // Longitudinal G * 1000                         [2B]
    int16_t  g_vert_quant;           // Vertical G * 1000                             [2B]

    // Powertrain, Pedals & 2026 Active Aero / ERS (22 Bytes)
    uint16_t speed_kph;              // Instantaneous speed in km/h                   [2B]
    uint16_t rpm;                    // Engine / MGU-K RPM                            [2B]
    uint16_t throttle_raw;           // 0..65535 normalized throttle application      [2B]
    uint16_t brake_raw;              // 0..65535 normalized hydraulic brake pressure  [2B]
    int16_t  steering_raw;           // -32767..32767 steering angle                  [2B]
    uint8_t  gear_and_aero;          // Low 4b: Gear (0-8), High 4b: DRS/X-Mode/Z-Mode[1B]
    uint8_t  ers_deploy_mode;        // 0=None, 1=Med, 2=Hotlap, 3=OvertakeOverride   [1B]
    float    ers_battery_joules;     // Remaining ES state of charge (0..4,000,000 J) [4B]
    float    mgu_k_harvest_kw;       // Instantaneous MGU-K electrical power (-350..+350kW)[4B]
    uint16_t fuel_remaining_centikg; // Fuel mass in 0.01 kg units                    [2B]

    // 4-Corner Tires, Brakes & Ride Height (40 Bytes) - Order: [FL, FR, RL, RR]
    uint16_t tire_pressure_centipsi[4]; // Pressure in 0.01 PSI (e.g., 2250 = 22.50 PSI) [8B]
    uint8_t  tire_surface_temp_c[4];    // Tread surface infrared temp (Celsius)         [4B]
    uint8_t  tire_carcass_temp_c[4];    // Inner carcass bulk temp (Celsius)             [4B]
    uint16_t brake_disc_temp_c[4];      // Carbon disc temperature (0..1400 Celsius)     [8B]
    uint16_t tire_wear_basis_pts[4];    // Wear in basis points (0..10000 = 0.00..100%)  [8B]
    uint16_t wheel_slip_ratio_bps[4];   // Longitudinal/lateral combined slip ratio      [8B]

    // Floor & Integrity (18 Bytes)
    uint16_t ride_height_front_mm10; // Front plank height in 0.1 mm                  [2B]
    uint16_t ride_height_rear_mm10;  // Rear plank height in 0.1 mm                   [2B]
    uint16_t lap_number;             // Current lap count                             [2B]
    uint8_t  sector_index;           // 0=S1, 1=S2, 2=S3, 3=PitLane                   [1B]
    uint8_t  flags;                  // Bitmask: Yellow, SC, VSC, PitLimiter          [1B]
    uint32_t crc32c;                 // Hardware SSE4.2 _mm_crc32_u64 checksum        [4B]
    uint8_t  reserved[6];            // Explicit padding to reach exactly 128 bytes   [6B]
};
#pragma pack(pop)

static_assert(sizeof(TelemetryFrame) == 128, "TelemetryFrame must be exactly 128 bytes (2 cache lines)");

// Standard CRC32C polynomial representation: 0x82F63B78
inline uint32_t calculate_crc32c_sw(const uint8_t* buffer, size_t length) noexcept {
    uint32_t crc = 0xFFFFFFFF;
    for (size_t i = 0; i < length; ++i) {
        crc ^= buffer[i];
        for (int k = 0; k < 8; ++k) {
            crc = (crc >> 1) ^ (0x82F63B78u & (0 - (crc & 1)));
        }
    }
    return ~crc;
}

#if defined(APEXIS_HAS_SSE42) && (defined(__GNUC__) || defined(__clang__))
__attribute__((target("sse4.2")))
#endif
inline uint32_t calculate_frame_crc32c(const TelemetryFrame& frame) noexcept {
    const size_t bytes_to_hash = offsetof(TelemetryFrame, crc32c);
    const uint8_t* byte_ptr = reinterpret_cast<const uint8_t*>(&frame);

#if defined(APEXIS_HAS_SSE42) && (defined(__GNUC__) || defined(__clang__))
    uint64_t crc = 0xFFFFFFFF;
    size_t i = 0;
    for (; i + sizeof(uint64_t) <= bytes_to_hash; i += sizeof(uint64_t)) {
        uint64_t chunk;
        std::memcpy(&chunk, byte_ptr + i, sizeof(uint64_t));
        crc = _mm_crc32_u64(crc, chunk);
    }
    for (; i < bytes_to_hash; ++i) {
        crc = _mm_crc32_u8(static_cast<uint32_t>(crc), byte_ptr[i]);
    }
    return static_cast<uint32_t>(~crc);
#else
    return calculate_crc32c_sw(byte_ptr, bytes_to_hash);
#endif
}

inline bool verify_frame_crc(const TelemetryFrame& frame) noexcept {
    return calculate_frame_crc32c(frame) == frame.crc32c;
}

} // namespace apexis::protocol
