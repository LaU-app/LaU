import { computed, reactive, ref } from 'vue';
import localforage from 'localforage';
import { App } from '@capacitor/app';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { studyService } from '@/services/studyService';
import { closeInterval, DEFAULT_PREFERENCES, initialTimer, remainingAt, studiedSeconds } from './studyTimer';
import type { StudyPreferences, TimerState } from '@/types/study';
const storage = localforage.createInstance({ name: 'LaU', storeName: 'study_v2' });
const timer = reactive(initialTimer());
const preferences = reactive<StudyPreferences>({ ...DEFAULT_PREFERENCES });
const busy = ref(false), ready = ref(false), error = ref(''), notice = ref(''), revision = ref(0);
const now = ref(Date.now());
const accountId = ref<number | null>(null);
let owner: number | null = null;
let chain: Promise<unknown> = Promise.resolve();
let interval: ReturnType<typeof setInterval> | null = null;
let appListener: PluginListenerHandle | null = null;
let foreground = true, lastTick = Date.now(), retryAt = 0;
const NOTIFICATION_ID = 83010;
const BREAK_NOTIFICATION_ID = 83011;
function userId(): number | null {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    if (!token)
        return null;
    try {
        return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null')?.id ?? null;
    }
    catch {
        return null;
    }
}
function message(e: unknown): string {
    const failure = e as {
        response?: {
            status?: number;
            data?: {
                message?: string;
            };
        };
        message?: string;
    };
    return failure.response?.data?.message || (e instanceof Error && !('isAxiosError' in e) ? e.message : '') || 'No pudimos conectar. Tu sesión se conserva en este dispositivo. Reintenta cuando tengas conexión.';
}
function serial<T>(action: () => Promise<T>): Promise<T | undefined> {
    const work = chain.then(async () => {
        busy.value = true;
        try {
            return await action();
        }
        catch (e) {
            error.value = message(e);
            return undefined;
        }
        finally {
            busy.value = false;
        }
    });
    chain = work;
    return work;
}
async function persist() {
    if (!owner || userId() !== owner)
        throw new Error('La cuenta cambió. Vuelve a abrir Estudio.');
    await storage.setItem(`user:${owner}`, JSON.parse(JSON.stringify({ timer, preferences })));
}
async function notifications() {
    if (!Capacitor.isNativePlatform())
        return;
    try {
        await LocalNotifications.cancel({ notifications: [{ id: NOTIFICATION_ID }, { id: BREAK_NOTIFICATION_ID }] });
        if (timer.status !== 'running' || !timer.deadline || timer.deadline <= Date.now())
            return;
        if ((await LocalNotifications.checkPermissions()).display !== 'granted')
            return;
        const planned = [{ id: timer.phase === 'focus' ? NOTIFICATION_ID : BREAK_NOTIFICATION_ID,
                title: timer.phase === 'focus' ? '¡Bloque de enfoque terminado!' : 'Tu descanso terminó',
                body: timer.phase === 'focus' ? 'Buen trabajo. Tómate un descanso.' : 'Vuelve a LaU para continuar estudiando.',
                schedule: { at: new Date(timer.deadline), allowWhileIdle: true } }];
        if (timer.phase === 'focus') {
            const long = (timer.completed + 1) % preferences.cycles_before_long_break === 0;
            const seconds = (long ? preferences.long_break_minutes : preferences.short_break_minutes) * 60;
            planned.push({ id: BREAK_NOTIFICATION_ID, title: 'Tu descanso terminó', body: 'Vuelve a LaU para continuar estudiando.', schedule: { at: new Date(timer.deadline + seconds * 1000), allowWhileIdle: true } });
        }
        await LocalNotifications.schedule({ notifications: planned });
    }
    catch {
        notice.value = 'El temporizador sigue funcionando. No se pudo programar el aviso en este dispositivo.';
    }
}
async function syncPending() {
    if (!timer.pending || !owner || owner !== userId())
        return;
    const account = owner;
    const session = await studyService.finish(timer.pending);
    if (account !== userId())
        return;
    timer.pending = null;
    error.value = '';
    notice.value = session.status === 'cancelled' ? 'Bloque cancelado. Tus bloques anteriores se conservan.' : 'Tu tiempo de enfoque quedó guardado.';
    if (session.task?.status === 'completed') {
        timer.continueAfterBreak = false;
        timer.taskId = null;
        timer.activity = '';
        notice.value = '¡Completaste los pomodoros de tu tarea! Disfruta tu descanso y elige después tu siguiente meta.';
    }
    await persist();
    revision.value++;
}
async function syncActiveSession() {
    const active = await studyService.active();
    if (owner !== userId()) return;
    if (active) {
        if (timer.session?.uuid_cliente === active.uuid_cliente) return;
        Object.assign(timer, {
            session: active, status: 'recovery', phase: 'focus', taskId: active.task_id,
            activity: active.activity || active.task?.title || '', startUuid: null,
            deadline: null, segmentStart: null, intervals: [], pending: null,
            duration: active.target_seconds, remaining: active.target_seconds,
        });
        notice.value = '';
    } else if (timer.session || timer.status === 'recovery' || timer.startUuid) {
        Object.assign(timer, initialTimer());
        timer.duration = timer.remaining = preferences.focus_minutes * 60;
        notice.value = 'No hay una sesión activa en el servidor. Puedes comenzar un nuevo enfoque.';
    }
    await persist();
}
async function ensureAccount() {
    const id = userId();
    if (id === owner && ready.value)
        return;
    owner = id;
    accountId.value = id;
    revision.value++;
    ready.value = false;
    Object.assign(timer, initialTimer());
    Object.assign(preferences, DEFAULT_PREFERENCES);
    error.value = '';
    notice.value = '';
    await notifications();
    if (!id)
        return;
    const saved = await storage.getItem<{
        timer: TimerState;
        preferences: StudyPreferences;
    }>(`user:${id}`);
    if (id !== userId())
        return;
    if (saved) {
        Object.assign(timer, saved.timer);
        Object.assign(preferences, saved.preferences);
    }
    ready.value = true;
    let failure: unknown = null;
    try {
        const p = await studyService.preferences();
        if (id !== userId()) return;
        Object.assign(preferences, p);
    } catch (e) { failure = e; }
    try { await syncPending(); } catch (e) { failure ??= e; }
    if (!timer.pending) {
        try { await syncActiveSession(); } catch (e) { failure ??= e; }
    }
    error.value = failure ? message(failure) : '';
    if (timer.status === 'idle' && timer.phase === 'focus')
        timer.duration = timer.remaining = preferences.focus_minutes * 60;
    await persist();
    await reconcile(false);
    await notifications();
}
async function startFocus() {
    if (!owner || !ready.value)
        return;
    await syncPending();
    if (timer.pending)
        return;
    timer.startUuid ||= crypto.randomUUID();
    await persist(); // Retry a lost start response with exactly the same UUID.
    const account = owner;
    let session;
    try {
        session = await studyService.start(timer.startUuid, timer.taskId, timer.activity);
    }
    catch (failure) {
        const status = (failure as { response?: { status?: number } }).response?.status;
        if (status && [400, 401, 403, 404, 422].includes(status)) {
            // A definitive rejection did not start a block. Allow selecting another task.
            timer.startUuid = null;
            await persist();
        }
        else if (status === 409) {
            const active = await studyService.active();
            if (active && account === userId()) {
                timer.session = active;
                timer.startUuid = null;
                timer.status = 'recovery';
                timer.taskId = active.task_id;
                timer.activity = active.activity || active.task?.title || '';
                notice.value = '';
                await persist();
            }
        }
        throw failure;
    }
    if (account !== userId())
        return;
    if (session.status !== 'running') {
        timer.startUuid = null;
        await persist();
        throw new Error('Esta sesión ya terminó. Vuelve a iniciar.');
    }
    const localStart = Date.now();
    Object.assign(timer, { continueAfterBreak: true, phase: 'focus', status: 'running', session, duration: session.target_seconds,
        remaining: session.target_seconds, intervals: [], serverOffset: Date.parse(session.started_at) - localStart,
        deadline: localStart + session.target_seconds * 1000, segmentStart: Date.parse(session.started_at) / 1000, startUuid: null });
    error.value = '';
    notice.value = '';
    await persist();
    await notifications();
}
async function finishFocus(cancelled = false, natural = false) {
    if (!timer.session)
        return;
    if (timer.status === 'running')
        closeInterval(timer, Date.now());
    const full = !cancelled && studiedSeconds(timer) === timer.duration;
    const end = timer.deadline ?? Date.now();
    timer.pending = { session_uuid: timer.session.uuid_cliente, status: cancelled ? 'cancelled' : 'finished', intervals: cancelled ? [] : [...timer.intervals] };
    if (full)
        timer.completed++;
    timer.session = null;
    timer.intervals = [];
    timer.segmentStart = null;
    timer.startUuid = null;
    if (natural && full) {
        const long = timer.completed % preferences.cycles_before_long_break === 0;
        timer.phase = long ? 'long_break' : 'short_break';
        timer.duration = timer.remaining = (long ? preferences.long_break_minutes : preferences.short_break_minutes) * 60;
        timer.deadline = end + timer.duration * 1000;
        timer.status = 'running';
    }
    else {
        timer.phase = 'focus';
        timer.status = 'idle';
        timer.deadline = null;
        timer.duration = timer.remaining = preferences.focus_minutes * 60;
    }
    await persist(); // Finalization and next phase are one durable snapshot before networking.
    await notifications();
    if (Capacitor.isNativePlatform() && foreground)
        Haptics.notification({ type: NotificationType.Success }).catch(() => { });
    await syncPending();
}
async function reconcile(autoStart: boolean) {
    if (!ready.value || owner !== userId())
        return;
    now.value = Date.now();
    if (timer.status !== 'running' || remainingAt(timer, now.value) > 0)
        return;
    if (timer.phase === 'focus') {
        await finishFocus(false, true);
        // Never manufacture subsequent focus cycles after suspension.
        if (timer.deadline && timer.deadline <= Date.now())
            await reconcile(false);
    }
    else {
        timer.phase = 'focus';
        timer.status = 'idle';
        timer.deadline = null;
        timer.duration = timer.remaining = preferences.focus_minutes * 60;
        notice.value = 'Descanso terminado. ¿Seguimos con otro bloque?';
        await persist();
        await notifications();
        if (autoStart && foreground && timer.continueAfterBreak)
            await startFocus();
    }
}
export const study = {
    timer, preferences, busy, ready, error, notice, revision, accountId,
    remaining: computed(() => remainingAt(timer, now.value)),
    focusActive: computed(() => timer.status === 'running' || timer.status === 'paused' || timer.status === 'recovery'),
    initialize: () => serial(ensureAccount),
    selectTask: (taskId: number | null, activity = '') => serial(async () => {
        await ensureAccount();
        if (timer.status !== 'idle' || timer.phase !== 'focus' || timer.startUuid) {
            if (timer.taskId !== taskId)
                notice.value = 'Tu sesión sigue en curso. Finalízala antes de elegir otra tarea.';
            return;
        }
        if (timer.taskId !== taskId || timer.activity !== activity)
            timer.completed = 0;
        timer.taskId = taskId;
        timer.activity = activity;
        await persist();
    }),
    start: () => serial(async () => { await ensureAccount(); if (timer.status === 'idle')
        await startFocus(); }),
    pause: () => serial(async () => {
        await reconcile(false);
        if (timer.status !== 'running')
            return;
        const at = Date.now();
        closeInterval(timer, at);
        timer.remaining = timer.phase === 'focus' ? timer.duration - studiedSeconds(timer) : remainingAt(timer, at);
        timer.status = 'paused';
        timer.deadline = null;
        await persist();
        await notifications();
    }),
    resume: () => serial(async () => {
        if (timer.status !== 'paused')
            return;
        const at = Date.now();
        // Align resumed intervals to whole server seconds; pauses are never counted.
        const serverSecond = Math.ceil((at + timer.serverOffset) / 1000);
        timer.segmentStart = timer.phase === 'focus' ? serverSecond : null;
        timer.deadline = (timer.phase === 'focus' ? serverSecond * 1000 - timer.serverOffset : at) + timer.remaining * 1000;
        timer.status = 'running';
        await persist();
        await notifications();
    }),
    recover: () => serial(async () => {
        await ensureAccount();
        if (timer.status !== 'recovery') return;
        const account = owner;
        const { session, serverNow } = await studyService.activeSnapshot();
        if (account !== userId()) return;
        if (!session) {
            Object.assign(timer, initialTimer());
            timer.duration = timer.remaining = preferences.focus_minutes * 60;
            notice.value = 'Tu sesión ya terminó. Puedes comenzar un nuevo enfoque.';
            await persist();
            return;
        }
        // Only count intervals observed after this explicit continuation.
        // Historical wall time cannot tell us whether the student was paused.
        const offset = Date.parse(serverNow) - Date.now();
        if (!Number.isFinite(offset)) throw new Error('No pudimos continuar. Inténtalo de nuevo.');
        const start = Math.ceil(Date.parse(serverNow) / 1000);
        Object.assign(timer, { session, taskId: session.task_id, activity: session.activity || session.task?.title || '',
            phase: 'focus', status: 'running', duration: session.target_seconds, remaining: session.target_seconds,
            intervals: [], segmentStart: start, serverOffset: offset,
            deadline: start * 1000 - offset + session.target_seconds * 1000, continueAfterBreak: true });
        error.value = ''; notice.value = '';
        await persist();
        await notifications();
    }),
    finish: (cancelled = false) => serial(async () => {
        if (timer.session)
            await finishFocus(cancelled);
        else if (!timer.startUuid) {
            timer.phase = 'focus';
            timer.status = 'idle';
            timer.deadline = null;
            timer.duration = timer.remaining = preferences.focus_minutes * 60;
            await persist();
            await notifications();
            await syncPending();
        }
    }),
    retry: () => serial(async () => {
        let failure: unknown = null;
        try { await syncPending(); } catch (e) { failure = e; }
        try { Object.assign(preferences, await studyService.preferences()); } catch (e) { failure ??= e; }
        if (!timer.pending) {
            try { await syncActiveSession(); } catch (e) { failure ??= e; }
        }
        if (timer.startUuid && !failure) await startFocus();
        await reconcile(false);
        if (failure) throw failure;
        error.value = '';
    }),
    refreshRemote: (areas: string[] = []) => serial(async () => {
        await ensureAccount();
        let failure: unknown = null;
        if (areas.includes('preferences')) {
            try {
                Object.assign(preferences, await studyService.preferences());
                if (timer.status === 'idle' && timer.phase === 'focus')
                    timer.duration = timer.remaining = preferences.focus_minutes * 60;
            } catch (e) { failure = e; }
        }
        if (areas.includes('timer') && !timer.pending) {
            try { await syncActiveSession(); } catch (e) { failure ??= e; }
        }
        revision.value++;
        if (failure) throw failure;
        error.value = '';
    }),
    savePreferences: (data: Partial<StudyPreferences>) => serial(async () => {
        const p = await studyService.savePreferences(data);
        Object.assign(preferences, p);
        if (timer.status === 'idle' && timer.phase === 'focus')
            timer.duration = timer.remaining = p.focus_minutes * 60;
        await persist();
        await notifications();
        error.value = '';
        revision.value++;
        return true;
    }),
    enableNotifications: () => serial(async () => {
        if (!Capacitor.isNativePlatform()) {
            notice.value = 'Los avisos locales están disponibles en la app Android.';
            return;
        }
        const result = await LocalNotifications.requestPermissions();
        notice.value = result.display === 'granted' ? 'Avisos de fin de fase activados.' : 'Puedes habilitar los avisos desde los ajustes del teléfono.';
        await notifications();
    }),
};
const onVisibility = () => {
    foreground = document.visibilityState === 'visible';
    if (foreground)
        serial(async () => { await ensureAccount(); await reconcile(false); await syncPending(); });
};
const onOnline = () => { void study.retry(); };
const onAccount = () => { void study.initialize(); };
export async function startStudyRuntime() {
    if (interval)
        return;
    interval = setInterval(() => {
        const auto = Date.now() - lastTick < 5000;
        lastTick = Date.now();
        now.value = lastTick;
        if (busy.value)
            return;
        if (owner !== userId() || !ready.value && userId()) {
            void study.initialize();
            return;
        }
        if (timer.status === 'running' && remainingAt(timer, now.value) === 0) {
            serial(() => reconcile(auto));
            return;
        }
        if (timer.pending && Date.now() > retryAt) {
            retryAt = Date.now() + 30000;
            serial(syncPending);
        }
    }, 500);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('online', onOnline);
    window.addEventListener('study-account-changed', onAccount);
    if (Capacitor.isNativePlatform())
        appListener = await App.addListener('appStateChange', ({ isActive }) => {
            foreground = isActive;
            if (isActive)
                serial(async () => { await ensureAccount(); await reconcile(false); await syncPending(); });
        });
    await study.initialize();
}
export async function stopStudyRuntime() {
    if (interval)
        clearInterval(interval);
    interval = null;
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('online', onOnline);
    window.removeEventListener('study-account-changed', onAccount);
    await appListener?.remove();
    appListener = null;
}
