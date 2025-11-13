<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-button @click="dismissModal">
                        <ion-icon :icon="closeOutline"></ion-icon>
                    </ion-button>
                </ion-buttons>
                <ion-title>{{ editMode ? 'Editar Tarea' : 'Nueva Tarea' }}</ion-title>
                <ion-buttons slot="end">
                    <ion-button @click="handleSave" :disabled="!form.title.trim()">
                        <strong>Guardar</strong>
                    </ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
            <form @submit.prevent="handleSave">
                <!-- Título -->
                <ion-item lines="inset">
                    <ion-label position="stacked">Título *</ion-label>
                    <ion-input v-model="form.title" placeholder="Ej: Estudiar para examen de matemáticas"
                        required></ion-input>
                </ion-item>

                <!-- Descripción -->
                <ion-item lines="inset">
                    <ion-label position="stacked">Descripción</ion-label>
                    <ion-textarea v-model="form.description" placeholder="Agrega detalles sobre la tarea..."
                        :rows="4"></ion-textarea>
                </ion-item>

                <!-- Prioridad -->
                <ion-item lines="inset">
                    <ion-label position="stacked">Prioridad</ion-label>
                    <ion-select v-model="form.priority" interface="popover">
                        <ion-select-option value="low">
                            <ion-icon :icon="flagOutline"></ion-icon>
                            Baja
                        </ion-select-option>
                        <ion-select-option value="medium">Media</ion-select-option>
                        <ion-select-option value="high">Alta</ion-select-option>
                    </ion-select>
                </ion-item>

                <!-- Fecha y hora de vencimiento -->
                <ion-item lines="inset" class="date-item">
                    <ion-label position="stacked">Fecha y hora de vencimiento</ion-label>
                    <ion-button id="open-date-modal" expand="block" fill="outline" class="date-button">
                        <ion-icon :icon="calendarOutline"></ion-icon>
                        {{ formatDateDisplay(form.due_date) }}
                    </ion-button>
                </ion-item>

                <ion-modal trigger="open-date-modal" :keep-contents-mounted="true">
                    <ion-datetime v-model="form.due_date" presentation="date-time"
                        :min="editMode ? undefined : new Date().toISOString()" :show-default-buttons="true"
                        done-text="Confirmar" cancel-text="Cancelar"></ion-datetime>
                </ion-modal>

                <!-- Pomodoros estimados -->
                <ion-item lines="inset" class="pomodoro-item">
                    <ion-label position="stacked">Pomodoros estimados</ion-label>
                    <div class="pomodoro-counter">
                        <ion-button fill="clear" @click="decrementPomodoros" :disabled="form.estimated_pomodoros <= 1">
                            <ion-icon :icon="removeCircleOutline"></ion-icon>
                        </ion-button>
                        <ion-input v-model.number="form.estimated_pomodoros" type="number" min="1"
                            class="pomodoro-input" readonly></ion-input>
                        <ion-button fill="clear" @click="incrementPomodoros">
                            <ion-icon :icon="addCircleOutline"></ion-icon>
                        </ion-button>
                    </div>
                </ion-item>

                <!-- Info de Pomodoro -->
                <ion-card class="pomodoro-info">
                    <ion-card-content>
                        <div class="info-row">
                            <ion-icon :icon="informationCircleOutline"></ion-icon>
                            <p>1 Pomodoro = 25 minutos de trabajo enfocado</p>
                        </div>
                        <p class="info-hint">
                            Estima cuántos bloques de 25 minutos necesitarás para completar esta tarea.
                        </p>
                    </ion-card-content>
                </ion-card>
            </form>
        </ion-content>
    </ion-page>
</template>

<script>
import {
    IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
    IonButton, IonButtons, IonIcon, IonItem, IonLabel,
    IonInput, IonTextarea, IonSelect, IonSelectOption,
    IonDatetime, IonDatetimeButton, IonModal, IonCard,
    IonCardContent, modalController, toastController
} from '@ionic/vue';
import {
    closeOutline, flagOutline, informationCircleOutline,
    addCircleOutline, removeCircleOutline, calendarOutline
} from 'ionicons/icons';
import { ref, reactive } from 'vue';
import tasksService from '@/services/tasksService';

export default {
    name: 'CreateTaskModal',
    components: {
        IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
        IonButton, IonButtons, IonIcon, IonItem, IonLabel,
        IonInput, IonTextarea, IonSelect, IonSelectOption,
        IonDatetime, IonDatetimeButton, IonModal, IonCard,
        IonCardContent
    },
    props: {
        task: {
            type: Object,
            default: null
        }
    },
    setup(props) {
        const editMode = ref(!!props.task);

        const form = reactive({
            title: props.task?.title || '',
            description: props.task?.description || '',
            priority: props.task?.priority || 'medium',
            due_date: props.task?.due_date || null,
            estimated_pomodoros: props.task?.estimated_pomodoros || 1
        });

        const incrementPomodoros = () => {
            if (!form.estimated_pomodoros) form.estimated_pomodoros = 0;
            form.estimated_pomodoros++;
        };

        const decrementPomodoros = () => {
            if (form.estimated_pomodoros > 1) {
                form.estimated_pomodoros--;
            }
        };

        const formatDateDisplay = (dateString) => {
            if (!dateString) return 'Seleccionar fecha y hora';

            const date = new Date(dateString);
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');

            return `${day}/${month}/${year} - ${hours}:${minutes}`;
        };

        const dismissModal = async () => {
            await modalController.dismiss();
        };

        const handleSave = async () => {
            if (!form.title.trim()) {
                showToast('El título es requerido', 'warning');
                return;
            }

            try {
                const taskData = {
                    title: form.title.trim(),
                    description: form.description?.trim() || null,
                    priority: form.priority,
                    due_date: form.due_date,
                    estimated_pomodoros: form.estimated_pomodoros || null
                };

                if (editMode.value) {
                    await tasksService.updateTask(props.task.id, taskData);
                    showToast('Tarea actualizada', 'success');
                } else {
                    await tasksService.createTask(taskData);
                    showToast('Tarea creada', 'success');
                }

                await modalController.dismiss({ created: true });
            } catch (error) {
                console.error('Error saving task:', error);
                showToast(
                    error.response?.data?.message || 'Error al guardar la tarea',
                    'danger'
                );
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

        return {
            editMode,
            form,
            dismissModal,
            handleSave,
            incrementPomodoros,
            decrementPomodoros,
            formatDateDisplay,
            // Icons
            closeOutline, flagOutline, informationCircleOutline,
            addCircleOutline, removeCircleOutline, calendarOutline
        };
    }
};
</script>

<style scoped>
ion-item {
    margin-bottom: 16px;
    --highlight-height: 2px;
    --highlight-color-focused: var(--ion-color-primary);
    --padding-start: 16px;
    --inner-padding-end: 16px;
}

ion-label {
    font-weight: 500;
    margin-bottom: 8px;
}

/* Fecha de vencimiento */
.date-item {
    display: block;
}

.date-item ion-label {
    padding-left: 16px;
    display: block;
    margin-bottom: 8px;
}

.date-button {
    margin-top: 8px;
    margin-left: 16px;
    margin-bottom: 8px;
    width: calc(100% - 32px);
    text-transform: none;
    --padding-start: 12px;
    --padding-end: 12px;
    height: 40px;
}

.date-button ion-icon {
    margin-right: 8px;
    font-size: 20px;
}

/* Contador de pomodoros */
.pomodoro-item {
    display: block;
}

.pomodoro-item ion-label {
    padding-left: 16px;
    display: block;
    margin-bottom: 8px;
}

.pomodoro-counter {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 8px;
    margin-bottom: 8px;
    padding: 0 16px;
    width: 100%;
}

.pomodoro-counter ion-button {
    --color: var(--ion-color-primary);
    margin: 0;
}

.pomodoro-counter ion-icon {
    font-size: 32px;
}

.pomodoro-input {
    text-align: center;
    font-size: 24px;
    font-weight: 600;
    max-width: 80px;
    --padding-start: 0;
    --padding-end: 0;
}

/* Card de información */
.pomodoro-info {
    margin-top: 24px;
    background: #e0e7ff;
    border-left: 4px solid var(--ion-color-primary);
}

.info-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
}

.info-row ion-icon {
    font-size: 24px;
    color: var(--ion-color-primary);
    flex-shrink: 0;
}

.info-row p {
    margin: 0;
    font-weight: 600;
    color: #1e293b;
}

.info-hint {
    margin: 0;
    margin-left: 36px;
    font-size: 14px;
    color: #475569;
    line-height: 1.4;
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
    .pomodoro-info {
        background: #1e293b;
    }

    .info-row p {
        color: #e2e8f0;
    }

    .info-hint {
        color: #94a3b8;
    }
}
</style>
