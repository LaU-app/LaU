<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <ion-title>Mis Tareas</ion-title>
                <ion-buttons slot="end">
                    <ion-button @click="openCreateTask">
                        <ion-icon :icon="addOutline"></ion-icon>
                    </ion-button>
                    <ion-button @click="refreshTasks">
                        <ion-icon :icon="refreshOutline"></ion-icon>
                    </ion-button>
                </ion-buttons>
            </ion-toolbar>

            <!-- Filtros -->
            <ion-toolbar>
                <ion-segment v-model="selectedStatus" @ionChange="loadTasks">
                    <ion-segment-button value="all">
                        <ion-label>Todas</ion-label>
                    </ion-segment-button>
                    <ion-segment-button value="pending">
                        <ion-label>Pendientes</ion-label>
                    </ion-segment-button>
                    <ion-segment-button value="in_progress">
                        <ion-label>En Curso</ion-label>
                    </ion-segment-button>
                    <ion-segment-button value="completed">
                        <ion-label>Completadas</ion-label>
                    </ion-segment-button>
                </ion-segment>
            </ion-toolbar>
        </ion-header>

        <ion-content :fullscreen="true">
            <!-- Estadísticas rápidas -->
            <div class="stats-card" v-if="stats">
                <div class="stat-item">
                    <ion-icon :icon="checkmarkCircleOutline" class="stat-icon success"></ion-icon>
                    <div class="stat-content">
                        <div class="stat-value">{{ stats.completed }}</div>
                        <div class="stat-label">Completadas</div>
                    </div>
                </div>
                <div class="stat-item">
                    <ion-icon :icon="timeOutline" class="stat-icon warning"></ion-icon>
                    <div class="stat-content">
                        <div class="stat-value">{{ stats.in_progress }}</div>
                        <div class="stat-label">En Curso</div>
                    </div>
                </div>
                <div class="stat-item">
                    <ion-icon :icon="alertCircleOutline" class="stat-icon danger"></ion-icon>
                    <div class="stat-content">
                        <div class="stat-value">{{ stats.overdue }}</div>
                        <div class="stat-label">Vencidas</div>
                    </div>
                </div>
                <div class="stat-item">
                    <ion-icon :icon="flameOutline" class="stat-icon primary"></ion-icon>
                    <div class="stat-content">
                        <div class="stat-value">{{ stats.pomodoros_today }}</div>
                        <div class="stat-label">Pomodoros Hoy</div>
                    </div>
                </div>
            </div>

            <!-- Lista de tareas -->
            <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
                <ion-refresher-content></ion-refresher-content>
            </ion-refresher>

            <div class="tasks-container">
                <ion-list v-if="tasks.length > 0">
                    <task-card v-for="task in tasks" :key="task.id" :task="task" @click="openTaskDetail(task)"
                        @update="loadTasks" @start-pomodoro="startPomodoroForTask" />
                </ion-list>

                <div v-else-if="!loading" class="empty-state">
                    <ion-icon :icon="checkmarkDoneOutline" class="empty-icon"></ion-icon>
                    <h3>No tienes tareas {{ selectedStatus !== 'all' ? statusText[selectedStatus] : '' }}</h3>
                    <p>¡Crea una nueva tarea para comenzar!</p>
                    <ion-button @click="openCreateTask">
                        <ion-icon slot="start" :icon="addOutline"></ion-icon>
                        Nueva Tarea
                    </ion-button>
                </div>

                <div v-if="loading" class="loading-state">
                    <ion-spinner name="crescent"></ion-spinner>
                </div>
            </div>

            <!-- Botón flotante de Pomodoro -->
            <ion-fab vertical="bottom" horizontal="end" slot="fixed">
                <ion-fab-button @click="openPomodoroTimer" :color="hasActiveSession ? 'success' : 'danger'">
                    <ion-icon :icon="timerOutline"></ion-icon>
                </ion-fab-button>
            </ion-fab>
        </ion-content>
    </ion-page>
</template>

<script>
import {
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
    IonButton, IonButtons, IonIcon, IonList, IonSegment,
    IonSegmentButton, IonLabel, IonRefresher, IonRefresherContent,
    IonSpinner, IonFab, IonFabButton,
    modalController, toastController
} from '@ionic/vue';
import {
    addOutline, refreshOutline, checkmarkCircleOutline,
    timeOutline, alertCircleOutline, flameOutline,
    checkmarkDoneOutline, timerOutline
} from 'ionicons/icons';
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import tasksService from '@/services/tasksService';
import pomodoroService from '@/services/pomodoroService';
import TaskCard from '@/components/TaskCard.vue';
import CreateTaskModal from '@/components/CreateTaskModal.vue';
import PomodoroTimer from '@/components/PomodoroTimer.vue';

export default {
    name: 'TasksView',
    components: {
        IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
        IonButton, IonButtons, IonIcon, IonList, IonSegment,
        IonSegmentButton, IonLabel, IonRefresher, IonRefresherContent,
        IonSpinner, IonFab, IonFabButton,
        TaskCard
    },
    setup() {
        const router = useRouter();
        const tasks = ref([]);
        const stats = ref(null);
        const selectedStatus = ref('all');
        const loading = ref(false);
        const hasActiveSession = ref(false);

        const statusText = {
            pending: 'pendientes',
            in_progress: 'en curso',
            completed: 'completadas'
        };

        const loadTasks = async () => {
            loading.value = true;
            try {
                const filters = {};
                if (selectedStatus.value !== 'all') {
                    filters.status = selectedStatus.value;
                }
                filters.sortBy = 'priority';

                const response = await tasksService.getTasks(filters);
                tasks.value = response.data.data || response.data;
            } catch (error) {
                console.error('Error al cargar tareas:', error);
                showToast('Error al cargar tareas', 'danger');
            } finally {
                loading.value = false;
            }
        };

        const loadStats = async () => {
            try {
                const response = await tasksService.getTasksStats();
                stats.value = response.data;
            } catch (error) {
                console.error('Error al cargar estadísticas:', error);
            }
        };

        const checkActiveSession = async () => {
            try {
                const response = await pomodoroService.getActiveSession();
                hasActiveSession.value = response.success && response.data;
            } catch (error) {
                hasActiveSession.value = false;
            }
        };

        const refreshTasks = async () => {
            await Promise.all([
                loadTasks(),
                loadStats(),
                checkActiveSession()
            ]);
        };

        const handleRefresh = async (event) => {
            await refreshTasks();
            event.target.complete();
        };

        const openCreateTask = async () => {
            const modal = await modalController.create({
                component: CreateTaskModal
            });

            await modal.present();

            const { data } = await modal.onWillDismiss();
            if (data?.created) {
                await refreshTasks();
                showToast('Tarea creada exitosamente', 'success');
            }
        };

        const openTaskDetail = (task) => {
            router.push(`/tasks/${task.id}`);
        };

        const openPomodoroTimer = async () => {
            const modal = await modalController.create({
                component: PomodoroTimer,
                componentProps: {
                    taskId: null
                }
            });

            await modal.present();

            const { data } = await modal.onWillDismiss();
            if (data?.completed) {
                await refreshTasks();
            }
        };

        const startPomodoroForTask = async (task) => {
            const modal = await modalController.create({
                component: PomodoroTimer,
                componentProps: {
                    taskId: task.id,
                    taskTitle: task.title
                }
            });

            await modal.present();

            const { data } = await modal.onWillDismiss();
            if (data?.completed) {
                await refreshTasks();
            }
        };

        const showToast = async (message, color = 'primary') => {
            const toast = await toastController.create({
                message,
                duration: 2000,
                color,
                position: 'bottom'
            });
            await toast.present();
        };

        onMounted(() => {
            refreshTasks();
        });

        return {
            tasks,
            stats,
            selectedStatus,
            loading,
            hasActiveSession,
            statusText,
            loadTasks,
            refreshTasks,
            handleRefresh,
            openCreateTask,
            openTaskDetail,
            openPomodoroTimer,
            startPomodoroForTask,
            // Icons
            addOutline, refreshOutline, checkmarkCircleOutline,
            timeOutline, alertCircleOutline, flameOutline,
            checkmarkDoneOutline, timerOutline
        };
    }
};
</script>

<style scoped>
.stats-card {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 16px;
    background: var(--ion-background-color);
}

.stat-item {
    display: flex;
    align-items: center;
    padding: 16px;
    background: var(--ion-card-background);
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-icon {
    font-size: 32px;
    margin-right: 12px;
}

.stat-icon.success {
    color: var(--ion-color-success);
}

.stat-icon.warning {
    color: var(--ion-color-warning);
}

.stat-icon.danger {
    color: var(--ion-color-danger);
}

.stat-icon.primary {
    color: var(--ion-color-primary);
}

.stat-content {
    flex: 1;
}

.stat-value {
    font-size: 24px;
    font-weight: bold;
    color: var(--ion-text-color);
}

.stat-label {
    font-size: 12px;
    color: var(--ion-color-medium);
    margin-top: 4px;
}

.tasks-container {
    padding: 8px;
    min-height: 200px;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    text-align: center;
    min-height: 300px;
}

.empty-icon {
    font-size: 80px;
    color: var(--ion-color-medium);
    opacity: 0.5;
    margin-bottom: 24px;
}

.empty-state h3 {
    color: var(--ion-text-color);
    margin-bottom: 8px;
}

.empty-state p {
    color: var(--ion-color-medium);
    margin-bottom: 24px;
}

.loading-state {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 48px;
}

ion-segment {
    padding: 0 16px;
}
</style>
