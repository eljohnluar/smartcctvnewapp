import axios from 'axios'

const rawBase = (import.meta.env.VITE_API_BASE_URL || '/api').trim().replace(/\/+$/, '')
// Ensure protocol is present if a domain/host was provided without http:// or https://
const withProtocol =
  rawBase && !rawBase.startsWith('/') && !/^https?:\/\//i.test(rawBase)
    ? `https://${rawBase}`
    : rawBase

const baseURL =
  withProtocol === '/api' || withProtocol.endsWith('/api')
    ? withProtocol
    : `${withProtocol}/api`

export const API_BASE_URL = baseURL

const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach auth token from localStorage if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Global error handler — unwraps FastAPI detail strings/arrays into a single message
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    let message = 'Request failed'
    const detail = error.response?.data?.detail
    if (typeof detail === 'string') {
      message = detail
    } else if (Array.isArray(detail) && detail.length > 0) {
      message = detail
        .map((d) => {
          const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : ''
          const prefix = field && field !== 'body' ? `${field}: ` : ''
          return `${prefix}${d.msg || JSON.stringify(d)}`
        })
        .join('; ')
    } else if (detail && typeof detail === 'object') {
      message = detail.msg || JSON.stringify(detail)
    } else if (error.message) {
      message = error.message
    }
    return Promise.reject(new Error(message))
  },
)

// Destructive actions require the signed-in account's password again.
export const confirmHeaders = (password) => (password ? { 'X-Confirm-Password': password } : {})

// ── Authentication ────────────────────────────────────────────────────────────
export const loginUser = (data) => api.post('/auth/login', data)

// ── Students ──────────────────────────────────────────────────────────────────
export const enrollFace = (formData, password) =>
  api.post('/students/face-enroll', formData, {
    headers: { 'Content-Type': 'multipart/form-data', ...confirmHeaders(password) },
  })

// ── Attendance ────────────────────────────────────────────────────────────────
export const getTodayAttendance = () => api.get('/attendance/today')
export const getAttendanceByDate = (date) => api.get(`/attendance/date/${date}`)
export const markAttendanceManual = (data) => api.post('/attendance/manual', data)
export const resetAttendance = (password) =>
  api.post('/attendance/reset', null, { headers: confirmHeaders(password) })

// ── Camera & System ───────────────────────────────────────────────────────────
export const getSystemStatus = () => api.get('/system/status')
export const setAttendanceRecording = (enabled) => api.post('/camera/attendance-recording', { enabled })
export const testVoiceAnnouncement = () => api.post('/camera/test-voice')

// ── System Settings ───────────────────────────────────────────────────────────
export const getGestureAttendanceSettings = () => api.get('/settings/gesture-attendance')
export const getScheduleSettings = () => api.get('/settings/schedule')
export const updateScheduleSettings = (data, password) =>
  api.put('/settings/schedule', data, { headers: confirmHeaders(password) })

export default api

