<template>
    <div class="selected-track">
        <div class="track-preview">
            <img :src="track.artworkUrl100" :alt="track.trackName" />
            <div class="track-details">
                <h4>{{ track.trackName }}</h4>
                <p>{{ track.artistName }}</p>
                <p class="album-name">{{ track.collectionName }}</p>
                <ion-badge color="primary">{{ track.duration }}</ion-badge>
            </div>
            <ion-button fill="clear" color="danger" @click="$emit('remove')">
                <ion-icon :icon="closeCircle"></ion-icon>
            </ion-button>
        </div>

        <!-- Reproductor de audio -->
        <AudioPlayer v-if="track.previewUrl" :previewUrl="track.previewUrl" ref="audioPlayerRef" />
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { IonButton, IonIcon, IonBadge } from '@ionic/vue'
import { closeCircle } from 'ionicons/icons'
import AudioPlayer from './AudioPlayer.vue'

defineProps({
    track: {
        type: Object,
        required: true
    }
})

defineEmits(['remove'])

const audioPlayerRef = ref(null)

// Exponer método para detener audio desde el padre
defineExpose({
    stopAudio: () => {
        if (audioPlayerRef.value) {
            audioPlayerRef.value.stop()
        }
    }
})
</script>

<style scoped>
.selected-track {
    margin-bottom: 1rem;
}

.track-preview {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background: var(--ion-card-background);
    border-radius: 12px;
    border: 2px solid var(--ion-color-primary);
}

.track-preview img {
    width: 80px;
    height: 80px;
    border-radius: 8px;
    object-fit: cover;
}

.track-details {
    flex: 1;
    min-width: 0;
}

.track-details h4 {
    margin: 0 0 0.25rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--ion-color-dark);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.track-details p {
    margin: 0 0 0.25rem 0;
    font-size: 0.9rem;
    color: var(--ion-color-medium);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.track-details .album-name {
    font-size: 0.85rem;
    margin-bottom: 0.5rem;
}
</style>
