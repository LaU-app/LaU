<template>
    <ion-page>
        <ion-content :fullscreen="true" class="login-page">
            <!-- Imagen de fondo -->
            <div class="background-image"></div>
            <div class="background-overlay"></div>

            <!-- Contenido -->
            <div class="login-container">
                <!-- Header -->
                <div class="login-header">
                    <ion-button fill="clear" class="back-button" @click="goToWelcome">
                        <ion-icon :icon="arrowBack" slot="icon-only"></ion-icon>
                    </ion-button>
                </div>

                <!-- Contenido principal -->
                <div class="login-content">
                    <!-- Logo y título -->
                    <div class="title-section">
                        <img src="/LaU1.png" alt="LaÚ" class="app-logo" />
                        <h2 class="subtitle">BIENVENIDO DE NUEVO</h2>
                        <p class="description">
                            Ingresa con tu correo institucional para conectar con tu campus.
                        </p>
                    </div>

                    <!-- Formulario -->
                    <form @submit.prevent="handleLogin" class="login-form">
                        <!-- Correo institucional -->
                        <div class="input-wrapper" :class="{ 'focused': emailFocused, 'invalid': errors.email }">
                            <ion-input v-model="formData.email" type="email" placeholder="Correo institucional"
                                class="login-input" :class="{ 'ion-invalid': errors.email }"
                                @ionFocus="emailFocused = true" @ionBlur="emailFocused = false"></ion-input>
                            <div class="input-line"></div>
                        </div>

                        <!-- Contraseña -->
                        <div class="input-wrapper" :class="{ 'focused': passwordFocused, 'invalid': errors.password }">
                            <ion-input v-model="formData.password" :type="showPassword ? 'text' : 'password'"
                                placeholder="Contraseña" class="login-input" :class="{ 'ion-invalid': errors.password }"
                                @ionFocus="passwordFocused = true" @ionBlur="passwordFocused = false">
                                <ion-icon :icon="showPassword ? eyeOffOutline : eyeOutline" slot="end"
                                    @click="togglePassword" class="password-toggle"></ion-icon>
                            </ion-input>
                            <div class="input-line"></div>
                        </div>

                        <!-- Olvidaste tu contraseña -->
                        <div class="forgot-password-container">
                            <ion-checkbox v-model="rememberMe" class="remember-checkbox">
                                <span class="remember-text">Recuérdame</span>
                            </ion-checkbox>
                            <a href="#" class="forgot-password-link">¿Olvidaste tu contraseña?</a>
                        </div>

                        <!-- Mensaje de error general -->
                        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

                        <!-- Botón de login -->
                        <ion-button expand="block" type="submit" class="login-button" :disabled="loading">
                            <ion-spinner v-if="loading" name="crescent"></ion-spinner>
                            <span v-else>Iniciar Sesión</span>
                        </ion-button>

                        <!-- Link a registro -->
                        <p class="register-link-text">
                            ¿No tienes una cuenta?
                            <a @click.prevent="goToRegister" class="register-link">Regístrate</a>
                        </p>
                    </form>
                </div>
            </div>
        </ion-content>
    </ion-page>
</template>

<script>
import {
    IonPage,
    IonContent,
    IonButton,
    IonInput,
    IonIcon,
    IonSpinner,
    IonCheckbox,
    toastController
} from '@ionic/vue'
import { arrowBack, eyeOutline, eyeOffOutline } from 'ionicons/icons'
import { AuthService } from '@/services/auth'

export default {
    name: 'LoginView',
    components: {
        IonPage,
        IonContent,
        IonButton,
        IonInput,
        IonIcon,
        IonSpinner,
        IonCheckbox
    },
    data() {
        return {
            arrowBack,
            eyeOutline,
            eyeOffOutline,
            formData: {
                email: '',
                password: ''
            },
            errors: {
                email: false,
                password: false
            },
            showPassword: false,
            loading: false,
            errorMessage: '',
            emailFocused: false,
            passwordFocused: false,
            rememberMe: false
        }
    },
    methods: {
        validateForm() {
            // Validación del email y contraseña según el controlador
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            const isEmailValid = this.formData.email && emailRegex.test(this.formData.email)
            const isPasswordValid = this.formData.password && this.formData.password.length >= 1

            return isEmailValid && isPasswordValid
        },

        async handleLogin() {
            this.errorMessage = ''
            // Resetear errores visuales
            this.errors.email = false
            this.errors.password = false

            if (!this.validateForm()) {
                this.errorMessage = 'Por favor, ingresa un correo y contraseña válidos'
                return
            }

            this.loading = true

            try {
                /*console.log('[LOGIN] Iniciando login...', { email: this.formData.email });*/

                // Pasar rememberMe al servicio de autenticación
                await AuthService.login(this.formData, this.rememberMe)

                /*console.log('[LOGIN] Login completado exitosamente');*/

                // Mostrar mensaje de éxito
                const toast = await toastController.create({
                    message: '¡Bienvenido de nuevo!',
                    duration: 2000,
                    position: 'top',
                    cssClass: 'success-toast'
                })
                await toast.present()

                // Redirigir al home o dashboard
                this.$router.replace('/tabs/tab1')
            } catch (error) {
                console.error('[LOGIN] Error en login:', error)

                // Marcar campos con error
                this.errors.email = true
                this.errors.password = true

                // Mostrar mensaje de error específico
                let errorMsg = 'Error al iniciar sesión. Por favor, intenta de nuevo.';

                if (!error.response) {
                    // Error de red
                    errorMsg = 'No se pudo conectar al servidor. Verifica tu conexión a internet.';
                } else if (error.response?.data?.message) {
                    errorMsg = error.response.data.message;
                } else if (error.response?.status === 401) {
                    errorMsg = 'Las credenciales son incorrectas.';
                } else if (error.response?.status === 500) {
                    errorMsg = 'Error en el servidor. Intenta más tarde.';
                }

                this.errorMessage = errorMsg;

                const toast = await toastController.create({
                    message: this.errorMessage,
                    duration: 3000,
                    position: 'top',
                    cssClass: 'danger-toast'
                })
                await toast.present()
            } finally {
                this.loading = false
            }
        },

        togglePassword() {
            this.showPassword = !this.showPassword
        },

        goToWelcome() {
            this.$router.push('/welcome')
        },

        goToRegister() {
            this.$router.push('/register')
        }
    }
}
</script>

<style scoped>
/* Fondo */
.login-page {
    --background: transparent;
}

.background-image {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url('https://res.cloudinary.com/dj848z4er/image/upload/v1763388919/b0c89a4c-efd1-4bc5-b5c0-496c74cf7b5a.png');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    z-index: 0;
}

.background-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.645), rgba(0, 0, 0, 0.201), transparent);
    z-index: 1;
}

/* Container */
.login-container {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    padding: 1.5rem 1.5rem 2rem 1.5rem;
}

/* Header */
.login-header {
    display: flex;
    justify-content: flex-start;
    margin-bottom: 2rem;
}

.back-button {
    --background: rgba(255, 255, 255, 0.2);
    --color: #FFFFFF;
    --border-radius: 50%;
    --padding-start: 0;
    --padding-end: 0;
    width: 40px;
    height: 40px;
    margin: 0;
}

/* Contenido */
.login-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

/* Título */
.title-section {
    margin-bottom: 2rem;
}

.app-logo {
    width: 160px;
    height: auto;
}

.subtitle {
    font-family: "Righteous", sans-serif;
    font-size: 1.875rem;
    font-weight: 400;
    color: #FFFFFF;
    margin: 0 0 1rem 0;
    line-height: 1.2;
    text-transform: uppercase;
}

.description {
    font-size: 0.875rem;
    font-weight: 300;
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
    line-height: 1.5;
}

ion-grid {
    padding: 0;
    margin-bottom: 1rem;
}

/* Formulario */
.login-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

/* Wrapper para input con línea */
.input-wrapper {
    position: relative;
    overflow: hidden;
}

.input-wrapper::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: rgba(55, 65, 81, 0.5);
    z-index: 5;
}

.login-input {
    --background: rgba(55, 65, 81, 0.5);
    --color: #FFFFFF;
    --placeholder-color: rgba(255, 255, 255, 0.6);
    --padding-start: 1rem;
    --padding-end: 1rem;
    --border-radius: 0.5rem 0.5rem 0 0;
    --border-color: transparent !important;
    --highlight-color: transparent !important;
    --highlight-color-focused: transparent !important;
    --highlight-color-valid: transparent !important;
    --highlight-color-invalid: transparent !important;
    --highlight-height: 0 !important;
    height: 3.5rem;
    font-size: 1rem;
    caret-color: #8A2BE2;
    border: none !important;
    position: relative;
    z-index: 1;
}

.login-input.ion-focused {
    --background: rgba(55, 65, 81, 0.5);
    --color: #FFFFFF;
    --highlight-color: transparent;
    --highlight-color-focused: transparent;
}

.login-input:hover {
    --background: rgba(55, 65, 81, 0.5);
}

.login-input::part(native) {
    border-radius: 0.5rem 0.5rem 0 0 !important;
    background: rgba(55, 65, 81, 0.5) !important;
    caret-color: #8A2BE2 !important;
}

/* Línea animada inferior */
.input-line {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 2px;
    background: #8A2BE2;
    transition: width 0.3s ease;
    z-index: 20;
}

.input-wrapper.focused .input-line {
    width: 100%;
}

.input-wrapper.invalid .input-line {
    background: #ef4444;
    width: 100%;
}

.input-wrapper.focused::after {
    display: none;
}

.input-wrapper.invalid::after {
    display: none;
}

.login-input.ion-invalid {
    --background: rgba(239, 68, 68, 0.2);
    --border-color: #ef4444;
}

.login-input.ion-invalid::part(native) {
    background: rgba(239, 68, 68, 0.2) !important;
}

.password-toggle {
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    font-size: 1.25rem;
}

.forgot-password-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: -0.5rem;
}

.remember-checkbox {
    --size: 20px;
    --checkbox-background-checked: #8A2BE2;
    --border-color: rgba(255, 255, 255, 0.4);
    --border-color-checked: #8A2BE2;
    margin-right: 0.5rem;
}

.remember-text {
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.875rem;
    font-weight: 400;
    margin-left: 0.5rem;
}

.forgot-password-link {
    color: #8A2BE2;
    font-size: 0.875rem;
    font-weight: 500;
    text-decoration: none;
}

.error-message {
    color: #ef4444;
    font-size: 0.875rem;
    margin: -0.5rem 0 0 0;
    text-align: center;
}

.login-button {
    --background: #8A2BE2;
    --color: #FFFFFF;
    --border-radius: 0.5rem;
    font-weight: 700;
    font-size: 1.125rem;
    height: 3.5rem;
    margin-top: 0.5rem;
    text-transform: none;
}

.login-button:hover {
    --background: #7a24c7;
}

.login-button::part(native) {
    border-radius: 0.5rem;
}

.register-link-text {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.9);
    text-align: center;
    margin: 1rem 0 0 0;
}

.register-link {
    color: #8A2BE2;
    font-weight: 600;
    text-decoration: underline;
    cursor: pointer;
}

/* Responsive */
@media (min-width: 768px) {
    .login-container {
        max-width: 480px;
        margin: 0 auto;
    }

    .app-title {
        font-size: 4.5rem;
    }

    .subtitle {
        font-size: 2.25rem;
    }
}
</style>

<style>
/* Estilos globales sin scoped para penetrar en componentes de Ionic */
.login-page .input-wrapper ion-input {
    --highlight-color-focused: transparent !important;
    --highlight-color-valid: transparent !important;
    --highlight-color-invalid: transparent !important;
    --highlight-height: 0 !important;
}

.login-page .input-wrapper ion-input .input-highlight {
    display: none !important;
}

.login-page .input-wrapper ion-input .input-bottom {
    display: none !important;
}

/* Cubrir absolutamente cualquier línea que aparezca */
.login-page .input-wrapper::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: rgba(55, 65, 81, 0.5);
    z-index: 15;
    pointer-events: none;
}

.login-page .input-wrapper.focused::before,
.login-page .input-wrapper.invalid::before {
    display: none;
}
</style>
