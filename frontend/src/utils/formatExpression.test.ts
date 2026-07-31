import { describe, expect, it } from 'vitest'
import { formatExpression } from './formatExpression'

describe('formatExpression', () => {
  it('formats a binary operation as "a op b = result"', () => {
    expect(formatExpression({ operation: 'add', operands: [2, 3], result: 5 })).toBe('2 + 3 = 5')
    expect(formatExpression({ operation: 'subtract', operands: [10, 4], result: 6 })).toBe(
      '10 − 4 = 6',
    )
    expect(formatExpression({ operation: 'multiply', operands: [6, 7], result: 42 })).toBe(
      '6 × 7 = 42',
    )
    expect(formatExpression({ operation: 'divide', operands: [10, 4], result: 2.5 })).toBe(
      '10 ÷ 4 = 2.5',
    )
    expect(formatExpression({ operation: 'power', operands: [2, 10], result: 1024 })).toBe(
      '2 ^ 10 = 1024',
    )
  })

  it('formats percentage using "a% of b" semantics', () => {
    expect(formatExpression({ operation: 'percentage', operands: [50, 200], result: 100 })).toBe(
      '50% of 200 = 100',
    )
  })

  it('formats sqrt as a unary expression', () => {
    expect(formatExpression({ operation: 'sqrt', operands: [144], result: 12 })).toBe('√144 = 12')
  })
})
