import { CheckCircle2, Clock3, Maximize2, Users, X } from 'lucide-react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

function formatTime(timestamp) {
  if (!timestamp) return 'Just now'
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(timestamp))
}

function RecordRow({ record }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
        {(record.student_name || '?').slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-slate-800">{record.student_name || 'Unknown student'}</p>
        <p
          className="truncate text-[10px] text-slate-400"
          title={[record.student_code, record.section].filter(Boolean).join(' - ')}
        >
          {record.student_code && record.section
            ? `${record.student_code} · ${record.section}`
            : record.student_code || record.section || 'Face recognition'}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="flex items-center justify-end gap-1 text-[11px] font-medium text-emerald-600">
          <Clock3 size={11} /> {formatTime(record.check_in_time)}
        </p>
        {record.confidence != null && (
          <p className="mt-0.5 text-[10px] text-slate-400">{Math.round(record.confidence * 100)}% match</p>
        )}
      </div>
    </div>
  )
}

function AttendanceLogModal({ records, onClose }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4 sm:p-8"
      style={{ background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(12px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Users size={17} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Attendance log</h2>
              <p className="text-[11px] text-slate-500">Marked by face recognition</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
              {records.length} today
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close attendance log"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto px-6">
          {records.length === 0 && (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-center text-slate-400">
              <CheckCircle2 size={22} className="text-slate-300" />
              <p className="text-xs">Recognized attendees will appear here.</p>
            </div>
          )}
          {records.map((record) => (
            <RecordRow
              key={record.id || `${record.student_id}-${record.check_in_time}`}
              record={record}
            />
          ))}
        </div>

        <div className="border-t border-slate-100 px-6 py-3 text-center">
          <p className="text-[10px] text-slate-400">
            Press <kbd className="rounded bg-slate-100 px-1 py-0.5 font-mono text-slate-600">Esc</kbd> or click outside to close
          </p>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default function AttendanceLog({ records = [], loading = false, open = false, onClose }) {
  const markedRecords = records
    .filter((record) => record.status === 'present' || record.status === 'late' || record.status === 'time_out')
    .sort((a, b) => new Date(b.check_in_time || 0) - new Date(a.check_in_time || 0))

  return (
    <>
      <section className="flex h-full min-h-[340px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Users size={16} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Attendance log</h2>
              <p className="text-[11px] text-slate-400">Marked by face recognition</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
              {markedRecords.length} today
            </span>
            {onClose && (
              <button
                type="button"
                onClick={() => onClose('open')}
                aria-label="Expand attendance log"
                title="Expand"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <Maximize2 size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto px-5">
          {loading && <p className="py-8 text-center text-xs text-slate-400">Loading attendance…</p>}
          {!loading && markedRecords.length === 0 && (
            <div className="flex h-full min-h-44 flex-col items-center justify-center gap-2 text-center text-slate-400">
              <CheckCircle2 size={22} className="text-slate-300" />
              <p className="text-xs">Recognized attendees will appear here.</p>
            </div>
          )}
          {markedRecords.map((record) => (
            <RecordRow
              key={record.id || `${record.student_id}-${record.check_in_time}`}
              record={record}
            />
          ))}
        </div>
      </section>

      {open && (
        <AttendanceLogModal records={markedRecords} onClose={() => onClose('close')} />
      )}
    </>
  )
}
