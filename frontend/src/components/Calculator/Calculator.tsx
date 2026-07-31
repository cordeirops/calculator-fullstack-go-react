import { useEffect, useRef } from 'react'
import { useCalculator } from '../../hooks/useCalculator'
import type { BinaryOperation } from '../../types/calculator'
import { Display } from '../Display/Display'
import { ErrorMessage } from '../ErrorMessage/ErrorMessage'
import { History } from '../History/History'
import { Keypad } from '../Keypad/Keypad'
import styles from './Calculator.module.css'

const DIGIT_KEYS = new Set('0123456789'.split(''))

const OPERATION_KEYS: Record<string, BinaryOperation> = {
  '+': 'add',
  '-': 'subtract',
  '*': 'multiply',
  '/': 'divide',
  '^': 'power',
  '%': 'percentage',
}

interface CalculatorActions {
  inputDigit: (digit: string) => void
  backspace: () => void
  toggleSign: () => void
  clear: () => void
  chooseOperation: (operation: BinaryOperation) => void
  equals: () => void
  applySqrt: () => void
}

const SIMPLE_KEY_ACTIONS: Record<string, (actions: CalculatorActions) => void> = {
  Enter: (actions) => actions.equals(),
  '=': (actions) => actions.equals(),
  Backspace: (actions) => actions.backspace(),
  Escape: (actions) => actions.clear(),
  r: (actions) => actions.applySqrt(),
  R: (actions) => actions.applySqrt(),
}

function handleKeyDown(event: KeyboardEvent, actions: CalculatorActions) {
  if (event.ctrlKey || event.metaKey || event.altKey) return

  const { key } = event

  if (DIGIT_KEYS.has(key) || key === '.') {
    event.preventDefault()
    actions.inputDigit(key)
    return
  }
  if (key in OPERATION_KEYS) {
    event.preventDefault()
    actions.chooseOperation(OPERATION_KEYS[key])
    return
  }

  const runSimpleAction = SIMPLE_KEY_ACTIONS[key]
  if (runSimpleAction) {
    event.preventDefault()
    runSimpleAction(actions)
  }
}

export function Calculator() {
  const {
    display,
    isLoading,
    error,
    history,
    inputDigit,
    backspace,
    toggleSign,
    clear,
    chooseOperation,
    equals,
    applyUnary,
  } = useCalculator()

  const actionsRef = useRef<CalculatorActions | undefined>(undefined)
  actionsRef.current = {
    inputDigit,
    backspace,
    toggleSign,
    clear,
    chooseOperation,
    equals: () => void equals(),
    applySqrt: () => void applyUnary('sqrt'),
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (actionsRef.current) handleKeyDown(event, actionsRef.current)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className={styles.card}>
      <Display value={display} isLoading={isLoading} />
      <ErrorMessage message={error} />
      <Keypad
        onDigit={inputDigit}
        onOperation={chooseOperation}
        onSqrt={() => void applyUnary('sqrt')}
        onEquals={() => void equals()}
        onClear={clear}
        onBackspace={backspace}
        onToggleSign={toggleSign}
        disabled={isLoading}
      />
      <History entries={history} />
    </div>
  )
}
