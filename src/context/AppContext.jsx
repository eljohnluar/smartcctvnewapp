import { createContext, useCallback, useContext, useEffect, useReducer } from 'react'
import { getSystemStatus, setAttendanceRecording as setAttendanceRecordingApi } from '../services/api'
import { useSectionScope } from '../hooks/useSectionScope'
import { wsClient } from '../services/websocket'
import { SYSTEM_STATUS } from '../utils/constants'

const AppContext = createContext(null)

const initialState = {
  sidebarOpen: true,
  systemStatus: SYSTEM_STATUS.OFFLINE,
  cameraActive: false,
  aiActive: false,
  attendanceRecording: true,
  notifications: [],
  unreadCount: 0,
}

function reducer(state, action) {
  switch (action.type) {
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen }
    case 'SET_SYSTEM_STATUS':
      return {
        ...state,
        systemStatus: action.payload.status,
        cameraActive: action.payload.camera_active ?? false,
        aiActive: action.payload.ai_active ?? false,
        attendanceRecording: action.payload.attendance_recording ?? state.attendanceRecording,
      }
    case 'SET_ATTENDANCE_RECORDING':
      return { ...state, attendanceRecording: action.payload }
    case 'ADD_NOTIFICATION':
      if (state.notifications.some((notification) => notification.id === action.payload.id)) return state
      return {
        ...state,
        notifications: [action.payload, ...state.notifications].slice(0, 50),
        unreadCount: state.unreadCount + 1,
      }
    case 'MARK_READ':
      return { ...state, unreadCount: 0 }
    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [], unreadCount: 0 }
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { wsSectionScope } = useSectionScope()

  // Poll system status from backend
  const refreshStatus = useCallback(async () => {
    try {
      const data = await getSystemStatus()
      dispatch({ type: 'SET_SYSTEM_STATUS', payload: data })
    } catch {
      dispatch({
        type: 'SET_SYSTEM_STATUS',
        payload: { status: SYSTEM_STATUS.OFFLINE, camera_active: false, ai_active: false },
      })
    }
  }, [])

  useEffect(() => {
    refreshStatus()
    const interval = setInterval(refreshStatus, 15000)
    return () => clearInterval(interval)
  }, [refreshStatus])

  // Authorize socket with token and teacher's section scope
  useEffect(() => {
    wsClient.authorize(localStorage.getItem('access_token'), wsSectionScope)
  }, [wsSectionScope])

  // WebSocket real-time events
  useEffect(() => {
    const unsubAlert = wsClient.on('alert', (data) => {
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: Date.now(),
          type: 'alert',
          message: data.description || 'Security alert detected',
          timestamp: new Date().toISOString(),
        },
      })
    })

    const unsubAttendance = wsClient.on('attendance', (data) => {
      const attendanceDate = data.class_date || data.record?.class_date || new Date().toISOString().slice(0, 10)
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          id: `attendance:${data.student_id}:${attendanceDate}`,
          type: 'attendance',
          message: `${data.student_name || 'Student'} marked ${data.status || 'present'}`,
          timestamp: new Date().toISOString(),
        },
      })
    })

    const unsubVoice = wsClient.on('voice', (data) => {
      if (!data.message || data.server_audio || typeof window === 'undefined' || !('speechSynthesis' in window)) return
      try {
        const utterance = new SpeechSynthesisUtterance(data.message)
        utterance.lang = 'en-US'
        utterance.rate = 1
        const gender = data.voice_gender || 'female'
        const voiceTerms =
          gender === 'male'
            ? ['male', 'david', 'mark', 'guy', 'daniel']
            : ['female', 'zira', 'hazel', 'susan', 'samantha']
        const matchingVoice = window.speechSynthesis
          .getVoices()
          .find((voice) => voiceTerms.some((term) => voice.name.toLowerCase().includes(term)))
        if (matchingVoice) utterance.voice = matchingVoice
        utterance.volume = Math.max(0, Math.min(1, Number(data.volume ?? 100) / 100))
        window.speechSynthesis.speak(utterance)
      } catch {
        // Speech synthesis error handled gracefully
      }
    })

    return () => {
      unsubAlert()
      unsubAttendance()
      unsubVoice()
      wsClient.disconnect()
    }
  }, [])

  const toggleSidebar = () => dispatch({ type: 'TOGGLE_SIDEBAR' })
  const addNotification = (n) => dispatch({ type: 'ADD_NOTIFICATION', payload: n })
  const markRead = () => dispatch({ type: 'MARK_READ' })
  const clearNotifications = () => dispatch({ type: 'CLEAR_NOTIFICATIONS' })

  const updateAttendanceRecording = useCallback(async (enabled) => {
    const data = await setAttendanceRecordingApi(enabled)
    dispatch({ type: 'SET_ATTENDANCE_RECORDING', payload: data.attendance_recording })
    return data
  }, [])

  return (
    <AppContext.Provider
      value={{
        ...state,
        toggleSidebar,
        addNotification,
        markRead,
        clearNotifications,
        refreshStatus,
        updateAttendanceRecording,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

export default AppContext
