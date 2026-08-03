import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Keypad } from './Keypad'

function renderKeypad(overrides: Partial<ComponentProps<typeof Keypad>> = {}) {
  const props = {
    onDigit: vi.fn(),
    onOperation: vi.fn(),
    onSqrt: vi.fn(),
    onSquare: vi.fn(),
    onEquals: vi.fn(),
    onClear: vi.fn(),
    onBackspace: vi.fn(),
    onToggleSign: vi.fn(),
    disabled: false,
    ...overrides,
  }
  render(<Keypad {...props} />)
  return props
}

describe('Keypad', () => {
  it('calls onDigit with the pressed digit', async () => {
    const user = userEvent.setup()
    const props = renderKeypad()

    await user.click(screen.getByTestId('key-7'))

    expect(props.onDigit).toHaveBeenCalledWith('7')
  })

  it('calls onDigit with "." for the decimal key', async () => {
    const user = userEvent.setup()
    const props = renderKeypad()

    await user.click(screen.getByTestId('key-decimal'))

    expect(props.onDigit).toHaveBeenCalledWith('.')
  })

  it.each([
    ['key-add', 'add'],
    ['key-subtract', 'subtract'],
    ['key-multiply', 'multiply'],
    ['key-divide', 'divide'],
    ['key-percentage', 'percentage'],
  ])('calls onOperation with %s -> %s', async (testId, operation) => {
    const user = userEvent.setup()
    const props = renderKeypad()

    await user.click(screen.getByTestId(testId))

    expect(props.onOperation).toHaveBeenCalledWith(operation)
  })

  it('calls onSquare (not onOperation) for the x² key, since it is unary in the UI', async () => {
    const user = userEvent.setup()
    const props = renderKeypad()

    await user.click(screen.getByTestId('key-square'))

    expect(props.onSquare).toHaveBeenCalledOnce()
    expect(props.onOperation).not.toHaveBeenCalled()
  })

  it('places = in cols 1-3 and x² in col 4 of the last row, so = sits directly left of x²', () => {
    renderKeypad()

    expect(screen.getByTestId('key-equals')).toHaveStyle({ gridColumn: '1 / span 3' })
    expect(screen.getByTestId('key-square')).toHaveStyle({ gridColumn: '4' })
  })

  it('places % in the top utility row, alongside C, backspace and sqrt', () => {
    renderKeypad()

    // The grid has no explicit row/column placement for these four, so DOM
    // order *is* visual order (first 4 cells = row 1). Checking the actual
    // sequence, not just presence, is what proves % really moved up top.
    const firstRow = screen
      .getAllByRole('button')
      .slice(0, 4)
      .map((button) => button.dataset.testid)
    expect(firstRow).toEqual(['key-clear', 'key-backspace', 'key-sqrt', 'key-percentage'])
  })

  it('calls onSqrt, onEquals, onClear, onBackspace and onToggleSign', async () => {
    const user = userEvent.setup()
    const props = renderKeypad()

    await user.click(screen.getByTestId('key-sqrt'))
    await user.click(screen.getByTestId('key-equals'))
    await user.click(screen.getByTestId('key-clear'))
    await user.click(screen.getByTestId('key-backspace'))
    await user.click(screen.getByTestId('key-toggle-sign'))

    expect(props.onSqrt).toHaveBeenCalledOnce()
    expect(props.onEquals).toHaveBeenCalledOnce()
    expect(props.onClear).toHaveBeenCalledOnce()
    expect(props.onBackspace).toHaveBeenCalledOnce()
    expect(props.onToggleSign).toHaveBeenCalledOnce()
  })

  it('disables every button when disabled is true', () => {
    renderKeypad({ disabled: true })

    expect(screen.getByTestId('key-7')).toBeDisabled()
    expect(screen.getByTestId('key-equals')).toBeDisabled()
    expect(screen.getByTestId('key-clear')).toBeDisabled()
  })
})
