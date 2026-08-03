import { describe, expect, it } from 'vitest'
import { formatNumber } from './formatNumber'

describe('formatNumber', () => {
  it('adds thousands separators for normal-magnitude integers', () => {
    expect(formatNumber(300000)).toBe('300,000')
    expect(formatNumber(1000000)).toBe('1,000,000')
    expect(formatNumber(999)).toBe('999')
  })

  it('keeps decimals without padding or truncation', () => {
    expect(formatNumber(16.665)).toBe('16.665')
    expect(formatNumber(1.4142135623730951)).toBe('1.4142135624')
  })

  it('formats negative numbers with a separator too', () => {
    expect(formatNumber(-1234567)).toBe('-1,234,567')
  })

  it('rounds away floating point noise', () => {
    expect(formatNumber(0.1 + 0.2)).toBe('0.3')
  })

  it('formats zero as "0"', () => {
    expect(formatNumber(0)).toBe('0')
  })

  it('formats a very large number as readable scientific notation', () => {
    expect(formatNumber(2.8469911352794057e27)).toBe('2.846991135 × 10^27')
  })

  it('formats a very small number as readable scientific notation', () => {
    expect(formatNumber(1 / 3e8)).toBe('3.333333333 × 10^-9')
  })

  it('returns "Error" for non-finite values', () => {
    expect(formatNumber(Infinity)).toBe('Error')
    expect(formatNumber(-Infinity)).toBe('Error')
    expect(formatNumber(NaN)).toBe('Error')
  })
})
