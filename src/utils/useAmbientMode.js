import { ref, watch } from 'vue';

// Estado global: por defecto activo
const isAmbientMode = ref(localStorage.getItem('ambient-mode') !== 'false');

export function useAmbientMode() {
    const toggleAmbientMode = () => {
        isAmbientMode.value = !isAmbientMode.value;
        localStorage.setItem('ambient-mode', isAmbientMode.value);
    };

    return {
        isAmbientMode,
        toggleAmbientMode
    };
}