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
                        <ion-icon :icon="flameOutline"></ion-icon>
                        <span>Sesión {{ sessionCount + 1 }}</span>
                    </div>
                    <div class="info-item">
                        <ion-icon :icon="timerOutline"></ion-icon>
                        <span>{{ totalCompletedToday }} hoy</span>
                    </div>
                </div>

                <!-- Controls -->
                <div class="controls">
                    <ion-button v-if="!isRunning && !sessionStarted" expand="block" size="large" @click="start"
                        class="control-btn start-btn">
                        <ion-icon slot="start" :icon="playOutline"></ion-icon>
                        Iniciar {{ isBreak ? 'Descanso' : 'Pomodoro' }}
                    </ion-button>

                    <div v-else class="control-buttons">
                        <ion-button v-if="isRunning" expand="block" color="warning" @click="pause" class="control-btn">
                            <ion-icon slot="start" :icon="pauseOutline"></ion-icon>
                            Pausar
                        </ion-button>

                        <ion-button v-else expand="block" color="success" @click="resume" class="control-btn">
                            <ion-icon slot="start" :icon="playOutline"></ion-icon>
                            Reanudar
                        </ion-button>

                        <ion-button expand="block" color="danger" @click="confirmStop" class="control-btn">
                            <ion-icon slot="start" :icon="stopOutline"></ion-icon>
                            Detener
                        </ion-button>
                    </div>
                </div>

                <!-- Break type selector (shown after completing pomodoro) -->
                <div v-if="showBreakSelector" class="break-selector">
                    <h3>¿Qué tipo de descanso quieres tomar?</h3>
                    <div class="break-options">
                        <ion-button expand="block" @click="startBreak('short')">
                            <ion-icon slot="start" :icon="cafeOutline"></ion-icon>
                            Corto (5 min)
                        </ion-button>
                        <ion-button expand="block" @click="startBreak('long')">
                            <ion-icon slot="start" :icon="bedOutline"></ion-icon>
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
            if (!sessionStarted.value) {
                // Iniciar nueva sesión en el servidor
                try {
                    const response = await pomodoroService.startPomodoro({
                        taskId: props.taskId,
                        uuidCliente: crypto.randomUUID()
                    });

                    sessionUuid.value = response.data.uuid_cliente;
                    sessionStarted.value = true;
                } catch (error) {
                    console.error('Error starting pomodoro:', error);
                    showToast('Error al iniciar Pomodoro', 'danger');
                    return;
                }
            }

            isRunning.value = true;

            intervalId.value = setInterval(() => {
                remaining.value--;

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
                // Descanso completado
                await sendNotification(
                    '⏰ Descanso terminado',
                    '¡Hora de volver al trabajo! ¿Listo para otro Pomodoro?'
                );
                showBreakSelector.value = false;
                isBreak.value = false;
                sessionStarted.value = false;
                sessionCount.value++;
                dismissModal(true);
            } else {
                // Pomodoro completado
                const actualDuration = totalSeconds.value - remaining.value;

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
                    totalCompletedToday.value++;
                } catch (error) {
                    console.error('Error completing pomodoro:', error);
                    showToast('Error al completar Pomodoro', 'danger');
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

            dismissModal(false);
        };

        const startBreak = (type) => {
            showBreakSelector.value = false;
            isBreak.value = true;
            totalSeconds.value = type === 'short' ? SHORT_BREAK : LONG_BREAK;
            remaining.value = totalSeconds.value;
            sessionStarted.value = false;
            start();
        };

        const skipBreak = () => {
            dismissModal(true);
        };

        const dismissModal = async (completed = false) => {
            if (intervalId.value) {
                clearInterval(intervalId.value);
            }
            await modalController.dismiss({ completed });
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
    stroke: var(--ion-color-danger);
    stroke-width: 8;
    stroke-linecap: round;
    stroke-dasharray: 754;
    transition: stroke-dashoffset 1s linear;
}

.progress-ring-circle.break {
    stroke: var(--ion-color-success);
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
    --background: var(--ion-color-danger);
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
