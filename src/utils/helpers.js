const SALT = 'smartcctv_salt_'

export async function sha256Hex(text) {
  const data = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function hashPassword(password) {
  return sha256Hex(`${SALT}${password}`)
}

/** Local calendar date as YYYY-MM-DD (matches the class_date column). */
export function toISODate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Date n days before today, as YYYY-MM-DD. */
export function daysAgoISO(days) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return toISODate(date)
}

export const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year']
export const SECTION_LETTERS = ['A', 'B', 'C', 'D', 'E']

export const sectionLabel = (yearLevel, letter) => `${yearLevel} - Section ${letter}`

/**
 * Sections a teacher may see, from their year levels and section names
 * (letters, numbers, or any short label). An empty result means the account
 * is unrestricted.
 */
export function assignableSections(yearLevels, names) {
  if (!yearLevels?.length || !names?.length) return []
  const cleaned = [...new Set(names.map((name) => String(name).trim()).filter(Boolean))]
  return yearLevels.flatMap((year) => cleaned.map((name) => sectionLabel(year, name)))
}

export function formatTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function timeAgo(iso) {
  if (!iso) return '—'
  const seconds = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  return `${days}d ago`
}

export function initials(fullName) {
  return (fullName || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function statusLabel(status) {
  if (status === 'present') return 'Time in'
  if (status === 'late') return 'Late'
  if (status === 'time_out') return 'Time out'
  if (status === 'absent') return 'Absent'
  return status || '—'
}

export function statusColors(status) {
  switch (status) {
    case 'present':
      return {
        bg: 'bg-green-500/10',
        text: 'text-green-400',
        border: 'border-green-500/30',
        dot: 'bg-green-400',
      }
    case 'late':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        dot: 'bg-amber-400',
      }
    case 'time_out':
      return {
        bg: 'bg-rose-500/10',
        text: 'text-rose-400',
        border: 'border-rose-500/30',
        dot: 'bg-rose-400',
      }
    default:
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-400',
        border: 'border-slate-500/30',
        dot: 'bg-slate-400',
      }
  }
}


export const toPercent = (value, total, decimals = 1) => {
  if (!total || total === 0) return '0%'
  return `${((value / total) * 100).toFixed(decimals)}%`
}

export const debounce = (fn, delay = 300) => {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export const formatConfidence = (score) => {
  if (score === null || score === undefined) return '—'
  return `${(score * 100).toFixed(1)}%`
}

export const todayLabel = () =>
  new Date().toLocaleDateString('en-PH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
