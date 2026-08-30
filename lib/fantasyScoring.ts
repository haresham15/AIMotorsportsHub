export function scorePodiumPrediction(predicted: string[], actual: string[]) {
  return predicted.reduce((score, driver, index) => {
    const actualIndex = actual.indexOf(driver)
    if (actualIndex === -1) return score
    return score + (actualIndex === index ? 5 : 2)
  }, 0)
}
