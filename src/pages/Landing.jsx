import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Camera,
  Cpu,
  Fingerprint,
  Hand,
  LogIn,
  Palette,
  Radio,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'

const stats = [
  {
    icon: Cpu,
    label: 'Face recognition',
    value: 'Sub-second',
    hint: '128-d matching',
    tint: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  },
  {
    icon: Radio,
    label: 'Threat detection',
    value: '41 objects',
    hint: 'Weapons & objects',
    tint: 'bg-sky-50 text-sky-700 ring-sky-200',
  },
  {
    icon: Palette,
    label: 'Uniform check',
    value: '6 shades',
    hint: 'Light / dark blue & red',
    tint: 'bg-amber-50 text-amber-700 ring-amber-200',
  },
  {
    icon: Hand,
    label: 'Palm verification',
    value: 'Anti-spoof',
    hint: 'Prevents proxy attendance',
    tint: 'bg-violet-50 text-violet-700 ring-violet-200',
  },
]

const highlights = [
  {
    icon: Fingerprint,
    title: 'Face check-in in under a second',
    text: 'The camera recognizes your students and marks attendance automatically, based on your class schedule.',
    tint: 'bg-emerald-50 text-emerald-600',
  },
  {
    icon: Activity,
    title: 'Automatic voice announcements',
    text: 'Students hear attendance and uniform reminders through the classroom speaker.',
    tint: 'bg-sky-50 text-sky-600',
  },
]

const capabilities = [
  {
    icon: Camera,
    title: 'Biometric attendance',
    text: 'Face recognition matches students against their enrolled photos and records their attendance automatically.',
    tint: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
  },
  {
    icon: AlertTriangle,
    title: 'Threat detection',
    text: 'AI vision scans live footage for bladed weapons, firearms, and other prohibited objects, and flags them instantly.',
    tint: 'bg-rose-50 text-rose-600 ring-rose-200',
  },
  {
    icon: Palette,
    title: 'Uniform policy check',
    text: "Checks clothing colors against your allowed uniform shades and reminds students when they're out of compliance.",
    tint: 'bg-amber-50 text-amber-600 ring-amber-200',
  },
  {
    icon: Hand,
    title: 'Palm verification',
    text: 'Optional open-palm confirmation prevents proxy attendance and keeps check-ins honest.',
    tint: 'bg-violet-50 text-violet-600 ring-violet-200',
  },
]

export default function Landing() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [currentTime, setCurrentTime] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const time24 = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      {/* ── Top navigation ───────────────────────────────────────── */}
      <header className="border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <img
                src="/logo-mark.jpg"
                alt="SmartCamera logo"
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight sm:text-lg">
                  Smart<span className="text-emerald-600">Camera</span>
                </span>
                <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-[9px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                  v2.6
                </span>
              </div>
              <p className="text-[10px] tracking-wide text-slate-500">
                AI vision &amp; attendance system
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <div className="hidden font-mono text-xs text-slate-500 sm:block">
              <span className="mr-1.5 text-emerald-600">Time</span>
              <span className="tabular-nums font-medium text-slate-700">{time24}</span>
            </div>

            <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-xs ring-1 ring-emerald-200 sm:flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              <span className="font-medium text-emerald-700">All systems active</span>
            </div>

            {user ? (
              <button
                type="button"
                onClick={() => navigate('/')}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
              >
                <span>Open dashboard</span>
                <ArrowRight size={13} />
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
              >
                <LogIn size={13} />
                <span>Sign in</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-8 sm:py-14">
        <div className="mx-auto max-w-5xl">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs text-slate-600 ring-1 ring-slate-200">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <span className="font-medium">Simple, secure attendance for your classroom</span>
            </div>

            <div className="flex items-center gap-4 pt-1">
              <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
                <img
                  src="/company-logo.png"
                  alt="C7 company logo"
                  className="h-9 w-auto max-w-[130px] object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
              <div className="text-[10px] uppercase leading-relaxed tracking-widest text-slate-400">
                <p>Powered by</p>
                <p className="font-semibold text-slate-600">C7</p>
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                Camera with{' '}
                <span className="text-emerald-600">AI-powered</span> and automated attendance
                system
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
                SmartCamera recognizes your students on camera, marks attendance automatically,
                checks uniforms, and keeps an eye on safety — so you can focus on teaching.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map(({ icon: Icon, label, value, hint, tint }) => (
                <div key={label} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
                  <div className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-bold uppercase ring-1 ${tint}`}>
                    <Icon size={12} /> {label}
                  </div>
                  <div className="mt-2 text-base font-bold">{value}</div>
                  <div className="text-[10px] text-slate-400">{hint}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
              {highlights.map(({ icon: Icon, title, text, tint }) => (
                <div key={title} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tint}`}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold">{title}</h2>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Capabilities ───────────────────────────────────────── */}
        <div className="mt-16 border-t border-slate-200 pt-10">
          <div className="mb-8 text-center">
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-widest text-emerald-600">
              Everything you need
            </h2>
            <p className="text-xl font-bold">One system for attendance and campus safety</p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {capabilities.map(({ icon: Icon, title, text, tint }) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300"
              >
                <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${tint}`}>
                  <Icon size={19} />
                </div>
                <h3 className="text-sm font-bold">{title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-500">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white px-4 py-6 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400 sm:justify-start">
            <span className="font-medium text-slate-500">SmartCamera</span>
            <span>|</span>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <Link
              to="/credits"
              className="font-medium text-emerald-600 underline underline-offset-4 decoration-emerald-200 hover:text-emerald-700"
            >
              Credits
            </Link>
            {!user && (
              <Link to="/login" className="font-medium text-slate-500 hover:text-slate-700">
                Teacher sign in
              </Link>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}
