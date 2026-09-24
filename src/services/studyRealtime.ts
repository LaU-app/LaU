type StudyUpdate = { areas?: string[]; updated_at?: string }
type Listener = (update: StudyUpdate) => void

const listeners = new Set<Listener>()
let channel: any = null
let channelName = ''

function currentUserId(): number | null {
  try {
    return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null')?.id ?? null
  } catch { return null }
}

function connect() {
  const id = currentUserId()
  const echo = (window as any).Echo
  if (!id || !echo) return
  const nextName = `study.${id}`
  if (channel && channelName === nextName) return
  if (channelName) echo.leave(channelName)
  channelName = nextName
  channel = echo.private(nextName)
  channel.listen('.study.updated', (update: StudyUpdate) => {
    listeners.forEach(listener => listener(update))
    window.dispatchEvent(new CustomEvent('study-data-updated', { detail: update }))
  })
}

export function subscribeStudyRealtime(listener: Listener) {
  listeners.add(listener)
  connect()
  return () => {
    listeners.delete(listener)
    if (!listeners.size && channelName) {
      ;(window as any).Echo?.leave(channelName)
      channel = null
      channelName = ''
    }
  }
}

window.addEventListener('study-account-changed', connect)
window.addEventListener('storage', event => {
  if (['auth_token', 'user'].includes(event.key || '')) connect()
})
