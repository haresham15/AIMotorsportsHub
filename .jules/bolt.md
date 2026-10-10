## 2024-05-24 - Batch Tensor Operations inside React
**Learning:** In React `useEffect` hooks, doing individual `tf.predict()` iteratively in loops causes massive sequential operations on UI/main thread. Using vectorized batch predictions (`predictBatch`) in `@tensorflow/tfjs` replaces 40 tensor predictions with a single vectorized matrix multiplication, improving the rendering loop performance.
**Action:** Always favor bulk/batch tensor predictions natively when predicting an array of items simultaneously instead of calling scalar predictions repetitively.
