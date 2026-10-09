import { Check, Clock } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { getScheduleSettings, updateScheduleSettings } from '../../services/api'
import { usePasswordConfirm } from '../../hooks/usePasswordConfirm'
import { wsClient } from '../../services/websocket'

function format12Hour(timeStr) {
  if (!timeStr) return '--:--'
  const [hStr, mStr] = timeStr.split(':')
  const h = parseInt(hStr, 10)
  const m = parseInt(mStr, 10)
  if (isNaN(h) || isNaN(m)) return timeStr
  const period = h >= 12 ? 'PM' : 'AM'
  const displayH = h % 12 || 12
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`
}

function calculateTimeoutTimeStr(checkinStr, minutes) {
  if (!checkinStr) return '10:00'
  const [hStr, mStr] = checkinStr.split(':')
  const h = parseInt(hStr, 10)
  const m = parseInt(mStr, 10)
  if (isNaN(h) || isNaN(m)) return '10:00'
  const total = h * 60 + m + (minutes || 120)
  const norm = ((total % 1440) + 1440) % 1440
  const newH = Math.floor(norm / 60)
  const newM = norm % 60
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
}

function calculateTimeoutMinutes(checkinStr, timeoutStr) {
  if (!checkinStr || !timeoutStr) return 120
  const [chH, chM] = checkinStr.split(':').map(Number)
  const [toH, toM] = timeoutStr.split(':').map(Number)
  let diff = toH * 60 + toM - (chH * 60 + chM)
  if (diff <= 0) {
    diff += 1440
  }
  return diff
}

const timeInputCls = 'bg-transparent font-mono text-xs text-slate-800 focus:outline-none'
const chipCls =
  'flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-[11px] text-slate-600'
const overlayChipCls =
  'flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-black/50 px-2.5 text-[11px] text-slate-200'

function TimeInputs({ checkinTime, timeoutTime, onCheckinChange, onTimeoutChange, overlay = false }) {
  const chip = overlay ? overlayChipCls : chipCls
  const inputStyle = overlay
    ? 'bg-transparent font-mono text-xs text-white focus:outline-none'
    : timeInputCls

  return (
    <>
      <div className={chip}>
        <span className={overlay ? 'font-medium text-slate-300' : 'font-medium text-slate-700'}>Time in:</span>
        <input
          type="time"
          value={checkinTime}
          onChange={(e) => onCheckinChange(e.target.value)}
          className={inputStyle}
          aria-label="Time in"
        />
        <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-600">
          {format12Hour(checkinTime)}
        </span>
      </div>

      <div className={chip}>
        <span className={overlay ? 'font-medium text-slate-300' : 'font-medium text-slate-700'}>Time out:</span>
        <input
          type="time"
          value={timeoutTime}
          onChange={(e) => onTimeoutChange(e.target.value)}
          className={inputStyle}
          aria-label="Time out"
        />
        <span className="rounded bg-rose-500/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-rose-600">
          {format12Hour(timeoutTime)}
        </span>
      </div>
    </>
  )
}

function LiveStatusBadge({ status, timeoutLabel, overlay = false }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl px-3 py-1.5 ${
        overlay
          ? 'border border-white/10 bg-black/50 text-white'
          : 'border border-slate-200 bg-slate-50 text-slate-700'
      }`}
    >
      <span className="text-[10px] uppercase tracking-wider text-slate-400">Live Status:</span>
      {status === 'present' && (
        <span className="flex items-center gap-1.5 font-mono text-xs font-semibold text-emerald-600">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
          Marking Time in
        </span>
      )}
      {status === 'late' && (
        <span className="flex items-center gap-1.5 font-mono text-xs font-semibold text-amber-600">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
          Marking Late
        </span>
      )}
      {status === 'time_out' && (
        <span
          className="flex items-center gap-1.5 font-mono text-xs font-semibold text-rose-600"
          title={`Departures after ${timeoutLabel} are marked Time out`}
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
          Marking Time out
        </span>
      )}
    </div>
  )
}

export default function CheckinTimeSchedule({ overlay = false }) {
  const [checkinTime, setCheckinTime] = useState('08:00')
  const [savedTime, setSavedTime] = useState('08:00')
  const [graceMinutes, setGraceMinutes] = useState(30)
  const [savedGraceMinutes, setSavedGraceMinutes] = useState(30)
  const [timeoutMinutes, setTimeoutMinutes] = useState(120)
  const [savedTimeoutMinutes, setSavedTimeoutMinutes] = useState(120)
  const [timeoutTime, setTimeoutTime] = useState('10:00')
  const [savedTimeoutTime, setSavedTimeoutTime] = useState('10:00')
  const [saving, setSaving] = useState(false)
  const { confirm, dialog } = usePasswordConfirm()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const apply = (data) => {
      if (!data?.checkin_time) return
      const checkin = data.checkin_time
      const grace = data.late_grace_minutes ?? 30
      const timeout = Math.max(grace, data.attendance_timeout_minutes ?? 120)
      const toTime = calculateTimeoutTimeStr(checkin, timeout)

      setCheckinTime(checkin)
      setSavedTime(checkin)
      setGraceMinutes(grace)
      setSavedGraceMinutes(grace)
      setTimeoutMinutes(timeout)
      setSavedTimeoutMinutes(timeout)
      setTimeoutTime(toTime)
      setSavedTimeoutTime(toTime)
    }

    getScheduleSettings()
      .then(apply)
      .catch(() => {})

    const unsub = wsClient.on('schedule_updated', apply)
    return unsub
  }, [])

  const currentStatus = useMemo(() => {
    if (!savedTime) return 'present'
    const [h, m] = savedTime.split(':').map(Number)
    const target = new Date(currentTime)
    target.setHours(h, m, 0, 0)
    const lateCutoff = new Date(target.getTime() + savedGraceMinutes * 60 * 1000)
    const attendanceCutoff = new Date(target.getTime() + savedTimeoutMinutes * 60 * 1000)

    if (currentTime > attendanceCutoff) return 'time_out'
    if (currentTime > lateCutoff) return 'late'
    return 'present'
  }, [savedTime, savedGraceMinutes, savedTimeoutMinutes, currentTime])

  const handleCheckinChange = (newCheckin) => {
    setCheckinTime(newCheckin)
    if (newCheckin && timeoutTime) {
      const minutes = calculateTimeoutMinutes(newCheckin, timeoutTime)
      setTimeoutMinutes(minutes)
    }
  }

  const handleTimeoutChange = (newTimeout) => {
    setTimeoutTime(newTimeout)
    if (newTimeout && checkinTime) {
      const minutes = calculateTimeoutMinutes(checkinTime, newTimeout)
      setTimeoutMinutes(minutes)
    }
  }

  const handleSave = async (
    timeToSave = checkinTime,
    timeoutMinsToSave = timeoutMinutes,
    timeoutTimeToSave = timeoutTime,
  ) => {
    setSaving(true)
    const saved = await confirm(
      async (password) => {
        await updateScheduleSettings(
          {
            checkin_time: timeToSave,
            late_grace_minutes: graceMinutes,
            attendance_timeout_minutes: timeoutMinsToSave,
          },
          password,
        )
        setSavedTime(timeToSave)
        setCheckinTime(timeToSave)
        setSavedGraceMinutes(graceMinutes)
        setSavedTimeoutMinutes(timeoutMinsToSave)
        setSavedTimeoutTime(timeoutTimeToSave)
        setTimeoutTime(timeoutTimeToSave)
      },
      {
        title: 'Confirm check-in schedule',
        description: `Attendance will be accepted from ${format12Hour(timeToSave)} until ${format12Hour(timeoutTimeToSave)}. Enter your password to continue.`,
        confirmLabel: 'Save schedule',
      },
    )
    setSaving(false)
    if (!saved) return
    toast.success(`Schedule set: ${format12Hour(timeToSave)} to ${format12Hour(timeoutTimeToSave)}`)
  }

  const isDirty = checkinTime !== savedTime || timeoutTime !== savedTimeoutTime

  const saveButton = (
    <button
      type="button"
      onClick={() => handleSave()}
      disabled={!isDirty || saving}
      title={isDirty ? 'Save the new schedule' : 'Edit Time in or Time out to enable'}
      className="flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-3 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Check size={14} />
      <span>{saving ? 'Saving…' : 'Set schedule'}</span>
    </button>
  )

  const inputs = (
    <TimeInputs
      checkinTime={checkinTime}
      timeoutTime={timeoutTime}
      onCheckinChange={handleCheckinChange}
      onTimeoutChange={handleTimeoutChange}
      overlay={overlay}
    />
  )

  if (overlay) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/60 px-3 py-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl">
        {inputs}
        {saveButton}
        <LiveStatusBadge status={currentStatus} timeoutLabel={format12Hour(savedTimeoutTime)} overlay />
        {dialog}
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Clock size={19} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-semibold text-slate-900">Target Check-in Schedule</h2>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-700">
                Active: {format12Hour(savedTime)} – {format12Hour(savedTimeoutTime)}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              The camera marks Time in until {format12Hour(calculateTimeoutTimeStr(savedTime, savedGraceMinutes))}, Late
              until {format12Hour(savedTimeoutTime)}, and Time out after that.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {inputs}
          {saveButton}
          <LiveStatusBadge status={currentStatus} timeoutLabel={format12Hour(savedTimeoutTime)} />
        </div>
      </div>

      {dialog}
    </div>
  )
}
