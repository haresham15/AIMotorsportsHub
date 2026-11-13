cmake_minimum_required(VERSION 3.20)
project(apexis-core LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Optimization flags
if(MSVC)
    add_compile_options(/O2 /arch:AVX2 /W4)
else()
    add_compile_options(-O3 -march=native -Wall -Wextra -pthread)
endif()

include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${CMAKE_CURRENT_SOURCE_DIR}/src
)

# Core Daemon Executable
add_executable(apexis-core
    src/main.cpp
    src/udp_ingest_server.cpp
    src/stream_processor_worker.cpp
    src/prometheus_exporter.cpp
)

if(WIN32)
    target_link_libraries(apexis-core PRIVATE ws2_32)
else()
    target_link_libraries(apexis-core PRIVATE pthread)
endif()

# Microbenchmark Executable
add_executable(spsc_bench
    benchmarks/spsc_vs_mutex_bench.cpp
)

if(WIN32)
    target_link_libraries(spsc_bench PRIVATE ws2_32)
else()
    target_link_libraries(spsc_bench PRIVATE pthread)
endif()
