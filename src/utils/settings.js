export const SETTINGS_STORAGE_KEY = 'smartcctv.settings'

export function readStoredSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

export function saveStoredSettings(nextSettings) {
  try {
    const current = readStoredSettings()
    const merged = { ...current, ...nextSettings }
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged))
    return merged
  } catch {
    return nextSettings
  }
}

export const CAMERA_SOURCES = ['virtual', 'webcam', 'obs', 'rtsp']

/**
 * Which camera the live feed shows:
 * - 'virtual': Local backend stream (AI analyzed MJPEG)
 * - 'webcam': Direct browser webcam (WebRTC/MediaDevices)
 * - 'obs': OBS Studio via bridge
 * - 'rtsp': Wired camera (RTSP stream)
 */
export function liveFeedCameraOf(settings) {
  const value = settings?.liveFeedCamera
  return CAMERA_SOURCES.includes(value) ? value : 'virtual'
}

export function enrollmentCameraOf(settings) {
  const value = settings?.enrollmentCamera
  return CAMERA_SOURCES.includes(value) ? value : 'webcam'
}

export function cameraSourceLabel(source) {
  return {
    virtual: 'AI Backend Stream',
    webcam: 'Browser Webcam',
    obs: 'OBS Studio',
    rtsp: 'Wired Camera (RTSP)',
  }[source] ?? 'Camera'
}
