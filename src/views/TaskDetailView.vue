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
                            <ion-chip :color="statusColor">
                                <ion-label>{{ statusText }}</ion-label>
                            </ion-chip>
                            <ion-chip :color="priorityColor">
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
                                <ion-icon :icon="calendarOutline" slot="start"></ion-icon>
                                <ion-label>
                                    <h3>Vencimiento</h3>
                                    <p>{{ formatDate(task.due_date) }}</p>
                                </ion-label>
                            </ion-item>

                            <ion-item>
                                <ion-icon :icon="timeOutline" slot="start"></ion-icon>
                                <ion-label>
                                    <h3>Creada</h3>
                                    <p>{{ formatDate(task.created_at) }}</p>
                                </ion-label>
                            </ion-item>

                            <ion-item v-if="task.completed_at">
                                <ion-icon :icon="checkmarkCircleOutline" slot="start"></ion-icon>
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
                            <ion-icon :icon="flameOutline"></ion-icon>
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
                                    :color="session.status === 'completed' ? 'success' : 'danger'"></ion-icon>
                                <ion-label>
                                    <h3>{{ formatSessionDuration(session.duration_seconds) }} min</h3>
                                    <p>{{ formatDate(session.started_at) }}</p>
                                </ion-label>
                                <ion-chip :color="session.status === 'completed' ? 'success' : 'danger'" slot="end">
                                    {{ session.status === 'completed' ? 'Completado' : 'Cancelado' }}
                                </ion-chip>
                            </ion-item>
                        </ion-list>
                    </ion-card-content>
                </ion-card>

                <!-- Actions -->
                <div class="actions-container">
                    <ion-button v-if="task.status !== 'completed'" expand="block" color="success"
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
    createOutline, flagOutline, calendarOutline, timeOutline,
    checkmarkCircleOutline, flameOutline, playCircleOutline,
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
            createOutline, flagOutline, calendarOutline, timeOutline,
            checkmarkCircleOutline, flameOutline, playCircleOutline,
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
    gap: 8px;
    margin-bottom: 12px;
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
    color: var(--ion-color-success);
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
    background: linear-gradient(90deg, var(--ion-color-success), var(--ion-color-primary));
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
