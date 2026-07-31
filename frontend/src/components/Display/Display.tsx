import styles from './Display.module.css'

interface DisplayProps {
  value: string
  isLoading: boolean
}

export function Display({ value, isLoading }: DisplayProps) {
  return (
    <div className={styles.display}>
      {isLoading && (
        <span className={styles.spinner} data-testid="display-spinner" aria-hidden="true" />
      )}
      <span className={styles.value} data-testid="display-value" aria-live="polite">
        {value}
      </span>
    </div>
  )
}
