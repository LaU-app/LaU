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

watch(() => props.initialFollowStatus, value => { isFollowing.value = value; });
watch(() => props.followersCount, value => { localFollowersCount.value = value; });

const buttonText = computed(() => isLoading.value ? 'Procesando...' : isFollowing.value ? 'Siguiendo' : 'Seguir');

function applyFollowState(data) {
    isFollowing.value = data.is_following;
    if (data.followers_count !== undefined) localFollowersCount.value = data.followers_count;
    const detail = { userId: props.userId, isFollowing: isFollowing.value, followersCount: localFollowersCount.value };
    emit(isFollowing.value ? 'follow' : 'unfollow', detail);
    emit('update', detail);
}

const handleToggleFollow = async () => {
    if (isLoading.value) return;
    isLoading.value = true;
    try {
        const result = isFollowing.value
            ? await followersService.unfollowUser(props.userId)
            : await followersService.followUser(props.userId);
        if (result.success && typeof result.data?.is_following === 'boolean') {
            applyFollowState(result.data);
            return;
        }

        // Reconcile with the server if a request failed after storing the relation.
        const current = await followersService.checkFollowStatus(props.userId);
        if (current.success && typeof current.data?.is_following === 'boolean') applyFollowState(current.data);
        const toast = await toastController.create({
            message: result.error || 'No pudimos actualizar el seguimiento.',
            duration: 2500,
            position: 'bottom',
            color: 'danger'
        });
        await toast.present();
    } catch (error) {
        console.error('[FollowButton] Error al actualizar seguimiento:', error);
        const toast = await toastController.create({
            message: 'No pudimos actualizar el seguimiento.',
            duration: 2500,
            position: 'bottom',
            color: 'danger'
        });
        await toast.present();
    } finally {
        isLoading.value = false;
    }
};

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
