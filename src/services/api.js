import axios from 'axios'

const rawBase = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '')
// Tolerate a configured base without the /api suffix (e.g. "https://backend.up.railway.app").
const baseURL = rawBase === '/api' || rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`

export const API_BASE_URL = baseURL

const api = axios.create({
  baseURL,
  timeout: 15000,
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

// ── Authentication ────────────────────────────────────────────────────────────
export const loginUser = (data) => api.post('/auth/login', data)

// ── Students ──────────────────────────────────────────────────────────────────

// Destructive actions require the signed-in account's password again.
const confirmHeaders = (password) => (password ? { 'X-Confirm-Password': password } : {})

export const enrollFace = (formData, password) =>
  api.post('/students/face-enroll', formData, {
    headers: { 'Content-Type': 'multipart/form-data', ...confirmHeaders(password) },
  })

// ── System Settings ───────────────────────────────────────────────────────────
export const getGestureAttendanceSettings = () => api.get('/settings/gesture-attendance')

export default api
