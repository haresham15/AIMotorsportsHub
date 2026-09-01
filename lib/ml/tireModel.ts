import * as tf from '@tensorflow/tfjs'

export class TireDegradationModel {
  private model: tf.Sequential

  constructor() {
    this.model = tf.sequential()
    // 2 inputs: lap count, and compound multiplier
    this.model.add(tf.layers.dense({ units: 8, activation: 'relu', inputShape: [2] }))
    this.model.add(tf.layers.dense({ units: 1 }))
    this.model.compile({
      optimizer: tf.train.adam(0.05),
      loss: 'meanSquaredError'
    })
  }

  /**
   * Train the model with synthetic multi-compound data
   */
  async train() {
    const inputs: number[][] = []
    const outputs: number[][] = []
    
    const compounds = [1.0, 0.6, 0.3] // SOFT, MEDIUM, HARD
    
    for (const comp of compounds) {
      for (let lap = 1; lap <= 40; lap++) {
        inputs.push([lap, comp])
        // Non-linear degradation curve
        let deg = (0.08 * comp) * lap
        if (comp === 1.0 && lap > 12) deg += 0.1 * (lap - 12) // Soft cliff
        if (comp === 0.6 && lap > 25) deg += 0.05 * (lap - 25) // Medium cliff
        outputs.push([deg])
      }
    }
    
    const xs = tf.tensor2d(inputs, [inputs.length, 2])
    const ys = tf.tensor2d(outputs, [outputs.length, 1])

    await this.model.fit(xs, ys, {
      epochs: 50,
      shuffle: true
    })

    xs.dispose()
    ys.dispose()
  }

  /**
   * Predict the time degradation for a specific lap count and compound
   */
  predict(lap: number, compound: 'SOFT' | 'MEDIUM' | 'HARD'): number {
    const compVal = compound === 'SOFT' ? 1.0 : (compound === 'MEDIUM' ? 0.6 : 0.3)
    const input = tf.tensor2d([[lap, compVal]], [1, 2])
    const output = this.model.predict(input) as tf.Tensor
    const prediction = output.dataSync()[0]
    
    input.dispose()
    output.dispose()
    
    return Math.max(0, prediction)
  }

  /**
   * Dispose of the model and its tensors to free memory
   */
  dispose() {
    this.model.dispose()
  }
}
