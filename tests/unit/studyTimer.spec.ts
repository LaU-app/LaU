import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { closeInterval, initialTimer, remainingAt, studiedSeconds } from '@/utils/studyTimer'

describe('absolute study clock', () => {
  it('caps a recovered focus at its deadline, even hours later', () => {
    const state = { ...initialTimer(), status: 'running' as const, deadline: 1500000, segmentStart: 0 }
    expect(remainingAt(state, 20000)).toBe(1480)
    closeInterval(state, 20000000)
    expect(studiedSeconds(state)).toBe(1500)
    expect(remainingAt(state, 20000000)).toBe(0)
  })
  it('never counts breaks or paused wall time', () => {
    const state = { ...initialTimer(), phase: 'short_break' as const, status: 'running' as const, deadline: 300000, segmentStart: 0 }
    closeInterval(state, 300000)
    expect(state.intervals).toEqual([])
    expect(remainingAt({ ...initialTimer(), status: 'paused', remaining: 123 }, 9900000)).toBe(123)
  })
})

const saved = new Map<string, unknown>()
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value))
const notifications = { cancel: vi.fn(async () => {}), schedule: vi.fn(async () => {}), checkPermissions: vi.fn(async () => ({ display: 'granted' })), requestPermissions: vi.fn(async () => ({ display: 'granted' })) }
vi.mock('localforage', () => ({ default: { createInstance: () => ({ getItem: async (key: string) => saved.has(key) ? copy(saved.get(key)) : null, setItem: async (key: string, data: unknown) => { saved.set(key, copy(data)) } }) } }))
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }))
vi.mock('@capacitor/app', () => ({ App: { addListener: vi.fn(async () => ({ remove: vi.fn() })) } }))
vi.mock('@capacitor/local-notifications', () => ({ LocalNotifications: notifications }))
vi.mock('@capacitor/haptics', () => ({ Haptics: { notification: vi.fn(async () => {}) }, NotificationType: { Success: 'SUCCESS' } }))

describe('persistent study runtime', () => {
  let runtime: typeof import('@/utils/useStudy')
  let api: any
  beforeEach(async () => {
    vi.resetModules(); vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-08T14:00:00Z'))
    saved.clear(); vi.clearAllMocks(); localStorage.clear(); sessionStorage.clear()
    localStorage.setItem('auth_token', 'test-only'); localStorage.setItem('user', JSON.stringify({ id: 1 }))
    api = {
      preferences: vi.fn(async () => ({ focus_minutes: 1, short_break_minutes: 1, long_break_minutes: 2, cycles_before_long_break: 3, ranking_public: false })),
      active: vi.fn(async () => null),
      activeSnapshot: vi.fn(async () => ({session:null,serverNow:new Date().toISOString()})),
      start: vi.fn(async (uuid: string, taskId: number | null, activity: string) => ({ id: 1, uuid_cliente: uuid, task_id: taskId, activity, status: 'running', started_at: new Date().toISOString(), ended_at: null, target_seconds: 60, duration_seconds: 0 })),
      finish: vi.fn(async (payload: any) => ({ status: payload.status === 'cancelled' ? 'cancelled' : payload.intervals.reduce((n: number, i: any) => n + i.end - i.start, 0) === 60 ? 'completed' : 'finished' })),
      savePreferences: vi.fn(async (data: any) => ({ ...(await api.preferences()), ...data })),
    }
    vi.doMock('@/services/studyService', () => ({ studyService: api }))
    runtime = await import('@/utils/useStudy')
    await runtime.startStudyRuntime()
  })
  afterEach(async () => { await runtime.stopStudyRuntime(); vi.useRealTimers() })

  it('serializes double taps and schedules one phase notification without asking permission', async () => {
    await Promise.all([runtime.study.start(), runtime.study.start()])
    expect(api.start).toHaveBeenCalledTimes(1)
    expect(notifications.requestPermissions).not.toHaveBeenCalled()
    expect(notifications.schedule).toHaveBeenCalledTimes(1)
  })
  it('retains the task over three focus/break cycles', async () => {
    await runtime.study.selectTask(42, 'Parcial')
    await runtime.study.start()
    await vi.advanceTimersByTimeAsync(300000)
    expect(api.finish).toHaveBeenCalledTimes(3)
    expect(api.start).toHaveBeenCalledTimes(3)
    expect(runtime.study.timer.taskId).toBe(42)
    expect(runtime.study.timer.completed).toBe(3)
    expect(runtime.study.timer.phase).toBe('long_break')
  })
  it('recovers after suspended JS without awarding missed cycles', async () => {
    await runtime.study.start()
    vi.setSystemTime(Date.now() + 4 * 3600000)
    await runtime.study.retry()
    expect(api.finish).toHaveBeenCalledTimes(1)
    expect(api.finish.mock.calls[0][0].intervals[0].end - api.finish.mock.calls[0][0].intervals[0].start).toBe(60)
    expect(api.start).toHaveBeenCalledTimes(1)
    expect(runtime.study.timer.status).toBe('idle')
    expect(runtime.study.timer.completed).toBe(1)
  })
  it('restores a running timer from disk after process recreation', async () => {
    await runtime.study.start()
    await runtime.stopStudyRuntime()
    vi.setSystemTime(Date.now() + 20000)
    vi.resetModules(); runtime = await import('@/utils/useStudy'); await runtime.startStudyRuntime()
    expect(runtime.study.remaining.value).toBe(40)
    expect(api.start).toHaveBeenCalledTimes(1)
  })
  it('excludes a long pause and cancels/replaces scheduled notifications', async () => {
    await runtime.study.start(); await vi.advanceTimersByTimeAsync(10000); await runtime.study.pause()
    const schedules = notifications.schedule.mock.calls.length
    await vi.advanceTimersByTimeAsync(3600000)
    expect(runtime.study.remaining.value).toBe(50)
    expect(notifications.schedule).toHaveBeenCalledTimes(schedules)
    await runtime.study.resume(); await vi.advanceTimersByTimeAsync(50000)
    const intervals = api.finish.mock.calls[0][0].intervals
    expect(intervals.reduce((n: number, i: any) => n + i.end - i.start, 0)).toBe(60)
    expect(intervals[1].start - intervals[0].end).toBe(3600)
  })
  it('persists a failed completion and retries the exact same UUID after restart', async () => {
    await runtime.study.start(); api.finish.mockRejectedValueOnce(new Error('offline'))
    vi.setSystemTime(Date.now() + 60000); await runtime.study.retry()
    const pending = copy(runtime.study.timer.pending)
    expect(pending).not.toBeNull()
    expect((saved.get('user:1') as any).timer.pending).toEqual(pending)
    await runtime.stopStudyRuntime(); vi.resetModules(); runtime = await import('@/utils/useStudy'); await runtime.startStudyRuntime()
    expect(api.finish.mock.calls[1][0]).toEqual(pending)
    expect(runtime.study.timer.pending).toBeNull()
  })
  it('never reports a validation failure as synchronized', async () => {
    await runtime.study.start(); api.finish.mockRejectedValue({ response: { status: 422, data: { message: 'Intervalos inválidos' } } })
    await vi.advanceTimersByTimeAsync(10000); await runtime.study.finish()
    expect(runtime.study.error.value).toBe('Intervalos inválidos')
    expect(runtime.study.timer.pending).not.toBeNull()
  })
  it('retries a lost start response with the original idempotency key', async () => {
    api.start.mockRejectedValueOnce(new Error('timeout'))
    await runtime.study.start(); const uuid = runtime.study.timer.startUuid
    await runtime.study.start()
    expect(api.start.mock.calls[0][0]).toBe(uuid); expect(api.start.mock.calls[1][0]).toBe(uuid)
  })
  it('keeps private state and pending completion isolated across accounts', async () => {
    await runtime.study.start(); api.finish.mockRejectedValue(new Error('offline'))
    await vi.advanceTimersByTimeAsync(10000); await runtime.study.finish()
    const calls = api.finish.mock.calls.length
    localStorage.setItem('user', JSON.stringify({ id: 2 })); await runtime.study.initialize()
    expect(runtime.study.timer.pending).toBeNull(); expect(runtime.study.timer.session).toBeNull()
    expect(api.finish).toHaveBeenCalledTimes(calls)
    expect((saved.get('user:1') as any).timer.pending).not.toBeNull()
  })
  it('saves partial study without awarding a full pomodoro', async () => {
    await runtime.study.start(); await vi.advanceTimersByTimeAsync(20000); await runtime.study.finish()
    expect(api.finish.mock.calls[0][0].intervals[0].end - api.finish.mock.calls[0][0].intervals[0].start).toBe(20)
    expect(runtime.study.timer.completed).toBe(0)
  })
  it('persists preferences and keeps an active phase unchanged', async () => {
    await runtime.study.start(); await runtime.study.savePreferences({ focus_minutes: 30, ranking_public: true })
    expect(runtime.study.timer.duration).toBe(60)
    expect(runtime.study.preferences.ranking_public).toBe(true)
    expect((saved.get('user:1') as any).preferences.focus_minutes).toBe(30)
  })
  it('reconstructs the phase through the native foreground callback', async () => {
    const { App } = await import('@capacitor/app')
    const callback = vi.mocked(App.addListener).mock.calls.find(call => call[0] === 'appStateChange')![1] as (state: { isActive: boolean }) => void
    await runtime.study.start()
    callback({ isActive: false })
    vi.setSystemTime(Date.now() + 600000)
    callback({ isActive: true })
    await runtime.study.initialize()
    expect(api.finish).toHaveBeenCalledTimes(1)
    expect(runtime.study.timer.status).toBe('idle')
    expect(api.start).toHaveBeenCalledTimes(1)
  })
  it('preserves cycle count when reopening the same task after a break', async () => {
    await runtime.study.selectTask(42, 'Parcial'); await runtime.study.start()
    vi.setSystemTime(Date.now() + 120000); await runtime.study.retry()
    await runtime.study.selectTask(42, 'Parcial')
    expect(runtime.study.timer.completed).toBe(1)
  })
  it('waits for a new goal when the server completes the linked task', async () => {
    await runtime.study.selectTask(42, 'Parcial')
    api.finish.mockResolvedValueOnce({ status: 'completed', task: { status: 'completed' } })
    await runtime.study.start(); await vi.advanceTimersByTimeAsync(120000)
    expect(runtime.study.timer.taskId).toBeNull()
    expect(runtime.study.timer.status).toBe('idle')
    expect(api.start).toHaveBeenCalledTimes(1)
  })
  it('allows changing activity after a definitive start validation rejection', async () => {
    await runtime.study.selectTask(42, 'Tarea cerrada')
    api.start.mockRejectedValueOnce({ response: { status: 422, data: { message: 'Esta tarea ya está cerrada.' } } })
    await runtime.study.start()
    expect(runtime.study.timer.startUuid).toBeNull()
    await runtime.study.selectTask(null, 'Estudio libre')
    await runtime.study.start()
    expect(runtime.study.timer.taskId).toBeNull()
    expect(runtime.study.timer.status).toBe('running')
  })
  it('offers recovery when another device opens a session', async () => {
    api.start.mockRejectedValueOnce({ response: { status: 409 } })
    api.active.mockResolvedValueOnce({ id: 2, uuid_cliente: 'remote', status: 'running' })
    await runtime.study.start()
    expect(runtime.study.timer.status).toBe('recovery')
    expect(runtime.study.timer.session?.uuid_cliente).toBe('remote')
  })
  it('continues a recovered session once, counting only newly observed study time', async () => {
    const session = {id:2, uuid_cliente:'remote',task_id:42,activity:'Matemáticas',target_seconds:60,status:'running',started_at:new Date(Date.now()-3600000).toISOString()}
    api.active.mockResolvedValueOnce(session)
    await runtime.study.refreshRemote(['timer'])
    api.activeSnapshot.mockResolvedValue({session,serverNow:new Date(Date.now()+120000).toISOString()})
    await Promise.all([runtime.study.recover(),runtime.study.recover()])
    expect(api.activeSnapshot).toHaveBeenCalledTimes(1)
    expect(api.start).not.toHaveBeenCalled()
    expect(runtime.study.timer.taskId).toBe(42)
    await vi.advanceTimersByTimeAsync(10000); await runtime.study.finish()
    const payload = api.finish.mock.calls[0][0]
    expect(payload.session_uuid).toBe('remote')
    expect(payload.intervals.reduce((n:number,i:any)=>n+i.end-i.start,0)).toBe(10)
    expect(runtime.study.timer.completed).toBe(0)
  })
  it('returns safely to ready when the recovered session already ended', async () => {
    api.active.mockResolvedValueOnce({id:2,uuid_cliente:'remote',status:'running'})
    await runtime.study.refreshRemote(['timer']); await runtime.study.recover()
    expect(runtime.study.timer.status).toBe('idle')
    expect(runtime.study.timer.session).toBeNull()
    expect(api.start).not.toHaveBeenCalled()
  })
})
