## 2026-10-12 - ReplayCanvas Frame Allocation Bounds

**Learning:** RaceReplayCanvas `getTransform` function was re-computing the track bounding box on *every single frame* within the 60 FPS animation loop, which caused unnecessary O(N) array allocation (`[...inner, ...outer]`) and iterations.

**Action:** Extracted the track bounds to a `useMemo` block keyed by `data.trackGeometry`, bringing a substantial improvement to animation smoothness by caching bounds ahead of time.
