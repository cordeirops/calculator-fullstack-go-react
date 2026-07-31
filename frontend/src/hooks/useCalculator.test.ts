import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CalculatorApiError } from '../types/calculator'
import { useCalculator } from './useCalculator'

vi.mock('../services/calculatorApi', () => ({
  calculate: vi.fn(),
}))

import { calculate } from '../services/calculatorApi'

const mockCalculate = vi.mocked(calculate)

describe('useCalculator', () => {
  beforeEach(() => {
    mockCalculate.mockReset()
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

  it('resets to the initial state on clear', () => {
    const { result } = renderHook(() => useCalculator())

    act(() => {
      result.current.inputDigit('9')
    })
    act(() => {
      result.current.clear()
    })

    expect(result.current.display).toBe('0')
  })
})
