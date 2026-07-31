import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CalculatorApiError } from '../../types/calculator'
import { Calculator } from './Calculator'

vi.mock('../../services/calculatorApi', () => ({
  calculate: vi.fn(),
}))

import { calculate } from '../../services/calculatorApi'

const mockCalculate = vi.mocked(calculate)

describe('Calculator', () => {
  beforeEach(() => {
    mockCalculate.mockReset()
  })

  it('performs an addition end to end via button clicks', async () => {
    mockCalculate.mockResolvedValueOnce({ operation: 'add', operands: [2, 3], result: 5 })
    const user = userEvent.setup()
    render(<Calculator />)

    await user.click(screen.getByTestId('key-2'))
    await user.click(screen.getByTestId('key-add'))
    await user.click(screen.getByTestId('key-3'))
    await user.click(screen.getByTestId('key-equals'))

    await waitFor(() => expect(screen.getByTestId('display-value')).toHaveTextContent('5'))
    expect(screen.getByText('2 + 3 = 5')).toBeInTheDocument()
  })

  it('performs an addition end to end via keyboard input', async () => {
    mockCalculate.mockResolvedValueOnce({ operation: 'add', operands: [2, 3], result: 5 })
    const user = userEvent.setup()
    render(<Calculator />)

    await user.keyboard('2+3=')

    await waitFor(() => expect(screen.getByTestId('display-value')).toHaveTextContent('5'))
  })

  it('shows an inline error message (not a native alert) on API failure', async () => {
    mockCalculate.mockRejectedValueOnce(
      new CalculatorApiError('DIVISION_BY_ZERO', 'cannot divide by zero', 422),
    )
    const user = userEvent.setup()
    render(<Calculator />)

    await user.click(screen.getByTestId('key-1'))
    await user.click(screen.getByTestId('key-divide'))
    await user.click(screen.getByTestId('key-0'))
    await user.click(screen.getByTestId('key-equals'))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('cannot divide by zero'),
    )
  })

  it('supports backspace and the sqrt shortcut ("r") via keyboard', async () => {
    mockCalculate.mockResolvedValueOnce({ operation: 'sqrt', operands: [16], result: 4 })
    const user = userEvent.setup()
    render(<Calculator />)

    await user.keyboard('167{Backspace}')
    expect(screen.getByTestId('display-value')).toHaveTextContent('16')

    await user.keyboard('r')

    await waitFor(() => expect(screen.getByTestId('display-value')).toHaveTextContent('4'))
    expect(mockCalculate).toHaveBeenCalledWith({ operation: 'sqrt', operands: [16] })
  })

  it('clears the display and error state when Escape is pressed', async () => {
    mockCalculate.mockRejectedValueOnce(
      new CalculatorApiError('DIVISION_BY_ZERO', 'cannot divide by zero', 422),
    )
    const user = userEvent.setup()
    render(<Calculator />)

    await user.click(screen.getByTestId('key-1'))
    await user.click(screen.getByTestId('key-divide'))
    await user.click(screen.getByTestId('key-0'))
    await user.click(screen.getByTestId('key-equals'))
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByTestId('display-value')).toHaveTextContent('0')
  })
})
