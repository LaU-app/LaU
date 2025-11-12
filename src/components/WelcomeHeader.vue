<template>
    <ion-header class="ion-no-border welcome-header">
        <ion-toolbar>
            <div class="welcome-header-content">
                <ion-button v-if="showLoginButton" @click="goToLogin" fill="clear" class="login-toggle-btn">
                    <ion-icon :icon="logIn" class="login-icon"></ion-icon>
                </ion-button>
                <ion-button @click="toggleDarkMode" fill="clear" class="theme-toggle-btn">
                    <ion-icon :icon="isDarkMode ? sunny : moon" class="theme-icon"></ion-icon>
                </ion-button>
            </div>
        </ion-toolbar>
    </ion-header>
</template>

<script>
import { IonHeader, IonToolbar, IonButton, IonIcon } from '@ionic/vue'
import { moon, sunny, logIn } from 'ionicons/icons'
import { useDarkMode } from '@/utils/useDarkMode'

export default {
    name: 'WelcomeHeader',
    components: {
        IonHeader,
        IonToolbar,
        IonButton,
        IonIcon
    },
    props: {
        showLoginButton: {
            type: Boolean,
            default: false
        }
    },
    setup() {
        const { isDarkMode, toggleDarkMode } = useDarkMode()
        return {
            isDarkMode,
            toggleDarkMode,
            moon,
            sunny,
            logIn
        }
    },
    methods: {
        goToLogin() {
            this.$router.push('/login')
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
    justify-content: flex-end;
    gap: 8px;
    position: relative;
    width: 100%;
}

.login-toggle-btn {
    --padding-start: 8px;
    --padding-end: 8px;
}

.login-icon {
    font-size: 26px;
    color: #8A2BE2;
}

.theme-toggle-btn {
    --padding-start: 8px;
    --padding-end: 8px;
}

.theme-icon {
    font-size: 26px;
    color: #8A2BE2;
}
</style>
