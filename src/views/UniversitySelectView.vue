<template>
    <ion-page>
        <ion-content :fullscreen="true" class="university-page">
            <!-- Imagen de fondo -->
            <div class="background-image"></div>
            <div class="background-overlay"></div>

            <!-- Contenido -->
            <div class="university-container">
                <!-- Header -->
                <div class="university-header" style="padding-top: env(safe-area-inset-top) !important;">
                    <ion-button fill="clear" class="back-button" @click="goBack">
                        <ion-icon :icon="arrowBack" slot="icon-only"></ion-icon>
                    </ion-button>
                </div>

                <!-- Progress bar -->
                <div class="progress-container">
                    <div class="progress-step" :class="{ active: currentStep >= 1 }"></div>
                    <div class="progress-step" :class="{ active: currentStep >= 2 }"></div>
                </div>

                <!-- Contenido principal -->
                <div class="university-content">
                    <!-- Logo y título -->
                    <div class="title-section">
                        <img src="/LaU1.png" alt="LaÚ" class="app-logo" />
                        <h2 class="subtitle">{{ currentTitle }}</h2>
                        <p class="description">{{ currentDescription }}</p>
                    </div>

                    <!-- Formulario -->
                    <form @submit.prevent="handleNext" class="university-form">
                        <!-- Paso 1: Seleccionar Universidad y Carrera -->
                        <div v-if="currentStep === 1" class="form-step">
                            <!-- Mensaje si no hay universidades -->
                            <div v-if="!loading && universidades.length === 0" class="no-data-message">
                                <ion-icon :icon="alertCircleOutline" class="alert-icon"></ion-icon>
                                <p>No se pudieron cargar las universidades.</p>
                                <p class="small-text">El servidor no tiene este endpoint configurado aún.</p>
                                <ion-button size="small" @click="loadUniversidades" class="retry-button">
                                    <ion-icon :icon="refreshOutline" slot="start"></ion-icon>
                                    Reintentar
                                </ion-button>
                            </div>

                            <div v-else>
                                <div class="select-wrapper">
                                    <ion-list class="select-list">
                                        <ion-item lines="none" class="select-item">
                                            <ion-select v-model="selectedUniversidad"
                                                placeholder="Selecciona tu universidad" interface="action-sheet"
                                                @ionChange="onUniversidadChange">
                                                <ion-select-option v-for="uni in universidades" :key="uni.id"
                                                    :value="uni">
                                                    {{ uni.nombre }}
                                                </ion-select-option>
                                            </ion-select>
                                        </ion-item>
                                    </ion-list>
                                </div>

                                <div class="select-wrapper" v-if="selectedUniversidad">
                                    <ion-list class="select-list">
                                        <ion-item lines="none" class="select-item">
                                            <ion-select v-model="selectedCarrera" placeholder="Selecciona tu carrera"
                                                interface="action-sheet" :disabled="loadingCarreras">
                                                <ion-select-option v-for="carrera in carreras" :key="carrera.id"
                                                    :value="carrera">
                                                    {{ carrera.nombre }}
                                                </ion-select-option>
                                            </ion-select>
                                        </ion-item>
                                    </ion-list>
                                </div>
                            </div>
                        </div>

                        <!-- Paso 2: Formulario de Registro -->
                        <div v-if="currentStep === 2" class="form-step">
                            <!-- Nombre completo -->
                            <div class="input-wrapper" :class="{ 'focused': nameFocused, 'invalid': errors.name }">
                                <ion-input v-model="formData.name" type="text" placeholder="Tu nombre"
                                    class="register-input" :class="{ 'ion-invalid': errors.name }"
                                    @ionFocus="nameFocused = true" @ionBlur="nameFocused = false"></ion-input>
                                <div class="input-line"></div>
                            </div>

                            <!-- Nombre de usuario -->
                            <div class="input-wrapper"
                                :class="{ 'focused': usernameFocused, 'invalid': errors.username }">
                                <ion-input v-model="formData.username" type="text"
                                    placeholder="Nombre de usuario (máx. 15 caracteres)" class="register-input"
                                    :class="{ 'ion-invalid': errors.username }" @ionFocus="usernameFocused = true"
                                    @ionBlur="usernameFocused = false" maxlength="15"></ion-input>
                                <div class="input-line"></div>
                            </div>

                            <!-- Correo institucional -->
                            <div class="input-wrapper" :class="{ 'focused': emailFocused, 'invalid': errors.email }">
                                <ion-input v-model="formData.email" type="email" :placeholder="emailPlaceholder"
                                    class="register-input" :class="{ 'ion-invalid': errors.email }"
                                    @ionFocus="emailFocused = true" @ionBlur="emailFocused = false"></ion-input>
                                <div class="input-line"></div>
                            </div>

                            <!-- Contraseña -->
                            <div class="input-wrapper"
                                :class="{ 'focused': passwordFocused, 'invalid': errors.password }">
                                <ion-input v-model="formData.password" :type="showPassword ? 'text' : 'password'"
                                    placeholder="Contraseña" class="register-input"
                                    :class="{ 'ion-invalid': errors.password }" @ionFocus="passwordFocused = true"
                                    @ionBlur="passwordFocused = false">
                                    <ion-icon :icon="showPassword ? eyeOffOutline : eyeOutline" slot="end"
                                        @click="togglePassword" class="password-toggle"></ion-icon>
                                </ion-input>
                                <div class="input-line"></div>
                            </div>

                            <!-- Confirmar contraseña -->
                            <div class="input-wrapper"
                                :class="{ 'focused': passwordConfirmFocused, 'invalid': errors.password_confirmation }">
                                <ion-input v-model="formData.password_confirmation"
                                    :type="showPasswordConfirm ? 'text' : 'password'" placeholder="Confirmar contraseña"
                                    class="register-input" :class="{ 'ion-invalid': errors.password_confirmation }"
                                    @ionFocus="passwordConfirmFocused = true" @ionBlur="passwordConfirmFocused = false">
                                    <ion-icon :icon="showPasswordConfirm ? eyeOffOutline : eyeOutline" slot="end"
                                        @click="togglePasswordConfirm" class="password-toggle"></ion-icon>
                                </ion-input>
                                <div class="input-line"></div>
                            </div>

                            <!-- Términos y condiciones -->
                            <p class="terms-text">
                                Al registrarte, aceptas nuestros
                                <a href="#" class="terms-link">Términos y Condiciones</a> de uso y confirmas que has
                                leído
                                nuestra
                                <a href="#" class="terms-link">Política de Privacidad</a>.
                            </p>
                        </div>

                        <!-- Mensaje de error -->
                        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

                        <!-- Botón continuar -->
                        <ion-button expand="block" type="submit" class="continue-button"
                            :disabled="!canContinue || loading">
                            <ion-spinner v-if="loading" name="crescent"></ion-spinner>
                            <span v-else>{{ buttonText }}</span>
                        </ion-button>

                        <!-- Link a login -->
                        <p class="login-link-text">
                            ¿Ya tienes una cuenta?
                            <a @click.prevent="goToLogin" class="login-link">Inicia Sesión</a>
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
    IonIcon,
    IonSpinner,
    IonList,
    IonItem,
    IonSelect,
    IonSelectOption,
    IonInput,
    toastController
} from '@ionic/vue'
import { arrowBack, eyeOutline, eyeOffOutline, alertCircleOutline, refreshOutline } from 'ionicons/icons'
import { UniversidadService } from '@/services/universidad'
import { AuthService } from '@/services/auth'

export default {
    name: 'UniversitySelectView',
    components: {
        IonPage,
        IonContent,
        IonButton,
        IonIcon,
        IonSpinner,
        IonList,
        IonItem,
        IonSelect,
        IonSelectOption,
        IonInput
    },
    data() {
        return {
            arrowBack,
            eyeOutline,
            eyeOffOutline,
            alertCircleOutline,
            refreshOutline,
            currentStep: 1,
            universidades: [],
            carreras: [],
            selectedUniversidad: null,
            selectedCarrera: null,
            loading: false,
            loadingCarreras: false,
            errorMessage: '',
            // Formulario de registro
            formData: {
                name: '',
                username: '',
                email: '',
                password: '',
                password_confirmation: '',
                universidad_id: null,
                carrera_id: null
            },
            errors: {
                name: false,
                username: false,
                email: false,
                password: false,
                password_confirmation: false
            },
            showPassword: false,
            showPasswordConfirm: false,
            nameFocused: false,
            usernameFocused: false,
            emailFocused: false,
            passwordFocused: false,
            passwordConfirmFocused: false
        }
    },
    computed: {
        currentTitle() {
            return this.currentStep === 1 ? 'SELECCIONA TU UNIVERSIDAD' : 'COMPLETA TU REGISTRO'
        },
        currentDescription() {
            return this.currentStep === 1
                ? 'Elige tu universidad y carrera para conectar con tu comunidad.'
                : 'Completa tus datos para unirte a la red universitaria.'
        },
        buttonText() {
            return this.currentStep === 1 ? 'Continuar' : 'Registrarse'
        },
        canContinue() {
            if (this.currentStep === 1) {
                return this.selectedUniversidad !== null && this.selectedCarrera !== null
            }
            // En paso 2, validar formulario de registro
            return this.validateForm()
        },
        emailPlaceholder() {
            if (this.selectedUniversidad?.dominio) {
                return `Correo institucional (${this.selectedUniversidad.dominio})`
            }
            return 'Correo institucional'
        }
    },
    async mounted() {
        await this.loadUniversidades()
    },
    methods: {
        async loadUniversidades() {
            this.loading = true
            try {
                const response = await UniversidadService.getUniversidades()
                /* console.log('Universidades cargadas:', response) */
                this.universidades = response.data || response
            } catch (error) {
                console.error('Error al cargar universidades:', error)

                let errorMsg = 'Error al cargar las universidades'
                if (error.response?.status === 404) {
                    errorMsg = 'El servidor no tiene configurado el endpoint de universidades. Por favor, contacta al administrador.'
                } else if (error.code === 'ERR_NETWORK') {
                    errorMsg = 'Error de conexión. Verifica tu internet.'
                }

                this.errorMessage = errorMsg
                const toast = await toastController.create({
                    message: errorMsg,
                    duration: 5000,
                    color: 'danger',
                    position: 'top'
                })
                await toast.present()
            } finally {
                this.loading = false
            }
        },

        async onUniversidadChange() {
            if (this.selectedUniversidad) {
                this.loadingCarreras = true
                this.selectedCarrera = null
                this.errorMessage = ''
                try {
                    const response = await UniversidadService.getCarreras(this.selectedUniversidad.id)
                    this.carreras = response.data
                } catch (error) {
                    console.error('Error al cargar carreras:', error)
                    this.errorMessage = 'Error al cargar las carreras'
                    const toast = await toastController.create({
                        message: 'Error al cargar las carreras',
                        duration: 3000,
                        color: 'danger',
                        position: 'top'
                    })
                    await toast.present()
                } finally {
                    this.loadingCarreras = false
                }
            }
        },

        validateForm() {
            if (!this.formData.name || this.formData.name.trim().length === 0) return false
            if (!this.formData.username || this.formData.username.trim().length === 0 || this.formData.username.length > 15) return false
            if (!this.formData.email || this.formData.email.trim().length === 0) return false
            if (!this.formData.password || this.formData.password.length < 8) return false
            if (this.formData.password !== this.formData.password_confirmation) return false

            // Validar dominio de email
            if (this.selectedUniversidad?.dominio) {
                if (!this.formData.email.endsWith(this.selectedUniversidad.dominio)) return false
            }

            return true
        },

        async handleNext() {
            this.errorMessage = ''

            if (this.currentStep === 1) {
                if (!this.selectedUniversidad) {
                    this.errorMessage = 'Por favor, selecciona tu universidad'
                    return
                }
                if (!this.selectedCarrera) {
                    this.errorMessage = 'Por favor, selecciona tu carrera'
                    return
                }
                // Guardar IDs en formData
                this.formData.universidad_id = this.selectedUniversidad.id
                this.formData.carrera_id = this.selectedCarrera.id
                // Pasar al paso 2
                this.currentStep = 2
            } else if (this.currentStep === 2) {
                // Validar formulario
                if (!this.formData.name || this.formData.name.trim().length === 0) {
                    this.errorMessage = 'Por favor, ingresa tu nombre'
                    this.errors.name = true
                    return
                }

                if (!this.formData.username || this.formData.username.trim().length === 0) {
                    this.errorMessage = 'Por favor, ingresa un nombre de usuario'
                    this.errors.username = true
                    return
                }

                if (this.formData.username.length > 15) {
                    this.errorMessage = 'El nombre de usuario no puede tener más de 15 caracteres'
                    this.errors.username = true
                    return
                }

                if (!this.formData.email || this.formData.email.trim().length === 0) {
                    this.errorMessage = 'Por favor, ingresa tu correo institucional'
                    this.errors.email = true
                    return
                }

                if (this.selectedUniversidad?.dominio) {
                    if (!this.formData.email.endsWith(this.selectedUniversidad.dominio)) {
                        this.errorMessage = `Solo se aceptan correos institucionales ${this.selectedUniversidad.dominio}`
                        this.errors.email = true
                        return
                    }
                }

                if (!this.formData.password || this.formData.password.length < 8) {
                    this.errorMessage = 'La contraseña debe tener al menos 8 caracteres'
                    this.errors.password = true
                    return
                }

                if (this.formData.password !== this.formData.password_confirmation) {
                    this.errorMessage = 'Las contraseñas no coinciden'
                    this.errors.password = true
                    this.errors.password_confirmation = true
                    return
                }

                // Realizar registro
                this.loading = true
                try {
                    await AuthService.register(this.formData)

                    const toast = await toastController.create({
                        message: '¡Registro exitoso! Bienvenido a LaÚ',
                        duration: 2000,
                        position: 'top',
                        color: 'success'
                    })
                    await toast.present()

                    this.$router.replace('/tabs/tab1')
                } catch (error) {
                    console.error('Error en registro:', error)

                    this.errors.name = true
                    this.errors.username = true
                    this.errors.email = true
                    this.errors.password = true
                    this.errors.password_confirmation = true

                    if (error.response?.data?.message) {
                        this.errorMessage = error.response.data.message
                    } else if (error.response?.data?.errors) {
                        const errors = error.response.data.errors
                        if (errors.email) {
                            this.errorMessage = Array.isArray(errors.email) ? errors.email[0] : errors.email
                        } else if (errors.username) {
                            this.errorMessage = Array.isArray(errors.username) ? errors.username[0] : errors.username
                        } else {
                            const firstError = Object.values(errors)[0]
                            this.errorMessage = Array.isArray(firstError) ? firstError[0] : firstError
                        }
                    } else {
                        this.errorMessage = 'Error al registrarse. Por favor, intenta de nuevo.'
                    }

                    const toast = await toastController.create({
                        message: this.errorMessage,
                        duration: 3000,
                        position: 'top',
                        color: 'danger'
                    })
                    await toast.present()
                } finally {
                    this.loading = false
                }
            }
        },

        togglePassword() {
            this.showPassword = !this.showPassword
        },

        togglePasswordConfirm() {
            this.showPasswordConfirm = !this.showPasswordConfirm
        },

        goToLogin() {
            this.$router.push('/login')
        },

        goBack() {
            if (this.currentStep === 1) {
                this.$router.push('/welcome')
            } else {
                this.currentStep = 1
                this.errorMessage = ''
                // Limpiar errores
                this.errors = {
                    name: false,
                    username: false,
                    email: false,
                    password: false,
                    password_confirmation: false
                }
            }
        }
    }
}
</script>

<style scoped>
/* Fondo */
.university-page {
    --background: transparent;
}

.background-image {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url('https://res.cloudinary.com/dj848z4er/image/upload/v1761539303/baf03a0f-035e-4047-b66a-4fec3dfc9529.png');
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
    background: linear-gradient(to top, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.7), transparent);
    z-index: 1;
}

/* Container */
.university-container {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    padding: 1.5rem;
    padding-top: 8px;
}

/* Header */
.university-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
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

/* Progress bar */
.progress-container {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 2rem;
}

.progress-step {
    flex: 1;
    height: 4px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    transition: background 0.3s ease;
}

.progress-step.active {
    background: #8A2BE2;
}

/* Contenido */
.university-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
}

/* Título */
.title-section {
    margin-bottom: 2rem;
}

.app-logo {
    width: 150px;
    height: auto;
    margin-bottom: 1rem;
}

.subtitle {
    font-family: "Righteous", sans-serif;
    font-size: 1.75rem;
    font-weight: 400;
    color: #FFFFFF;
    margin: 0 0 1rem 0;
    line-height: 1.2;
}

.description {
    font-size: 0.875rem;
    font-weight: 300;
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
    line-height: 1.5;
}

/* Formulario */
.university-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.form-step {
    animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.select-wrapper {
    margin-bottom: 1rem;
}

.select-list {
    background: transparent;
    padding: 0;
}

.select-item {
    --background: rgba(55, 65, 81, 0.5);
    --border-radius: 0.5rem;
    --padding-start: 1rem;
    --padding-end: 1rem;
    --min-height: 3.5rem;
    --inner-padding-end: 0;
    border-radius: 0.5rem;
}

.select-item::part(native) {
    border-radius: 0.5rem;
}

.select-item ion-select {
    width: 100%;
    --placeholder-color: rgba(255, 255, 255, 0.6);
    color: #FFFFFF;
    font-size: 1rem;
}

/* Mensaje sin datos */
.no-data-message {
    text-align: center;
    padding: 2rem 1rem;
    background: rgba(239, 68, 68, 0.1);
    border-radius: 0.5rem;
    border: 1px solid rgba(239, 68, 68, 0.3);
}

.alert-icon {
    font-size: 3rem;
    color: #ef4444;
    margin-bottom: 1rem;
}

.no-data-message p {
    color: #FFFFFF;
    margin: 0.5rem 0;
}

.small-text {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.7);
}

.retry-button {
    --background: #8A2BE2;
    --color: #FFFFFF;
    --border-radius: 0.5rem;
    margin-top: 1rem;
    font-size: 0.875rem;
}

.error-message {
    color: #ef4444;
    font-size: 0.875rem;
    text-align: center;
    margin: 0;
}

.continue-button {
    --background: #8A2BE2;
    --color: #FFFFFF;
    --border-radius: 0.5rem;
    font-weight: 700;
    font-size: 1.125rem;
    height: 3.5rem;
    margin-top: 0.5rem;
    text-transform: none;
}

.continue-button:hover {
    --background: #7a24c7;
}

.continue-button::part(native) {
    border-radius: 0.5rem;
}

.continue-button:disabled {
    --background: rgba(138, 43, 226, 0.5);
}

/* Inputs de registro */
.input-wrapper {
    position: relative;
    margin-bottom: 1rem;
}

.register-input {
    --background: rgba(55, 65, 81, 0.5);
    --color: #FFFFFF;
    --placeholder-color: rgba(255, 255, 255, 0.6);
    --padding-start: 1rem;
    --padding-end: 1rem;
    --border-radius: 0.5rem 0.5rem 0 0;
    --border-color: transparent;
    height: 3.5rem;
    font-size: 1rem;
    caret-color: #8A2BE2;
}

.register-input.ion-focused {
    --background: rgba(55, 65, 81, 0.5);
    --color: #FFFFFF;
}

.register-input:hover {
    --background: rgba(55, 65, 81, 0.5);
}

.register-input::part(native) {
    border-radius: 0.5rem 0.5rem 0 0 !important;
    background: rgba(55, 65, 81, 0.5) !important;
    caret-color: #8A2BE2 !important;
}

.input-line {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 0;
    height: 2px;
    background: #8A2BE2;
    transition: width 0.3s ease;
    z-index: 10;
}

.input-wrapper.focused .input-line {
    width: 100%;
}

.input-wrapper.invalid .input-line {
    background: #ef4444;
    width: 100%;
}

.register-input.ion-invalid {
    --background: rgba(239, 68, 68, 0.2);
    --border-color: #ef4444;
}

.register-input.ion-invalid::part(native) {
    background: rgba(239, 68, 68, 0.2) !important;
}

.password-toggle {
    color: rgba(255, 255, 255, 0.6);
    cursor: pointer;
    font-size: 1.25rem;
}

.terms-text {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.7);
    text-align: center;
    margin: 0.5rem 0 0 0;
    line-height: 1.4;
}

.terms-link {
    color: #FFFFFF;
    text-decoration: underline;
    cursor: pointer;
}

.login-link-text {
    font-size: 0.875rem;
    color: rgba(255, 255, 255, 0.9);
    text-align: center;
    margin: 1rem 0 0 0;
}

.login-link {
    color: #8A2BE2;
    font-weight: 600;
    text-decoration: underline;
    cursor: pointer;
}

/* Responsive */
@media (min-width: 768px) {
    .university-container {
        max-width: 480px;
        margin: 0 auto;
    }

    .subtitle {
        font-size: 2rem;
    }
}
</style>
