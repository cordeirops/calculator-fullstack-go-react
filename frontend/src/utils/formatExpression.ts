import type { HistoryEntry } from '../types/calculator'

const OPERATION_SYMBOLS: Record<string, string> = {
  add: '+',
  subtract: '−',
  multiply: '×',
  divide: '÷',
  power: '^',
}

// formatExpression renders a HistoryEntry as a short human-readable
// expression, e.g. "2 + 3 = 5", "√16 = 4", "50% of 200 = 100".
export function formatExpression(entry: HistoryEntry): string {
  const [a, b] = entry.operands

  if (entry.operation === 'sqrt') {
    return `√${a} = ${entry.result}`
  }

  if (entry.operation === 'percentage') {
    return `${a}% of ${b} = ${entry.result}`
  }

  const symbol = OPERATION_SYMBOLS[entry.operation] ?? entry.operation
  return `${a} ${symbol} ${b} = ${entry.result}`
}
