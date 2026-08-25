import * as tf from '@tensorflow/tfjs'

export class TireDegradationModel {
  private model: tf.Sequential

  constructor() {
    this.model = tf.sequential()
    // Simple linear regression: predict lap time added based on lap count
    this.model.add(tf.layers.dense({ units: 1, inputShape: [1] }))
    this.model.compile({
      optimizer: tf.train.sgd(0.001),
      loss: 'meanSquaredError'
    })
  }

  /**
   * Train the model with some simulated historical data
   */
  async train() {
    // x: lap number on current tire
    const laps = [1, 5, 10, 15, 20, 25, 30]
    // y: time degradation in seconds (e.g. lap 30 is 2.5s slower)
    const degradation = [0.1, 0.4, 0.9, 1.4, 1.8, 2.2, 2.6]
    
    const xs = tf.tensor2d(laps, [laps.length, 1])
    const ys = tf.tensor2d(degradation, [degradation.length, 1])

    await this.model.fit(xs, ys, {
      epochs: 50,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          // Training progress could be logged here
        }
      }
    })

    xs.dispose()
    ys.dispose()
  }

  /**
   * Predict the time degradation for a specific lap count
   */
  predict(lap: number): number {
    const input = tf.tensor2d([lap], [1, 1])
    const output = this.model.predict(input) as tf.Tensor
    const prediction = output.dataSync()[0]
    
    input.dispose()
    output.dispose()
    
    return prediction
  }

  /**
   * Dispose of the model and its tensors to free memory
   */
  dispose() {
    this.model.dispose()
  }
}
