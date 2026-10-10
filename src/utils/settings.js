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

/**
 * Returns preferred device camera ID, if set
 */
export function storedCameraDeviceIdOf(settings) {
  return settings?.cameraDeviceId || ''
}

/**
 * Returns whether device camera preview should be horizontally mirrored
 */
export function storedCameraFlipOf(settings) {
  return Boolean(settings?.cameraFlipHorizontal ?? true)
}
