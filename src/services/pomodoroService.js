import { api } from './api';
// Compatibility reads for existing Tasks widgets. Study v2 owns active state and retries.
export default {
  async getActiveSession() { return (await api.get('/pomodoro/active')).data; },
  async getSessions(params = {}) { return (await api.get('/pomodoro/sessions', { params })).data; },
  async getPomodoroStats() { return (await api.get('/pomodoro/stats')).data; },
  async getWeeklyLeaderboard() { return (await api.get('/pomodoro/leaderboard', { params: { period: 'week' } })).data; },
};
