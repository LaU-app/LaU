<template>
    <ion-page>
        <welcome-header />
        <ion-content :fullscreen="true" class="welcome-page">
            <div class="welcome-container">

                <div class="logo-container">
                    <img src="/LaU.png" alt="LaÚ" class="logo-img" />
                </div>

                <!-- Carousel de características -->
                <swiper :modules="modules" :slides-per-view="1" :space-between="16"
                    :autoplay="{ delay: 3000, disableOnInteraction: false }" @slideChange="onSlideChange"
                    class="welcome-swiper">
                    <swiper-slide>
                        <div class="slide-content">
                            <div class="slide-image"
                                :style="{ backgroundImage: `url(https://res.cloudinary.com/dj848z4er/image/upload/v1761525211/IMG_20240315_104900_b1fjqj.jpg)` }">
                            </div>
                        </div>
                    </swiper-slide>
                    <swiper-slide>
                        <div class="slide-content">
                            <div class="slide-image"
                                :style="{ backgroundImage: `url(https://res.cloudinary.com/dj848z4er/image/upload/v1761328457/5a965478-9727-444f-9832-eb1e0c37d497.png)` }">
                            </div>
                        </div>
                    </swiper-slide>
                    <swiper-slide>
                        <div class="slide-content">
                            <div class="slide-image" :style="{ backgroundImage: `url(https://res.cloudinary.com/dj848z4er/image/upload/v1761539611/bbe58127-5095-4028-872e-e45343abe39d.png)` }"></div>
                        </div>
                    </swiper-slide>
                </swiper>

                <!-- Indicadores de slide -->
                <div class="slide-indicators">
                    <div v-for="i in 3" :key="i" :class="['indicator', { active: currentSlide === i - 1 }]"></div>
                </div>

                <!-- Título principal -->
                <h2 class="main-title">Tu red universitaria. <br>Todo en un solo lugar.</h2>

                <!-- Cards de características -->
                <ion-grid class="features-grid">
                    <ion-row class="ion-align-items-stretch ion-justify-content-center">
                        <ion-col size="9" size-md="3">
                            <ion-card class="feature-card">
                                <ion-card-content class="ion-padding feature-content">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24"
                                        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                        stroke-linejoin="round" class="feature-icon-svg">
                                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                        <path d="M5.931 6.936l1.275 4.249m5.607 5.609l4.251 1.275" />
                                        <path d="M11.683 12.317l5.759 -5.759" />
                                        <path d="M5.5 5.5m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0" />
                                        <path d="M18.5 5.5m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0" />
                                        <path d="M18.5 18.5m-1.5 0a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0 -3 0" />
                                        <path d="M8.5 15.5m-4.5 0a4.5 4.5 0 1 0 9 0a4.5 4.5 0 1 0 -9 0" />
                                    </svg>
                                    <div class="feature-text">
                                        <h3>Conecta</h3>
                                        <p>Conecta con estudiantes de tu carrera.</p>
                                    </div>
                                </ion-card-content>
                            </ion-card>
                        </ion-col>
                        <ion-col size="9" size-md="3">
                            <ion-card class="feature-card">
                                <ion-card-content class="ion-padding feature-content">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24"
                                        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                        stroke-linejoin="round" class="feature-icon-svg">
                                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                        <path d="M15 3v4a1 1 0 0 0 1 1h4" />
                                        <path d="M15 3v4a1 1 0 0 0 1 1h4" />
                                        <path
                                            d="M6 8v-3a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-7" />
                                        <path d="M3 15l3 -3l3 3" />
                                    </svg>
                                    <div class="feature-text">
                                        <h3>Comparte</h3>
                                        <p>Accede y comparte material de estudio.</p>
                                    </div>
                                </ion-card-content>
                            </ion-card>
                        </ion-col>
                        <ion-col size="9" size-md="3">
                            <ion-card class="feature-card">
                                <ion-card-content class="ion-padding feature-content">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24"
                                        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                        stroke-linejoin="round" class="feature-icon-svg">
                                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                        <path d="M21 12a9 9 0 1 0 -9 9" />
                                        <path d="M9 10h.01" />
                                        <path d="M15 10h.01" />
                                        <path d="M9.5 15c.658 .672 1.56 1 2.5 1" />
                                        <path d="M18 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
                                        <path d="M20.2 20.2l1.8 1.8" />
                                    </svg>
                                    <div class="feature-text">
                                        <h3>Descubre</h3>
                                        <p>Entérate de los eventos académicos y sociales.</p>
                                    </div>
                                </ion-card-content>
                            </ion-card>
                        </ion-col>
                    </ion-row>
                </ion-grid>

                <!-- Botones de acción -->
                <div class="action-buttons">
                    <ion-button expand="block" class="create-account-btn" @click="goToRegister">
                        Crear Cuenta
                    </ion-button>
                    <ion-button expand="block" fill="clear" class="login-btn" @click="goToLogin">
                        ¿Ya tienes una cuenta? Inicia Sesión
                    </ion-button>
                </div>
            </div>
        </ion-content>
    </ion-page>
</template>

<script>
import {
    IonPage,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardContent,
    IonButton
} from '@ionic/vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay } from 'swiper/modules'
import WelcomeHeader from '@/components/WelcomeHeader.vue'
import 'swiper/css'
import 'swiper/css/autoplay'

export default {
    name: 'WelcomePage',
    components: {
        IonPage,
        IonContent,
        WelcomeHeader,
        Swiper,
        SwiperSlide,
        IonGrid,
        IonRow,
        IonCol,
        IonCard,
        IonCardContent,
        IonButton
    },
    data() {
        return {
            modules: [Autoplay],
            currentSlide: 0,
        }
    },
    methods: {
        onSlideChange(swiper) {
            this.currentSlide = swiper.activeIndex
        },
        goToRegister() {
            this.$router.push('/register')
        },
        goToLogin() {
            this.$router.push('/login')
        }
    }
}
</script>

<style scoped>
@import '../theme/colors.css';

/* LIGHT MODE - Fondo */
ion-content {
    --background: #F3F4F6;
}

ion-page {
    background: #F3F4F6;
}

.welcome-page {
    --background: #F3F4F6;
}

.welcome-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    padding: 0.5rem 1rem 1rem 1rem;
    background: #F3F4F6;
}

.logo-container {
    display: flex;
    align-items: center;
    justify-content: center;
}

.logo-img {
    height: 146px;
    width: auto;
    object-fit: contain;
}

/* DARK MODE - Fondo */
.ion-palette-dark ion-content {
    --background: #121212 !important;
}

.ion-palette-dark ion-page {
    background: #121212 !important;
}

.ion-palette-dark .welcome-page {
    --background: #121212 !important;
}

.ion-palette-dark .welcome-container {
    background: #121212 !important;
}

/* Slides */
.welcome-swiper {
    width: 100%;
    height: auto;
    margin-bottom: 0.5rem;
    padding: 1rem 0;
}

.slide-content {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 450px;
    padding: 0 1rem;
    margin: 0 auto;
}

.slide-image {
    width: 100%;
    aspect-ratio: 16 / 9;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    border-radius: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* Indicadores */
.slide-indicators {
    display: flex;
    justify-content: center;
    gap: 0.75rem;
    padding: 0.75rem 0 1rem 0;
}

.indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #6B7280;
    opacity: 0.3;
    transition: all 0.3s ease;
}

.indicator.active {
    background-color: #8A2BE2;
    opacity: 1;
    transform: scale(1.2);
}

/* Título principal */
.main-title {
    font-family: "Righteous", sans-serif;
    font-size: 1.75rem;
    font-weight: 400;
    text-align: center;
    color: #1F2937;
    margin: 1rem 0 1.5rem 0;
    line-height: 1.3;
    text-transform: uppercase;
}

.ion-palette-dark .main-title {
    color: #E5E7EB;
}

/* Features Grid */
.features-grid {
    padding: 0;
    margin-bottom: 1rem;
}

/* LIGHT MODE - Cards */
.feature-card {
    margin: 0.5rem 0;
    border: 1px solid #E5E7EB;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    background: #FFFFFF;
    --background: #FFFFFF;
    border-radius: 16px;
}

.feature-card ion-card-content {
    background: #FFFFFF;

}

/* DARK MODE - Cards */
.ion-palette-dark .feature-card {
    border: 1px solid #374151;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    background: #1E1E1E !important;
    --background: #1E1E1E !important;
}

.ion-palette-dark .feature-card ion-card-content {
    background: #1E1E1E !important;

}

.feature-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0.5rem;
}

.feature-icon {
    font-size: 2.5rem;
    color: #8A2BE2;
    margin-bottom: 0.25rem;
}

.feature-icon-svg {
    width: 40px;
    height: 40px;
    color: #8A2BE2;
    stroke: #8A2BE2;
    margin-bottom: 0.25rem;
}

.feature-text h3 {
    font-family: "Righteous", sans-serif;
    font-size: 1.1rem;
    font-weight: 400;
    color: #1F2937;
    margin: 0 0 0.25rem 0;
    text-transform: uppercase;
}

.ion-palette-dark .feature-text h3 {
    color: #E5E7EB;
}

.feature-text p {
    font-size: 0.875rem;
    color: #6B7280;
    margin: 0;
    line-height: 1.4;
}

.ion-palette-dark .feature-text p {
    color: #9CA3AF;
}

/* Botones de acción */
.action-buttons {
    margin-top: auto;
    padding-top: 1.5rem;
}

.create-account-btn {
    --background: #8A2BE2;
    --color: #FFFFFF;
    --border-radius: 12px;
    font-weight: 700;
    margin-bottom: 0.75rem;
    text-transform: none;
    height: 48px;
    font-size: 1rem;
}

.login-btn {
    --color: #8A2BE2;
    --border-radius: 12px;
    font-weight: 600;
    text-transform: none;
    height: 48px;
    font-size: 0.95rem;
}

/* Responsive */
@media (min-width: 768px) {
    .welcome-container {
        max-width: 1200px;
        margin: 0 auto;
    }

    .slide-content {
        max-width: 600px;
    }

    .main-title {
        font-size: 2.25rem;
    }
}
</style>