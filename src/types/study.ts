export interface StudyPreferences {
    focus_minutes: number;
    short_break_minutes: number;
    long_break_minutes: number;
    cycles_before_long_break: number;
    ranking_public: boolean;
}
export interface FocusInterval {
    start: number;
    end: number;
}
export interface StudySession {
    id: number;
    uuid_cliente: string;
    task_id: number | null;
    activity: string | null;
    status: 'running' | 'completed' | 'finished' | 'cancelled';
    started_at: string;
    ended_at: string | null;
    target_seconds: number;
    duration_seconds: number;
    task?: {
        id: number;
        title: string;
        status?: string;
    } | null;
}
export interface StudySummary {
    timezone: string;
    today_seconds: number;
    week_seconds: number;
    month_seconds: number;
    sessions_completed: number;
    pomodoros_completed: number;
    current_streak: number;
    best_streak: number;
    daily_average_seconds: number;
    streak_minimum_seconds: number;
    weekly: {
        date: string;
        seconds: number;
    }[];
}
export interface StudyRanking {
    entries: {
        id: number;
        username: string;
        avatar: string | null;
        seconds: number;
        position: number;
    }[];
    me: {
        position: number;
        seconds: number;
    } | null;
    ranking_public: boolean;
    available_scopes: string[];
    timezone: string;
}
export interface StudyPage {
    data: StudySession[];
    current_page: number;
    last_page: number;
}
export interface FinishPayload {
    session_uuid: string;
    status: 'finished' | 'cancelled';
    intervals: FocusInterval[];
}
export interface TimerState {
    continueAfterBreak: boolean;
    phase: 'focus' | 'short_break' | 'long_break';
    status: 'idle' | 'running' | 'paused' | 'recovery';
    duration: number;
    remaining: number;
    deadline: number | null;
    segmentStart: number | null;
    intervals: FocusInterval[];
    serverOffset: number;
    session: StudySession | null;
    taskId: number | null;
    activity: string;
    completed: number;
    startUuid: string | null;
    pending: FinishPayload | null;
}
