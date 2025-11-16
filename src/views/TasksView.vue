<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-button fill="clear" @click="goBack" aria-label="Cerrar">
                        <ion-icon :icon="closeOutline"></ion-icon>
                    </ion-button>
                </ion-buttons>
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

            <!-- Vista toggle: Tareas / Podio -->
            <ion-toolbar>
                <ion-segment v-model="activeView" @ionChange="onViewChange">
                    <ion-segment-button value="tasks">
                        <ion-label>Tareas</ion-label>
                    </ion-segment-button>
                    <ion-segment-button value="podium">
                        <ion-label>Podio</ion-label>
                    </ion-segment-button>
                </ion-segment>
            </ion-toolbar>

            <!-- Filtro de categoría (solo en vista Tareas) -->
            <ion-toolbar v-if="activeView === 'tasks'">
                <ion-item lines="none">
                    <ion-label>Categoría</ion-label>
                    <ion-select v-model="selectedStatus" interface="popover" @ionChange="loadTasks">
                        <ion-select-option value="all">Todas</ion-select-option>
                        <ion-select-option value="pending">Pendientes</ion-select-option>
                        <ion-select-option value="in_progress">En Curso</ion-select-option>
                        <ion-select-option value="completed">Completadas</ion-select-option>
                    </ion-select>
                </ion-item>
            </ion-toolbar>
        </ion-header>

        <ion-content :fullscreen="true">
            <!-- Estadísticas rápidas (solo en vista Tareas) -->
            <div class="stats-card" v-if="activeView === 'tasks' && stats">
                <div class="stat-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
                        stroke="#8A2BE2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        class="stat-icon success">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d="M10 20.777a8.942 8.942 0 0 1 -2.48 -.969" />
                        <path d="M14 3.223a9.003 9.003 0 0 1 0 17.554" />
                        <path d="M4.579 17.093a8.961 8.961 0 0 1 -1.227 -2.592" />
                        <path d="M3.124 10.5c.16 -.95 .468 -1.85 .9 -2.675l.169 -.305" />
                        <path d="M6.907 4.579a8.954 8.954 0 0 1 3.093 -1.356" />
                        <path d="M9 12l2 2l4 -4" />
                    </svg>
                    <div class="stat-content">
                        <div class="stat-value">{{ stats.completed }}</div>
                        <div class="stat-label">Completadas</div>
                    </div>
                </div>
                <div class="stat-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
                        stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        class="stat-icon warning">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d="M10 20.777a8.942 8.942 0 0 1 -2.48 -.969" />
                        <path d="M14 3.223a9.003 9.003 0 0 1 0 17.554" />
                        <path d="M4.579 17.093a8.961 8.961 0 0 1 -1.227 -2.592" />
                        <path d="M3.124 10.5c.16 -.95 .468 -1.85 .9 -2.675l.169 -.305" />
                        <path d="M6.907 4.579a8.954 8.954 0 0 1 3.093 -1.356" />
                    </svg>
                    <div class="stat-content">
                        <div class="stat-value">{{ stats.in_progress }}</div>
                        <div class="stat-label">En Curso</div>
                    </div>
                </div>
                <div class="stat-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
                        stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        class="stat-icon danger">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d="M3 12v.01" />
                        <path d="M7.5 19.8v.01" />
                        <path d="M4.2 16.5v.01" />
                        <path d="M4.2 7.5v.01" />
                        <path d="M12 21a8.994 8.994 0 0 0 6.362 -2.634m1.685 -2.336a9 9 0 0 0 -8.047 -13.03" />
                        <path d="M3 3l18 18" />
                    </svg>
                    <div class="stat-content">
                        <div class="stat-value">{{ stats.pending }}</div>
                        <div class="stat-label">Pendientes</div>
                    </div>
                </div>
                <div class="stat-item">
                    <!-- Icono filled cuando hay al menos 1 pomodoro -->
                    <svg v-if="stats.pomodoros_today > 0" xmlns="http://www.w3.org/2000/svg" width="32" height="32"
                        viewBox="0 0 24 24" fill="#3880ff" class="stat-icon primary">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path
                            d="M10 2c0 -.88 1.056 -1.331 1.692 -.722c1.958 1.876 3.096 5.995 1.75 9.12l-.08 .174l.012 .003c.625 .133 1.203 -.43 2.303 -2.173l.14 -.224a1 1 0 0 1 1.582 -.153c1.334 1.435 2.601 4.377 2.601 6.27c0 4.265 -3.591 7.705 -8 7.705s-8 -3.44 -8 -7.706c0 -2.252 1.022 -4.716 2.632 -6.301l.605 -.589c.241 -.236 .434 -.43 .618 -.624c1.43 -1.512 2.145 -2.924 2.145 -4.78" />
                    </svg>
                    <!-- Icono outline cuando no hay pomodoros -->
                    <svg v-else xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"
                        fill="none" stroke="#3880ff" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"
                        class="stat-icon primary">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path
                            d="M12 10.941c2.333 -3.308 .167 -7.823 -1 -8.941c0 3.395 -2.235 5.299 -3.667 6.706c-1.43 1.408 -2.333 3.621 -2.333 5.588c0 3.704 3.134 6.706 7 6.706s7 -3.002 7 -6.706c0 -1.712 -1.232 -4.403 -2.333 -5.588c-2.084 3.353 -3.257 3.353 -4.667 2.235" />
                    </svg>
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

            <div v-if="activeView === 'tasks'" class="tasks-container two-column">
                <div class="left-column">
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
            </div>

            <div v-else class="podium-view">
                <weekly-podium />
            </div>

            <!-- Botón flotante de Pomodoro -->
            <ion-fab vertical="bottom" horizontal="end" slot="fixed">
                <ion-fab-button @click="openPomodoroTimer"
                    :style="{ '--background': hasActiveSession ? '#3880ff' : '#3880ff' }">
                    <!-- Icono hourglass: filled si hay pomodoros hoy, outline si no -->
                    <svg v-if="stats && stats.pomodoros_today > 0" xmlns="http://www.w3.org/2000/svg" width="24"
                        height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path
                            d="M17 2a2 2 0 0 1 1.995 1.85l.005 .15v2a6.996 6.996 0 0 1 -3.393 6a6.994 6.994 0 0 1 3.388 5.728l.005 .272v2a2 2 0 0 1 -1.85 1.995l-.15 .005h-10a2 2 0 0 1 -1.995 -1.85l-.005 -.15v-2a6.996 6.996 0 0 1 3.393 -6a6.994 6.994 0 0 1 -3.388 -5.728l-.005 -.272v-2a2 2 0 0 1 1.85 -1.995l.15 -.005h10z" />
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"
                        stroke-linejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d="M6 20v-2a6 6 0 1 1 12 0v2a1 1 0 0 1 -1 1h-10a1 1 0 0 1 -1 -1z" />
                        <path d="M6 4v2a6 6 0 1 0 12 0v-2a1 1 0 0 0 -1 -1h-10a1 1 0 0 0 -1 1z" />
                    </svg>
                </ion-fab-button>
            </ion-fab>
        </ion-content>
    </ion-page>
</template>

<script>
import {
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
    IonButton, IonButtons, IonIcon, IonList,
    IonLabel, IonRefresher, IonRefresherContent, IonSegment, IonSegmentButton,
    IonSpinner, IonFab, IonFabButton, IonItem, IonSelect, IonSelectOption,
    modalController, toastController
} from '@ionic/vue';
import {
    addOutline, refreshOutline, checkmarkCircleOutline,
    checkmarkDoneOutline, timerOutline, closeOutline
} from 'ionicons/icons';
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import tasksService from '@/services/tasksService';
import pomodoroService from '@/services/pomodoroService';
import TaskCard from '@/components/TaskCard.vue';
import CreateTaskModal from '@/components/CreateTaskModal.vue';
import PomodoroTimer from '@/components/PomodoroTimer.vue';
import WeeklyPodium from '@/components/WeeklyPodium.vue';

export default {
    name: 'TasksView',
    components: {
        IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
        IonButton, IonButtons, IonIcon, IonList,
        IonLabel, IonRefresher, IonRefresherContent,
        IonSpinner, IonFab, IonFabButton, IonItem, IonSelect, IonSelectOption, IonSegment, IonSegmentButton,
        TaskCard, WeeklyPodium
    },
    setup() {
        const router = useRouter();
        const goBack = () => {
            // If there is history, go back; otherwise navigate to home/tab1
            if (window.history.length > 1) {
                router.back();
            } else {
                router.push('/tabs/tab1');
            }
        };
        const tasks = ref([]);
        const stats = ref(null);
        const selectedStatus = ref('all');
        const loading = ref(false);
        const hasActiveSession = ref(false);
        const filtersState = ref({ order: null });
        const activeView = ref('tasks');

        const onViewChange = () => {
            // when switching views, refresh relevant data
            if (activeView.value === 'podium') {
                // ensure podium data loads (WeeklyPodium will fetch on mount), but refresh stats too
                loadStats();
            } else {
                loadTasks();
            }
        };

        const statusText = {
            pending: 'pendientes',
            in_progress: 'en curso',
            completed: 'completadas'
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

        const loadTasks = async () => {
            loading.value = true;
            try {
                const filters = {};
                if (selectedStatus.value !== 'all') {
                    filters.status = selectedStatus.value;
                }
                // default sort (server may apply its own)
                filters.sort_by = 'created_at';

                const response = await tasksService.getTasks(filters);
                tasks.value = response.data.data || response.data;
            } catch (error) {
                console.error('Error al cargar tareas:', error);
                showToast('Error al cargar tareas', 'danger');
            } finally {
                loading.value = false;
            }
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
            try {
                await modal.onDidDismiss();
                await refreshTasks();
            } catch (e) {
                showToast('Error al cerrar el Pomodoro', 'danger');
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
            try {
                await modal.onDidDismiss();
                await refreshTasks();
            } catch (e) {
                showToast('Error al cerrar el Pomodoro', 'danger');
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

        // expose goBack to template
        return {
            tasks,
            stats,
            selectedStatus,
            loading,
            hasActiveSession,
            filtersState,
            activeView,
            onViewChange,
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
            checkmarkDoneOutline, timerOutline, closeOutline,
            goBack
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
    color: #3880ff;
}

.stat-icon.warning {
    color: var(--ion-color-warning);
}

.stat-icon.danger {
    color: var(--ion-color-danger);
}

.stat-icon.primary {
    color: #3880ff;
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

/* segment removed; selects used for ordering */

/* Chips oscuros en la lista de tareas con gradiente y mejor contraste */
ion-chip {
    background: linear-gradient(90deg, #23272f 0%, #181a20 100%) !important;
    color: #fff !important;
    border-radius: 16px !important;
    font-weight: 600 !important;
    font-size: 15px !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12) !important;
    border: none !important;
    padding: 7px 14px !important;
    display: flex;
    align-items: center;
    gap: 6px;
}

ion-chip ion-label {
    color: #fff !important;
    font-size: 15px !important;
    font-weight: 600 !important;
    letter-spacing: 0.5px;
}

ion-chip ion-icon {
    color: #fff !important;
    font-size: 18px !important;
    margin-right: 4px;
    vertical-align: middle;
    filter: drop-shadow(0 0 2px #000);
}
</style>
