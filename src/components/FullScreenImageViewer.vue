<template>
    <ion-modal 
    :is-open="isOpen" 
    @didDismiss="handleDismiss"
    @didPresent="initGesture" 
    class="image-viewer-modal"
    :enter-animation="enterAnimation"
    :leave-animation="leaveAnimation">
        <ion-content>
            <div class="modal-image-container" @click="toggleUI">
                
                <div v-if="isAmbientMode" class="modal-blur-bg"
                    :style="{ backgroundImage: `url(${imageUrl})` }">
                </div>

                <transition name="fade">
                    <ion-button v-show="showUI" class="close-image-btn" @click.stop="handleDismiss">
                        <ion-icon :icon="closeOutline" slot="icon-only"></ion-icon>
                    </ion-button>
                </transition>

                <img ref="draggableImage" :src="imageUrl" class="fullscreen-img" />
            </div>
        </ion-content>
    </ion-modal>
</template>

<script setup>
import { ref } from 'vue';
import { IonModal, IonContent, IonButton, IonIcon, createGesture, createAnimation } from '@ionic/vue';
import { closeOutline } from 'ionicons/icons';
import { StatusBar } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

// --- NUEVO: Animación de Entrada (Fade + Scale) ---
const enterAnimation = (baseEl) => {
    const root = baseEl.shadowRoot;
    
    // Animación del fondo oscuro
    const backdropAnimation = createAnimation()
        .addElement(root.querySelector('ion-backdrop'))
        .fromTo('opacity', '0.01', 'var(--backdrop-opacity)');

    // Animación del contenedor de la imagen (Aparece y hace un ligero zoom desde 0.8 a 1)
    const wrapperAnimation = createAnimation()
        .addElement(root.querySelector('.modal-wrapper'))
        .keyframes([
            { offset: 0, opacity: '0', transform: 'scale(0.8)' },
            { offset: 1, opacity: '1', transform: 'scale(1)' }
        ]);

    return createAnimation()
        .addElement(baseEl)
        .easing('ease-out')
        .duration(250) // Duración en milisegundos
        .addAnimation([backdropAnimation, wrapperAnimation]);
};

// --- NUEVO: Animación de Salida (Reversa) ---
const leaveAnimation = (baseEl) => {
    return enterAnimation(baseEl).direction('reverse');
};

// Propiedades que el componente recibirá desde fuera
const props = defineProps({
    isOpen: {
        type: Boolean,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    isAmbientMode: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['close']);

const draggableImage = ref(null);
let gesture = null;

// Estado para controlar la visibilidad de los controles (botón cerrar, status bar)
const showUI = ref(true);

// Función para alternar el Modo Inmersivo
const toggleUI = async () => {
    showUI.value = !showUI.value;
    
    // Si estamos en un celular real, ocultamos/mostramos la barra del celular (batería, hora)
    if (Capacitor.isNativePlatform()) {
        try {
            if (showUI.value) {
                await StatusBar.show();
            } else {
                await StatusBar.hide();
            }
        } catch (e) {
            console.warn("StatusBar plugin no disponible", e);
        }
    }
};

const handleDismiss = async () => {
    emit('close'); // Avisamos al padre que cierre el modal

    // MUY IMPORTANTE: Si el usuario cierra la imagen mientras la UI estaba oculta, 
    // debemos restaurar la barra de estado para el resto de la app
    if (Capacitor.isNativePlatform() && !showUI.value) {
        await StatusBar.show();
        showUI.value = true;
    }

    if (gesture) {
        gesture.destroy();
        gesture = null;
    }

    setTimeout(() => {
        if (draggableImage.value) {
            draggableImage.value.style.transform = `translateY(0px)`;
            draggableImage.value.style.transition = 'none';
        }
        showUI.value = true; // Reseteamos el estado para la próxima vez que se abra
    }, 300);
};

const initGesture = () => {
    if (!draggableImage.value) return;

    gesture = createGesture({
        el: draggableImage.value,
        gestureName: 'swipe-to-close',
        direction: 'y',

        onStart: () => {
            draggableImage.value.style.transition = 'none';
            // Opcional: Mostrar la UI si el usuario empieza a deslizar
            if (!showUI.value) toggleUI(); 
        },

        onMove: (detail) => {
            draggableImage.value.style.transform = `translateY(${detail.deltaY}px)`;
        },

        onEnd: (detail) => {
            draggableImage.value.style.transition = 'transform 0.3s ease-out';

            if (Math.abs(detail.deltaY) > 150) {
                const direccion = detail.deltaY > 0 ? 1 : -1;
                draggableImage.value.style.transform = `translateY(${direccion * 100}vh)`;

                setTimeout(() => {
                    handleDismiss();
                }, 200);
            } else {
                draggableImage.value.style.transform = `translateY(0px)`;
            }
        }
    });

    gesture.enable(true);
};
</script>

<style scoped>
/* Transición suave para ocultar/mostrar el botón de cerrar */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* --- RESTO DE TU CSS ORIGINAL --- */
ion-modal.image-viewer-modal {
    --background: rgba(0, 0, 0, 0.95);
}

ion-modal.image-viewer-modal ion-content {
    --background: #000 !important;
    --background: transparent; /* Importante para el blur */
}

.modal-image-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
}

.fullscreen-img {
    max-width: 100vw;
    max-height: 100vh;
    object-fit: contain;
    user-select: none;
    z-index: 2;
    position: relative;
}

.close-image-btn {
    position: absolute;
    top: calc(20px + env(safe-area-inset-top));
    right: 15px;
    z-index: 100;
    --background: rgba(100, 100, 100, 0.6);
    --border-radius: 50%;
    --padding-start: 0;
    --padding-end: 0;
    --border-color: 0.5px solid rgba(255, 255, 255, 0.3);
    width: 32px;
    height: 32px;
    min-width: 32px;
    min-height: 32px;
    margin: 0;
    transition: background 0.2s ease;
}

.close-image-btn:hover {
    opacity: 1;
}

.close-image-btn ion-icon {
    color: #ffffff !important;
    font-size: 20px !important;
}

.close-image-btn:hover,
.close-image-btn:active {
    --background: rgba(100, 100, 100, 0.9);
}

.modal-blur-bg {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background-size: cover;
    background-position: center;
    filter: blur(30px) saturate(1.5) brightness(0.5);
    transform: scale(1.1);
    z-index: 0;
}
</style>