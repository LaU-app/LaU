<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-back-button default-href="/tasks"></ion-back-button>
                </ion-buttons>
                <ion-title>Detalle de Tarea</ion-title>
                <ion-buttons slot="end">
                    <ion-button @click="openEditTask" v-if="task">
                        <ion-icon :icon="createOutline"></ion-icon>
                    </ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>

        <ion-content>
            <div v-if="loading" class="loading-container">
                <ion-spinner></ion-spinner>
            </div>

            <div v-else-if="task" class="task-detail">
                <!-- Header Card -->
                <ion-card>
                    <ion-card-header>
                        <div class="task-status-row">
                            <!-- Estado con icono coloreado -->
                            <div class="status-badge">
                                <!-- Pendiente -->
                                <svg v-if="task.status === 'pending'" xmlns="http://www.w3.org/2000/svg" width="20"
                                    height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"
                                    stroke-linecap="round" stroke-linejoin="round">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                    <path d="M3 12v.01" />
                                    <path d="M7.5 19.8v.01" />
                                    <path d="M4.2 16.5v.01" />
                                    <path d="M4.2 7.5v.01" />
                                    <path
                                        d="M12 21a8.994 8.994 0 0 0 6.362 -2.634m1.685 -2.336a9 9 0 0 0 -8.047 -13.03" />
                                    <path d="M3 3l18 18" />
                                </svg>
                                <!-- Completada -->
                                <svg v-else-if="task.status === 'completed'" xmlns="http://www.w3.org/2000/svg"
                                    width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8A2BE2"
                                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                    <path d="M10 20.777a8.942 8.942 0 0 1 -2.48 -.969" />
                                    <path d="M14 3.223a9.003 9.003 0 0 1 0 17.554" />
                                    <path d="M4.579 17.093a8.961 8.961 0 0 1 -1.227 -2.592" />
                                    <path d="M3.124 10.5c.16 -.95 .468 -1.85 .9 -2.675l.169 -.305" />
                                    <path d="M6.907 4.579a8.954 8.954 0 0 1 3.093 -1.356" />
                                    <path d="M9 12l2 2l4 -4" />
                                </svg>
                                <!-- En Curso -->
                                <svg v-else-if="task.status === 'in_progress'" xmlns="http://www.w3.org/2000/svg"
                                    width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b"
                                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                    <path d="M10 20.777a8.942 8.942 0 0 1 -2.48 -.969" />
                                    <path d="M14 3.223a9.003 9.003 0 0 1 0 17.554" />
                                    <path d="M4.579 17.093a8.961 8.961 0 0 1 -1.227 -2.592" />
                                    <path d="M3.124 10.5c.16 -.95 .468 -1.85 .9 -2.675l.169 -.305" />
                                    <path d="M6.907 4.579a8.954 8.954 0 0 1 3.093 -1.356" />
                                </svg>
                                <span class="status-text">{{ statusText }}</span>
                            </div>

                            <!-- Prioridad con bandera -->
                            <ion-chip class="priority-chip">
                                <ion-icon :icon="flagOutline"></ion-icon>
                                <ion-label>{{ priorityText }}</ion-label>
                            </ion-chip>
                        </div>
                        <ion-card-title>{{ task.title }}</ion-card-title>
                    </ion-card-header>

                    <ion-card-content v-if="task.description">
                        <p class="task-description">{{ task.description }}</p>
                    </ion-card-content>
                </ion-card>

                <!-- Info Card -->
                <ion-card>
                    <ion-card-header>
                        <ion-card-title>Información</ion-card-title>
                    </ion-card-header>
                    <ion-card-content>
                        <ion-list>
                            <ion-item v-if="task.due_date">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                    fill="currentColor" slot="start">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                    <path
                                        d="M16 2c.183 0 .355 .05 .502 .135l.033 .02c.28 .177 .465 .49 .465 .845v1h1a3 3 0 0 1 2.995 2.824l.005 .176v12a3 3 0 0 1 -2.824 2.995l-.176 .005h-12a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-12a3 3 0 0 1 2.824 -2.995l.176 -.005h1v-1a1 1 0 0 1 .514 -.874l.093 -.046l.066 -.025l.1 -.029l.107 -.019l.12 -.007q .083 0 .161 .013l.122 .029l.04 .012l.06 .023c.328 .135 .568 .44 .61 .806l.007 .117v1h6v-1a1 1 0 0 1 1 -1m3 7h-14v9.625c0 .705 .386 1.286 .883 1.366l.117 .009h12c.513 0 .936 -.53 .993 -1.215l.007 -.16z" />
                                    <path
                                        d="M9.015 13a1 1 0 0 1 -1 1a1.001 1.001 0 1 1 -.005 -2c.557 0 1.005 .448 1.005 1" />
                                    <path
                                        d="M13.015 13a1 1 0 0 1 -1 1a1.001 1.001 0 1 1 -.005 -2c.557 0 1.005 .448 1.005 1" />
                                    <path
                                        d="M17.02 13a1 1 0 0 1 -1 1a1.001 1.001 0 1 1 -.005 -2c.557 0 1.005 .448 1.005 1" />
                                    <path d="M12.02 15a1 1 0 0 1 0 2a1.001 1.001 0 1 1 -.005 -2z" />
                                    <path
                                        d="M9.015 16a1 1 0 0 1 -1 1a1.001 1.001 0 1 1 -.005 -2c.557 0 1.005 .448 1.005 1" />
                                </svg>
                                <ion-label>
                                    <h3>Vencimiento</h3>
                                    <p>{{ formatDate(task.due_date) }}</p>
                                </ion-label>
                            </ion-item>

                            <ion-item>
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                    fill="currentColor" slot="start">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                    <path
                                        d="M17 3.34a10 10 0 1 1 -15 8.66l.005 -.324a10 10 0 0 1 14.995 -8.336m-5 2.66a1 1 0 0 0 -1 1v5.026l.009 .105l.02 .107l.04 .129l.048 .102l.046 .078l.042 .06l.069 .08l.088 .083l.083 .062l3 2a1 1 0 1 0 1.11 -1.664l-2.555 -1.704v-4.464a1 1 0 0 0 -.883 -.993z" />
                                </svg>
                                <ion-label>
                                    <h3>Creada</h3>
                                    <p>{{ formatDate(task.created_at) }}</p>
                                </ion-label>
                            </ion-item>

                            <ion-item v-if="task.completed_at">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                    fill="currentColor" slot="start">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                    <path
                                        d="M17 3.34a10 10 0 1 1 -14.995 8.984l-.005 -.324l.005 -.324a10 10 0 0 1 14.995 -8.336zm-1.293 5.953a1 1 0 0 0 -1.32 -.083l-.094 .083l-3.293 3.292l-1.293 -1.292l-.094 -.083a1 1 0 0 0 -1.403 1.403l.083 .094l2 2l.094 .083a1 1 0 0 0 1.226 0l.094 -.083l4 -4l.083 -.094a1 1 0 0 0 -.083 -1.32z" />
                                </svg>
                                <ion-label>
                                    <h3>Completada</h3>
                                    <p>{{ formatDate(task.completed_at) }}</p>
                                </ion-label>
                            </ion-item>
                        </ion-list>
                    </ion-card-content>
                </ion-card>

                <!-- Pomodoro Progress Card -->
                <ion-card>
                    <ion-card-header>
                        <ion-card-title>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                                fill="#3880ff" style="vertical-align: middle; margin-right: 6px;">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path
                                    d="M10 2c0 -.88 1.056 -1.331 1.692 -.722c1.958 1.876 3.096 5.995 1.75 9.12l-.08 .174l.012 .003c.625 .133 1.203 -.43 2.303 -2.173l.14 -.224a1 1 0 0 1 1.582 -.153c1.334 1.435 2.601 4.377 2.601 6.27c0 4.265 -3.591 7.705 -8 7.705s-8 -3.44 -8 -7.706c0 -2.252 1.022 -4.716 2.632 -6.301l.605 -.589c.241 -.236 .434 -.43 .618 -.624c1.43 -1.512 2.145 -2.924 2.145 -4.78" />
                            </svg>
                            Progreso Pomodoro
                        </ion-card-title>
                    </ion-card-header>
                    <ion-card-content>
                        <div class="pomodoro-progress">
                            <div class="progress-info">
                                <div class="progress-text">
                                    <span class="completed">{{ task.completed_pomodoros }}</span>
                                    <span class="separator">/</span>
                                    <span class="estimated">{{ task.estimated_pomodoros || '∞' }}</span>
                                </div>
                                <p class="progress-label">Pomodoros completados</p>
                            </div>

                            <div v-if="task.estimated_pomodoros" class="progress-bar">
                                <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
                            </div>
                        </div>

                        <ion-button expand="block" @click="startPomodoro" v-if="task.status !== 'completed'"
                            class="start-pomodoro-btn">
                            <ion-icon slot="start" :icon="playCircleOutline"></ion-icon>
                            Iniciar Pomodoro
                        </ion-button>
                    </ion-card-content>
                </ion-card>

                <!-- Historial de Sesiones -->
                <ion-card v-if="sessions.length > 0">
                    <ion-card-header>
                        <ion-card-title>
                            <ion-icon :icon="listOutline"></ion-icon>
                            Historial de Sesiones
                        </ion-card-title>
                    </ion-card-header>
                    <ion-card-content>
                        <ion-list>
                            <ion-item v-for="session in sessions" :key="session.id">
                                <ion-icon
                                    :icon="session.status === 'completed' ? checkmarkCircleOutline : closeCircleOutline"
                                    slot="start"
                                    :style="{ color: session.status === 'completed' ? '#8A2BE2' : 'var(--ion-color-danger)' }"></ion-icon>
                                <ion-label>
                                    <h3>{{ formatSessionDuration(session.duration_seconds) }} min</h3>
                                    <p>{{ formatDate(session.started_at) }}</p>
                                </ion-label>
                                <ion-chip
                                    :style="{ '--background': session.status === 'completed' ? '#8A2BE2' : 'var(--ion-color-danger)', '--color': '#fff' }"
                                    slot="end">
                                    {{ session.status === 'completed' ? 'Completado' : 'Cancelado' }}
                                </ion-chip>
                            </ion-item>
                        </ion-list>
                    </ion-card-content>
                </ion-card>

                <!-- Actions -->
                <div class="actions-container">
                    <ion-button v-if="task.status !== 'completed'" expand="block" style="--background: #8A2BE2;"
                        @click="confirmComplete">
                        <ion-icon slot="start" :icon="checkmarkCircleOutline"></ion-icon>
                        Marcar como Completada
                    </ion-button>

                    <ion-button expand="block" color="danger" fill="outline" @click="confirmDelete">
                        <ion-icon slot="start" :icon="trashOutline"></ion-icon>
                        Eliminar Tarea
                    </ion-button>
                </div>
            </div>
        </ion-content>
    </ion-page>
</template>

<script>
import {
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
    IonButton, IonBackButton, IonIcon, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent, IonList, IonItem, IonLabel,
    IonChip, IonSpinner, modalController, alertController,
    toastController
} from '@ionic/vue';
import {
    createOutline, flagOutline,
    checkmarkCircleOutline, playCircleOutline,
    listOutline, closeCircleOutline, trashOutline
} from 'ionicons/icons';
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import tasksService from '@/services/tasksService';
import CreateTaskModal from '@/components/CreateTaskModal.vue';
import PomodoroTimer from '@/components/PomodoroTimer.vue';

export default {
    name: 'TaskDetailView',
    components: {
        IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
        IonButton, IonBackButton, IonIcon, IonCard, IonCardHeader,
        IonCardTitle, IonCardContent, IonList, IonItem, IonLabel,
        IonChip, IonSpinner
    },
    setup() {
        const route = useRoute();
        const router = useRouter();
        const task = ref(null);
        const sessions = ref([]);
        const loading = ref(true);

        const statusColor = computed(() => {
            const colors = {
                pending: 'warning',
                in_progress: 'primary',
                completed: 'success',
                cancelled: 'medium'
            };
            return colors[task.value?.status] || 'medium';
        });

        const statusText = computed(() => {
            const texts = {
                pending: 'Pendiente',
                in_progress: 'En Curso',
                completed: 'Completada',
                cancelled: 'Cancelada'
            };
            return texts[task.value?.status] || task.value?.status;
        });

        const priorityColor = computed(() => {
            const colors = {
                low: 'success',
                medium: 'warning',
                high: 'danger'
            };
            return colors[task.value?.priority] || 'medium';
        });

        const priorityText = computed(() => {
            const texts = {
                low: 'Baja',
                medium: 'Media',
                high: 'Alta'
            };
            return texts[task.value?.priority] || task.value?.priority;
        });

        const progressPercentage = computed(() => {
            if (!task.value?.estimated_pomodoros) return 0;
            return Math.min(
                (task.value.completed_pomodoros / task.value.estimated_pomodoros) * 100,
                100
            );
        });

        const loadTask = async () => {
            loading.value = true;
            try {
                const taskId = route.params.id;
                const response = await tasksService.getTaskById(taskId);
                task.value = response.data;

                // Cargar sesiones si existen
                if (task.value.pomodoro_sessions) {
                    sessions.value = task.value.pomodoro_sessions;
                }
            } catch (error) {
                console.error('Error loading task:', error);
                showToast('Error al cargar la tarea', 'danger');
                router.back();
            } finally {
                loading.value = false;
            }
        };

        const formatDate = (dateString) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        };

        const formatSessionDuration = (seconds) => {
            return Math.round(seconds / 60);
        };

        const openEditTask = async () => {
            const modal = await modalController.create({
                component: CreateTaskModal,
                componentProps: {
                    task: task.value
                }
            });

            await modal.present();

            const { data } = await modal.onWillDismiss();
            if (data?.created) {
                await loadTask();
                showToast('Tarea actualizada', 'success');
            }
        };

        const startPomodoro = async () => {
            const modal = await modalController.create({
                component: PomodoroTimer,
                componentProps: {
                    taskId: task.value.id,
                    taskTitle: task.value.title
                }
            });

            await modal.present();

            const { data } = await modal.onWillDismiss();
            if (data?.completed) {
                await loadTask();
            }
        };

        const confirmComplete = async () => {
            const alert = await alertController.create({
                header: 'Completar tarea',
                message: '¿Marcar esta tarea como completada?',
                buttons: [
                    {
                        text: 'Cancelar',
                        role: 'cancel'
                    },
                    {
                        text: 'Completar',
                        handler: async () => {
                            try {
                                await tasksService.completeTask(task.value.id);
                                await loadTask();
                                showToast('Tarea completada', 'success');
                            } catch (error) {
                                console.error('Error completing task:', error);
                                showToast('Error al completar tarea', 'danger');
                            }
                        }
                    }
                ]
            });

            await alert.present();
        };

        const confirmDelete = async () => {
            const alert = await alertController.create({
                header: 'Eliminar tarea',
                message: '¿Estás seguro de eliminar esta tarea? Esta acción no se puede deshacer.',
                buttons: [
                    {
                        text: 'Cancelar',
                        role: 'cancel'
                    },
                    {
                        text: 'Eliminar',
                        role: 'destructive',
                        handler: async () => {
                            try {
                                await tasksService.deleteTask(task.value.id);
                                showToast('Tarea eliminada', 'success');
                                router.push('/tasks');
                            } catch (error) {
                                console.error('Error deleting task:', error);
                                showToast('Error al eliminar tarea', 'danger');
                            }
                        }
                    }
                ]
            });

            await alert.present();
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
            loadTask();
        });

        return {
            task,
            sessions,
            loading,
            statusColor,
            statusText,
            priorityColor,
            priorityText,
            progressPercentage,
            formatDate,
            formatSessionDuration,
            openEditTask,
            startPomodoro,
            confirmComplete,
            confirmDelete,
            // Icons
            createOutline, flagOutline,
            checkmarkCircleOutline, playCircleOutline,
            listOutline, closeCircleOutline, trashOutline
        };
    }
};
</script>

<style scoped>
.loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
}

.task-detail {
    padding: 16px;
}

.task-status-row {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;
    align-items: center;
}

.status-badge {
    display: flex;
    align-items: center;
    gap: 8px;
}

.status-badge svg {
    flex-shrink: 0;
}

.status-text {
    font-size: 14px;
    font-weight: 500;
    color: var(--ion-text-color);
}

.priority-chip {
    --background: #e5e7eb;
    --color: #6b7280;
    margin: 0;
}

.task-description {
    white-space: pre-wrap;
    line-height: 1.6;
    color: var(--ion-text-color);
}

ion-card-title {
    display: flex;
    align-items: center;
    gap: 8px;
}

ion-card-title ion-icon {
    font-size: 20px;
}

.pomodoro-progress {
    margin-bottom: 16px;
}

.progress-info {
    text-align: center;
    margin-bottom: 16px;
}

.progress-text {
    font-size: 48px;
    font-weight: bold;
    color: var(--ion-text-color);
}

.progress-text .completed {
    color: #3880ff;
}

.progress-text .separator {
    color: var(--ion-color-medium);
    margin: 0 8px;
}

.progress-text .estimated {
    color: var(--ion-color-medium);
}

.progress-label {
    font-size: 14px;
    color: var(--ion-color-medium);
    margin-top: 8px;
}

.progress-bar {
    width: 100%;
    height: 8px;
    background: var(--ion-color-light);
    border-radius: 4px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3880ff, #5a9dff);
    transition: width 0.3s ease;
    border-radius: 4px;
}

.start-pomodoro-btn {
    margin-top: 16px;
    height: 48px;
}

.actions-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 24px;
}

.actions-container ion-button {
    height: 48px;
}
</style>
