import { reactive } from 'vue';

export const globalAudioState = reactive({
    post: null,           // Guarda los datos de la canción que está sonando
    isPlaying: false,     // ¿Está en play?
    isVisible: true,      // ¿El post original está en la pantalla?
    isDismissed: false,
    progressPercent: 0,   // El progreso de la barra azul
    audioElement: null,    // El control remoto del <audio> original
    themeColorHex: '#113a82',      // Azul por defecto
    themeColorRgb: '77, 141, 255'  // Azul por defecto
});

// Función para darle play/pausa desde la burbuja flotante
export const toggleGlobalAudio = () => {
    if (!globalAudioState.audioElement) return;
    
    if (globalAudioState.audioElement.paused) {
        globalAudioState.audioElement.play();
        globalAudioState.isPlaying = true;
    } else {
        globalAudioState.audioElement.pause();
        globalAudioState.isPlaying = false;
    }
};

export const dismissGlobalAudio = () => {
    // 1. Si está sonando, la pausamos
    if (globalAudioState.audioElement && !globalAudioState.audioElement.paused) {
        globalAudioState.audioElement.pause();
        globalAudioState.isPlaying = false;
    }
    // 2. Le decimos al cerebro que la oculte definitivamente
    globalAudioState.isDismissed = true;
};