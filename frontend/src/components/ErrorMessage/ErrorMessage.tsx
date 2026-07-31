import styles from './ErrorMessage.module.css'

interface ErrorMessageProps {
  message: string | null
}

// Renders inline, accessible error feedback. Never uses window.alert().
export function ErrorMessage({ message }: ErrorMessageProps) {
  if (!message) return null

  return (
    <div className={styles.error} role="alert">
      {message}
    </div>
  )
}
