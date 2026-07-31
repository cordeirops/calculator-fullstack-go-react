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
    ['key-power', 'power'],
    ['key-percentage', 'percentage'],
  ])('calls onOperation with %s -> %s', async (testId, operation) => {
    const user = userEvent.setup()
    const props = renderKeypad()

    await user.click(screen.getByTestId(testId))

    expect(props.onOperation).toHaveBeenCalledWith(operation)
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
