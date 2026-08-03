import type { BinaryOperation, HistoryEntry } from '../types/calculator'
import { formatNumber } from './formatNumber'

export const OPERATION_SYMBOLS: Record<BinaryOperation, string> = {
  add: '+',
  subtract: '−',
  multiply: '×',
  divide: '÷',
  power: '^',
  percentage: '%',
}

// formatExpression renders a HistoryEntry as a short human-readable
// expression, e.g. "2 + 3 = 5", "√16 = 4", "50% of 200 = 100".
export function formatExpression(entry: HistoryEntry): string {
  const [a, b] = entry.operands.map(formatNumber)
  const result = formatNumber(entry.result)

  if (entry.operation === 'sqrt') {
    return `√${a} = ${result}`
  }

  if (entry.operation === 'percentage') {
    return `${a}% of ${b} = ${result}`
  }

  const symbol = OPERATION_SYMBOLS[entry.operation] ?? entry.operation
  return `${a} ${symbol} ${b} = ${result}`
}
