import type { BinaryOperation } from '../../types/calculator'
import styles from './Keypad.module.css'

interface KeypadProps {
  onDigit: (digit: string) => void
  onOperation: (operation: BinaryOperation) => void
  onSqrt: () => void
  onEquals: () => void
  onClear: () => void
  onBackspace: () => void
  onToggleSign: () => void
  disabled: boolean
}

interface ButtonSpec {
  label: string
  onClick: () => void
  kind: 'digit' | 'operator' | 'equals' | 'function'
  testId: string
  title?: string
  gridColumn?: string
}

export function Keypad({
  onDigit,
  onOperation,
  onSqrt,
  onEquals,
  onClear,
  onBackspace,
  onToggleSign,
  disabled,
}: KeypadProps) {
  const buttons: ButtonSpec[] = [
    { label: 'C', onClick: onClear, kind: 'function', testId: 'key-clear', title: 'Clear' },
    {
      label: '⌫',
      onClick: onBackspace,
      kind: 'function',
      testId: 'key-backspace',
      title: 'Backspace',
    },
    { label: '√', onClick: onSqrt, kind: 'operator', testId: 'key-sqrt', title: 'Square root' },
    {
      label: '^',
      onClick: () => onOperation('power'),
      kind: 'operator',
      testId: 'key-power',
      title: 'Power',
    },

    { label: '7', onClick: () => onDigit('7'), kind: 'digit', testId: 'key-7' },
    { label: '8', onClick: () => onDigit('8'), kind: 'digit', testId: 'key-8' },
    { label: '9', onClick: () => onDigit('9'), kind: 'digit', testId: 'key-9' },
    {
      label: '÷',
      onClick: () => onOperation('divide'),
      kind: 'operator',
      testId: 'key-divide',
      title: 'Divide',
    },

    { label: '4', onClick: () => onDigit('4'), kind: 'digit', testId: 'key-4' },
    { label: '5', onClick: () => onDigit('5'), kind: 'digit', testId: 'key-5' },
    { label: '6', onClick: () => onDigit('6'), kind: 'digit', testId: 'key-6' },
    {
      label: '×',
      onClick: () => onOperation('multiply'),
      kind: 'operator',
      testId: 'key-multiply',
      title: 'Multiply',
    },

    { label: '1', onClick: () => onDigit('1'), kind: 'digit', testId: 'key-1' },
    { label: '2', onClick: () => onDigit('2'), kind: 'digit', testId: 'key-2' },
    { label: '3', onClick: () => onDigit('3'), kind: 'digit', testId: 'key-3' },
    {
      label: '−',
      onClick: () => onOperation('subtract'),
      kind: 'operator',
      testId: 'key-subtract',
      title: 'Subtract',
    },

    {
      label: '±',
      onClick: onToggleSign,
      kind: 'function',
      testId: 'key-toggle-sign',
      title: 'Toggle sign',
    },
    { label: '0', onClick: () => onDigit('0'), kind: 'digit', testId: 'key-0' },
    { label: '.', onClick: () => onDigit('.'), kind: 'digit', testId: 'key-decimal' },
    {
      label: '+',
      onClick: () => onOperation('add'),
      kind: 'operator',
      testId: 'key-add',
      title: 'Add',
    },

    // The last row: "=" fills cols 1-3 (big, right below the digit pad),
    // "%" is pinned to col 4 so it lines up with ÷ × − + ^ instead of
    // sitting alone at col 1.
    {
      label: '=',
      onClick: onEquals,
      kind: 'equals',
      testId: 'key-equals',
      gridColumn: '1 / span 3',
      title: 'Calculate result',
    },
    {
      label: '%',
      onClick: () => onOperation('percentage'),
      kind: 'operator',
      testId: 'key-percentage',
      gridColumn: '4',
      title: 'Percentage',
    },
  ]

  return (
    <div className={styles.keypad} role="group" aria-label="Calculator keypad">
      {buttons.map((button) => (
        <button
          key={button.testId}
          type="button"
          className={`${styles.button} ${styles[button.kind]}`}
          style={button.gridColumn ? { gridColumn: button.gridColumn } : undefined}
          onClick={button.onClick}
          disabled={disabled}
          data-testid={button.testId}
          title={button.title}
          aria-label={button.title ?? button.label}
        >
          {button.label}
        </button>
      ))}
    </div>
  )
}
