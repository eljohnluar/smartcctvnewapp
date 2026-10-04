import { lazy, Suspense, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/useAuth'
import Sidebar from './components/common/Sidebar'
import Header from './components/common/Header'
import LoadingSpinner from './components/common/LoadingSpinner'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'

const Reports = lazy(() => import('./pages/Reports'))

const pageTitles = {
  '/': 'Dashboard',
  '/students': 'Students',
  '/reports': 'Reports',
}

function AppLayout() {
  const { user } = useAuth()
  const location = useLocation()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  if (!user) {
    return <Navigate to="/login" replace />
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
            <Route path="/students" element={<Students />} />
            <Route path="/reports" element={
              <Suspense fallback={<LoadingSpinner label="Loading reports…" />}>
                <Reports />
              </Suspense>
            } />
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
        <Route path="/*" element={<AppLayout />} />
      </Routes>
    </AuthProvider>
  )
}
