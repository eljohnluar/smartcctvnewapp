/**
 * WebSocket client for real-time backend events (system status, AI camera feed, attendance).
 */

function resolveWsUrl() {
  const configured = import.meta.env.VITE_WEBSOCKET_URL
  if (configured) {
    return configured.replace(/^http/, 'ws').replace(/\/+$/, '')
  }
  const apiBase = import.meta.env.VITE_API_BASE_URL
  if (apiBase && apiBase.startsWith('http')) {
    const host = apiBase.replace(/^http/, 'ws').replace(/\/api\/?$/, '').replace(/\/+$/, '')
    return `${host}/ws`
  }
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}/ws`
  }
  return 'ws://localhost:8000/ws'
}

const WS_URL = resolveWsUrl()

const sameScope = (a, b) =>
  a === b ||
  (Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((value, index) => value === b[index]))

class WSClient {
  constructor() {
    this.ws = null
    this.listeners = new Map()
    this.reconnectDelay = 3000
    this.reconnectTimer = null
    this.shouldReconnect = false
    this.token = null
    // Sections this client may see; null means every section.
    this.sectionScope = null
  }

  /**
   * Bind the socket to the signed-in account. The token lets the backend filter
   * events per connection; sectionScope drops anything that still arrives here.
   */
  authorize(token, sectionScope) {
    const scope = sectionScope === null || sectionScope === undefined ? null : [...sectionScope]
    const unchanged = token === this.token && sameScope(scope, this.sectionScope)
    this.token = token
    this.sectionScope = scope
    if (unchanged && this.ws) return
    this.disconnect()
    this.connect()
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return

    this.shouldReconnect = true

    const url = this.token
      ? `${WS_URL}${WS_URL.includes('?') ? '&' : '?'}token=${encodeURIComponent(this.token)}`
      : WS_URL

    try {
      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        this._emit('open', null)
        clearTimeout(this.reconnectTimer)
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (!this._isVisible(data)) return
          this._emit(data.type || 'message', data)
          this._emit('*', data)
        } catch {
          this._emit('raw', event.data)
        }
      }

      this.ws.onerror = (err) => {
        this._emit('error', err)
      }

      this.ws.onclose = () => {
        this._emit('close', null)
        if (this.shouldReconnect) {
          this.reconnectTimer = setTimeout(() => this.connect(), this.reconnectDelay)
        }
      }
    } catch {
      // Gracefully handle offline socket
    }
  }

  disconnect() {
    this.shouldReconnect = false
    clearTimeout(this.reconnectTimer)
    if (this.ws) {
      this.ws.onopen = null
      this.ws.onmessage = null
      this.ws.onerror = null
      this.ws.onclose = null
      this.ws.close()
      this.ws = null
    }
  }

  _isVisible(data) {
    const tracked = data.type === 'attendance' || data.type === 'attendance_time_out'
    if (!tracked || this.sectionScope === null || !this.sectionScope.length) return true
    const sec = data.record?.section ?? data.section
    if (!sec) return true
    return this.sectionScope.some((s) => s === sec || s.includes(sec) || sec.includes(s))
  }

  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set())
    this.listeners.get(event).add(callback)
    return () => this.listeners.get(event)?.delete(callback)
  }

  _emit(event, data) {
    this.listeners.get(event)?.forEach((cb) => cb(data))
  }

  send(data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

export const wsClient = new WSClient()
export default wsClient
