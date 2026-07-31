import styles from './App.module.css'
import { Calculator } from './components/Calculator/Calculator'
import { ThemeToggle } from './components/ThemeToggle/ThemeToggle'

function App() {
  return (
    <main>
      <header className={styles.header}>
        <h1>Calculator - Pedro S. Cordeiro</h1>
        <ThemeToggle />
      </header>
      <Calculator />
    </main>
  )
}

export default App
