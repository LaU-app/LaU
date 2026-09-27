<template>
    <ion-card class="music-card" ref="playerContainer">
        <ion-card-content class="music-content" :class="{ 'is-ambient': isAmbientMode }"
        :style="{ 
            '--theme-color-hex': dominantColorHex, 
            '--theme-color-rgb': dominantColorRgb 
        }"
        @click.stop="togglePlay">
            
            <div 
                v-if="post.itunes_artwork_url && isAmbientMode"
                class="ambient-music-bg" 
                :style="{ backgroundImage: `url(${post.itunes_artwork_url})` }"
            ></div>

            <div v-if="isAmbientMode" class="dark-overlay" :class="{ 'active-dark': isDarkMode }"></div>


            <div class="progress-bg" :class="{ 'is-playing': isPlaying }" :style="{ width: progressPercent + '%' }"></div>

            
            <div class="card-inner-content">
                <ion-thumbnail class="album-art">
                    <img v-if="post.itunes_artwork_url" :src="post.itunes_artwork_url"
                        :alt="post.itunes_track_name || 'Album'" loading="lazy" @error="$emit('imageError', $event)" />
                    <div v-else class="placeholder-art">
                        <ion-icon :icon="musicalNotesOutline"></ion-icon>
                    </div>
                </ion-thumbnail>

                <div class="voice-note-container">
                    <audio 
                        ref="audioElement" 
                        :src="post.itunes_preview_url" 
                        @play="onNativePlay"
                        @pause="onNativePause"
                        @ended="onEnded"
                        @loadedmetadata="loadMetadata"
                    ></audio>

                    <div class="voice-note-bubble transparent-bubble">
                        <div class="bubble-content">
                            
                            <ion-button fill="clear" class="play-btn">
                                <ion-icon :icon="isPlaying ? pauseCircle : playCircle" slot="icon-only"></ion-icon>
                            </ion-button>
                            
                            <div class="track-info">
                                <div class="marquee-mask title-mask" :class="{ 'is-scrolling': shouldScrollTitle }">
                                    <h3 class="song-title animate-scroll" ref="songTitleRef">
                                        <span class="marquee-part">{{ post.itunes_track_name || 'Canción' }}</span>
                                        <span class="marquee-part" v-if="shouldScrollTitle" aria-hidden="true">{{ post.itunes_track_name }}</span>
                                    </h3>
                                </div>

                                <div class="marquee-mask artist-mask" :class="{ 'is-scrolling': shouldScrollArtist }">
                                    <p class="artist-name animate-scroll" ref="artistNameRef">
                                        <span class="marquee-part">{{ post.itunes_artist_name || 'Artista' }}</span>
                                        <span class="marquee-part" v-if="shouldScrollArtist" aria-hidden="true">{{ post.itunes_artist_name }}</span>
                                    </p>
                                </div>
                            </div>

                            <div class="time-and-eq">
                                <div class="equalizer" v-if="isPlaying">
                                    <span class="bar bar-1"></span>
                                    <span class="bar bar-2"></span>
                                    <span class="bar bar-3"></span>
                                </div>
                                <span class="time-display">{{ isPlaying ? currentTimeFormatted : durationFormatted }}</span>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </ion-card-content>
    </ion-card>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { IonCard, IonCardContent, IonThumbnail, IonText, IonIcon, IonButton } from '@ionic/vue';
import { musicalNotesOutline, playCircle, pauseCircle } from 'ionicons/icons';
import { useAmbientMode } from "@/utils/useAmbientMode";
import * as VibrantNamespace from 'node-vibrant';
import { App } from '@capacitor/app';
import { useDarkMode } from "@/utils/useDarkMode";
import { globalAudioState, startAudioAnimation, stopAudioAnimation } from '@/utils/audioPlayerState';

export default {
    name: 'MusicPlayer',
    components: {
        IonCard, IonCardContent, IonThumbnail, IonText, IonIcon, IonButton
    },
    props: {
        post: { type: Object, required: true }
    },
    emits: ['imageError'],
    setup(props) {
        const { isAmbientMode } = useAmbientMode();
        const { isDarkMode } = useDarkMode();
        const audioElement = ref(null);

        const dominantColorHex = ref('#113a82'); 
        const dominantColorRgb = ref('77, 141, 255');
        const playerContainer = ref(null);
        let appStateListener = null;
        const isCardCurrentlyVisible = ref(true);

        // ==========================================
        // APLICACIÓN SOLID: SINGLE SOURCE OF TRUTH
        // Delegamos el estado al cerebro global.
        // ==========================================
        const isPlaying = computed(() => {
            return globalAudioState.post?.id === props.post.id && globalAudioState.isPlaying;
        });

        const progressPercent = computed(() => {
            return globalAudioState.post?.id === props.post.id ? globalAudioState.progressPercent : 0;
        });

        const currentTimeFormatted = ref('0:00');
        const durationFormatted = ref('0:30');

        // Mantenemos el tiempo local actualizado sin calcular animaciones
        watch(() => progressPercent.value, () => {
            if (audioElement.value && isPlaying.value) {
                currentTimeFormatted.value = formatTime(audioElement.value.currentTime);
            }
        });

        const formatTime = (seconds) => {
            if (isNaN(seconds)) return '0:00';
            const m = Math.floor(seconds / 60);
            const s = Math.floor(seconds % 60);
            return `${m}:${s < 10 ? '0' : ''}${s}`;
        };

        // --- Lógica de Marquesina (Marquee) ---
        const songTitleRef = ref(null);
        const artistNameRef = ref(null);
        const shouldScrollTitle = ref(false);
        const shouldScrollArtist = ref(false);

        const checkScrollingRequirements = () => {
            setTimeout(() => {
                nextTick(() => {
                    if (songTitleRef.value && songTitleRef.value.parentElement) {
                        shouldScrollTitle.value = songTitleRef.value.scrollWidth > songTitleRef.value.parentElement.clientWidth;
                    }
                    if (artistNameRef.value && artistNameRef.value.parentElement) {
                        shouldScrollArtist.value = artistNameRef.value.scrollWidth > artistNameRef.value.parentElement.clientWidth;
                    }
                });
            }, 150);
        };

        const extractMusicColor = async (url) => {
            if (!url) return;
            try {
                const VibrantClass = VibrantNamespace.Vibrant || VibrantNamespace.default || VibrantNamespace;
                const img = new Image();
                img.crossOrigin = "anonymous"; 
                
                const imagePromise = new Promise((resolve, reject) => {
                    img.onload = () => resolve(img);
                    img.onerror = () => reject(new Error("CORS o error de red"));
                    img.src = url;
                });

                const loadedImg = await imagePromise;
                const palette = await VibrantClass.from(loadedImg).getPalette();
                const swatch = palette.Vibrant || palette.LightVibrant || palette.Muted;
                
                if (swatch) {
                    dominantColorHex.value = swatch.getHex(); 
                    const rgb = swatch.getRgb();
                    dominantColorRgb.value = `${Math.round(rgb[0])}, ${Math.round(rgb[1])}, ${Math.round(rgb[2])}`;
                }
            } catch (error) {
                console.warn("Usando color azul por defecto.");
            }
        };

        const route = useRoute();

        watch(() => route.path, () => {
            if (isPlaying.value && audioElement.value) {
                audioElement.value.pause();
            }
        });

        watch(() => props.post, () => {
            checkScrollingRequirements();
        }, { deep: true });

        // ==========================================
        // CONTROLADORES DE AUDIO (Emisores)
        // ==========================================
        const togglePlay = () => {
            if (!audioElement.value) return;
            
            // Asignar al estado global si es un audio nuevo
            if (globalAudioState.post?.id !== props.post.id) {
                globalAudioState.post = props.post;
                globalAudioState.audioElement = audioElement.value;
                globalAudioState.themeColorHex = dominantColorHex.value;
                globalAudioState.themeColorRgb = dominantColorRgb.value;
            }

            if (audioElement.value.paused) {
                audioElement.value.play(); // Dispara onNativePlay nativamente
            } else {
                audioElement.value.pause(); // Dispara onNativePause nativamente
            }
        };

        const onNativePlay = (event) => {
            globalAudioState.isVisible = isCardCurrentlyVisible.value; 
            globalAudioState.isDismissed = false;
            
            globalAudioState.post = props.post;
            globalAudioState.isPlaying = true;
            globalAudioState.audioElement = audioElement.value;
            globalAudioState.themeColorHex = dominantColorHex.value;
            globalAudioState.themeColorRgb = dominantColorRgb.value;

            startAudioAnimation(); // Arrancar el motor global

            // Pausar los demás audios en el feed
            const audios = document.querySelectorAll('audio');
            audios.forEach((audio) => {
                if (audio !== event.target) audio.pause();
            });
        };

        const onNativePause = () => {
            if (globalAudioState.post?.id === props.post.id) {
                globalAudioState.isPlaying = false;
                stopAudioAnimation(); // Detener el motor global
            }
        };

        const onEnded = () => {
            currentTimeFormatted.value = '0:00';
            if (globalAudioState.post?.id === props.post.id) {
                globalAudioState.isPlaying = false;
                globalAudioState.progressPercent = 0;
                stopAudioAnimation();
            }
        };

        const loadMetadata = () => {
            if (audioElement.value && audioElement.value.duration !== Infinity) {
                durationFormatted.value = formatTime(audioElement.value.duration);
            }
        };

        onMounted(async () => {
            checkScrollingRequirements();

            const observer = new IntersectionObserver(([entry]) => {
                isCardCurrentlyVisible.value = entry.isIntersecting;
                if (globalAudioState.post && globalAudioState.post.id === props.post.id) {
                    globalAudioState.isVisible = entry.isIntersecting;
                }
            }, { threshold: [0, 0.1, 0.9, 1.0] });

            if (playerContainer.value) {
                observer.observe(playerContainer.value.$el || playerContainer.value);
            }

            if (props.post.itunes_artwork_url) {
                extractMusicColor(props.post.itunes_artwork_url);
            }

            appStateListener = await App.addListener('appStateChange', (state) => {
                if (!state.isActive && audioElement.value) {
                    audioElement.value.pause();
                }
            });
        });

        onUnmounted(() => {
            if (appStateListener) appStateListener.remove();
        });

        return {
            musicalNotesOutline, playCircle, pauseCircle,
            audioElement, isPlaying, togglePlay,
            currentTimeFormatted, durationFormatted, progressPercent,
            loadMetadata, onEnded, onNativePlay, onNativePause,
            songTitleRef, artistNameRef, shouldScrollTitle, shouldScrollArtist, 
            isAmbientMode, dominantColorHex, dominantColorRgb, playerContainer,
            isDarkMode
        }
    }
}
</script>

<style scoped>
/* --- CONFIGURACIÓN BASE DE LA TARJETA --- */
.music-card {
    margin: 16px;
    border-radius: 16px;
    /* Usamos el color de fondo de la card por defecto de Ionic por seguridad */
    --background: var(--ion-card-background);
    overflow: hidden; /* Vital para que el blur y el progreso no se salgan de las esquinas redondeadas */
    /* Pequeña sombra para dar profundidad visual */
    box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

/* Efecto sutil al tocar o pasar el mouse sobre la tarjeta entera */
.music-card:active {
    transform: scale(0.99);
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

/* Modificamos el contenedor principal para la posición absoluta de las capas de fondo */
.music-content {
    position: relative; 
    padding: 0; 
    background: var(--ion-color-light); /* Modo Normal: Fondo limpio según el tema de tu app */
    cursor: pointer;
    display: flex;
    overflow: hidden;
}

/* MODO AMBIENTE */
.music-content.is-ambient {
    background: var(--ion-background-color);; 
}

/* --- LAS 3 CAPAS DE FONDO INMERSIVO (Spotify Canvas Style) --- */

/* 1. CAPA INFERIOR: La portada de la canción difuminada */
.ambient-music-bg {
    position: absolute;
    /* Le damos márgenes negativos para que los bordes del blur no se vean blancos/claros */
    top: -20px; left: -20px; right: -20px; bottom: -20px; 
    background-size: cover;
    background-position: center;
    filter: blur(15px) saturate(1.2); /* Difumina y resalta los colores */
    z-index: 0;

    transform: translateZ(0);
    will-change: transform, filter;
    backface-visibility: hidden;
}

/* 2. CAPA MEDIA: Filtro oscuro semi-transparente para garantizar legibilidad extrema */
.dark-overlay {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(255, 255, 255, 0); /* 55% de oscuridad */
    z-index: 1;
    transition: background 0.3s ease;
}

.dark-overlay.active-dark {
    /* El 55% de oscuridad que querías */
    background: rgba(0, 0, 0, 0.55); 
}

/* 3. CAPA SUPERIOR DE FONDO: Barra de progreso (Tu color #4d8dff con transparencia) */
/* --- LA NUEVA BARRA DE PROGRESO MULTI-OLA --- */
.progress-bg {
    position: absolute;
    top: 0; left: 0; 
    height: 100%;
    /* El contenedor ahora es invisible, el color lo ponen las olas */
    background: transparent; 
    z-index: 2;
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
    
    /* CAMBIO AQUÍ: Cambiamos 30px 50px a 30px 100px para estirarla verticalmente */
    -webkit-mask-size: calc(100% - 14px) 100%, 30px 100px; 
    
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
    100% { -webkit-mask-position: left top, right 0px top 100px; } 
}

@keyframes flowWaveEdge2 {
    0% { -webkit-mask-position: right 0px top 0px; }
    100% { -webkit-mask-position: right 0px top 70px; } /* Sincronizado con su mask-size */
}




/* --- EL CONTENIDO REAL (z-index superior) --- */
.card-inner-content {
    position: relative;
    z-index: 3; /* Asegura que la foto y los textos estén por encima de todo */
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    width: 100%; /* Toma todo el ancho disponible */
}

/* --- PORTADA DEL ÁLBUM --- */
.album-art {
    --size: 70px;
    width: var(--size);
    height: var(--size);
    min-width: var(--size);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
}

.album-art img { width: 100%; height: 100%; object-fit: cover; }

/* Arte placeholder si no hay portada */
.placeholder-art {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,0.1); /* Ligeramente más claro para contraste */
}

.placeholder-art ion-icon { font-size: 32px; color: rgba(255, 255, 255, 0.5); }

/* --- DISEÑO DE INFORMACIÓN Y REPRODUCTOR --- */
.voice-note-container {
    flex: 1;
    min-width: 0; /* Vital para que la marquesina funcione */
}

/* La burbuja ahora es transparente porque el fondo lo pone la tarjeta */
.voice-note-bubble.transparent-bubble {
    position: relative;
    width: 100%;
    background: transparent; 
    border-radius: 0;
    overflow: visible;
}

.bubble-content {
    display: flex; align-items: center;
    padding: 0; /* Quitamos padding extra, ya lo tiene el contenedor exterior */
    gap: 8px;
}

/* --- EL BOTÓN DE PLAY (Azul Institucional #113a82) --- */
.play-btn {
    --padding-start: 0; --padding-end: 0; margin: 0;
    width: 36px; height: 36px;
    /* Usamos color normal en lugar de --color para el ion-icon */
    color: #113a82; 
}

/* Atacamos directamente al ícono para ganar al Shadow DOM */
.play-btn ion-icon { 
    font-size: 36px; 
    color: var(--theme-color-hex) !important; 
}

/* MODO AMBIENTE */
.is-ambient .play-btn ion-icon { 
    color: var(--theme-color-hex) !important; 
}

/* --- ESTILOS DE LA INFORMACIÓN DE LA CANCIÓN --- */
.track-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2px;
    min-width: 0; /* Vital para que la marquesina funcione */
}

/* Máscara que define el área de visualización del texto (como una ventana) */
.marquee-mask {
    width: 100%;
    overflow: hidden; /* Oculta lo que sale de la ventana */
    white-space: nowrap; /* Evita que el texto salte de línea */
}

/* Textos originales ( display inline-block para animación) */
.song-title, .artist-name {
    display: inline-block; 
    margin: 0;
    line-height: 1.3;
}

/* TÍTULO EN BLANCO FORZADO */
.song-title {
    font-size: 15px; 
    font-weight: 700;
    color: var(--ion-text-color) !important;
    text-shadow: none;
}

/* ARTISTA EN BLANCO FORZADO CON OPACIDAD */
.artist-name {
    font-size: 13px;
    color: var(--ion-text-color) !important;
    text-shadow: none;
}

/* --- LÓGICA DE LA MARQUESINA (CON PAUSA AL INICIO) --- */
.animate-scroll {
    display: flex; /* Flex garantiza que ambas partes midan exactamente lo mismo */
    width: max-content;
    text-overflow: clip !important; /* Quitamos los 3 puntos */
}

.marquee-part {
    /* Este es el espacio vacío entre el final de la canción y cuando vuelve a empezar */
    padding-right: 40px; 
}

/* Solo activa la animación si Vue detecta que el texto es largo */
.marquee-mask.is-scrolling .animate-scroll {
    /* 10s es el tiempo total del bucle. Modifícalo si quieres que vaya más rápido o lento */
    animation: marqueeWithPause 10s linear infinite; 
}

/* LA MAGIA DE LA PAUSA (Se detiene al inicio) */
@keyframes marqueeWithPause {
    0%, 25% { 
        /* Del 0% al 25% del tiempo (aprox 2.5 seg) se queda congelado al inicio */
        transform: translateX(0); 
    }
    100% { 
        /* En el tiempo restante, se desplaza a la mitad. */
        transform: translateX(-50%); 
    }
}

/* --- TIEMPO Y ECUALIZADOR (z-index superior) --- */
.time-and-eq {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    margin-left: auto; /* Empuja a la derecha */
}

/* TIEMPO EN BLANCO FORZADO CON OPACIDAD */
.time-display {
    font-size: 11px; 
    font-weight: 600; 
    font-variant-numeric: tabular-nums;
    color: var(--ion-text-color) !important;
    text-shadow: none;
}

/* MODO AMBIENTE: Forzamos textos blancos con sombra oscura para legibilidad sobre la foto */
.is-ambient .song-title {
    color: #ffffff !important;
    text-shadow: 0 1px 4px rgba(0,0,0,0.6);
}
.is-ambient .artist-name,
.is-ambient .time-display {
    color: rgba(255, 255, 255, 0.8) !important;
    text-shadow: 0 1px 4px rgba(0,0,0,0.6);
}

/* --- ECUALIZADOR DISCRETO (Tu Azul de Progreso #4d8dff) --- */
.equalizer {
    display: flex; align-items: flex-end; gap: 2px; height: 12px; margin-bottom: 2px;
}

.equalizer .bar { 
    width: 2px; 
    background-color: var(--theme-color-hex); /* Color dinámico sólido */
    border-radius: 2px; 
    animation: bounce 0.5s infinite alternate; 
}

/* Animaciones de las barritas */
.equalizer .bar-1 { height: 8px; animation-delay: 0.1s; }
.equalizer .bar-2 { height: 12px; animation-delay: 0.3s; }
.equalizer .bar-3 { height: 6px; animation-delay: 0.0s; }

/* Animación de bote del ecualizador */
@keyframes bounce { 0% { transform: scaleY(0.3); } 100% { transform: scaleY(1); } }

/* --- RESPONSIVE --- */
@media (max-width: 576px) { 
    .album-art { --size: 60px; } 
    .song-title { font-size: 14px; } 
    .artist-name { font-size: 12px; } 
}
</style>