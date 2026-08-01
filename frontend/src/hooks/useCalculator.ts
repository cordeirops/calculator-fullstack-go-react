import { useEffect, useState } from 'react'
import { calculate } from '../services/calculatorApi'
import {
  CalculatorApiError,
  type BinaryOperation,
  type HistoryEntry,
  type Operation,
  type UnaryOperation,
} from '../types/calculator'
import { OPERATION_SYMBOLS } from '../utils/formatExpression'

const MAX_DISPLAY_DIGITS = 15
const MAX_HISTORY_ENTRIES = 20
const HISTORY_STORAGE_KEY = 'calculator-history'
const NETWORK_ERROR_MESSAGE =
  'Could not reach the calculator API. Check your connection and try again.'

interface CalculatorState {
  display: string
  storedValue: number | null
  pendingOperation: BinaryOperation | null
  overwrite: boolean
  history: HistoryEntry[]
  isLoading: boolean
  error: string | null
}

// Fields that "C" resets. History is intentionally excluded: clearing the
// current calculation should not wipe past results.
const BLANK_CALCULATION_STATE: Omit<CalculatorState, 'history'> = {
  display: '0',
  storedValue: null,
  pendingOperation: null,
  overwrite: true,
  isLoading: false,
  error: null,
}

function loadHistory(): HistoryEntry[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : []
  } catch {
    return []
  }
}

function formatResult(value: number): string {
  if (!Number.isFinite(value)) return 'Error'
  // Round away IEEE-754 noise (e.g. 0.30000000000000004) beyond a
  // reasonable display precision, without truncating legitimate decimals.
  const rounded = Math.round(value * 1e10) / 1e10
  return rounded.toString()
}

function appendDigit(display: string, digit: string): string {
  if (digit === '.' && display.includes('.')) return display
  const digitCount = display.replace('-', '').replace('.', '').length
  if (digit !== '.' && digitCount >= MAX_DISPLAY_DIGITS) return display
  return display + digit
}

function firstDigit(digit: string): string {
  return digit === '.' ? '0.' : digit
}

function negate(display: string): string {
  if (display.startsWith('-')) return display.slice(1)
  if (display === '0') return display
  return `-${display}`
}

export function useCalculator() {
  const [state, setState] = useState<CalculatorState>(() => ({
    ...BLANK_CALCULATION_STATE,
    history: loadHistory(),
  }))

  useEffect(() => {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(state.history))
  }, [state.history])

  function inputDigit(digit: string) {
    setState((s) => ({
      ...s,
      display: s.overwrite ? firstDigit(digit) : appendDigit(s.display, digit),
      overwrite: false,
      error: null,
    }))
  }

  function backspace() {
    setState((s) => {
      if (s.overwrite) return s
      const next = s.display.length > 1 ? s.display.slice(0, -1) : '0'
      return { ...s, display: next === '-' ? '0' : next }
    })
  }

  function toggleSign() {
    setState((s) => ({ ...s, display: negate(s.display) }))
  }

  function clear() {
    setState((s) => ({ ...BLANK_CALCULATION_STATE, history: s.history }))
  }

  function clearHistory() {
    setState((s) => ({ ...s, history: [] }))
  }

  // Returns the computed result on success, or null if the request failed
  // (state.error is already set in that case).
  async function runCalculation(operation: Operation, operands: number[]): Promise<number | null> {
    setState((s) => ({ ...s, isLoading: true, error: null }))
    try {
      const response = await calculate({ operation, operands })
      setState((s) => ({
        ...s,
        display: formatResult(response.result),
        storedValue: null,
        pendingOperation: null,
        overwrite: true,
        isLoading: false,
        history: [{ operation, operands, result: response.result }, ...s.history].slice(
          0,
          MAX_HISTORY_ENTRIES,
        ),
      }))
      return response.result
    } catch (err) {
      const message = err instanceof CalculatorApiError ? err.message : NETWORK_ERROR_MESSAGE
      setState((s) => ({ ...s, isLoading: false, error: message, overwrite: true }))
      return null
    }
  }

  // Windows-Calculator-style chaining: pressing an operator right after
  // typing a new operand evaluates the pending operation immediately
  // (a real API call, same as pressing "="), then starts the next one from
  // that result — so "5 × 3 +" already shows 15 before "2 =" adds to it.
  // Pressing an operator again with no new digits typed just swaps it,
  // keeping the existing storedValue rather than resampling the display
  // (which may have been mutated since, e.g. by toggleSign).
  async function chooseOperation(operation: BinaryOperation) {
    if (state.isLoading) return

    if (state.storedValue !== null && state.pendingOperation !== null && !state.overwrite) {
      const result = await runCalculation(state.pendingOperation, [
        state.storedValue,
        Number(state.display),
      ])
      if (result === null) return
      setState((s) => ({ ...s, storedValue: result, pendingOperation: operation, overwrite: true }))
      return
    }
    setState((s) => ({
      ...s,
      storedValue: s.storedValue === null ? Number(s.display) : s.storedValue,
      pendingOperation: operation,
      overwrite: true,
    }))
  }

  async function equals() {
    if (state.storedValue === null || state.pendingOperation === null || state.isLoading) return
    await runCalculation(state.pendingOperation, [state.storedValue, Number(state.display)])
  }

  async function applyUnary(operation: UnaryOperation) {
    if (state.isLoading) return
    await runCalculation(operation, [Number(state.display)])
  }

  const expressionPreview =
    state.storedValue !== null && state.pendingOperation !== null
      ? `${state.storedValue} ${OPERATION_SYMBOLS[state.pendingOperation]}`
      : null

  return {
    ...state,
    expressionPreview,
    inputDigit,
    backspace,
    toggleSign,
    clear,
    clearHistory,
    chooseOperation,
    equals,
    applyUnary,
  }
}
