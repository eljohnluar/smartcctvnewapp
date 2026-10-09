// Attendance status options
export const ATTENDANCE_STATUS = {
  PRESENT: 'present',
  LATE: 'late',
  TIME_OUT: 'time_out',
}

// Display labels for stored statuses
export const ATTENDANCE_STATUS_LABELS = {
  [ATTENDANCE_STATUS.PRESENT]: 'Time in',
  [ATTENDANCE_STATUS.LATE]: 'Late',
  [ATTENDANCE_STATUS.TIME_OUT]: 'Time out',
  absent: 'Absent',
}

// System status options
export const SYSTEM_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  PROCESSING: 'processing',
  ERROR: 'error',
}

// College year levels
export const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year']

// Lettered sections
export const SECTION_LETTERS = ['A', 'B', 'C', 'D', 'E']

export const sectionLabel = (yearLevel, letter) => `${yearLevel} - Section ${letter}`

export const COLLEGE_SECTIONS = YEAR_LEVELS.flatMap((year) =>
  SECTION_LETTERS.map((letter) => sectionLabel(year, letter)),
)

export function assignableSections(yearLevels, letters) {
  if (!yearLevels?.length || !letters?.length) return []
  const names = [...new Set(letters.map((l) => String(l).trim()).filter(Boolean))]
  return yearLevels.flatMap((year) => names.map((letter) => sectionLabel(year, letter)))
}

export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.9,
  MEDIUM: 0.75,
  LOW: 0.0,
}
