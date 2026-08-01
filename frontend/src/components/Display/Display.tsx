import { useEffect, useState, type KeyboardEvent } from 'react'
import styles from './Display.module.css'

interface DisplayProps {
  value: string
  isLoading: boolean
  expression: string | null
}

const COPIED_FEEDBACK_MS = 1500

export function Display({ value, isLoading, expression }: DisplayProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS)
    return () => window.clearTimeout(id)
  }, [copied])

  async function copyValue() {
    if (isLoading) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
    } catch {
      // Clipboard access can fail (permissions, insecure context); fail silently.
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      void copyValue()
    }
  }

  return (
    <div
      className={styles.display}
      role="button"
      tabIndex={0}
      onClick={() => void copyValue()}
      onKeyDown={handleKeyDown}
      aria-label="Copy result to clipboard"
    >
      {/* Reserves a stable line height whether or not a pending operation exists, so the value below doesn't jump. */}
      <span className={styles.expression} data-testid="display-expression">
        {expression ?? ' '}
      </span>
      <div className={styles.valueRow}>
        {isLoading ? (
          <span className={styles.skeleton} data-testid="display-skeleton" aria-hidden="true" />
        ) : (
          <span className={styles.value} data-testid="display-value" aria-live="polite">
            {value}
          </span>
        )}
        {copied && (
          <span className={styles.copiedBadge} data-testid="display-copied-badge">
            Copied!
          </span>
        )}
      </div>
    </div>
  )
}
