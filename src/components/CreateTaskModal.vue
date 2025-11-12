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
                <ion-item>
                    <ion-label position="stacked">Título *</ion-label>
                    <ion-input v-model="form.title" placeholder="Ej: Estudiar para examen de matemáticas"
                        required></ion-input>
                </ion-item>

                <!-- Descripción -->
                <ion-item>
                    <ion-label position="stacked">Descripción</ion-label>
                    <ion-textarea v-model="form.description" placeholder="Agrega detalles sobre la tarea..."
                        :rows="4"></ion-textarea>
                </ion-item>

                <!-- Prioridad -->
                <ion-item>
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

                <!-- Fecha de vencimiento -->
                <ion-item>
                    <ion-label position="stacked">Fecha de vencimiento</ion-label>
                    <ion-datetime-button datetime="due-date"></ion-datetime-button>

                    <ion-modal :keep-contents-mounted="true">
                        <ion-datetime id="due-date" v-model="form.due_date" presentation="date"
                            :min="new Date().toISOString()"></ion-datetime>
                    </ion-modal>
                </ion-item>

                <!-- Pomodoros estimados -->
                <ion-item>
                    <ion-label position="stacked">Pomodoros estimados</ion-label>
                    <ion-input v-model.number="form.estimated_pomodoros" type="number" min="1"
                        placeholder="¿Cuántos pomodoros necesitas?"></ion-input>
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
    closeOutline, flagOutline, informationCircleOutline
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
            estimated_pomodoros: props.task?.estimated_pomodoros || null
        });

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
            // Icons
            closeOutline, flagOutline, informationCircleOutline
        };
    }
};
</script>

<style scoped>
ion-item {
    margin-bottom: 16px;
}

ion-label {
    font-weight: 500;
    margin-bottom: 8px;
}

.pomodoro-info {
    margin-top: 24px;
    background: var(--ion-color-primary-tint);
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
    color: var(--ion-text-color);
}

.info-hint {
    margin: 0;
    font-size: 14px;
    color: var(--ion-color-medium);
    line-height: 1.4;
}
</style>
