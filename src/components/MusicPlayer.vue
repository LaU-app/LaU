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

            <div v-if="isAmbientMode" class="dark-overlay"></div>

            <div class="progress-bg" :style="{ width: progressPercent + '%' }"></div>
            
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
                        @pause="isPlaying = false"
                        @ended="onEnded"
                        @timeupdate="updateTime"
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
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'; // NUEVO: nextTick
import { useRoute } from 'vue-router';
import { IonCard, IonCardContent, IonThumbnail, IonText, IonIcon, IonButton } from '@ionic/vue';
import { musicalNotesOutline, playCircle, pauseCircle } from 'ionicons/icons';
import { useAmbientMode } from "@/utils/useAmbientMode";
import * as VibrantNamespace from 'node-vibrant';
import { globalAudioState } from '@/utils/audioPlayerState';
import { App } from '@capacitor/app';

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
        const audioElement = ref(null);

        const dominantColorHex = ref('#113a82'); 
        const dominantColorRgb = ref('77, 141, 255');

        const playerContainer = ref(null);

        let appStateListener = null;

        const isPlaying = ref(false);
        const currentTimeFormatted = ref('0:00');
        const durationFormatted = ref('0:30');
        const progressPercent = ref(0); 

        const isCardCurrentlyVisible = ref(true);

        // --- NUEVO: Lógica de Marquesina (Marquee) ---
        // Referencias a los elementos de texto en el DOM
        const songTitleRef = ref(null);
        const artistNameRef = ref(null);
        // Estados reactivos para saber si el texto debe desplazarse
        const shouldScrollTitle = ref(false);
        const shouldScrollArtist = ref(false);

        // Función que revisa si el texto es más ancho que su contenedor
        const checkScrollingRequirements = () => {
            // Le damos 150 milisegundos al navegador para que termine de aplicar los estilos de Ionic
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
                img.crossOrigin = "anonymous"; // Necesario para imágenes externas (iTunes)
                
                const imagePromise = new Promise((resolve, reject) => {
                    img.onload = () => resolve(img);
                    img.onerror = () => reject(new Error("CORS o error de red"));
                    img.src = url;
                });

                const loadedImg = await imagePromise;
                const palette = await VibrantClass.from(loadedImg).getPalette();

                // Buscamos el mejor color disponible
                const swatch = palette.Vibrant || palette.LightVibrant || palette.Muted;
                
                if (swatch) {
                    dominantColorHex.value = swatch.getHex(); // Ejemplo: "#ff0000"
                    const rgb = swatch.getRgb();
                    dominantColorRgb.value = `${Math.round(rgb[0])}, ${Math.round(rgb[1])}, ${Math.round(rgb[2])}`; // Ejemplo: "255, 0, 0"
                }
            } catch (error) {
                // Si falla (por reglas de CORS del servidor de Apple), simplemente se queda con el azul base
                console.warn("Usando color azul por defecto, no se pudo extraer color de la portada.");
            }
        };

        // --- Mantenemos la lógica anterior ---
        const route = useRoute();

        // Pausar si cambiamos de vista (Mejora UX que ya teníamos)
        watch(() => route.path, () => {
            if (isPlaying.value && audioElement.value) {
                audioElement.value.pause();
                isPlaying.value = false;
            }
        });

        // NUEVO: Volvemos a revisar si se necesita marquesina si los datos del post cambian
        watch(() => props.post, () => {
            checkScrollingRequirements();
        }, { deep: true });

        // Cuando se pausa desde la burbuja flotante, actualizamos nuestro botón local
        watch(() => globalAudioState.isPlaying, (newVal) => {
            if (globalAudioState.post?.id === props.post.id) {
                isPlaying.value = newVal;
            }
        });

        const formatTime = (seconds) => {
            if (isNaN(seconds)) return '0:00';
            const m = Math.floor(seconds / 60);
            const s = Math.floor(seconds % 60);
            return `${m}:${s < 10 ? '0' : ''}${s}`;
        };

        const togglePlay = () => {
            if (!audioElement.value) return;
            if (audioElement.value.paused) {
                audioElement.value.play();
                isPlaying.value = true;
            } else {
                audioElement.value.pause();
                isPlaying.value = false;
            }
        };

        const updateTime = () => {
            if (audioElement.value) {
                currentTimeFormatted.value = formatTime(audioElement.value.currentTime);
                progressPercent.value = (audioElement.value.currentTime / audioElement.value.duration) * 100 || 0;
                
                // Sincronizamos con la burbuja flotante
                if (globalAudioState.post && globalAudioState.post.id === props.post.id) {
                    globalAudioState.progressPercent = progressPercent.value;
                }
            }
        };

        const loadMetadata = () => {
            if (audioElement.value && audioElement.value.duration !== Infinity) {
                durationFormatted.value = formatTime(audioElement.value.duration);
            }
        };

        const onEnded = () => {
            isPlaying.value = false;
            progressPercent.value = 0;
            currentTimeFormatted.value = '0:00';
        };

        // Cuando le damos play a ESTE post
        const onNativePlay = (event) => {
            globalAudioState.isVisible = isCardCurrentlyVisible.value; 

            globalAudioState.isDismissed = false;
            
            isPlaying.value = true;
            globalAudioState.post = props.post;
            globalAudioState.isPlaying = true;
            globalAudioState.audioElement = audioElement.value;
            
            globalAudioState.themeColorHex = dominantColorHex.value;
            globalAudioState.themeColorRgb = dominantColorRgb.value;

            const audios = document.querySelectorAll('audio');
            audios.forEach((audio) => {
                if (audio !== event.target) audio.pause();
            });
        };

        onMounted(async () => {
            // Revisa si se necesita marquesina al montar el componente por primera vez
            checkScrollingRequirements();

            // --- MAGIA: DETECTAR SI LA TARJETA SALE DE LA PANTALLA ---
            const observer = new IntersectionObserver(([entry]) => {
                // 1. Siempre actualizamos la memoria local de esta tarjeta
                isCardCurrentlyVisible.value = entry.isIntersecting;
                
                // 2. Si es la canción que está sonando, también le avisa al cerebro global
                if (globalAudioState.post && globalAudioState.post.id === props.post.id) {
                    globalAudioState.isVisible = entry.isIntersecting;
                }
            }, { 
                threshold: [0, 0.1, 0.9, 1.0] 
            });

            if (playerContainer.value) {
                // En Ionic a veces necesitamos acceder a $el
                observer.observe(playerContainer.value.$el || playerContainer.value);
            }

            if (props.post.itunes_artwork_url) {
                extractMusicColor(props.post.itunes_artwork_url);
            }

            appStateListener = await App.addListener('appStateChange', (state) => {
                if (!state.isActive && audioElement.value) {
                    audioElement.value.pause();
                    isPlaying.value = false;
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
            updateTime, loadMetadata, onEnded, onNativePlay,
            // Exponemos las refs y estados de la marquesina
            songTitleRef, artistNameRef, shouldScrollTitle, shouldScrollArtist, isAmbientMode, dominantColorHex, dominantColorRgb, playerContainer
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
    background: #222428; /* Modo Normal: Fondo limpio según el tema de tu app */
    cursor: pointer;
    display: flex;
    overflow: hidden;
}

/* MODO AMBIENTE */
.music-content.is-ambient {
    background: #1a1a1a; 
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
}

/* 2. CAPA MEDIA: Filtro oscuro semi-transparente para garantizar legibilidad extrema */
.dark-overlay {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.55); /* 55% de oscuridad */
    z-index: 1;
}

/* 3. CAPA SUPERIOR DE FONDO: Barra de progreso (Tu color #4d8dff con transparencia) */
/* MODO NORMAL */
.progress-bg {
    position: absolute;
    top: 0; left: 0; 
    height: 100%;
    /* Usamos el RGB dinámico con 45% de opacidad */
    background: rgba(var(--theme-color-rgb), 0.55); 
    transition: width 0.1s linear; 
    z-index: 2;
}

/* MODO AMBIENTE */
.is-ambient .progress-bg {
    /* Usamos el RGB dinámico con solo 15% de opacidad para que el blur de fondo brille */
    background: rgba(var(--theme-color-rgb), 0.15); 
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
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.4));
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
    box-shadow: 0 1px 3px rgba(0,0,0,0.5);
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