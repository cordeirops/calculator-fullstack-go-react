import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CalculatorApiError, type CalculateResponse } from '../types/calculator'
import { useCalculator } from './useCalculator'

vi.mock('../services/calculatorApi', () => ({
  calculate: vi.fn(),
}))

import { calculate } from '../services/calculatorApi'

const mockCalculate = vi.mocked(calculate)

describe('useCalculator', () => {
  beforeEach(() => {
    mockCalculate.mockReset()
    window.localStorage.clear()
  })

  it('starts with a zeroed display and empty history', () => {
    const { result } = renderHook(() => useCalculator())

    expect(result.current.display).toBe('0')
    expect(result.current.history).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('builds up a multi-digit display from digit input', () => {
    const { result } = renderHook(() => useCalculator())

    act(() => {
      result.current.inputDigit('1')
    })
    act(() => {
      result.current.inputDigit('2')
    })
    act(() => {
      result.current.inputDigit('.')
    })
    act(() => {
      result.current.inputDigit('5')
    })

    expect(result.current.display).toBe('12.5')
  })

  it('ignores a second decimal point', () => {
    const { result } = renderHook(() => useCalculator())

    act(() => {
      result.current.inputDigit('1')
      result.current.inputDigit('.')
      result.current.inputDigit('2')
      result.current.inputDigit('.')
      result.current.inputDigit('3')
    })

    expect(result.current.display).toBe('1.23')
  })

  it('performs backspace and resets to 0 when the last digit is removed', () => {
    const { result } = renderHook(() => useCalculator())

    act(() => {
      result.current.inputDigit('7')
      result.current.inputDigit('8')
    })
    act(() => {
      result.current.backspace()
    })
    expect(result.current.display).toBe('7')

    act(() => {
      result.current.backspace()
    })
    expect(result.current.display).toBe('0')
  })

  it('toggles the sign of the current display', () => {
    const { result } = renderHook(() => useCalculator())

    act(() => {
      result.current.inputDigit('5')
    })
    act(() => {
      result.current.toggleSign()
    })
    expect(result.current.display).toBe('-5')

    act(() => {
      result.current.toggleSign()
    })
    expect(result.current.display).toBe('5')
  })

  it('performs a full binary operation end to end and records history', async () => {
    mockCalculate.mockResolvedValueOnce({ operation: 'add', operands: [2, 3], result: 5 })
    const { result } = renderHook(() => useCalculator())

    act(() => {
      result.current.inputDigit('2')
    })
    act(() => {
      result.current.chooseOperation('add')
    })
    act(() => {
      result.current.inputDigit('3')
    })
    await act(async () => {
      await result.current.equals()
    })

    expect(mockCalculate).toHaveBeenCalledWith({ operation: 'add', operands: [2, 3] })
    await waitFor(() => expect(result.current.display).toBe('5'))
    expect(result.current.history).toEqual([{ operation: 'add', operands: [2, 3], result: 5 }])
    expect(result.current.isLoading).toBe(false)
  })

  it('formats a very large result as readable scientific notation instead of raw "e+" syntax', async () => {
    // 23123123123123 * 123123123123123, computed exactly as float64 would.
    mockCalculate.mockResolvedValueOnce({
      operation: 'multiply',
      operands: [23123123123123, 123123123123123],
      result: 2.8469911352794057e27,
    })
    const { result } = renderHook(() => useCalculator())

    act(() => {
      result.current.inputDigit('5')
    })
    act(() => {
      result.current.chooseOperation('multiply')
    })
    act(() => {
      result.current.inputDigit('3')
    })
    await act(async () => {
      await result.current.equals()
    })

    expect(result.current.display).toBe('2.846991135 × 10^27')
    expect(result.current.display).not.toContain('e+')
  })

  it('formats a very small result as readable scientific notation', async () => {
    mockCalculate.mockResolvedValueOnce({
      operation: 'divide',
      operands: [1, 3e8],
      result: 1 / 3e8,
    })
    const { result } = renderHook(() => useCalculator())

    act(() => {
      result.current.inputDigit('1')
    })
    act(() => {
      result.current.chooseOperation('divide')
    })
    act(() => {
      result.current.inputDigit('3')
    })
    await act(async () => {
      await result.current.equals()
    })

    expect(result.current.display).toMatch(/^3\.333333333 × 10\^-9$/)
    expect(result.current.isLoading).toBe(false)
  })

  it('performs a unary operation immediately on the current display value', async () => {
    mockCalculate.mockResolvedValueOnce({ operation: 'sqrt', operands: [16], result: 4 })
    const { result } = renderHook(() => useCalculator())

    act(() => {
      result.current.inputDigit('1')
      result.current.inputDigit('6')
    })
    await act(async () => {
      await result.current.applyUnary('sqrt')
    })

    expect(mockCalculate).toHaveBeenCalledWith({ operation: 'sqrt', operands: [16] })
    expect(result.current.display).toBe('4')
  })

  it('square() calls power with the current value and a fixed exponent of 2', async () => {
    mockCalculate.mockResolvedValueOnce({ operation: 'power', operands: [9, 2], result: 81 })
    const { result } = renderHook(() => useCalculator())

    act(() => {
      result.current.inputDigit('9')
    })
    await act(async () => {
      await result.current.square()
    })

    expect(mockCalculate).toHaveBeenCalledWith({ operation: 'power', operands: [9, 2] })
    expect(result.current.display).toBe('81')
  })

  it('square() is a no-op while a calculation is already in flight', async () => {
    mockCalculate.mockReturnValueOnce(new Promise(() => {})) // never resolves
    const { result } = renderHook(() => useCalculator())

    act(() => {
      result.current.inputDigit('9')
    })
    act(() => {
      // Deliberately not awaited: the mock never resolves, so this just
      // kicks off the in-flight request we want isLoading to reflect below.
      result.current.square()
    })
    expect(result.current.isLoading).toBe(true)

    await act(async () => {
      await result.current.square()
    })

    expect(mockCalculate).toHaveBeenCalledOnce()
  })

  it('surfaces the API error message and clears loading state on failure', async () => {
    mockCalculate.mockRejectedValueOnce(
      new CalculatorApiError('DIVISION_BY_ZERO', 'cannot divide by zero', 422),
    )
    const { result } = renderHook(() => useCalculator())

    act(() => {
      result.current.inputDigit('1')
    })
    act(() => {
      result.current.chooseOperation('divide')
    })
    act(() => {
      result.current.inputDigit('0')
    })
    await act(async () => {
      await result.current.equals()
    })

    expect(result.current.error).toBe('cannot divide by zero')
    expect(result.current.isLoading).toBe(false)
  })

  it('does nothing when equals is pressed without a pending operation', async () => {
    const { result } = renderHook(() => useCalculator())

    await act(async () => {
      await result.current.equals()
    })

    expect(mockCalculate).not.toHaveBeenCalled()
  })

  it('resets the calculation but keeps history on clear', async () => {
    mockCalculate.mockResolvedValueOnce({ operation: 'add', operands: [2, 3], result: 5 })
    const { result } = renderHook(() => useCalculator())

    act(() => {
      result.current.inputDigit('2')
    })
    act(() => {
      result.current.chooseOperation('add')
    })
    act(() => {
      result.current.inputDigit('3')
    })
    await act(async () => {
      await result.current.equals()
    })
    await waitFor(() => expect(result.current.history).toHaveLength(1))

    act(() => {
      result.current.inputDigit('9')
    })
    act(() => {
      result.current.clear()
    })

    expect(result.current.display).toBe('0')
    expect(result.current.history).toHaveLength(1)
  })

  it('loads history from localStorage on init', () => {
    window.localStorage.setItem(
      'calculator-history',
      JSON.stringify([{ operation: 'add', operands: [1, 1], result: 2 }]),
    )

    const { result } = renderHook(() => useCalculator())

    expect(result.current.history).toEqual([{ operation: 'add', operands: [1, 1], result: 2 }])
  })

  it('ignores corrupted localStorage history and starts empty', () => {
    window.localStorage.setItem('calculator-history', 'not valid json')

    const { result } = renderHook(() => useCalculator())

    expect(result.current.history).toEqual([])
  })

  it('persists new history entries to localStorage', async () => {
    mockCalculate.mockResolvedValueOnce({ operation: 'add', operands: [2, 3], result: 5 })
    const { result } = renderHook(() => useCalculator())

    act(() => {
      result.current.inputDigit('2')
    })
    act(() => {
      result.current.chooseOperation('add')
    })
    act(() => {
      result.current.inputDigit('3')
    })
    await act(async () => {
      await result.current.equals()
    })

    await waitFor(() =>
      expect(JSON.parse(window.localStorage.getItem('calculator-history') ?? '[]')).toEqual([
        { operation: 'add', operands: [2, 3], result: 5 },
      ]),
    )
  })

  it('clears history via clearHistory and persists the empty list', async () => {
    window.localStorage.setItem(
      'calculator-history',
      JSON.stringify([{ operation: 'add', operands: [1, 1], result: 2 }]),
    )
    const { result } = renderHook(() => useCalculator())
    expect(result.current.history).toHaveLength(1)

    act(() => {
      result.current.clearHistory()
    })

    expect(result.current.history).toEqual([])
    await waitFor(() => expect(window.localStorage.getItem('calculator-history')).toBe('[]'))
  })

  it('exposes a null expressionPreview until an operation is pending', () => {
    const { result } = renderHook(() => useCalculator())

    expect(result.current.expressionPreview).toBeNull()

    act(() => {
      result.current.inputDigit('5')
    })
    act(() => {
      result.current.chooseOperation('add')
    })

    expect(result.current.expressionPreview).toBe('5 +')
  })

  it('chains: pressing an operator after typing a new operand evaluates the pending one first', async () => {
    mockCalculate.mockResolvedValueOnce({ operation: 'multiply', operands: [5, 3], result: 15 })
    mockCalculate.mockResolvedValueOnce({ operation: 'add', operands: [15, 2], result: 17 })
    const { result } = renderHook(() => useCalculator())

    act(() => {
      result.current.inputDigit('5')
    })
    act(() => {
      result.current.chooseOperation('multiply')
    })
    act(() => {
      result.current.inputDigit('3')
    })

    await act(async () => {
      await result.current.chooseOperation('add')
    })

    expect(mockCalculate).toHaveBeenNthCalledWith(1, { operation: 'multiply', operands: [5, 3] })
    expect(result.current.display).toBe('15')
    expect(result.current.expressionPreview).toBe('15 +')
    expect(result.current.history).toEqual([
      { operation: 'multiply', operands: [5, 3], result: 15 },
    ])

    act(() => {
      result.current.inputDigit('2')
    })
    await act(async () => {
      await result.current.equals()
    })

    expect(mockCalculate).toHaveBeenNthCalledWith(2, { operation: 'add', operands: [15, 2] })
    expect(result.current.display).toBe('17')
  })

  it('does not chain (no API call) when switching operators without typing a new operand', () => {
    const { result } = renderHook(() => useCalculator())

    act(() => {
      result.current.inputDigit('5')
    })
    act(() => {
      result.current.chooseOperation('add')
    })
    act(() => {
      result.current.chooseOperation('multiply')
    })

    expect(mockCalculate).not.toHaveBeenCalled()
    expect(result.current.expressionPreview).toBe('5 ×')
  })

  it('stops the chain and surfaces the error if the intermediate calculation fails', async () => {
    mockCalculate.mockRejectedValueOnce(
      new CalculatorApiError('DIVISION_BY_ZERO', 'cannot divide by zero', 422),
    )
    const { result } = renderHook(() => useCalculator())

    act(() => {
      result.current.inputDigit('5')
    })
    act(() => {
      result.current.chooseOperation('divide')
    })
    act(() => {
      result.current.inputDigit('0')
    })

    await act(async () => {
      await result.current.chooseOperation('add')
    })

    expect(result.current.error).toBe('cannot divide by zero')
    // The original pending operation is left intact (not silently
    // discarded) so the user can correct the operand and retry.
    expect(result.current.expressionPreview).toBe('5 ÷')
  })

  it('keeps the original storedValue when an operator is re-pressed after the display changes without a new digit', () => {
    // Regression test: pressing an operator used to always resample the
    // display as the new storedValue, even when one was already pending.
    // Toggling the sign in between (or any other display-only mutation)
    // would silently corrupt the operand a subsequent operator press used,
    // even though no new digit was ever typed for the second operand.
    const { result } = renderHook(() => useCalculator())

    act(() => {
      result.current.inputDigit('5')
    })
    act(() => {
      result.current.chooseOperation('add')
    })
    act(() => {
      result.current.toggleSign()
    })
    act(() => {
      result.current.chooseOperation('multiply')
    })

    expect(result.current.expressionPreview).toBe('5 ×')
  })

  it('ignores chooseOperation while a calculation is already in flight', async () => {
    let resolveCalculate!: (value: CalculateResponse) => void
    mockCalculate.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveCalculate = resolve
      }),
    )
    const { result } = renderHook(() => useCalculator())

    act(() => {
      result.current.inputDigit('5')
    })
    act(() => {
      result.current.chooseOperation('multiply')
    })
    act(() => {
      result.current.inputDigit('3')
    })

    // Kick off the chained call (multiply 5*3) but don't await it yet, so
    // isLoading is true while we try to sneak in another operator press —
    // simulating a keyboard shortcut firing while the Keypad is disabled.
    let chainPromise!: Promise<void>
    act(() => {
      chainPromise = result.current.chooseOperation('add')
    })
    expect(result.current.isLoading).toBe(true)

    await act(async () => {
      await result.current.chooseOperation('subtract')
    })

    expect(mockCalculate).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveCalculate({ operation: 'multiply', operands: [5, 3], result: 15 })
      await chainPromise
    })

    expect(result.current.display).toBe('15')
  })
})
