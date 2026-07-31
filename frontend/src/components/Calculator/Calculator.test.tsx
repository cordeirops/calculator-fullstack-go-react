import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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
    window.localStorage.clear()
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

  it('performs a percentage calculation via the operator-column % key', async () => {
    mockCalculate.mockResolvedValueOnce({
      operation: 'percentage',
      operands: [50, 200],
      result: 100,
    })
    const user = userEvent.setup()
    render(<Calculator />)

    await user.click(screen.getByTestId('key-5'))
    await user.click(screen.getByTestId('key-0'))
    await user.click(screen.getByTestId('key-percentage'))
    await user.click(screen.getByTestId('key-2'))
    await user.click(screen.getByTestId('key-0'))
    await user.click(screen.getByTestId('key-0'))
    await user.click(screen.getByTestId('key-equals'))

    await waitFor(() => expect(screen.getByTestId('display-value')).toHaveTextContent('100'))
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

  it('clears the calculation (not the error toast unmount) when Escape is pressed', async () => {
    mockCalculate.mockRejectedValueOnce(
      new CalculatorApiError('DIVISION_BY_ZERO', 'cannot divide by zero', 422),
    )
    const user = userEvent.setup()
    render(<Calculator />)

    await user.click(screen.getByTestId('key-1'))
    await user.click(screen.getByTestId('key-divide'))
    await user.click(screen.getByTestId('key-0'))
    await user.click(screen.getByTestId('key-equals'))
    const alert = await screen.findByRole('alert')

    await user.keyboard('{Escape}')
    fireEvent.transitionEnd(alert)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByTestId('display-value')).toHaveTextContent('0')
  })

  it('opens and closes the history panel via the toggle button', async () => {
    const user = userEvent.setup()
    render(<Calculator />)

    const panel = screen.getByRole('complementary', { hidden: true })
    expect(panel).toHaveAttribute('aria-hidden', 'true')

    await user.click(screen.getByTestId('history-toggle'))
    expect(panel).toHaveAttribute('aria-hidden', 'false')

    await user.click(screen.getByTestId('history-toggle'))
    expect(panel).toHaveAttribute('aria-hidden', 'true')
  })

  it('closes the history panel on Escape without clearing the current calculation', async () => {
    const user = userEvent.setup()
    render(<Calculator />)

    await user.click(screen.getByTestId('key-7'))
    await user.click(screen.getByTestId('history-toggle'))
    const panel = screen.getByRole('complementary', { hidden: true })
    expect(panel).toHaveAttribute('aria-hidden', 'false')

    await user.keyboard('{Escape}')

    expect(panel).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByTestId('display-value')).toHaveTextContent('7')
  })

  it('keeps history across a manual clear ("C") of the current calculation', async () => {
    mockCalculate.mockResolvedValueOnce({ operation: 'add', operands: [2, 3], result: 5 })
    const user = userEvent.setup()
    render(<Calculator />)

    await user.click(screen.getByTestId('key-2'))
    await user.click(screen.getByTestId('key-add'))
    await user.click(screen.getByTestId('key-3'))
    await user.click(screen.getByTestId('key-equals'))
    await waitFor(() => expect(screen.getByTestId('display-value')).toHaveTextContent('5'))

    await user.click(screen.getByTestId('key-clear'))

    expect(screen.getByTestId('display-value')).toHaveTextContent('0')
    await user.click(screen.getByTestId('history-toggle'))
    expect(screen.getByText('2 + 3 = 5')).toBeInTheDocument()
  })
})
