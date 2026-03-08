<template>
    <ion-button :fill="isFollowing ? 'outline' : 'solid'" :color="isFollowing ? 'medium' : 'primary'"
        :disabled="isLoading" @click.stop="handleToggleFollow" :class="['follow-button', { 'icon-only': iconOnly }]">
        <ion-spinner v-if="isLoading" name="crescent" slot="start"></ion-spinner>
        <svg v-else-if="!isFollowing" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            class="custom-icon" slot="start">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
            <path d="M16 19h6" />
            <path d="M19 16v6" />
            <path d="M6 21v-2a4 4 0 0 1 4 -4h4" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="custom-icon"
            slot="start">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path d="M5 12l5 5l10 -10" />
        </svg>
        <ion-label v-if="!iconOnly">{{ buttonText }}</ion-label>
    </ion-button>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { IonButton, IonLabel, IonSpinner, toastController } from '@ionic/vue';
import { followersService } from '@/services/followersService';

const props = defineProps({
    userId: {
        type: Number,
        required: true
    },
    initialFollowStatus: {
        type: Boolean,
        default: false
    },
    followersCount: {
        type: Number,
        default: 0
    },
    iconOnly: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['follow', 'unfollow', 'update']);

const isFollowing = ref(props.initialFollowStatus);
const isLoading = ref(false);
const localFollowersCount = ref(props.followersCount);

// Observar cambios en initialFollowStatus para actualizar el estado interno
watch(() => props.initialFollowStatus, (newValue) => {
    console.log('[FollowButton] initialFollowStatus cambió:', newValue, 'para userId:', props.userId);
    isFollowing.value = newValue;
});

// Observar cambios en followersCount
watch(() => props.followersCount, (newValue) => {
    console.log('[FollowButton] followersCount cambió:', newValue, 'para userId:', props.userId);
    localFollowersCount.value = newValue;
});

const buttonText = computed(() => {
    if (isLoading.value) return 'Procesando...';
    return isFollowing.value ? 'Siguiendo' : 'Seguir';
});

const handleToggleFollow = async () => {
    if (isLoading.value) return;

    isLoading.value = true;
    const previousState = isFollowing.value;
    const previousCount = localFollowersCount.value;

    // Actualización optimista
    isFollowing.value = !previousState;
    localFollowersCount.value = isFollowing.value
        ? previousCount + 1
        : Math.max(0, previousCount - 1);

    console.log('[FollowButton] Toggle follow - Estado antes:', {
        userId: props.userId,
        isFollowing: previousState,
        followersCount: previousCount
    });

    try {
        const result = await followersService.toggleFollow(props.userId);

        console.log('[FollowButton] Resultado del servicio:', result);

        if (result.success && result.data) {
            // Actualizar con datos reales del backend
            // Manejar diferentes estructuras de respuesta

            console.log('[FollowButton] Data recibida:', result.data);
            console.log('[FollowButton] result.data.is_following:', result.data.is_following);
            console.log('[FollowButton] result.data.isFollowing:', result.data.isFollowing);

            // Si el backend envía is_following, úsalo
            // Si no, mantén el estado optimista (toggle del estado anterior)
            let newFollowStatus;
            if (result.data.is_following !== undefined && result.data.is_following !== null) {
                newFollowStatus = result.data.is_following;
            } else if (result.data.isFollowing !== undefined && result.data.isFollowing !== null) {
                newFollowStatus = result.data.isFollowing;
            } else {
                // Si el backend no envía el estado, mantener el estado optimista
                newFollowStatus = !previousState;
                console.log('[FollowButton] ⚠️ Backend no retornó is_following, usando estado optimista');
            }

            const followersCount = result.data.followers_count ?? result.data.followersCount ?? localFollowersCount.value;

            isFollowing.value = newFollowStatus;
            localFollowersCount.value = followersCount;

            console.log('[FollowButton] Toggle follow - Estado final:', {
                userId: props.userId,
                isFollowing: isFollowing.value,
                followersCount: localFollowersCount.value,
                dataRecibida: result.data
            });

            // Emitir evento según la acción
            if (isFollowing.value) {
                emit('follow', {
                    userId: props.userId,
                    followersCount: localFollowersCount.value
                });
            } else {
                emit('unfollow', {
                    userId: props.userId,
                    followersCount: localFollowersCount.value
                });
            }

            // Emitir evento de actualización general
            emit('update', {
                userId: props.userId,
                isFollowing: isFollowing.value,
                followersCount: localFollowersCount.value
            });
        } else {
            // Si falla, revertir
            console.error('[FollowButton] Error:', result.error);
            isFollowing.value = previousState;
            localFollowersCount.value = previousCount;

            const toast = await toastController.create({
                message: result.error || 'Error al procesar la acción',
                duration: 2000,
                position: 'bottom',
                color: 'danger'
            });
            await toast.present();
        }
    } catch (error) {
        console.error('[FollowButton] Error inesperado:', error);
        // Revertir en caso de error
        isFollowing.value = previousState;
        localFollowersCount.value = previousCount;

        const toast = await toastController.create({
            message: 'Error al procesar la acción',
            duration: 2000,
            position: 'bottom',
            color: 'danger'
        });
        await toast.present();
    } finally {
        isLoading.value = false;
    }
};

// Exponer métodos públicos
defineExpose({
    isFollowing,
    followersCount: localFollowersCount
});
</script>

<style scoped>
.follow-button {
    --padding-start: 16px;
    --padding-end: 16px;
    min-width: 120px;
    text-transform: none;
    font-weight: 600;
}

.follow-button.icon-only {
    --padding-start: 12px;
    --padding-end: 12px;
    min-width: 44px;
    width: 44px;
    height: 44px;
    --border-radius: 50%;
}

.follow-button.icon-only ion-icon {
    margin: 0;
}

.follow-button.icon-only .custom-icon {
    margin: 0;
}

.follow-button .custom-icon {
    margin-inline-end: 8px;
}

.follow-button ion-spinner {
    width: 16px;
    height: 16px;
}

.follow-button ion-icon {
    font-size: 18px;
    margin-right: 4px;
}
</style>
