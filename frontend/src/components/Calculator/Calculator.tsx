import { useEffect, useRef, useState } from 'react'
import { useCalculator } from '../../hooks/useCalculator'
import type { BinaryOperation } from '../../types/calculator'
import { Display } from '../Display/Display'
import { ErrorMessage } from '../ErrorMessage/ErrorMessage'
import { HistoryPanel } from '../HistoryPanel/HistoryPanel'
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

function HistoryIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  )
}

export function Calculator() {
  const {
    display,
    expressionPreview,
    isLoading,
    error,
    history,
    inputDigit,
    backspace,
    toggleSign,
    clear,
    clearHistory,
    chooseOperation,
    equals,
    applyUnary,
  } = useCalculator()

  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  const actionsRef = useRef<CalculatorActions | undefined>(undefined)
  actionsRef.current = {
    inputDigit,
    backspace,
    toggleSign,
    clear,
    chooseOperation: (operation) => void chooseOperation(operation),
    equals: () => void equals(),
    applySqrt: () => void applyUnary('sqrt'),
  }

  const isHistoryOpenRef = useRef(isHistoryOpen)
  isHistoryOpenRef.current = isHistoryOpen

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isHistoryOpenRef.current) {
        event.preventDefault()
        setIsHistoryOpen(false)
        return
      }
      if (actionsRef.current) handleKeyDown(event, actionsRef.current)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <>
      <div className={styles.card}>
        <div className={styles.topRow}>
          <button
            type="button"
            className={styles.historyToggle}
            onClick={() => setIsHistoryOpen((open) => !open)}
            aria-expanded={isHistoryOpen}
            aria-controls="history-panel"
            aria-label={isHistoryOpen ? 'Close history' : 'Open history'}
            title={isHistoryOpen ? 'Close history' : 'Open history'}
            data-testid="history-toggle"
          >
            <HistoryIcon />
          </button>
        </div>

        <Display value={display} isLoading={isLoading} expression={expressionPreview} />
        <ErrorMessage message={error} />
        <Keypad
          onDigit={inputDigit}
          onOperation={(operation) => void chooseOperation(operation)}
          onSqrt={() => void applyUnary('sqrt')}
          onEquals={() => void equals()}
          onClear={clear}
          onBackspace={backspace}
          onToggleSign={toggleSign}
          disabled={isLoading}
        />
      </div>

      <HistoryPanel
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        entries={history}
        onClear={clearHistory}
      />
    </>
  )
}
