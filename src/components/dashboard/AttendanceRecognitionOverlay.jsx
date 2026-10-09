import { CheckCircle2, Clock3, Shield, X } from 'lucide-react'

function formatTime(timestamp) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(timestamp || Date.now()))
}

export default function AttendanceRecognitionOverlay({ recognition, onClose }) {
  if (!recognition) return null

  const initial = (recognition.student_name || '?').slice(0, 1).toUpperCase()
  const confidence = recognition.confidence
    ? `${(recognition.confidence * 100).toFixed(1)}%`
    : null

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center overflow-y-auto px-4 py-6 backdrop-blur-md animate-in fade-in duration-200"
      style={{ background: 'rgba(0, 8, 20, 0.94)' }}
      role="status"
      aria-live="assertive"
    >
      {/* Scanline overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 170, 0.015) 2px, rgba(0, 255, 170, 0.015) 4px)',
        }}
      />

      {/* Outer Card Container with Adaptive Cyberpunk Corner Brackets */}
      <div className="relative z-10 my-auto flex w-full max-w-[440px] flex-col items-center sm:max-w-[480px] md:max-w-[500px]">
        {/* Corner Brackets */}
        <div className="pointer-events-none absolute -inset-3 sm:-inset-4">
          <span
            className="absolute left-0 top-0 h-9 w-9 border-l-2 border-t-2 border-emerald-400"
            style={{ boxShadow: '0 0 10px #22c55e90' }}
          />
          <span
            className="absolute right-0 top-0 h-9 w-9 border-r-2 border-t-2 border-emerald-400"
            style={{ boxShadow: '0 0 10px #22c55e90' }}
          />
          <span
            className="absolute bottom-0 left-0 h-9 w-9 border-b-2 border-l-2 border-emerald-400"
            style={{ boxShadow: '0 0 10px #22c55e90' }}
          />
          <span
            className="absolute bottom-0 right-0 h-9 w-9 border-b-2 border-r-2 border-emerald-400"
            style={{ boxShadow: '0 0 10px #22c55e90' }}
          />
        </div>

        {/* Card Body */}
        <div
          className="relative flex w-full flex-col items-center overflow-hidden rounded-3xl"
          style={{
            background: 'linear-gradient(160deg, #0b1a2e 0%, #071020 100%)',
            border: '1px solid rgba(34,197,94,0.35)',
            boxShadow:
              '0 0 60px rgba(34,197,94,0.14), 0 0 120px rgba(34,197,94,0.06), inset 0 1px 0 rgba(34,197,94,0.12)',
          }}
        >
          {/* Top status bar */}
          <div
            className="flex w-full items-center justify-between px-6 py-3"
            style={{
              background: 'rgba(34,197,94,0.08)',
              borderBottom: '1px solid rgba(34,197,94,0.16)',
            }}
          >
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-emerald-400" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-400 sm:text-[11px]">
                Identity Verified
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span
                  className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400"
                  style={{ boxShadow: '0 0 6px #22c55e' }}
                />
                <span className="font-mono text-[9px] font-medium tracking-wider text-emerald-400/90 sm:text-[10px]">
                  Live · 5s
                </span>
              </div>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Dismiss recognition overlay"
                  className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Enlarged Photo Section with Multi-layer HUD Rings */}
          <div className="relative mt-5 flex items-center justify-center p-2 sm:mt-6">
            <span className="absolute -top-1 h-3 w-0.5 bg-emerald-400/70" />
            <span className="absolute -bottom-1 h-3 w-0.5 bg-emerald-400/70" />
            <span className="absolute -left-1 h-0.5 w-3 bg-emerald-400/70" />
            <span className="absolute -right-1 h-0.5 w-3 bg-emerald-400/70" />

            <div
              className="absolute h-[250px] w-[250px] rounded-full sm:h-[280px] sm:w-[280px]"
              style={{
                boxShadow:
                  '0 0 0 2px rgba(34,197,94,0.45), 0 0 40px rgba(34,197,94,0.3), 0 0 80px rgba(34,197,94,0.12)',
              }}
            />

            <div
              className="absolute h-[270px] w-[270px] animate-spin rounded-full sm:h-[300px] sm:w-[300px]"
              style={{
                background: 'transparent',
                border: '1.5px dashed rgba(34,197,94,0.35)',
                animationDuration: '9s',
              }}
            />

            <div
              className="relative h-56 w-56 overflow-hidden rounded-full sm:h-64 sm:w-64"
              style={{
                border: '3px solid rgba(34,197,94,0.75)',
                boxShadow: '0 0 35px rgba(34,197,94,0.35)',
              }}
            >
              <div className="flex h-full w-full items-center justify-center bg-[#0d221b] text-6xl font-bold text-emerald-300 sm:text-7xl">
                {initial}
              </div>
              {recognition.enrollment_photo_url && (
                <img
                  src={recognition.enrollment_photo_url}
                  alt={`${recognition.student_name}'s photo`}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
            </div>
          </div>

          <style>{`
            @keyframes scanSlide {
              0% { left: -6rem; }
              100% { left: 26rem; }
            }
            @keyframes countdownBar {
              0% { width: 100%; }
              100% { width: 0%; }
            }
          `}</style>

          {/* Details Section */}
          <div className="flex w-full flex-col items-center px-6 pb-5 pt-3 sm:px-8">
            <div className="mb-3 flex items-center gap-2">
              {recognition.status === 'time_out' ? (
                <>
                  <Clock3 size={16} className="text-rose-400" />
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-rose-400 sm:text-xs">
                    Attendance Marked · Time Out
                  </span>
                </>
              ) : recognition.status === 'late' ? (
                <>
                  <Clock3 size={16} className="text-amber-400" />
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-400 sm:text-xs">
                    Attendance Marked · Late
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-emerald-400 sm:text-xs">
                    Attendance Marked · Present
                  </span>
                </>
              )}
            </div>

            <h2 className="text-center text-xl font-bold tracking-wide text-white sm:text-2xl">
              {recognition.student_name}
            </h2>

            {recognition.student_code && (
              <p className="mt-1 font-mono text-xs tracking-[0.2em] text-emerald-400/90 sm:text-sm">
                ID: {recognition.student_code}
              </p>
            )}

            {recognition.section && (
              <p className="mt-1 max-w-full truncate px-4 text-center text-xs tracking-wide text-slate-400 sm:text-sm">
                {recognition.section}
              </p>
            )}

            <div
              className="my-3 h-px w-full"
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(34,197,94,0.45), transparent)',
              }}
            />

            <div className="flex w-full items-center justify-between font-mono text-xs text-slate-400 sm:text-sm">
              <div className="flex items-center gap-2">
                <Clock3 size={14} className="text-emerald-400" />
                <span className="text-emerald-300/90">
                  {formatTime(recognition.check_in_time)}
                </span>
              </div>
              {confidence && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 sm:text-[11px]">
                    Match
                  </span>
                  <span className="font-semibold text-emerald-300">
                    {confidence}
                  </span>
                </div>
              )}
            </div>

            {recognition.confidence && (
              <div className="mt-3 w-full">
                <div className="h-[4px] w-full overflow-hidden rounded-full bg-slate-800/80">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(recognition.confidence * 100).toFixed(0)}%`,
                      background: 'linear-gradient(90deg, #10b981, #22c55e)',
                      boxShadow: '0 0 8px rgba(34,197,94,0.75)',
                      transition: 'width 0.8s ease',
                    }}
                  />
                </div>
              </div>
            )}

            <div className="mt-3 w-full">
              <div className="h-[3px] w-full overflow-hidden rounded-full bg-slate-800/70">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400"
                  style={{
                    animation: 'countdownBar 5s linear forwards',
                    boxShadow: '0 0 10px rgba(34,197,94,0.6)',
                  }}
                />
              </div>
            </div>

            <p className="mt-2.5 font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">
              Returning to live monitor in 5s…
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
