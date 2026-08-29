<template>
    <transition name="slide-down">
        <div v-if="globalAudioState.post && !globalAudioState.isVisible && !globalAudioState.isDismissed" class="floating-player-wrapper">
            
            <div class="floating-pill" 
                 ref="pillRef"
                 :class="{ 'is-glass': isGlassMode }"
                 :style="{ 
                     '--theme-color-hex': globalAudioState.themeColorHex, 
                     '--theme-color-rgb': globalAudioState.themeColorRgb 
                 }" 
                 @click.stop="toggleGlobalAudio">

                 <LiquidGlassBox 
                   v-if="isGlassMode"
                   class="pill-glass-bg" 
                   :height="60" 
                   :depth="5" 
                   :radius="30"
                   :strength="100"
                   :chromaticAberration="3" 
                   :blur="1.8"
                   :width="calculatedPillWidth" 
                />
                

                <div class="progress-bg" :class="{ 'is-playing': globalAudioState.isPlaying }" :style="{ width: globalAudioState.progressPercent + '%' }"></div>

                
                <div class="pill-content">
                    <img v-if="globalAudioState.post.itunes_artwork_url" 
                         :src="globalAudioState.post.itunes_artwork_url" 
                         class="mini-art" />
                    
                    <div class="mini-info">
                        <span class="mini-title">{{ globalAudioState.post.itunes_track_name }}</span>
                        <span class="mini-artist">{{ globalAudioState.post.itunes_artist_name }}</span>
                    </div>

                    <div class="equalizer" v-if="globalAudioState.isPlaying">
                        <span class="bar bar-1"></span><span class="bar bar-2"></span><span class="bar bar-3"></span>
                    </div>

                    <ion-button fill="clear" class="mini-play-btn">
                        <ion-icon :icon="globalAudioState.isPlaying ? pauseCircle : playCircle" slot="icon-only"></ion-icon>
                    </ion-button>
                </div>
            </div>

        </div>
    </transition>
</template>

<script setup>
import { ref, watch, nextTick, computed, onMounted, onUnmounted } from 'vue';
import { IonButton, IonIcon, createGesture } from '@ionic/vue';
import { playCircle, pauseCircle } from 'ionicons/icons';

// Inversión de Dependencias: Dependemos del estado central, no de lógica local
import { globalAudioState, toggleGlobalAudio, dismissGlobalAudio } from '@/utils/audioPlayerState';
import LiquidGlassBox from '@/components/LiquidGlassBox.vue';
import { useGlassMode } from '@/utils/useGlassMode';

// ==========================================
// 1. ESTADO DE INTERFAZ Y RESPONSIVE
// ==========================================
const { isGlassMode } = useGlassMode();
const windowWidth = ref(window.innerWidth);

const updateWidth = () => {
    windowWidth.value = window.innerWidth;
};

onMounted(() => window.addEventListener('resize', updateWidth));
onUnmounted(() => window.removeEventListener('resize', updateWidth));

const calculatedPillWidth = computed(() => {
    return Math.min(windowWidth.value - 32, 400);
});

// ==========================================
// 2. GESTOS Y ANIMACIONES (Responsabilidad Visual)
// ==========================================
const pillRef = ref(null);
let gesture = null;

// ¡RESTAURADO! Observador vital para que funcione el Swipe-to-dismiss
watch(
    () => globalAudioState.post && !globalAudioState.isVisible && !globalAudioState.isDismissed, 
    async (shouldShow) => {
        if (shouldShow) {
            // Esperamos a que Vue dibuje la píldora en el DOM
            await nextTick();
            initGesture();
        } else {
            // Limpiamos la memoria si desaparece
            if (gesture) {
                gesture.destroy();
                gesture = null;
            }
        }
    },
    { immediate: true } // Ejecutar al cargar por si la píldora ya debía mostrarse
);

const initGesture = () => {
    if (!pillRef.value) return;

    gesture = createGesture({
        el: pillRef.value,
        gestureName: 'swipe-to-dismiss-audio',
        direction: 'x', // Solo movimiento horizontal
        
        onStart: () => {
            // Quitamos transiciones para que se pegue al dedo del usuario
            pillRef.value.style.transition = 'none'; 
        },
        
        onMove: (detail) => {
            pillRef.value.style.transform = `translateX(${detail.deltaX}px)`;
            pillRef.value.style.opacity = `${1 - Math.abs(detail.deltaX) / 300}`;
        },
        
        onEnd: (detail) => {
            pillRef.value.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
            
            // Umbral para decidir si se cierra o no (100px)
            if (Math.abs(detail.deltaX) > 100) {
                const direccion = detail.deltaX > 0 ? 1 : -1;
                
                // La sacamos de la pantalla visualmente
                pillRef.value.style.transform = `translateX(${direccion * window.innerWidth}px)`;
                pillRef.value.style.opacity = '0';

                // Le avisamos al Cerebro Global que la oculte y la pause
                setTimeout(() => {
                    dismissGlobalAudio();
                }, 300);

            } else {
                // Efecto resorte si no deslizó lo suficiente
                pillRef.value.style.transform = 'translateX(0px)';
                pillRef.value.style.opacity = '1';
            }
        }
    });

    gesture.enable(true);
};
</script>

<style scoped>
.floating-player-wrapper {
    position: fixed;
    top: calc(env(safe-area-inset-top) + 60px); 
    left: 0;
    width: 100%;
    z-index: 1000;
    display: flex;
    justify-content: center;
    padding: 0 16px;
    pointer-events: none; 
}

/* ESTILO NORMAL (Por defecto / Apagado) */
.floating-pill {
    position: relative;
    width: 100%;
    max-width: 400px;
    background: var(--ion-color-light); /* Tu fondo sólido */
    border-radius: 30px;
    overflow: hidden;
    box-shadow: 0 8px 20px rgba(0,0,0,0.4);
    pointer-events: auto; 
    cursor: pointer;
    border: 1px solid rgba(255,255,255,0.1);
    transition: background 0.3s ease, border 0.3s ease, box-shadow 0.3s ease;
}

/* MODO CRISTAL (Encendido) */
.floating-pill.is-glass {
    background: transparent; /* Hacemos la caja invisible */
    border: none;
    box-shadow: none; /* La sombra la maneja el SVG ahora */
}

/* Posición del componente de cristal SVG */
.pill-glass-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: -1; /* Vital: esto lo pone DETRÁS de la barra de progreso y botones */
    pointer-events: none;
    border-radius: 30px;
}

/* --- COLORES DINÁMICOS AQUÍ --- */
/* --- LA NUEVA BARRA DE PROGRESO MULTI-OLA --- */
.progress-bg {
    position: absolute;
    top: 0; left: 0; 
    height: 100%;
    /* El contenedor ahora es invisible, el color lo ponen las olas */
    background: transparent; 
    z-index: 0;
    pointer-events: none;
    /* El halo de luz ilumina ambas olas al mismo tiempo dándoles volumen */
    filter: drop-shadow(3px 0px 5px rgba(255, 255, 255, 0.4));
}

/* OLA 1: La ola principal y el cuerpo sólido de la barra */
.progress-bg::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(var(--theme-color-rgb), 0.55);
    -webkit-mask-image: 
        linear-gradient(black, black), 
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 100' preserveAspectRatio='none'%3E%3Cpath d='M20,0 Q40,25 20,50 T20,100 L0,100 L0,0 Z' fill='black'/%3E%3C/svg%3E");
    -webkit-mask-size: calc(100% - 14px) 100%, 30px 50px;
    -webkit-mask-position: left top, right 0px top 0px;
    -webkit-mask-repeat: no-repeat, repeat-y;
}

/* OLA 2: Ola secundaria desfasada (Efecto 3D de líquido traslúcido) */
.progress-bg::after {
    content: '';
    position: absolute;
    /* Sobresale 10px a la derecha para adelantarse a la ola principal */
    top: 0; left: 0; right: -10px; bottom: 0; 
    background: rgba(var(--theme-color-rgb), 0.35); /* Más transparente */
    
    /* Esta máscara solo dibuja la ola, no el cuerpo de la barra */
    -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 100' preserveAspectRatio='none'%3E%3Cpath d='M20,0 Q40,25 20,50 T20,100 L0,100 L0,0 Z' fill='black'/%3E%3C/svg%3E");
    -webkit-mask-size: 25px 70px; /* Ola más estirada verticalmente */
    -webkit-mask-position: right 0px top 0px;
    -webkit-mask-repeat: repeat-y;
    z-index: -1;
}

/* MODO AMBIENTE (Ajuste de transparencia si estás en MusicPlayer.vue) */
.is-ambient .progress-bg::before { background: rgba(var(--theme-color-rgb), 0.20); }
.is-ambient .progress-bg::after  { background: rgba(var(--theme-color-rgb), 0.10); }

/* --- ANIMACIONES INDEPENDIENTES --- */
/* Al tener velocidades distintas (0.8s y 1.3s), las olas se cruzan de forma caótica y natural */
.progress-bg.is-playing::before {
    animation: flowWaveEdge1 0.8s linear infinite;
}
.progress-bg.is-playing::after {
    animation: flowWaveEdge2 1.3s linear infinite;
}

@keyframes flowWaveEdge1 {
    0% { -webkit-mask-position: left top, right 0px top 0px; }
    100% { -webkit-mask-position: left top, right 0px top 50px; } /* Sincronizado con su mask-size */
}

@keyframes flowWaveEdge2 {
    0% { -webkit-mask-position: right 0px top 0px; }
    100% { -webkit-mask-position: right 0px top 70px; } /* Sincronizado con su mask-size */
}


.mini-play-btn ion-icon { 
    font-size: 32px; 
    color: var(--theme-color-hex) !important; /* Color dinámico sólido */
}

/* Animación Ecualizador Mini */
.equalizer { display: flex; align-items: flex-end; gap: 2px; height: 12px; margin-right: 8px; }
.equalizer .bar { 
    width: 2px; 
    background-color: var(--theme-color-hex); /* Color dinámico sólido */
    border-radius: 2px; 
    animation: bounce 0.5s infinite alternate; 
}

/* El resto se queda igual */
.pill-content {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    padding: 6px 6px 6px 6px;
    gap: 10px;
}

.mini-art {
    width: 36px; height: 36px;
    border-radius: 50%;
    object-fit: cover;
}

.mini-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.mini-title {
    font-size: 13px; font-weight: 700; 
    color:  var(--ion-text-color);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.mini-artist {
    font-size: 11px; 
    color:  var(--ion-text-color);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.mini-play-btn {
    --padding-start: 0; --padding-end: 0; margin: 0;
    width: 36px; height: 36px;
}

.equalizer .bar-1 { height: 8px; animation-delay: 0.1s; }
.equalizer .bar-2 { height: 12px; animation-delay: 0.3s; }
.equalizer .bar-3 { height: 6px; animation-delay: 0.0s; }
@keyframes bounce { 0% { transform: scaleY(0.3); } 100% { transform: scaleY(1); } }

.slide-down-enter-active, .slide-down-leave-active { transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-20px) scale(0.95); }
</style>