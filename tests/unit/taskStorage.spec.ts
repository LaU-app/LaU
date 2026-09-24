import { beforeEach, describe, expect, it, vi } from 'vitest'
const storage = new Map<string, unknown>()
const api = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }
vi.mock('@/services/api', () => ({ api }))
vi.mock('localforage', () => ({ default: { createInstance: () => ({
  getItem: async (key: string) => storage.get(key),
  setItem: async (key: string, value: unknown) => storage.set(key, JSON.parse(JSON.stringify(value))),
  keys: async () => [...storage.keys()], removeItem: async (key: string) => storage.delete(key),
}) } }))
let tasks: typeof import('@/services/tasksService').default
function account(id: number) { localStorage.setItem('auth_token', 'test-only'); localStorage.setItem('user', JSON.stringify({ id })) }
beforeEach(async () => {
  vi.resetModules(); vi.resetAllMocks(); storage.clear(); localStorage.clear(); sessionStorage.clear(); account(1)
  tasks = (await import('@/services/tasksService')).default
})
describe('task compatibility and account isolation', () => {
  it('never shows cached personal study statistics to another account', async () => {
    api.get.mockResolvedValueOnce({ data: { success: true, data: { today_seconds: 1500 } } })
    await tasks.getTasksStats()
    account(2); api.get.mockRejectedValue(new Error('offline'))
    await expect(tasks.getTasksStats()).rejects.toThrow('offline')
    account(1); expect((await tasks.getTasksStats()).data.today_seconds).toBe(1500)
  })
  it('only retries queued tasks for their original account and UUID', async () => {
    api.post.mockRejectedValueOnce(new Error('offline'))
    const result = await tasks.createTask({ title: 'Parcial', estimated_pomodoros: 3 })
    expect(result.offline).toBe(true)
    api.post.mockClear(); api.post.mockResolvedValue({ data: { success: true } })
    account(2); expect((await tasks.flushSyncQueue()).synced).toBe(0)
    expect(api.post).not.toHaveBeenCalled()
    account(1); expect((await tasks.flushSyncQueue()).synced).toBe(1)
    expect(api.post.mock.calls[0][1].uuid_cliente).toBe(result.data.uuid_cliente)
  })
  it('does not turn authorization or validation errors into successful offline tasks', async () => {
    api.post.mockRejectedValue({ response: { status: 422 } })
    await expect(tasks.createTask({ title: '' })).rejects.toEqual({ response: { status: 422 } })
    expect((await tasks.flushSyncQueue()).failed).toBe(0)
  })
})
