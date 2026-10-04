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
 * Sections a teacher may see, from their year levels and section letters.
 * An empty result means the account is unrestricted.
 */
export function assignableSections(yearLevels, letters) {
  if (!yearLevels?.length || !letters?.length) return []
  return yearLevels.flatMap((year) =>
    letters
      .filter((letter) => SECTION_LETTERS.includes(letter))
      .map((letter) => sectionLabel(year, letter)),
  )
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
