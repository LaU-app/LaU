import { api } from './api';
import localforage from 'localforage';

// V2 deliberately keeps old unowned caches intact without exposing them to another account.
const storage = localforage.createInstance({ name: 'LaU', storeName: 'tasks_v2' });
let pending = Promise.resolve();
function owner() {
  if (!(localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token'))) return null;
  try { return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null')?.id ?? null; } catch { return null; }
}
function requireOwner() { const id = owner(); if (!id) throw new Error('Inicia sesión para gestionar tus tareas.'); return id; }
const retryable = error => !error.response || error.response.status >= 500;
function serialize(work) { const result = pending.then(work); pending = result.catch(() => {}); return result; }
async function cachedRead(path, params, key) {
  const id = requireOwner();
  const cacheKey = `${id}:${key}:${JSON.stringify(params || {})}`;
  try {
    const response = (await api.get(path, { params })).data;
    if (owner() !== id) throw new Error('La cuenta cambió.');
    await storage.setItem(cacheKey, response);
    return response;
  } catch (error) {
    if (!retryable(error) || owner() !== id) throw error;
    const cached = await storage.getItem(cacheKey);
    if (cached) return { ...cached, offline: true };
    throw error;
  }
}
async function enqueue(id, action, payload) {
  const key = `${id}:queue`;
  const queue = (await storage.getItem(key)) || [];
  queue.push({ action, payload });
  await storage.setItem(key, queue);
}
export default {
  async getTasks({ status = null, priority = null, search = null, sortBy = 'created_at', sortOrder = 'desc', overdue = false, page = 1 } = {}) {
    const params = { sort_by: sortBy, sort_order: sortOrder, page };
    if (status) params.status = status;
    if (priority) params.priority = priority;
    if (search) params.search = search;
    if (overdue) params.overdue = true;
    return cachedRead('/tasks', params, 'list');
  },
  async getTaskById(taskId) { return cachedRead(`/tasks/${taskId}`, {}, `task:${taskId}`); },
  async getTasksStats() { return cachedRead('/tasks-stats', {}, 'stats'); },
  createTask(taskData) {
    return serialize(async () => {
      const id = requireOwner();
      const payload = { ...taskData, uuid_cliente: crypto.randomUUID() };
      try { return (await api.post('/tasks', payload)).data; }
      catch (error) {
        if (!retryable(error) || owner() !== id) throw error;
        await enqueue(id, 'create', payload);
        return { success: true, data: { ...payload, status: 'pending', completed_pomodoros: 0 }, offline: true, message: 'Tarea guardada en este dispositivo. Se sincronizará al recuperar conexión.' };
      }
    });
  },
  updateTask(taskId, taskData) {
    return serialize(async () => {
      const id = requireOwner();
      try { return (await api.put(`/tasks/${taskId}`, taskData)).data; }
      catch (error) {
        if (retryable(error) && owner() === id) await enqueue(id, 'update', { id: taskId, data: taskData });
        throw error;
      }
    });
  },
  async deleteTask(taskId) { requireOwner(); return (await api.delete(`/tasks/${taskId}`)).data; },
  completeTask(taskId) { return this.updateTask(taskId, { status: 'completed' }); },
  flushSyncQueue() {
    return serialize(async () => {
      const id = owner();
      if (!id) return { synced: 0, failed: 0 };
      const key = `${id}:queue`, queue = (await storage.getItem(key)) || [];
      let synced = 0;
      while (queue.length && owner() === id) {
        const item = queue[0];
        try {
          if (item.action === 'create') await api.post('/tasks', item.payload);
          else if (item.action === 'update') await api.put(`/tasks/${item.payload.id}`, item.payload.data);
          else break;
          queue.shift(); synced++;
          await storage.setItem(key, queue);
        } catch { break; }
      }
      return { synced, failed: queue.length };
    });
  },
  async clearCache() {
    const id = requireOwner();
    for (const key of await storage.keys()) if (key.startsWith(`${id}:`) && key !== `${id}:queue`) await storage.removeItem(key);
  },
};
