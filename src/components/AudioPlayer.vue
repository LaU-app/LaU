<template>
    <div v-if="previewUrl" class="audio-preview-container">
        <div class="audio-controls">
            <ion-button fill="clear" size="large" @click="togglePlay" class="play-button">
                <ion-icon :icon="isPlaying ? pauseCircle : playCircle" slot="icon-only" class="play-icon">
                </ion-icon>
            </ion-button>

            <div class="audio-progress">
                <div class="time-display">
                    <span>{{ formatTime(currentTime) }}</span>
                    <span>{{ formatTime(duration) }}</span>
                </div>
                <ion-range v-model="currentTime" :max="duration" :pin="false" @ionChange="seek" class="progress-bar">
                </ion-range>
            </div>

            <ion-button fill="clear" size="small" @click="toggleMute" class="volume-button">
                <ion-icon :icon="isMuted ? volumeMuteOutline : volumeHighOutline" slot="icon-only">
                </ion-icon>
            </ion-button>
        </div>
        <audio ref="audioElement" :src="previewUrl" @timeupdate="updateProgress" @loadedmetadata="onLoaded"
            @ended="onEnded" preload="metadata">
        </audio>
    </div>
</template>

<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { IonButton, IonIcon, IonRange } from '@ionic/vue'
import {
    playCircle,
    pauseCircle,
    volumeHighOutline,
    volumeMuteOutline
} from 'ionicons/icons'

const props = defineProps({
    previewUrl: {
        type: String,
        required: true
    }
})

const audioElement = ref(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const isMuted = ref(false)

const togglePlay = () => {
    if (!audioElement.value) return

    if (isPlaying.value) {
        audioElement.value.pause()
        isPlaying.value = false
    } else {
        audioElement.value.play()
        isPlaying.value = true
    }
}

const updateProgress = () => {
    if (audioElement.value) {
        currentTime.value = audioElement.value.currentTime
    }
}

const onLoaded = () => {
    if (audioElement.value) {
        duration.value = audioElement.value.duration || 30
    }
}

const onEnded = () => {
    isPlaying.value = false
    currentTime.value = 0
    if (audioElement.value) {
        audioElement.value.currentTime = 0
    }
}

const seek = (event) => {
    if (audioElement.value) {
        const newTime = event.detail.value
        audioElement.value.currentTime = newTime
        currentTime.value = newTime
    }
}

const toggleMute = () => {
    if (audioElement.value) {
        isMuted.value = !isMuted.value
        audioElement.value.muted = isMuted.value
    }
}

const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === 0) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Detener audio al desmontar o cuando cambie la URL
watch(() => props.previewUrl, () => {
    if (audioElement.value && isPlaying.value) {
        audioElement.value.pause()
        isPlaying.value = false
        currentTime.value = 0
    }
})

onBeforeUnmount(() => {
    if (audioElement.value) {
        audioElement.value.pause()
        audioElement.value.currentTime = 0
    }
})

// Exponer método para detener desde el padre
defineExpose({
    stop: () => {
        if (audioElement.value) {
            audioElement.value.pause()
            audioElement.value.currentTime = 0
            isPlaying.value = false
            currentTime.value = 0
        }
    }
})
</script>

<style scoped>
/* Reproductor de audio preview */
.audio-preview-container {
    margin-top: 1rem;
    padding: 1rem;
    background: var(--ion-card-background);
    border-radius: 12px;
    border: 1px solid var(--ion-border-color);
}

.audio-controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.play-button {
    flex-shrink: 0;
    --padding-start: 0;
    --padding-end: 0;
    margin: 0;
}

.play-icon {
    font-size: 48px;
    color: var(--ion-color-primary);
}

.audio-progress {
    flex: 1;
    min-width: 0;
}

.time-display {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: var(--ion-color-medium);
    margin-bottom: 0.25rem;
    padding: 0 0.5rem;
}

.progress-bar {
    --bar-height: 4px;
    --bar-background: var(--ion-color-light);
    --bar-background-active: var(--ion-color-primary);
    --knob-size: 16px;
    --knob-background: var(--ion-color-primary);
    --knob-box-shadow: 0 2px 4px rgba(138, 43, 226, 0.3);
    padding: 0;
}

.volume-button {
    flex-shrink: 0;
    --padding-start: 0;
    --padding-end: 0;
    margin: 0;
}

.volume-button ion-icon {
    font-size: 24px;
    color: var(--ion-color-medium);
}
</style>
