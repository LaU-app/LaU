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
                
                <div class="wave-progress-bar" ref="waveContainer" @click="seekByClick">
                    <div class="liquid-fill" :style="{ width: progressPercent + '%' }">
                        <div class="liquid-wave"></div>
                    </div>
                </div>

            </div>

            <ion-button fill="clear" size="small" @click="toggleMute" class="volume-button">
                <ion-icon :icon="isMuted ? volumeMuteOutline : volumeHighOutline" slot="icon-only">
                </ion-icon>
            </ion-button>
        </div>
        
        <audio ref="audioElement" :src="previewUrl" @loadedmetadata="onLoaded"
            @ended="onEnded" preload="metadata">
        </audio>
    </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { IonButton, IonIcon } from '@ionic/vue'
import {
    playCircle,
    pauseCircle,
    volumeHighOutline,
    volumeMuteOutline
} from 'ionicons/icons'

const props = defineProps({
    previewUrl: { type: String, required: true }
})

const audioElement = ref(null)
const waveContainer = ref(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const isMuted = ref(false)

let animationFrameId = null

// Calcula el porcentaje de avance para el ancho del líquido
const progressPercent = computed(() => {
    if (!duration.value) return 0
    return (currentTime.value / duration.value) * 100
})

// Bucle de animación a 60 FPS
const updateSmoothProgress = () => {
    if (audioElement.value && isPlaying.value) {
        currentTime.value = audioElement.value.currentTime
        animationFrameId = requestAnimationFrame(updateSmoothProgress)
    }
}

const togglePlay = () => {
    if (!audioElement.value) return

    if (isPlaying.value) {
        audioElement.value.pause()
        isPlaying.value = false
        if (animationFrameId) cancelAnimationFrame(animationFrameId)
    } else {
        audioElement.value.play()
        isPlaying.value = true
        // Iniciamos la animación fluida
        animationFrameId = requestAnimationFrame(updateSmoothProgress)
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
    if (animationFrameId) cancelAnimationFrame(animationFrameId)
}

// Nueva función de seek calculando el clic del usuario
const seekByClick = (event) => {
    if (!waveContainer.value || !audioElement.value) return
    
    const rect = waveContainer.value.getBoundingClientRect()
    const clickX = event.clientX - rect.left
    const percentage = Math.max(0, Math.min(1, clickX / rect.width))
    const newTime = percentage * duration.value

    audioElement.value.currentTime = newTime
    currentTime.value = newTime
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

watch(() => props.previewUrl, () => {
    if (audioElement.value && isPlaying.value) {
        audioElement.value.pause()
        isPlaying.value = false
        currentTime.value = 0
        if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
})

onBeforeUnmount(() => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId)
    if (audioElement.value) {
        audioElement.value.pause()
        audioElement.value.currentTime = 0
    }
})

defineExpose({
    stop: () => {
        if (audioElement.value) {
            audioElement.value.pause()
            audioElement.value.currentTime = 0
            isPlaying.value = false
            currentTime.value = 0
            if (animationFrameId) cancelAnimationFrame(animationFrameId)
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
    margin-bottom: 0.4rem;
    padding: 0 0.2rem;
}

/* ==========================================
   BARRA DE LÍQUIDO ANIMADA
   ========================================== */
.wave-progress-bar {
    position: relative;
    height: 12px; /* Grosor de la barra */
    background: rgba(150, 150, 150, 0.15); /* Fondo del track */
    border-radius: 10px;
    overflow: hidden;
    cursor: pointer;
}

.liquid-fill {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    /* Color base de tu app */
    background: var(--ion-color-primary); 
    border-radius: 10px;
    /* IMPORTANTE: No le ponemos transition al width, requestAnimationFrame ya lo hace fluido */
}

/* La textura de ola en movimiento */
.liquid-wave {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    
    /* 👇 AQUÍ ESTÁ LA OLA: Cámbiale el 0.2 del final por 0.5 si la quieres más marcada */
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 20'%3E%3Cpath d='M0,10 Q25,20 50,10 T100,10 T150,10 T200,10 L200,20 L0,20 Z' fill='rgba(255,255,255,0.4)'/%3E%3C/svg%3E");
    
    background-size: 100px 100%;
    
    /* 👇 ESTO LE DA EL MOVIMIENTO CONSTANTE */
    animation: flowWave 1.5s linear infinite;
}

/* La animación que desplaza la ola */
@keyframes flowWave {
    0% { background-position: 0 0; }
    100% { background-position: -100px 0; }
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
