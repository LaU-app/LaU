import { api } from './api';
import type { FinishPayload, StudyPage, StudyPreferences, StudyRanking, StudySession, StudySummary } from '@/types/study';
export const studyService = {
    async preferences(): Promise<StudyPreferences> { return (await api.get('/pomodoro/preferences')).data.data; },
    async savePreferences(data: Partial<StudyPreferences>): Promise<StudyPreferences> { return (await api.put('/pomodoro/preferences', data)).data.data; },
    async start(uuid: string, task_id: number | null, activity: string): Promise<StudySession> {
        return (await api.post('/pomodoro/start', { uuid_cliente: uuid, task_id, activity: activity || null })).data.data;
    },
    async finish(payload: FinishPayload): Promise<StudySession> { return (await api.post('/pomodoro/complete', payload)).data.data; },
    async active(): Promise<StudySession | null> { return (await api.get('/pomodoro/active')).data.data; },
    async activeSnapshot(): Promise<{ session: StudySession | null; serverNow: string }> {
        const response = (await api.get('/pomodoro/active')).data;
        return { session: response.data, serverNow: response.server_now };
    },
    async summary(): Promise<StudySummary> { return (await api.get('/pomodoro/stats')).data.data; },
    async history(page = 1): Promise<StudyPage> { return (await api.get('/pomodoro/sessions', { params: { page } })).data.data; },
    async ranking(period = 'week', scope = 'global'): Promise<StudyRanking> {
        return (await api.get('/pomodoro/leaderboard', { params: { period, scope } })).data.data;
    },
};
