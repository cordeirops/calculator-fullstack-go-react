import type { HistoryEntry } from '../../types/calculator'
import { History } from '../History/History'
import styles from './HistoryPanel.module.css'

interface HistoryPanelProps {
  isOpen: boolean
  onClose: () => void
  entries: HistoryEntry[]
  onClear: () => void
}

// A slide-in drawer anchored to the right edge of the viewport, toggled by
// a button elsewhere in the tree (see Calculator). Deliberately has no
// backdrop: the calculator underneath must stay fully usable while the
// panel is open. Stays mounted (off-screen via transform) even when closed
// so the slide transition can play both ways.
export function HistoryPanel({ isOpen, onClose, entries, onClear }: HistoryPanelProps) {
  return (
    <aside
      id="history-panel"
      className={`${styles.panel} ${isOpen ? styles.open : ''}`}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        className={styles.close}
        onClick={onClose}
        aria-label="Close history"
        data-testid="history-close"
      >
        ×
      </button>
      <History entries={entries} onClear={onClear} />
    </aside>
  )
}
