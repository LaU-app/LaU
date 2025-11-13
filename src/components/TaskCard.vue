<template>
    <ion-item-sliding>
        <ion-item button @click="$emit('click')" class="task-item">
            <div class="task-content">
                <div class="task-info">
                    <h3 class="task-title">{{ task.title }}</h3>

                    <p v-if="task.description" class="task-description">
                        {{ truncate(task.description, 60) }}
                    </p>

                    <div class="task-meta">
                        <!-- Pendiente -->
                        <svg v-if="task.status === 'pending'" xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                            viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round"
                            stroke-linejoin="round" class="status-icon">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                            <path d="M3 12v.01" />
                            <path d="M7.5 19.8v.01" />
                            <path d="M4.2 16.5v.01" />
                            <path d="M4.2 7.5v.01" />
                            <path d="M12 21a8.994 8.994 0 0 0 6.362 -2.634m1.685 -2.336a9 9 0 0 0 -8.047 -13.03" />
                            <path d="M3 3l18 18" />
                        </svg>
                        <!-- Completada -->
                        <svg v-else-if="task.status === 'completed'" xmlns="http://www.w3.org/2000/svg" width="20"
                            height="20" viewBox="0 0 24 24" fill="none" stroke="#8A2BE2" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round" class="status-icon">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                            <path d="M10 20.777a8.942 8.942 0 0 1 -2.48 -.969" />
                            <path d="M14 3.223a9.003 9.003 0 0 1 0 17.554" />
                            <path d="M4.579 17.093a8.961 8.961 0 0 1 -1.227 -2.592" />
                            <path d="M3.124 10.5c.16 -.95 .468 -1.85 .9 -2.675l.169 -.305" />
                            <path d="M6.907 4.579a8.954 8.954 0 0 1 3.093 -1.356" />
                            <path d="M9 12l2 2l4 -4" />
                        </svg>
                        <!-- En Curso -->
                        <svg v-else-if="task.status === 'in_progress'" xmlns="http://www.w3.org/2000/svg" width="20"
                            height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round" class="status-icon">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                            <path d="M10 20.777a8.942 8.942 0 0 1 -2.48 -.969" />
                            <path d="M14 3.223a9.003 9.003 0 0 1 0 17.554" />
                            <path d="M4.579 17.093a8.961 8.961 0 0 1 -1.227 -2.592" />
                            <path d="M3.124 10.5c.16 -.95 .468 -1.85 .9 -2.675l.169 -.305" />
                            <path d="M6.907 4.579a8.954 8.954 0 0 1 3.093 -1.356" />
                        </svg>

                        <ion-chip v-if="task.due_date" size="small" class="due-date-chip">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                fill="currentColor" style="margin-right: 4px;">
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
                            <ion-label>{{ formatDueDate(task.due_date) }}</ion-label>
                        </ion-chip>

                        <ion-chip size="small" class="priority-chip">
                            <ion-icon :icon="flagOutline"></ion-icon>
                            <ion-label>{{ getPriorityText() }}</ion-label>
                        </ion-chip>

                        <ion-chip v-if="task.estimated_pomodoros" size="small">
                            <!-- Icono filled cuando está completo -->
                            <svg v-if="task.completed_pomodoros >= task.estimated_pomodoros"
                                xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                fill="currentColor" style="margin-right: 4px;">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path
                                    d="M10 2c0 -.88 1.056 -1.331 1.692 -.722c1.958 1.876 3.096 5.995 1.75 9.12l-.08 .174l.012 .003c.625 .133 1.203 -.43 2.303 -2.173l.14 -.224a1 1 0 0 1 1.582 -.153c1.334 1.435 2.601 4.377 2.601 6.27c0 4.265 -3.591 7.705 -8 7.705s-8 -3.44 -8 -7.706c0 -2.252 1.022 -4.716 2.632 -6.301l.605 -.589c.241 -.236 .434 -.43 .618 -.624c1.43 -1.512 2.145 -2.924 2.145 -4.78" />
                            </svg>
                            <!-- Icono outline cuando no está completo -->
                            <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"
                                stroke-linejoin="round" style="margin-right: 4px;">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <path
                                    d="M12 10.941c2.333 -3.308 .167 -7.823 -1 -8.941c0 3.395 -2.235 5.299 -3.667 6.706c-1.43 1.408 -2.333 3.621 -2.333 5.588c0 3.704 3.134 6.706 7 6.706s7 -3.002 7 -6.706c0 -1.712 -1.232 -4.403 -2.333 -5.588c-2.084 3.353 -3.257 3.353 -4.667 2.235" />
                            </svg>
                            <ion-label>{{ task.completed_pomodoros }}/{{ task.estimated_pomodoros }}</ion-label>
                        </ion-chip>
                    </div>
                </div>

                <!-- Quick action button -->
                <ion-button v-if="task.status !== 'completed'" fill="solid" @click.stop="$emit('start-pomodoro', task)"
                    class="pomodoro-btn">
                    <!-- Icono hourglass: filled si hay pomodoros hoy, outline si no -->
                    <svg v-if="task.completed_pomodoros_today > 0" xmlns="http://www.w3.org/2000/svg" width="16"
                        height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path
                            d="M17 2a2 2 0 0 1 1.995 1.85l.005 .15v2a6.996 6.996 0 0 1 -3.393 6a6.994 6.994 0 0 1 3.388 5.728l.005 .272v2a2 2 0 0 1 -1.85 1.995l-.15 .005h-10a2 2 0 0 1 -1.995 -1.85l-.005 -.15v-2a6.996 6.996 0 0 1 3.393 -6a6.994 6.994 0 0 1 -3.388 -5.728l-.005 -.272v-2a2 2 0 0 1 1.85 -1.995l.15 -.005h10z" />
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"
                        stroke-linejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d="M6 20v-2a6 6 0 1 1 12 0v2a1 1 0 0 1 -1 1h-10a1 1 0 0 1 -1 -1z" />
                        <path d="M6 4v2a6 6 0 1 0 12 0v-2a1 1 0 0 0 -1 -1h-10a1 1 0 0 0 -1 1z" />
                    </svg>
                </ion-button>
            </div>
        </ion-item>
        <ion-item-options>
            <ion-item-option color="success" @click="handleComplete" v-if="task.status !== 'completed'">
                <ion-icon :icon="checkmarkOutline"></ion-icon>
            </ion-item-option>
            <ion-item-option color="danger" @click="handleDelete">
                <ion-icon :icon="trashOutline"></ion-icon>
            </ion-item-option>
        </ion-item-options>
    </ion-item-sliding>
</template>

<script setup>
import { computed } from 'vue';
import {
    IonItem, IonItemSliding, IonItemOptions, IonItemOption,
    IonButton, IonIcon, IonChip, IonLabel,
    alertController, toastController
} from '@ionic/vue';
import { flagOutline, checkmarkOutline, trashOutline } from 'ionicons/icons';

const props = defineProps({
    task: {
        type: Object,
        required: true
    }
});
const emit = defineEmits(['click', 'start-pomodoro', 'update']);

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

const isOverdue = computed(() => {
    if (!props.task.due_date) return false;
    const dueDate = new Date(props.task.due_date);
    const now = new Date();
    return dueDate < now;
});

const getPriorityText = () => {
    if (props.task.priority === 'high') return 'Alta';
    if (props.task.priority === 'medium') return 'Media';
    if (props.task.priority === 'low') return 'Baja';
    return 'Media';
};

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
    gap: 6px;
    flex-wrap: wrap;
    align-items: center;
}

.task-meta ion-chip {
    margin: 0;
    height: 24px;
}

.status-icon {
    flex-shrink: 0;
}

/* Los colores de los iconos de estado se definen inline en el SVG */

.due-date-chip {
    --background: #e5e7eb;
    --color: #6b7280;
}

.due-date-chip svg {
    fill: #6b7280;
}

.priority-chip {
    --background: #e5e7eb;
    --color: #6b7280;
}

.pomodoro-btn {
    margin-left: 8px;
    --padding-start: 8px;
    --padding-end: 8px;
    --border-radius: 50%;
    width: 36px;
    height: 36px;
    --background: #3880ff;
}

.pomodoro-btn svg {
    fill: white;
}

.pomodoro-btn {
    margin-left: 8px;
    --padding-start: 8px;
    --padding-end: 8px;
    --border-radius: 50%;
    width: 36px;
    height: 36px;
    --background: #3880ff;
    display: flex;
    align-items: center;
    justify-content: center;
}

.pomodoro-btn svg {
    fill: white;
    margin: 0;
    display: block;
}

ion-item-option ion-icon {
    font-size: 24px;
}
</style>
