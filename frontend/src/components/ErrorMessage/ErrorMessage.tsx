import { useEffect, useState } from 'react'
import styles from './ErrorMessage.module.css'

interface ErrorMessageProps {
  message: string | null
}

const AUTO_DISMISS_MS = 4000

// Renders an accessible, auto-dismissing toast (never window.alert()).
// Stays mounted briefly after becoming invisible so the fade-out
// transition can finish before it's removed from the DOM.
export function ErrorMessage({ message }: ErrorMessageProps) {
  const [displayedMessage, setDisplayedMessage] = useState(message)
  const [visible, setVisible] = useState(Boolean(message))

  useEffect(() => {
    if (!message) {
      setVisible(false)
      return
    }
    setDisplayedMessage(message)
    setVisible(true)
    const id = window.setTimeout(() => setVisible(false), AUTO_DISMISS_MS)
    return () => window.clearTimeout(id)
  }, [message])

  function handleTransitionEnd() {
    if (!visible) setDisplayedMessage(null)
  }

  if (!displayedMessage) return null

  return (
    <div
      className={`${styles.toast} ${visible ? styles.visible : ''}`}
      role="alert"
      onTransitionEnd={handleTransitionEnd}
    >
      {displayedMessage}
    </div>
  )
}
