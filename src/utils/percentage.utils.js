/**
 * Integer-percentage helper for dashboard aggregates.
 * Multiplies before dividing so the intermediate value stays integer-shaped,
 * sidestepping the tiny float drift you'd get from `(n / d) * 100`.
 * Returns 0 when the denominator is 0 — no divide-by-zero, no NaN leakage.
 */
const percentage = (numerator, denominator) => {
  if (denominator === 0) return 0
  return Math.round((numerator * 100) / denominator)
}

export { percentage }
