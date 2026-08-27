# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Fixed
- **Race Replay System**: Fixed a critical bug where all race replays were hard-capped at 15 laps (approx. 22 minutes). Races now dynamically use their track's full lap count (e.g. 50+ for F1, 200 for NASCAR, 24 for GT Endurance).
- **Pit Stop Timing**: Fixed an issue where pit stops completed instantaneously (~0.04s) due to an incorrect frame rate division. Pit stops now take a realistic duration (e.g. 25 seconds).
- **Leaderboard Gaps**: Fixed arbitrary gap calculations. The gap column now uses realistic speed-based time deltas.
- **Time Display Formatting**: Upgraded time formatting to display `HH:MM:SS` when race durations exceed 60 minutes.

### Added
- **Dynamic Frame Budgeting**: Added automatic FPS downsampling (up to ~75,000 max frames) to keep memory usage under control during long endurance races without truncating lap counts.
- **New Playback Speed**: Added a 32x playback speed option to efficiently scrub through long NASCAR and GT endurance races.
- **Web Worker Fallback**: Added a synchronous generation fallback for the race simulator in environments where Web Workers are restricted or fail to initialize.
- **Early Termination**: Replay frame generation now stops early once all drivers have crossed the finish line.

### Changed
- Improved safety and stability by adding NaN/Infinity clamping to driver speed calculations, and null-checking for degenerate zero-length track geometry.
- Reset the replay scrubber automatically when switching race circuits or sessions.
- Tightened ESLint rule compliance (fixed `any` types in `LiveMap2D` and removed unused variables in the race simulator).
