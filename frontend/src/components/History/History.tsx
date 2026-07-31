import type { HistoryEntry } from '../../types/calculator'
import { formatExpression } from '../../utils/formatExpression'
import styles from './History.module.css'

interface HistoryProps {
  entries: HistoryEntry[]
  onClear: () => void
}

export function History({ entries, onClear }: HistoryProps) {
  return (
    <div className={styles.history}>
      <div className={styles.header}>
        <p className={styles.title}>History</p>
        {entries.length > 0 && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={onClear}
            data-testid="history-clear"
          >
            Clear
          </button>
        )}
      </div>
      {entries.length === 0 ? (
        <p className={styles.empty}>No calculations yet</p>
      ) : (
        <ul className={styles.list}>
          {entries.map((entry, index) => (
            <li key={index} className={styles.entry}>
              {formatExpression(entry)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
