<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-button @click="dismissModal">
                        <ion-icon :icon="closeOutline"></ion-icon>
                    </ion-button>
                </ion-buttons>
                <ion-title>{{ isBreak ? 'Descanso' : 'Pomodoro' }}</ion-title>
            </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
            <div class="pomodoro-container">
                <!-- Task info -->
                <div v-if="taskTitle && !isBreak" class="task-header">
                    <ion-icon :icon="listOutline" class="task-icon"></ion-icon>
                    <h2>{{ taskTitle }}</h2>
                </div>

                <!-- Timer display -->
                <div class="timer-wrapper">
                    <div class="timer-circle" :class="{ running: isRunning, break: isBreak }">
                        <svg class="progress-ring" width="280" height="280">
                            <circle class="progress-ring-circle-bg" cx="140" cy="140" r="120" />
                            <circle class="progress-ring-circle" :class="{ break: isBreak }" cx="140" cy="140" r="120"
                                :style="{ strokeDashoffset: progressOffset }" />
                        </svg>

                        <div class="timer-display">
                            <div class="time">{{ formattedTime }}</div>
                            <div class="status">{{ statusText }}</div>
                        </div>
                    </div>
                </div>

                <!-- Session info -->
                <div class="session-info" v-if="!isBreak">
                    <div class="info-item">
                        <!-- Flame SVG: outline if 0 pomodoros, filled if >=1 -->
                        <span v-if="totalCompletedToday < 1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                fill="none" stroke="#3880ff" stroke-width="1.75" stroke-linecap="round"
                                stroke-linejoin="round">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path
                                    d="M12 10.941c2.333 -3.308 .167 -7.823 -1 -8.941c0 3.395 -2.235 5.299 -3.667 6.706c-1.43 1.408 -2.333 3.621 -2.333 5.588c0 3.704 3.134 6.706 7 6.706s7 -3.002 7 -6.706c0 -1.712 -1.232 -4.403 -2.333 -5.588c-2.084 3.353 -3.257 3.353 -4.667 2.235" />
                            </svg>
                        </span>
                        <span v-else>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                fill="#3880ff">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path
                                    d="M10 2c0 -.88 1.056 -1.331 1.692 -.722c1.958 1.876 3.096 5.995 1.75 9.12l-.08 .174l.012 .003c.625 .133 1.203 -.43 2.303 -2.173l.14 -.224a1 1 0 0 1 1.582 -.153c1.334 1.435 2.601 4.377 2.601 6.27c0 4.265 -3.591 7.705 -8 7.705s-8 -3.44 -8 -7.706c0 -2.252 1.022 -4.716 2.632 -6.301l.605 -.589c.241 -.236 .434 -.43 .618 -.624c1.43 -1.512 2.145 -2.924 2.145 -4.78" />
                            </svg>
                        </span>
                        <span>{{ totalCompletedToday }} hoy</span>
                    </div>
                    <div class="info-item">
                        <!-- Hourglass SVG: outline if 0 pomodoros, filled if >=1 -->
                        <span v-if="sessionCount < 1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                fill="none" stroke="#888" stroke-width="1.75" stroke-linecap="round"
                                stroke-linejoin="round">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path d="M6 20v-2a6 6 0 1 1 12 0v2a1 1 0 0 1 -1 1h-10a1 1 0 0 1 -1 -1z" />
                                <path d="M6 4v2a6 6 0 1 0 12 0v-2a1 1 0 0 0 -1 -1h-10a1 1 0 0 0 -1 1z" />
                            </svg>
                        </span>
                        <span v-else>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                fill="#888">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path
                                    d="M17 2a2 2 0 0 1 1.995 1.85l.005 .15v2a6.996 6.996 0 0 1 -3.393 6a6.994 6.994 0 0 1 3.388 5.728l.005 .272v2a2 2 0 0 1 -1.85 1.995l-.15 .005h-10a2 2 0 0 1 -1.995 -1.85l-.005 -.15v-2a6.996 6.996 0 0 1 3.393 -6a6.994 6.994 0 0 1 -3.388 -5.728l-.005 -.272v-2a2 2 0 0 1 1.85 -1.995l.15 -.005h10z" />
                            </svg>
                        </span>
                        <span>{{ sessionCount }} sesión</span>
                    </div>
                </div>

                <!-- Controls -->
                <div class="controls">
                    <ion-button v-if="!isRunning && !sessionStarted" expand="block" size="large" @click="start"
                        class="control-btn start-btn">
                        <ion-icon :icon="playOutline"></ion-icon>
                        Iniciar {{ isBreak ? 'Descanso' : 'Pomodoro' }}
                    </ion-button>

                    <div v-else class="control-buttons">
                        <ion-button v-if="isRunning" expand="block" color="warning" @click="pause" class="control-btn">
                            <ion-icon :icon="pauseOutline"></ion-icon>
                            Pausar
                        </ion-button>

                        <ion-button v-else expand="block" style="--background: #8A2BE2;" @click="resume"
                            class="control-btn">
                            <ion-icon :icon="playOutline"></ion-icon>
                            Reanudar
                        </ion-button>

                        <ion-button expand="block" style="--background: #8A2BE2;" @click="confirmStop"
                            class="control-btn">
                            <ion-icon :icon="stopOutline"></ion-icon>
                            Detener
                        </ion-button>
                    </div>
                </div>

                <!-- Break type selector (shown after completing pomodoro) -->
                <div v-if="showBreakSelector" class="break-selector">
                    <h3>¿Qué tipo de descanso quieres tomar?</h3>
                    <div class="break-options">
                        <ion-button expand="block" @click="startBreak('short')">
                            <ion-icon :icon="cafeOutline"></ion-icon>
                            Corto (5 min)
                        </ion-button>
                        <ion-button expand="block" @click="startBreak('long')">
                            <ion-icon :icon="bedOutline"></ion-icon>
                            Largo (15 min)
                        </ion-button>
                        <ion-button expand="block" fill="outline" @click="skipBreak">
                            Saltar descanso
                        </ion-button>
                    </div>
                </div>
            </div>
        </ion-content>
    </ion-page>
</template>

<script>
import {
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
    IonButton, IonButtons, IonIcon,
    modalController, alertController, toastController
} from '@ionic/vue';
import {
    closeOutline, listOutline, flameOutline, timerOutline,
    playOutline, pauseOutline, stopOutline, cafeOutline, bedOutline
} from 'ionicons/icons';
import { ref, computed, onUnmounted, onMounted } from 'vue';
import pomodoroService from '@/services/pomodoroService';
import { LocalNotifications } from '@capacitor/local-notifications';

const POMODORO_DURATION = 25 * 60; // 25 minutos
const SHORT_BREAK = 5 * 60; // 5 minutos
const LONG_BREAK = 15 * 60; // 15 minutos

export default {
    name: 'PomodoroTimer',
    components: {
        IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
        IonButton, IonButtons, IonIcon
    },
    props: {
        taskId: {
            type: Number,
            default: null
        },
        taskTitle: {
            type: String,
            default: ''
        }
    },
    setup(props) {
        const totalSeconds = ref(POMODORO_DURATION);
        const remaining = ref(totalSeconds.value);
        const intervalId = ref(null);
        const sessionUuid = ref(null);
        const isRunning = ref(false);
        const sessionStarted = ref(false);
        const isBreak = ref(false);
        const showBreakSelector = ref(false);
        const sessionCount = ref(0);
        const totalCompletedToday = ref(0);

        const formattedTime = computed(() => {
            const mins = Math.floor(remaining.value / 60);
            const secs = remaining.value % 60;
            return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        });

        const statusText = computed(() => {
            if (!sessionStarted.value) return 'Listo para empezar';
            if (isRunning.value) return isBreak.value ? 'Descansando...' : 'Enfocado';
            return 'Pausado';
        });

        const progressOffset = computed(() => {
            const circumference = 2 * Math.PI * 120;
            const progress = remaining.value / totalSeconds.value;
            return circumference * (1 - progress);
        });

        const requestNotificationPermission = async () => {
            try {
                const result = await LocalNotifications.requestPermissions();
                return result.display === 'granted';
            } catch (error) {
                console.error('Error requesting notification permissions:', error);
                return false;
            }
        };

        const sendNotification = async (title, body) => {
            try {
                const hasPermission = await requestNotificationPermission();
                if (!hasPermission) {
                    console.warn('Notification permissions not granted');
                    return;
                }

                await LocalNotifications.schedule({
                    notifications: [{
                        title,
                        body,
                        id: Date.now(),
                        schedule: { at: new Date(Date.now() + 100) },
                        sound: undefined,
                        attachments: undefined,
                        actionTypeId: '',
                        extra: null
                    }]
                });
            } catch (error) {
                console.error('Error sending notification:', error);
            }
        };

        const loadTodayStats = async () => {
            try {
                const response = await pomodoroService.getSessions({ period: 'today', status: 'completed' });
                const sessions = response.data.data || response.data;
                totalCompletedToday.value = Array.isArray(sessions) ? sessions.length : 0;
            } catch (error) {
                console.error('Error loading today stats:', error);
            }
        };

        const start = async () => {
            if (!sessionStarted.value && !isBreak.value) {
                // Iniciar nueva sesión en el servidor (solo para Pomodoros, no descansos)
                try {
                    const response = await pomodoroService.startPomodoro({
                        taskId: props.taskId,
                        uuidCliente: crypto.randomUUID()
                    });

                    sessionUuid.value = response.data.data?.uuid_cliente ?? response.data.uuid_cliente;
                    sessionStarted.value = true;
                } catch (error) {
                    console.error('Error starting pomodoro:', error);
                    await showToast('Error al iniciar Pomodoro', 'danger');
                    await dismissModal(false);
                    return;
                }
            }

            isRunning.value = true;

            intervalId.value = setInterval(() => {
                if (remaining.value > 0) {
                    remaining.value--;
                }

                if (remaining.value <= 0) {
                    clearInterval(intervalId.value);
                    intervalId.value = null;
                    isRunning.value = false;
                    handleTimerComplete();
                }
            }, 1000);
        };

        const pause = () => {
            if (intervalId.value) {
                clearInterval(intervalId.value);
                intervalId.value = null;
            }
            isRunning.value = false;
        };

        const resume = () => {
            start();
        };

        const handleTimerComplete = async () => {
            if (isBreak.value) {
                // Descanso completado — resetear todo para un nuevo Pomodoro
                await sendNotification(
                    '⏰ Descanso terminado',
                    '¡Hora de volver al trabajo! ¿Listo para otro Pomodoro?'
                );
                // Reset completo para el siguiente Pomodoro
                isBreak.value = false;
                showBreakSelector.value = false;
                sessionStarted.value = false;
                sessionUuid.value = null;
                totalSeconds.value = POMODORO_DURATION;
                remaining.value = POMODORO_DURATION;
                isRunning.value = false;
            } else {
                // Pomodoro completado
                const actualDuration = POMODORO_DURATION; // siempre 25min si completó natural

                sessionCount.value++;
                totalCompletedToday.value++;

                try {
                    await pomodoroService.completePomodoro({
                        sessionUuid: sessionUuid.value,
                        actualDurationSeconds: actualDuration,
                        breakType: 'none'
                    });

                    await sendNotification(
                        '🎉 ¡Pomodoro completado!',
                        '¡Excelente trabajo! Es hora de tomar un descanso.'
                    );

                    showBreakSelector.value = true;
                } catch (error) {
                    console.error('Error completing pomodoro:', error);
                    await showToast('Error al completar Pomodoro', 'danger');
                    await dismissModal(false);
                }
            }
        };

        const confirmStop = async () => {
            const alert = await alertController.create({
                header: isBreak.value ? 'Detener descanso' : 'Detener Pomodoro',
                message: `¿Estás seguro de que quieres detener ${isBreak.value ? 'el descanso' : 'este Pomodoro'}?`,
                buttons: [
                    {
                        text: 'Cancelar',
                        role: 'cancel'
                    },
                    {
                        text: 'Detener',
                        role: 'destructive',
                        handler: () => stop()
                    }
                ]
            });

            await alert.present();
        };

        const stop = async () => {
            pause();

            if (!isBreak.value && sessionUuid.value) {
                try {
                    await pomodoroService.cancelPomodoro({
                        sessionUuid: sessionUuid.value
                    });
                } catch (error) {
                    console.error('Error canceling pomodoro:', error);
                }
            }

            await dismissModal(false);
            return;
        };

        const startBreak = (type) => {
            showBreakSelector.value = false;
            isBreak.value = true;
            totalSeconds.value = type === 'short' ? SHORT_BREAK : LONG_BREAK;
            remaining.value = totalSeconds.value;
            sessionStarted.value = true; // break no necesita llamar al servidor
            sessionUuid.value = null;
            start();
        };

        const skipBreak = async () => {
            await dismissModal(true);
            return;
        };

        const dismissModal = async (completed = false) => {
            if (intervalId.value) {
                clearInterval(intervalId.value);
                intervalId.value = null;
            }
            try {
                await modalController.dismiss({ completed });
            } catch (err) {
                console.error('Error dismissing modal:', err);
            }
        };

        const showToast = async (message, color) => {
            const toast = await toastController.create({
                message,
                duration: 2000,
                color,
                position: 'bottom'
            });
            await toast.present();
        };

        onMounted(() => {
            loadTodayStats();
            requestNotificationPermission();
        });

        onUnmounted(() => {
            if (intervalId.value) {
                clearInterval(intervalId.value);
            }
        });

        return {
            formattedTime,
            statusText,
            progressOffset,
            isRunning,
            sessionStarted,
            isBreak,
            showBreakSelector,
            sessionCount,
            totalCompletedToday,
            start,
            pause,
            resume,
            confirmStop,
            startBreak,
            skipBreak,
            dismissModal,
            // Icons
            closeOutline, listOutline, flameOutline, timerOutline,
            playOutline, pauseOutline, stopOutline, cafeOutline, bedOutline
        };
    }
};
</script>

<style scoped>
.pomodoro-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 24px;
}

.task-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 32px;
    text-align: center;
}

.task-icon {
    font-size: 24px;
    color: var(--ion-color-primary);
}

.task-header h2 {
    font-size: 20px;
    color: var(--ion-text-color);
    margin: 0;
}

.timer-wrapper {
    position: relative;
    margin: 32px 0;
}

.timer-circle {
    position: relative;
    width: 280px;
    height: 280px;
}

.progress-ring {
    transform: rotate(-90deg);
}

.progress-ring-circle-bg {
    fill: none;
    stroke: var(--ion-color-light);
    stroke-width: 8;
}

.progress-ring-circle {
    fill: none;
    stroke: #3880ff;
    stroke-width: 8;
    stroke-linecap: round;
    stroke-dasharray: 754;
    transition: stroke-dashoffset 1s linear;
}

.progress-ring-circle.break {
    stroke: #3880ff;
}

.timer-display {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
}

.time {
    font-size: 64px;
    font-weight: bold;
    color: var(--ion-text-color);
    font-variant-numeric: tabular-nums;
}

.status {
    font-size: 16px;
    color: var(--ion-color-medium);
    margin-top: 8px;
}

.session-info {
    display: flex;
    gap: 24px;
    margin: 24px 0;
}

.info-item {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--ion-color-medium);
    font-size: 14px;
}

.info-item ion-icon {
    font-size: 20px;
}

.controls {
    width: 100%;
    max-width: 400px;
    margin-top: 32px;
}

.control-btn {
    height: 56px;
    font-size: 16px;
    font-weight: 600;
}

.start-btn {
    --background: var(--ion-color-primary);
}

.control-buttons {
    display: flex;
    gap: 12px;
}

.control-buttons ion-button {
    flex: 1;
}

.break-selector {
    width: 100%;
    max-width: 400px;
    margin-top: 32px;
    padding: 24px;
    background: var(--ion-card-background);
    border-radius: 16px;
    text-align: center;
}

.break-selector h3 {
    color: var(--ion-text-color);
    margin-bottom: 16px;
}

.break-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.break-options ion-button {
    height: 48px;
}
</style>