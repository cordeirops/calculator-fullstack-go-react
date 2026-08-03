// Formats a finite number for display: thousands separators for normal
// magnitudes, readable scientific notation ("2.847 × 10^27") outside the
// range Number#toString() would otherwise render in fixed notation (float64
// only carries ~15-17 significant digits at that magnitude anyway).
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return 'Error'

  const magnitude = Math.abs(value)
  if (value !== 0 && (magnitude >= 1e21 || magnitude < 1e-6)) {
    const [mantissa, exponent] = value.toExponential(9).split('e')
    return `${mantissa} × 10^${exponent.replace('+', '')}`
  }

  // Round away IEEE-754 noise (e.g. 0.30000000000000004) beyond a
  // reasonable display precision, without truncating legitimate decimals.
  const rounded = Math.round(value * 1e10) / 1e10
  return rounded.toLocaleString('en-US', { maximumFractionDigits: 10 })
}
