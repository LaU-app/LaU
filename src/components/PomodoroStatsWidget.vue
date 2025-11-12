<template>
    <ion-card class="pomodoro-widget">
        <ion-card-header>
            <ion-card-title>
                <ion-icon :icon="flameOutline"></ion-icon>
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
                    <div class="stat-value">{{ stats.pomodoros_today }}</div>
                    <div class="stat-label">Hoy</div>
                </div>

                <div class="stat-box">
                    <div class="stat-value">{{ stats.pomodoros_this_week }}</div>
                    <div class="stat-label">Esta Semana</div>
                </div>
            </div>

            <ion-button expand="block" size="small" @click="$emit('start-pomodoro')" class="quick-start-btn">
                <ion-icon slot="start" :icon="playCircleOutline"></ion-icon>
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
import { flameOutline, playCircleOutline } from 'ionicons/icons';
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
            flameOutline,
            playCircleOutline
        };
    }
};
</script>

<style scoped>
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
    background: linear-gradient(135deg, var(--ion-color-danger), var(--ion-color-primary));
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
    --color: var(--ion-color-danger);
    font-weight: 600;
}
</style>
