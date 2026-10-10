import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getTheme, setTheme } from '../../utils/theme'

export default function ThemeToggle() {
  const [theme, setThemeState] = useState(getTheme())

  useEffect(() => {
    const sync = (event) => setThemeState(event.detail)
    window.addEventListener('smartcctv-theme', sync)
    return () => window.removeEventListener('smartcctv-theme', sync)
  }, [])

  const toggle = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    setThemeState(next)
  }

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
    >
      {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  )
}
