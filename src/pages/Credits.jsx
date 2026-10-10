import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Award,
  Camera,
  Code2,
  Cpu,
  Database,
  GraduationCap,
  Layers,
  Radio,
  Server,
  Sparkles,
  Terminal,
} from 'lucide-react'
import { useAuth } from '../context/useAuth'

const TEAM_MEMBERS = [
  {
    id: 'rebano',
    name: 'Rebaño, Eljohn L.',
    role: 'Lead developer & AI system architect',
    subRole: 'Neural networks & full-stack integration',
    slugs: ['rebano', 'rebano_eljohn', 'eljohn_rebano'],
    initials: 'ER',
    specialty: 'Computer vision & deep learning pipeline',
    badge: 'Core architect',
  },
  {
    id: 'pablo',
    name: 'Pablo, Christian F.',
    role: 'AI model & computer vision engineer',
    subRole: 'YOLOv8 threat detection & frame processing',
    slugs: ['pablo', 'pablo_christian', 'christian_pablo'],
    initials: 'CP',
    specialty: 'Object detection & threat heuristics',
    badge: 'AI engineer',
  },
  {
    id: 'dasig',
    name: 'Dasig, Charles Aivan M.',
    role: 'Backend systems & API engineer',
    subRole: 'FastAPI, RTSP streaming & WebSockets',
    slugs: ['dasig', 'dasig_charles', 'charles_dasig'],
    initials: 'CD',
    specialty: 'Async stream ingestion & microservices',
    badge: 'Backend engineer',
  },
  {
    id: 'ortega',
    name: 'Ortega, Jerold C.',
    role: 'Database & security engineer',
    subRole: 'Supabase PostgreSQL & embedding storage',
    slugs: ['ortega', 'ortega_jerold', 'jerold_ortega'],
    initials: 'JO',
    specialty: 'Vector database & data security',
    badge: 'Database ops',
  },
  {
    id: 'rustia',
    name: 'Rustia, Reynielle N.',
    role: 'UI/UX & frontend developer',
    subRole: 'React 19, Tailwind & real-time feeds',
    slugs: ['rustia', 'rustia_reynielle', 'reynielle_rustia'],
    initials: 'RR',
    specialty: 'Dynamic interactive dashboards',
    badge: 'UI/UX frontend',
  },
  {
    id: 'borres',
    name: 'Borres, Earlwyn Kyle T.',
    role: 'Biometric analytics & QA engineer',
    subRole: 'Face matching accuracy & dress code checks',
    slugs: ['borres', 'borres_earlwyn', 'earlwyn_borres'],
    initials: 'EB',
    specialty: 'Model benchmarking & quality assurance',
    badge: 'QA & validation',
  },
  {
    id: 'limpag',
    name: 'Limpag, John Laurence A.',
    role: 'Hardware integration & systems support',
    subRole: 'Camera feed ingestion & network protocol',
    slugs: ['limpag', 'limpag_john', 'john_limpag'],
    initials: 'JL',
    specialty: 'CCTV hardware calibration & deployment',
    badge: 'Hardware integration',
  },
]

const ADVISER = {
  name: 'Prof. Joel Almazan',
  title: 'Project adviser & technopreneurship mentor',
  department: 'College of Computer Studies',
  institution: 'Bestlink College of the Philippines',
  slugs: ['almazan', 'prof_almazan', 'joel_almazan', 'almazan_joel'],
  initials: 'JA',
  message:
    'Guiding the research, technical architecture, and implementation of the SmartCamera Automated Biometric Attendance & Security Sentry System.',
}

/** Tries each candidate photo path in turn, falling back to an initials avatar. */
function MemberPhoto({ slugs = [], initials = '?', name = '' }) {
  const [candidateIndex, setCandidateIndex] = useState(0)
  const [loadError, setLoadError] = useState(false)

  const extensions = ['jpg', 'png', 'jpeg', 'webp']
  const candidates = slugs.flatMap((slug) =>
    extensions.map((ext) => `/photos/credits_name/${slug}.${ext}`),
  )
  const currentSrc = candidates[candidateIndex]

  const handleImgError = () => {
    if (candidateIndex < candidates.length - 1) {
      setCandidateIndex((prev) => prev + 1)
    } else {
      setLoadError(true)
    }
  }

  if (loadError || !currentSrc) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold tracking-widest text-slate-400 sm:text-3xl">
            {initials}
          </span>
          <span className="mt-1 text-[9px] uppercase tracking-widest text-slate-400">
            Photo pending
          </span>
        </div>
      </div>
    )
  }

  return (
    <img
      src={currentSrc}
      alt={name}
      onError={handleImgError}
      className="h-full w-full object-cover"
    />
  )
}

const stack = [
  {
    icon: Cpu,
    title: 'Deep learning biometrics',
    text: 'OpenCV YuNet & FaceNet models producing 128-dimensional cosine vector embeddings for instantaneous student recognition.',
    tint: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
  },
  {
    icon: Radio,
    title: 'YOLOv8 threat detection',
    text: 'Ultralytics YOLOv8 object detection scanning video frames 3x/sec for bladed weapons, firearms, and hazardous materials.',
    tint: 'bg-sky-50 text-sky-600 ring-sky-200',
  },
  {
    icon: Camera,
    title: 'HSV uniform policy engine',
    text: 'Autonomous torso crop analyzer mapping light/dark blue and light/dark red clothing against institutional dress regulations.',
    tint: 'bg-amber-50 text-amber-600 ring-amber-200',
  },
  {
    icon: Server,
    title: 'FastAPI async server',
    text: 'High-throughput Python asynchronous web server handling OpenCV RTSP camera loops and MJPEG multi-client streaming.',
    tint: 'bg-violet-50 text-violet-600 ring-violet-200',
  },
  {
    icon: Database,
    title: 'Supabase realtime cloud',
    text: 'PostgreSQL database storing attendance logs, encrypted vector embeddings, and pushing live WebSocket state updates.',
    tint: 'bg-teal-50 text-teal-600 ring-teal-200',
  },
  {
    icon: Terminal,
    title: 'React web dashboard',
    text: 'Responsive web portal with real-time video feeds, audio announcements, and attendance dashboards.',
    tint: 'bg-rose-50 text-rose-600 ring-rose-200',
  },
]

export default function Credits() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin' || user?.role === 'administrator'
  const dashboardPath = isAdmin ? '/admin' : '/'

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      {/* ── Top navigation ─────────────────────────────────────────── */}
      <header className="border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3.5">
            <Link
              to="/"
              className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-transform hover:scale-105"
            >
              <img
                src="/logo-mark.jpg"
                alt="SmartCamera logo"
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight sm:text-lg">
                  Smart<span className="text-emerald-600">Camera</span>
                </span>
              </div>
              <p className="text-[10px] tracking-wide text-slate-500">
                Bestlink College of the Philippines
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <Link
              to={user ? dashboardPath : '/landing'}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              <ArrowLeft size={14} />
              <span className="sm:hidden">{user ? 'Dashboard' : 'Home'}</span>
              <span className="hidden sm:inline">{user ? 'Back to dashboard' : 'Back to home'}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
        {/* ── Institutional banner ─────────────────────────────────── */}
        <section className="relative mb-12 overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:p-10">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1 text-xs text-emerald-700 ring-1 ring-emerald-200">
              <GraduationCap size={15} />
              <span className="font-medium">Academic research &amp; development</span>
            </div>

            <div className="mb-6 flex flex-col items-center gap-3">
              <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-8 py-4 shadow-sm">
                <img
                  src="/company-logo.png"
                  alt="C7 company logo"
                  className="h-12 w-auto max-w-[160px] object-contain sm:h-16 sm:max-w-[200px]"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">
                Developed by C7
              </p>
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Bestlink College of the Philippines
            </h1>
            <p className="mt-2 text-xs uppercase tracking-widest text-emerald-600 sm:text-sm">
              College of Computer Studies · Information Technology
            </p>

            <div className="mt-4 max-w-3xl text-xs leading-relaxed text-slate-600 sm:text-sm">
              <p>
                The{' '}
                <span className="font-bold text-slate-900">
                  SmartCamera: Camera with AI-Powered and Automated Attendance System
                </span>{' '}
                was researched, architected, and engineered by students and faculty at{' '}
                <span className="font-semibold text-emerald-700">
                  Bestlink College of the Philippines
                </span>
                . The system integrates real-time computer vision, FaceNet deep biometric
                vectors, YOLOv8 threat heuristics, and automated uniform compliance.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 text-[10px]">
              <span className="rounded-lg bg-slate-100 px-3 py-1 font-medium text-slate-600">
                Campus: Novaliches, Quezon City
              </span>
              <span className="rounded-lg bg-emerald-50 px-3 py-1 font-medium text-emerald-700 ring-1 ring-emerald-200">
                Academic year: 2025–2026
              </span>
              <span className="rounded-lg bg-violet-50 px-3 py-1 font-medium text-violet-700 ring-1 ring-violet-200">
                Technopreneurship project · Version 2.6
              </span>
            </div>
          </div>
        </section>

        {/* ── Project adviser ──────────────────────────────────────── */}
        <section className="mb-14">
          <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Award size={18} className="text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Project adviser &amp; mentor</h2>
            </div>
            <span className="text-[10px] text-slate-400">Faculty guidance</span>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:p-8">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
              <div className="h-36 w-36 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:h-40 sm:w-40">
                <MemberPhoto slugs={ADVISER.slugs} initials={ADVISER.initials} name={ADVISER.name} />
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                  <Sparkles size={11} />
                  <span>Project adviser</span>
                </div>
                <h3 className="text-2xl font-extrabold sm:text-3xl">{ADVISER.name}</h3>
                <p className="mt-1 text-xs font-medium text-emerald-700">
                  {ADVISER.title} · {ADVISER.department}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">{ADVISER.institution}</p>
                <p className="mt-3 max-w-2xl text-xs leading-relaxed text-slate-600">
                  {ADVISER.message}
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600">
                    Adviser code: ADVISER-BCP
                  </span>
                  <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600">
                    Technopreneurship advisory council
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Development team ─────────────────────────────────────── */}
        <section className="mb-14">
          <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Code2 size={18} className="text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Development &amp; research team</h2>
            </div>
            <span className="text-[10px] text-slate-400">{TEAM_MEMBERS.length} team members</span>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {TEAM_MEMBERS.map((member, index) => (
              <div
                key={member.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300"
              >
                <div className="mb-3.5 flex items-center justify-between text-[10px]">
                  <span className="font-bold text-slate-400">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-bold text-emerald-700 ring-1 ring-emerald-200">
                    {member.badge}
                  </span>
                </div>

                <div className="mx-auto mb-4 h-44 w-full overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <MemberPhoto
                    slugs={member.slugs}
                    initials={member.initials}
                    name={member.name}
                  />
                </div>

                <div className="flex-1">
                  <h3 className="text-base font-bold tracking-wide">{member.name}</h3>
                  <p className="mt-1 text-xs font-semibold text-emerald-700">{member.role}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{member.subRole}</p>
                  <div className="mt-3 rounded-lg bg-slate-50 p-2 text-[10px] text-slate-600 ring-1 ring-slate-200">
                    <span className="font-bold text-emerald-700">Specialty: </span>
                    {member.specialty}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[10px]">
                  <span className="flex items-center gap-1 font-medium text-emerald-600">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    Verified
                  </span>
                  <span className="text-slate-400">BCP student</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── System architecture & stack ──────────────────────────── */}
        <section className="mb-14 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">
                System architecture &amp; technologies
              </h2>
            </div>
            <span className="text-[10px] text-slate-400">Technology stack</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stack.map(({ icon: Icon, title, text, tint }) => (
              <div key={title} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className={`inline-flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-bold ring-1 ${tint}`}>
                  <Icon size={15} />
                  <span>{title}</span>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white px-4 py-6 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400 sm:justify-start">
            <span className="font-medium text-slate-500">SmartCamera</span>
            <span>|</span>
            <span>Bestlink College of the Philippines</span>
            <span>|</span>
            <span>Research team &copy; {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            {user ? (
              <Link to={dashboardPath} className="font-medium text-slate-500 hover:text-slate-700">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/landing" className="font-medium text-slate-500 hover:text-slate-700">
                  Home
                </Link>
                <span className="text-slate-300">|</span>
                <Link to="/login" className="font-medium text-emerald-600 hover:text-emerald-700">
                  Sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}
