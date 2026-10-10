import { useCallback, useEffect, useState } from 'react'
import { getAttendanceByDate, getTodayAttendance, markAttendanceManual, resetAttendance } from '../services/api'
import { fetchAttendanceRange } from '../services/data'
import { toISODate } from '../utils/helpers'
import { wsClient } from '../services/websocket'

function normalizeRecord(r) {
  return {
    id: r.id || `${r.student_id}-${r.check_in_time || Date.now()}`,
    student_id: r.student_id,
    student_name: r.student_name || r.students?.full_name || `Student #${r.student_id}`,
    student_code: r.student_code || r.students?.student_id || '',
    section: r.section || r.students?.section || '',
    status: r.status || 'present',
    confidence: r.confidence ?? null,
    check_in_time: r.check_in_time || new Date().toISOString(),
    check_out_time: r.check_out_time ?? null,
    class_date: r.class_date || toISODate(new Date()),
    enrollment_photo_url: r.enrollment_photo_url || r.students?.photo_url || null,
  }
}

function computeStats(records) {
  const total = records.length
  const present = records.filter((r) => r.status === 'present').length
  const late = records.filter((r) => r.status === 'late').length
  const time_out = records.filter((r) => r.status === 'time_out').length
  const rate = total > 0 ? Math.round(((present + late + time_out) / total) * 100) : 0
  return { total, present, late, time_out, rate }
}

export function useAttendance(date = null) {
  const [attendance, setAttendance] = useState([])
  const [stats, setStats] = useState({ total: 0, present: 0, late: 0, time_out: 0, rate: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAttendance = useCallback(async () => {
    setLoading(true)
    setError(null)
    const targetDate = date ? toISODate(new Date(date)) : toISODate(new Date())

    try {
      // 1. Try backend API first
      const data = date ? await getAttendanceByDate(targetDate) : await getTodayAttendance()
      const rawRecords = data?.records ?? (Array.isArray(data) ? data : [])
      const normalized = rawRecords.map(normalizeRecord)
      setAttendance(normalized)
      setStats(data?.stats ?? computeStats(normalized))
    } catch {
      // 2. Fall back to Supabase directly
      try {
        const rows = await fetchAttendanceRange(targetDate, targetDate)
        const normalized = rows.map(normalizeRecord)
        setAttendance(normalized)
        setStats(computeStats(normalized))
      } catch (err) {
        setError(err.message || 'Could not load attendance.')
      }
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    fetchAttendance()
  }, [fetchAttendance])

  // Real-time camera biometric check-in event over WebSocket
  useEffect(() => {
    const unsubscribe = wsClient.on('attendance', (event) => {
      const record = normalizeRecord({
        ...(event.record || {}),
        student_id: event.student_id,
        student_name: event.student_name,
        student_code: event.student_code,
        section: event.section,
        status: event.status || 'present',
        confidence: event.confidence,
        check_in_time: event.check_in_time || new Date().toISOString(),
        class_date: event.class_date,
        enrollment_photo_url: event.enrollment_photo_url,
      })

      setAttendance((previous) => {
        const existingIndex = previous.findIndex((item) => item.student_id === record.student_id)
        const next =
          existingIndex >= 0
            ? previous.map((item, index) => (index === existingIndex ? { ...item, ...record } : item))
            : [record, ...previous]
        setStats(computeStats(next))
        return next
      })
    })
    return unsubscribe
  }, [])

  // Real-time student departure event
  useEffect(() => {
    const unsubTimeOut = wsClient.on('attendance_time_out', (event) => {
      setAttendance((previous) => {
        const next = previous.map((item) =>
          item.student_id === event.student_id
            ? { ...item, status: 'time_out', check_out_time: event.check_out_time }
            : item,
        )
        setStats(computeStats(next))
        return next
      })
    })
    return unsubTimeOut
  }, [])

  // Real-time reset event
  useEffect(() => {
    const unsubReset = wsClient.on('attendance_reset', () => {
      setAttendance([])
      setStats({ total: 0, present: 0, late: 0, time_out: 0, rate: 0 })
    })
    return unsubReset
  }, [])

  const markManual = useCallback(
    async (payload) => {
      const response = await markAttendanceManual(payload)
      await fetchAttendance()
      return response.record || response
    },
    [fetchAttendance],
  )

  const resetToday = useCallback(async (password) => {
    await resetAttendance(password)
    setAttendance([])
    setStats({ total: 0, present: 0, late: 0, time_out: 0, rate: 0 })
  }, [])

  return {
    attendance,
    stats,
    loading,
    error,
    refetch: fetchAttendance,
    markManual,
    resetToday,
  }
}

export default useAttendance
