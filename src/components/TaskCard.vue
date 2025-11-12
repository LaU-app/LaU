<template>
    <ion-item-sliding>
        <ion-item button @click="$emit('click')" class="task-item">
            <div class="task-content">
                <!-- Priority indicator -->
                <div class="priority-indicator" :class="`priority-${task.priority}`"></div>

                <div class="task-info">
                    <h3 class="task-title">{{ task.title }}</h3>

                    <p v-if="task.description" class="task-description">
                        {{ truncate(task.description, 60) }}
                    </p>

                    <div class="task-meta">
                        <ion-chip :color="statusColor" size="small">
                            <ion-label>{{ statusText }}</ion-label>
                        </ion-chip>

                        <ion-chip v-if="task.due_date" :color="dueDateColor" size="small">
                            <ion-icon :icon="calendarOutline"></ion-icon>
                            <ion-label>{{ formatDueDate(task.due_date) }}</ion-label>
                        </ion-chip>

                        <ion-chip v-if="task.estimated_pomodoros" size="small">
                            <ion-icon :icon="flameOutline"></ion-icon>
                            <ion-label>{{ task.completed_pomodoros }}/{{ task.estimated_pomodoros }}</ion-label>
                        </ion-chip>
                    </div>
                </div>

                <!-- Quick action button -->
                <ion-button v-if="task.status !== 'completed'" fill="clear" @click.stop="$emit('start-pomodoro', task)"
                    class="pomodoro-btn">
                    <ion-icon :icon="timerOutline" slot="icon-only"></ion-icon>
                </ion-button>
            </div>
        </ion-item>

        <ion-item-options side="end">
            <ion-item-option color="success" @click="handleComplete" v-if="task.status !== 'completed'">
                <ion-icon :icon="checkmarkOutline" slot="icon-only"></ion-icon>
            </ion-item-option>
            <ion-item-option color="danger" @click="handleDelete">
                <ion-icon :icon="trashOutline" slot="icon-only"></ion-icon>
            </ion-item-option>
        </ion-item-options>
    </ion-item-sliding>
</template>

<script>
import {
    IonItem, IonItemSliding, IonItemOptions, IonItemOption,
    IonButton, IonIcon, IonChip, IonLabel,
    alertController, toastController
} from '@ionic/vue';
import {
    calendarOutline, flameOutline, timerOutline,
    checkmarkOutline, trashOutline
} from 'ionicons/icons';
import { computed } from 'vue';
import tasksService from '@/services/tasksService';

export default {
    name: 'TaskCard',
    components: {
        IonItem, IonItemSliding, IonItemOptions, IonItemOption,
        IonButton, IonIcon, IonChip, IonLabel
    },
    props: {
        task: {
            type: Object,
            required: true
        }
    },
    emits: ['click', 'start-pomodoro', 'update'],
    setup(props, { emit }) {
        const statusColor = computed(() => {
            const colors = {
                pending: 'warning',
                in_progress: 'primary',
                completed: 'success',
                cancelled: 'medium'
            };
            return colors[props.task.status] || 'medium';
        });

        const statusText = computed(() => {
            const texts = {
                pending: 'Pendiente',
                in_progress: 'En Curso',
                completed: 'Completada',
                cancelled: 'Cancelada'
            };
            return texts[props.task.status] || props.task.status;
        });

        const dueDateColor = computed(() => {
            if (!props.task.due_date) return 'medium';

            const dueDate = new Date(props.task.due_date);
            const now = new Date();
            const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

            if (diffDays < 0) return 'danger';
            if (diffDays <= 1) return 'warning';
            return 'medium';
        });

        const formatDueDate = (dateString) => {
            if (!dateString) return '';

            const date = new Date(dateString);
            const now = new Date();
            const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

            if (diffDays < 0) return `Vencida ${Math.abs(diffDays)}d`;
            if (diffDays === 0) return 'Hoy';
            if (diffDays === 1) return 'Mañana';
            if (diffDays <= 7) return `En ${diffDays}d`;

            return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        };

        const truncate = (text, length) => {
            if (!text) return '';
            return text.length > length ? text.substring(0, length) + '...' : text;
        };

        const handleComplete = async () => {
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
                                await tasksService.completeTask(props.task.id);
                                showToast('Tarea completada', 'success');
                                emit('update');
                            } catch (error) {
                                console.error('Error al completar tarea:', error);
                                showToast('Error al completar tarea', 'danger');
                            }
                        }
                    }
                ]
            });

            await alert.present();
        };

        const handleDelete = async () => {
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
                                await tasksService.deleteTask(props.task.id);
                                showToast('Tarea eliminada', 'success');
                                emit('update');
                            } catch (error) {
                                console.error('Error al eliminar tarea:', error);
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

        return {
            statusColor,
            statusText,
            dueDateColor,
            formatDueDate,
            truncate,
            handleComplete,
            handleDelete,
            // Icons
            calendarOutline, flameOutline, timerOutline,
            checkmarkOutline, trashOutline
        };
    }
};
</script>

<style scoped>
.task-item {
    --padding-start: 0;
    margin-bottom: 8px;
}

.task-content {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 12px 16px;
}

.priority-indicator {
    width: 4px;
    height: 48px;
    border-radius: 2px;
    margin-right: 12px;
    flex-shrink: 0;
}

.priority-indicator.priority-high {
    background: var(--ion-color-danger);
}

.priority-indicator.priority-medium {
    background: var(--ion-color-warning);
}

.priority-indicator.priority-low {
    background: var(--ion-color-success);
}

.task-info {
    flex: 1;
    min-width: 0;
}

.task-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--ion-text-color);
    margin: 0 0 4px 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.task-description {
    font-size: 14px;
    color: var(--ion-color-medium);
    margin: 0 0 8px 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.task-meta {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
}

.task-meta ion-chip {
    margin: 0;
    height: 24px;
}

.pomodoro-btn {
    margin-left: 8px;
    --padding-start: 8px;
    --padding-end: 8px;
}

ion-item-option ion-icon {
    font-size: 24px;
}
</style>
