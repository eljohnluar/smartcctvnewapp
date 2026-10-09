import { useCallback, useEffect, useRef, useState } from 'react'
import { useAttendance } from '../hooks/useAttendance'
import LiveCameraFeed from '../components/dashboard/LiveCameraFeed'
import AttendanceLog from '../components/dashboard/AttendanceLog'
import AttendanceRecognitionOverlay from '../components/dashboard/AttendanceRecognitionOverlay'
import CheckinTimeSchedule from '../components/dashboard/CheckinTimeSchedule'
import { wsClient } from '../services/websocket'

export default function LiveCamera() {
  const { attendance, loading } = useAttendance()
  const [recognition, setRecognition] = useState(null)
  const [attendanceLogOpen, setAttendanceLogOpen] = useState(false)
  const dismissTimer = useRef(null)
  const displayedAttendance = useRef(new Set())

  const handleAttendanceLogToggle = useCallback((action) => {
    setAttendanceLogOpen(action === 'open')
  }, [])

  useEffect(() => {
    const showRecognition = (event, eventKey) => {
      if (displayedAttendance.current.has(eventKey)) return
      displayedAttendance.current.add(eventKey)
      clearTimeout(dismissTimer.current)
      setRecognition(event)
      dismissTimer.current = setTimeout(() => setRecognition(null), 5000)
    }

    const unsubAttendance = wsClient.on('attendance', (event) => {
      const attendanceDate =
        event.class_date || event.record?.class_date || new Date().toISOString().slice(0, 10)
      showRecognition(event, `${event.student_id}:${attendanceDate}`)
    })

    const unsubTimeOut = wsClient.on('attendance_time_out', (event) => {
      showRecognition(
        { ...event, status: 'time_out', check_in_time: event.check_out_time },
        `time-out:${event.student_id}:${event.class_date || ''}`,
      )
    })

    const unsubReset = wsClient.on('attendance_reset', () => {
      displayedAttendance.current.clear()
      setRecognition(null)
    })

    return () => {
      unsubAttendance()
      unsubTimeOut()
      unsubReset()
      clearTimeout(dismissTimer.current)
    }
  }, [])

  return (
    <>
      <AttendanceRecognitionOverlay
        recognition={recognition}
        onClose={() => {
          clearTimeout(dismissTimer.current)
          setRecognition(null)
        }}
      />

      <div className="mx-auto max-w-[1600px] space-y-6 pb-8">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.85fr)]">
          <LiveCameraFeed attendanceRecords={attendance} />
          <AttendanceLog
            records={attendance}
            loading={loading}
            open={attendanceLogOpen}
            onClose={handleAttendanceLogToggle}
          />
        </div>

        <CheckinTimeSchedule />
      </div>
    </>
  )
}
