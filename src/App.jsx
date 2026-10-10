import { lazy, Suspense, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { AppProvider } from './context/AppContext'
import { useAuth } from './context/useAuth'
import Sidebar from './components/common/Sidebar'
import Header from './components/common/Header'
import AdminSidebar from './components/common/AdminSidebar'
import AdminHeader from './components/common/AdminHeader'
import LoadingSpinner from './components/common/LoadingSpinner'
import Login from './pages/Login'
import Landing from './pages/Landing'
import Credits from './pages/Credits'
import Dashboard from './pages/Dashboard'
import Attendance from './pages/Attendance'
import Profile from './pages/Profile'
import Students from './pages/Students'
import LiveCamera from './pages/LiveCamera'
import Settings from './pages/Settings'
import AdminDashboard from './pages/admin/AdminDashboard'
import TeacherManagement from './pages/admin/TeacherManagement'
import AdminStudents from './pages/admin/AdminStudents'
import AdminAttendance from './pages/admin/AdminAttendance'
import AuditLog from './pages/admin/AuditLog'
import AdminSettings from './pages/admin/AdminSettings'

const Reports = lazy(() => import('./pages/Reports'))

const pageTitles = {
  '/': 'Dashboard',
  '/attendance': 'Attendance',
  '/profile': 'My Profile',
  '/students': 'Students',
  '/reports': 'Reports',
  '/live': 'Live Camera Feed',
  '/settings': 'Settings & Configuration',
}

const adminTitles = {
  '/admin': 'Administrator Dashboard',
  '/admin/teachers': 'Teacher Management',
  '/admin/students': 'Student Management',
  '/admin/attendance': 'Attendance Oversight',
  '/admin/audit': 'Audit Log',
  '/admin/settings': 'Administrator Settings',
  '/profile': 'My Profile',
  '/credits': 'System Credits & Research Team',
}

function AdminLayout() {
  const location = useLocation()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#080d15] text-[#f1f5f9]">
      <AdminSidebar
        mobileOpen={mobileNavOpen}
        onOpen={() => setMobileNavOpen(true)}
        onClose={() => setMobileNavOpen(false)}
      />
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        <AdminHeader title={adminTitles[location.pathname] ?? 'SmartCamera Administrator'} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7">
          <Routes>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/teachers" element={<TeacherManagement />} />
            <Route path="/admin/students" element={<AdminStudents />} />
            <Route path="/admin/attendance" element={<AdminAttendance />} />
            <Route path="/admin/audit" element={<AuditLog />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/credits" element={<Credits />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function AppLayout() {
  const { user } = useAuth()
  const location = useLocation()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  if (!user) {
    return <Landing />
  }

  if (user.role === 'admin' || user.role === 'administrator') {
    return <AdminLayout />
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar
        mobileOpen={mobileNavOpen}
        onOpen={() => setMobileNavOpen(true)}
        onClose={() => setMobileNavOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header title={pageTitles[location.pathname] ?? 'Teacher portal'} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/live" element={<LiveCamera />} />
            <Route path="/students" element={<Students />} />
            <Route
              path="/reports"
              element={
                <Suspense fallback={<LoadingSpinner label="Loading reports…" />}>
                  <Reports />
                </Suspense>
              }
            />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              color: '#0f172a',
              fontSize: '13px',
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
            },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/credits" element={<Credits />} />
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </AppProvider>
    </AuthProvider>
  )
}
