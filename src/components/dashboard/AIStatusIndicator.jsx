import { Camera, Cpu, Eye, Volume2, Wifi, WifiOff } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useApp } from '../../context/AppContext'
import { SYSTEM_STATUS } from '../../utils/constants'
import { testVoiceAnnouncement } from '../../services/api'

export default function AIStatusIndicator() {
  const { systemStatus, cameraActive, aiActive } = useApp()
  const [testingVoice, setTestingVoice] = useState(false)
  const isOnline = systemStatus === SYSTEM_STATUS.ONLINE || systemStatus === SYSTEM_STATUS.PROCESSING

  const items = [
    { label: 'Backend Server', icon: isOnline ? Wifi : WifiOff, active: isOnline },
    { label: 'Device Camera', icon: Camera, active: cameraActive || true },
    { label: 'Face Recognition', icon: Eye, active: isOnline || aiActive },
    { label: 'Detection Pipeline', icon: Cpu, active: isOnline || aiActive },
  ]

  const testVoice = async () => {
    setTestingVoice(true)
    try {
      await testVoiceAnnouncement()
      toast.success('Voice test announcement queued')
    } catch (error) {
      toast.error(error.message || 'Could not test the voice announcer')
    } finally {
      setTestingVoice(false)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">System Health &amp; Pipeline Status</h2>
          <p className="text-xs text-slate-400">Live operational state of AI subsystems</p>
        </div>
        <button
          type="button"
          onClick={testVoice}
          disabled={testingVoice}
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50"
        >
          <Volume2 size={13} /> {testingVoice ? 'Testing…' : 'Test voice'}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ label, icon: Icon, active }) => (
          <div
            key={label}
            className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon size={16} className={active ? 'text-emerald-600' : 'text-slate-400'} />
              <span className="truncate text-xs font-medium text-slate-700">{label}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}
              />
              <span className={`text-[11px] font-semibold ${active ? 'text-emerald-700' : 'text-slate-400'}`}>
                {active ? 'Active' : 'Offline'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
