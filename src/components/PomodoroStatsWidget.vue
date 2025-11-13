<template>
    <ion-card class="pomodoro-widget">
        <ion-card-header>
            <ion-card-title>
                <!-- Custom Flame SVG Icon for Widget Title, fully inline-styled, no class -->
                <svg width="20" height="20" viewBox="0 0 24 24" style="vertical-align: middle; margin-right: 6px;"
                    xmlns="http://www.w3.org/2000/svg">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path fill="#3880ff" stroke="#3880ff" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M12 2C12 2 7 8 7 12C7 15.3137 9.68629 18 13 18C16.3137 18 19 15.3137 19 12C19 8 12 2 12 2Z" />
                    <path fill="none" stroke="#3880ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                        d="M12 12V22" />
                </svg>
                Productividad
            </ion-card-title>
        </ion-card-header>

        <ion-card-content>
            <div v-if="loading" class="widget-loading">
                <ion-spinner name="dots"></ion-spinner>
            </div>

            <div v-else-if="stats" class="stats-grid">
                <div class="stat-box" @click="$emit('open-tasks')">
                    <div class="stat-value">{{ stats.pending }}</div>
                    <div class="stat-label">Pendientes</div>
                </div>

                <div class="stat-box highlight" @click="$emit('open-pomodoro')">
                    <div class="stat-value">
                        <span v-if="stats.pomodoros_today < 1">
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
                        {{ stats.pomodoros_today }}
                    </div>
                    <div class="stat-label">Hoy</div>
                </div>

                <div class="stat-box">
                    <div class="stat-value">
                        <!-- Custom Hourglass SVG for Pomodoros This Week, azul directo -->
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                            style="vertical-align: middle; margin-right: 4px;">
                            <path :fill="stats.pomodoros_this_week > 0 ? '#3880ff' : 'none'"
                                :stroke="stats.pomodoros_this_week > 0 ? '#3880ff' : '#3880ff'" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round"
                                d="M6 2h12M6 22h12M6 2c0 6 6 6 6 10s-6 4-6 10M18 2c0 6-6 6-6 10s6 4 6 10" />
                        </svg>
                        {{ stats.pomodoros_this_week }}
                    </div>
                    <div class="stat-label">Esta Semana</div>
                </div>
            </div>

            <ion-button expand="block" size="small" @click="$emit('start-pomodoro')" class="quick-start-btn">
                <ion-icon :icon="playCircleOutline"></ion-icon>
                Iniciar Pomodoro
            </ion-button>
        </ion-card-content>
    </ion-card>
</template>

<script>
import {
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonButton, IonIcon, IonSpinner
} from '@ionic/vue';
import { playCircleOutline } from 'ionicons/icons';
import { ref, onMounted } from 'vue';
import tasksService from '@/services/tasksService';

export default {
    name: 'PomodoroStatsWidget',
    components: {
        IonCard, IonCardHeader, IonCardTitle, IonCardContent,
        IonButton, IonIcon, IonSpinner
    },
    emits: ['open-tasks', 'open-pomodoro', 'start-pomodoro'],
    setup() {
        const stats = ref(null);
        const loading = ref(true);

        const loadStats = async () => {
            loading.value = true;
            try {
                const response = await tasksService.getTasksStats();
                stats.value = response.data;
            } catch (error) {
                console.error('Error loading stats:', error);
            } finally {
                loading.value = false;
            }
        };

        onMounted(() => {
            loadStats();
        });

        return {
            stats,
            loading,
            playCircleOutline
        };
    }
};
</script>

<style scoped>
/* Eliminado: ya no se usa ninguna clase ni override para el icono de fuego, todo es inline SVG */

.pomodoro-widget {
    margin: 16px;
    background: linear-gradient(135deg, var(--ion-color-danger-tint), var(--ion-color-primary-tint));
}

ion-card-title {
    display: flex;
    align-items: center;
    gap: 8px;
    color: white;
}

ion-card-title ion-icon {
    font-size: 24px;
}

.widget-loading {
    display: flex;
    justify-content: center;
    padding: 24px;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 16px;
}

.stat-box {
    background: rgba(255, 255, 255, 0.9);
    padding: 16px;
    border-radius: 12px;
    text-align: center;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
}

.stat-box:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-box.highlight {
    background: linear-gradient(135deg, #3880ff, #4bc0ff);
    color: white;
}

.stat-value {
    font-size: 28px;
    font-weight: bold;
    color: var(--ion-text-color);
}

.stat-box.highlight .stat-value,
.stat-box.highlight .stat-label {
    color: white;
}

.stat-label {
    font-size: 12px;
    color: var(--ion-color-medium);
    margin-top: 4px;
}

.quick-start-btn {
    margin-top: 8px;
    --background: white;
    font-weight: 600;
}
</style>
