export const THEME_STORAGE_KEY = 'smartcctv.theme'

export function getTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function applyTheme(mode) {
  document.documentElement.classList.toggle('light', mode === 'light')
}

export function setTheme(mode) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode)
  } catch {
    // Storage unavailable — apply for this session only.
  }
  applyTheme(mode)
  window.dispatchEvent(new CustomEvent('smartcctv-theme', { detail: mode }))
}
