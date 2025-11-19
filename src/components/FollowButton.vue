<template>
    <ion-button :fill="isFollowing ? 'outline' : 'solid'" :color="isFollowing ? 'medium' : 'primary'"
        :disabled="isLoading" @click.stop="handleToggleFollow" class="follow-button">
        <ion-spinner v-if="isLoading" name="crescent" slot="start"></ion-spinner>
        <ion-icon v-else-if="!isFollowing" :icon="personAddOutline" slot="start"></ion-icon>
        <ion-icon v-else :icon="checkmarkOutline" slot="start"></ion-icon>
        <ion-label>{{ buttonText }}</ion-label>
    </ion-button>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { IonButton, IonIcon, IonLabel, IonSpinner, toastController } from '@ionic/vue';
import { personAddOutline, checkmarkOutline } from 'ionicons/icons';
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

.follow-button ion-spinner {
    width: 16px;
    height: 16px;
}

.follow-button ion-icon {
    font-size: 18px;
    margin-right: 4px;
}
</style>
