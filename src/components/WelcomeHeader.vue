<template>
    <ion-header class="ion-no-border welcome-header">
        <ion-toolbar>
            <div class="welcome-header-content">
                <ion-button @click="toggleDarkMode" fill="clear" class="theme-toggle-btn">
                    <ion-icon :icon="isDarkMode ? sunny : moon" class="theme-icon"></ion-icon>
                </ion-button>
            </div>
        </ion-toolbar>
    </ion-header>
</template>

<script>
import { IonHeader, IonToolbar, IonButton, IonIcon } from '@ionic/vue'
import { moon, sunny } from 'ionicons/icons'

export default {
    name: 'WelcomeHeader',
    components: {
        IonHeader,
        IonToolbar,
        IonButton,
        IonIcon
    },
    data() {
        return {
            moon,
            sunny,
            isDarkMode: false
        }
    },
    mounted() {
        // Detectar el modo oscuro actual
        this.isDarkMode = document.documentElement.classList.contains('ion-palette-dark')
    },
    methods: {
        toggleDarkMode() {
            this.isDarkMode = !this.isDarkMode
            document.documentElement.classList.toggle('ion-palette-dark', this.isDarkMode)

            // Guardar preferencia en localStorage
            localStorage.setItem('darkMode', this.isDarkMode ? 'true' : 'false')
        }
    }
}
</script>

<style scoped>
@import '../theme/colors.css';

/* LIGHT MODE */
.welcome-header {
    --background: #F3F4F6;
}

ion-toolbar {
    --background: #F3F4F6;
    --border-width: 0;
    padding: 0.5rem 1rem;
}

/* DARK MODE */
.ion-palette-dark .welcome-header {
    --background: #121212 !important;
}

.ion-palette-dark ion-toolbar {
    --background: #121212 !important;
}

.welcome-header-content {
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 100%;
}

.theme-toggle-btn {
    position: absolute;
    right: 0;
    --padding-start: 8px;
    --padding-end: 8px;
}

.theme-icon {
    font-size: 26px;
    color: #8A2BE2;
}
</style>
