import type { TimerState } from '@/types/study';
export const DEFAULT_PREFERENCES = { focus_minutes: 25, short_break_minutes: 5, long_break_minutes: 15, cycles_before_long_break: 4, ranking_public: false };
export function initialTimer(): TimerState {
    return { continueAfterBreak: true, phase: 'focus', status: 'idle', duration: 1500, remaining: 1500, deadline: null,
        segmentStart: null, intervals: [], serverOffset: 0, session: null, taskId: null, activity: '',
        completed: 0, startUuid: null, pending: null };
}
export function remainingAt(state: TimerState, now: number): number {
    return state.status === 'running' && state.deadline !== null
        ? Math.max(0, Math.min(state.remaining, Math.ceil((state.deadline - now) / 1000))) : state.remaining;
}
/** Close only the current focus interval; cap it at the absolute phase deadline. */
export function closeInterval(state: TimerState, now: number): void {
    if (state.phase !== 'focus' || state.segmentStart === null || state.deadline === null)
        return;
    const end = Math.floor((Math.min(now, state.deadline) + state.serverOffset) / 1000);
    if (end > state.segmentStart)
        state.intervals.push({ start: state.segmentStart, end });
    state.segmentStart = null;
}
export function studiedSeconds(state: TimerState): number {
    return state.intervals.reduce((sum, i) => sum + i.end - i.start, 0);
}
export function formatStudyTime(seconds: number): string {
    if (seconds > 0 && seconds < 60)
        return `${seconds} s`;
    const minutes = Math.floor(seconds / 60);
    return minutes >= 60 ? `${Math.floor(minutes / 60)} h ${minutes % 60} min` : `${minutes} min`;
}
