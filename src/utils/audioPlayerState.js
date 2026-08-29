import { reactive } from 'vue';

// ==========================================
// 1. ESTADO GLOBAL (Single Source of Truth)
// ==========================================
export const globalAudioState = reactive({
    post: null,
    isPlaying: false,
    isVisible: true,
    isDismissed: false,
    progressPercent: 0,
    audioElement: null,
    themeColorHex: '#113a82',
    themeColorRgb: '77, 141, 255'
});

// ==========================================
// 2. MOTOR DE ANIMACIÓN CENTRAL
// ==========================================
let animationFrameId = null;

export const startAudioAnimation = () => {
    const update = () => {
        if (globalAudioState.audioElement && globalAudioState.isPlaying) {
            globalAudioState.progressPercent = 
                (globalAudioState.audioElement.currentTime / globalAudioState.audioElement.duration) * 100 || 0;
            animationFrameId = requestAnimationFrame(update);
        }
    };
    
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(update);
};

export const stopAudioAnimation = () => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
};

// ==========================================
// 3. ACCIONES GLOBALES
// ==========================================
export const toggleGlobalAudio = () => {
    if (globalAudioState.audioElement) {
        if (globalAudioState.isPlaying) {
            globalAudioState.audioElement.pause();
            globalAudioState.isPlaying = false; // Mutación explícita
            stopAudioAnimation(); 
        } else {
            globalAudioState.audioElement.play();
            globalAudioState.isPlaying = true; // Mutación explícita
            startAudioAnimation(); 
        }
    }
};

export const dismissGlobalAudio = () => {
    if (globalAudioState.audioElement) {
        globalAudioState.audioElement.pause();
        globalAudioState.isPlaying = false;
        stopAudioAnimation();
    }
    globalAudioState.isDismissed = true;
};