export type BinaryOperation = 'add' | 'subtract' | 'multiply' | 'divide' | 'power' | 'percentage'
export type UnaryOperation = 'sqrt'
export type Operation = BinaryOperation | UnaryOperation

export interface CalculateRequest {
  operation: Operation
  operands: number[]
}

export interface CalculateResponse {
  operation: Operation
  operands: number[]
  result: number
}

export interface HistoryEntry {
  operation: Operation
  operands: number[]
  result: number
}

export class CalculatorApiError extends Error {
  readonly code: string
  readonly status: number

  constructor(code: string, message: string, status: number) {
    super(message)
    this.name = 'CalculatorApiError'
    this.code = code
    this.status = status
  }
}
