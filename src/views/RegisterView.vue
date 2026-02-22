<template>
    <ion-page>
        <ion-content :fullscreen="true" class="register-page">
            <!-- Imagen de fondo -->
            <div class="background-image"></div>
            <div class="background-overlay"></div>

            <!-- Contenido -->
            <div class="register-container">
                <!-- Header -->
                <div class="register-header">
                    <ion-button fill="clear" class="back-button" @click="goToWelcome">
                        <ion-icon :icon="arrowBack" slot="icon-only"></ion-icon>
                    </ion-button>
                </div>

                <!-- Contenido principal -->
                <div class="register-content">
                    <!-- Logo y título -->
                    <div class="title-section">
                        <img src="/LaU1.png" alt="LaÚ" class="app-logo" />
                        <h2 class="subtitle">{{ pageTitle }}</h2>
                        <p class="description">
                            {{ pageDescription }}
                        </p>
                    </div>

                    <div id="app">
                        <div v-if="botonesVisibles" class="contenedor-botones">
                            <p>Selecciona una opción:</p>

                            <button expand="block" class="cssbuttons-io" @click="cambiarVista('vistaA')">
                                <span>Aspirante</span>
                            </button>
                            
                            <button expand="block" class="cssbuttons-io" @click="cambiarVista('vistaB')">
                                <span>Estudiante</span>
                            </button>

                            <button expand="block" class="cssbuttons-io" @click="cambiarVista('vistaC')">
                                <span>Egresado</span>
                            </button>
                            
                            <button expand="block" class="cssbuttons-io" @click="ocultarBotones">
                                <span>Ocultar Botones de Navegación</span>
                            </button>
                        </div>

                        <div v-if="vistaActiva === 'vistaA'" class="vista-a">
                            <!-- Login con Google -->
                            <ion-button expand="block" class="login-google" @click="loginWithGoogle">
                                <img src="https://res.cloudinary.com/dksv7n9bg/image/upload/v1764973131/pngwing.com_2_mmyosg.png" class="icon-provider" />
                                <span class="text-google">Iniciar con Google</span>
                            </ion-button>
                            <ion-button @click="cambiarVista('inicio')">Volver al inicio</ion-button>
                        </div>

                        <div v-else-if="vistaActiva === 'vistaB'" class="vista-b">
                            <!-- Login con Microsoft -->
                            <ion-button expand="block" class="login-microsoft" @click="loginWithMicrosoft">
                                <img src="https://res.cloudinary.com/dksv7n9bg/image/upload/v1764973132/pngwing.com_1_aofhph.png" class="icon-provider" />
                                <span class="text-microsoft">Iniciar con Microsoft</span>
                            </ion-button>
                            <ion-button @click="cambiarVista('inicio')">Volver al inicio</ion-button>
                        </div>

                        <div v-else-if="vistaActiva === 'vistaC'" class="vista-c">
                            <!-- Login con Google -->
                            <ion-button expand="block" class="login-google" @click="loginWithGoogle">
                                <img src="https://res.cloudinary.com/dksv7n9bg/image/upload/v1764973131/pngwing.com_2_mmyosg.png" class="icon-provider" />
                                <span class="text-google">Iniciar con Google</span>
                            </ion-button>
                            <!-- Login con Microsoft -->
                            <ion-button expand="block" class="login-microsoft" @click="loginWithMicrosoft">
                                <img src="https://res.cloudinary.com/dksv7n9bg/image/upload/v1764973132/pngwing.com_1_aofhph.png" class="icon-provider" />
                                <span class="text-microsoft">Iniciar con Microsoft</span>
                            </ion-button>
                            <ion-button @click="cambiarVista('inicio')">Volver al inicio</ion-button>
                        </div>

                        <div v-else class="vista-inicio">
                            <h3>👋 Inicio</h3>
                            <p>Utiliza los botones de arriba para navegar entre las vistas A y B.</p>
                        </div>
                    </div>

                    <!-- Formulario -->
                    <form @submit.prevent="handleRegister" class="register-form">
                        <!-- Nombre completo -->
                        <div class="input-wrapper" :class="{ 'focused': nameFocused, 'invalid': errors.name }">
                            <ion-input v-model="formData.name" type="text" placeholder="Tú nombre"
                                class="register-input" :class="{ 'ion-invalid': errors.name }"
                                @ionFocus="nameFocused = true" @ionBlur="nameFocused = false"></ion-input>
                            <div class="input-line"></div>
                        </div>

                        <!-- Nombre de usuario -->
                        <div class="input-wrapper" :class="{ 'focused': usernameFocused, 'invalid': errors.username }">
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
                        <div class="input-wrapper" :class="{ 'focused': passwordFocused, 'invalid': errors.password }">
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

                        <!-- Mensaje de error general -->
                        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

                        <!-- Botón de registro -->
                        <ion-button expand="block" type="submit" class="register-button" :disabled="loading">
                            <ion-spinner v-if="loading" name="crescent"></ion-spinner>
                            <span v-else>Registrarse</span>
                        </ion-button>

                        <!-- Términos y condiciones -->
                        <p class="terms-text">
                            Al registrarte, aceptas nuestros
                            <a href="#" class="terms-link">Términos y Condiciones</a> de uso y confirmas que has leído
                            nuestra
                            <a href="#" class="terms-link">Política de Privacidad</a>.
                        </p>

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
    IonInput,
    IonIcon,
    IonSpinner,
    toastController
} from '@ionic/vue'
import { arrowBack, eyeOutline, eyeOffOutline } from 'ionicons/icons'
import { AuthService } from '@/services/auth'
import oauthService from "@/services/oauthServices";

export default {
    name: 'RegisterView',
    components: {
        IonPage,
        IonContent,
        IonButton,
        IonInput,
        IonIcon,
        IonSpinner
    },
    data() {
        return {
            // 1. Estado para controlar qué contenido mostrar ('inicio', 'vistaA', 'vistaB')
            vistaActiva: 'inicio', 
      
            // 2. Estado para controlar la visibilidad de los botones de navegación
            botonesVisibles: true,

            arrowBack,
            eyeOutline,
            eyeOffOutline,
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
            loading: false,
            errorMessage: '',
            nameFocused: false,
            usernameFocused: false,
            emailFocused: false,
            passwordFocused: false,
            passwordConfirmFocused: false,
            // Datos de universidad seleccionada
            universidadData: {
                id: null,
                nombre: null,
                dominio: null
            },
            carreraData: {
                id: null,
                nombre: null
            }
        }
    },
    mounted() {
        // Leer parámetros de la URL
        const { universidadId, universidadNombre, universidadDominio, carreraId, carreraNombre } = this.$route.query

        if (universidadId && universidadNombre && universidadDominio) {
            this.universidadData.id = parseInt(universidadId)
            this.universidadData.nombre = universidadNombre
            this.universidadData.dominio = universidadDominio
            this.formData.universidad_id = parseInt(universidadId)
        }

        if (carreraId && carreraNombre) {
            this.carreraData.id = parseInt(carreraId)
            this.carreraData.nombre = carreraNombre
            this.formData.carrera_id = parseInt(carreraId)
        }

        // Dentro de mounted() -> listenForAuth
        oauthService.listenForAuth(async (response, error) => {
            if (error) {
                console.error("Error OAuth:", error);
                return;
            }

            if (response) {
                try {
                    // AQUÍ ESTÁ LA MAGIA: Enviamos el token a TU API
                    // response.accessToken es lo que usualmente se envía
                    const provider = 'google'; // O detecta cuál usaste

                    console.log("Enviando token al backend...");
                    await authService.socialLogin(provider, response.accessToken);

                    // Si todo sale bien, ir al Home
                    router.push('/tabs/home');
                } catch (apiError) {
                    console.error("Error en el backend:", apiError);
                    // Aquí podrías mostrar una alerta: "Error al crear cuenta"
                }
            }
        });
    },
    computed: {
        emailPlaceholder() {
            if (this.universidadData.dominio) {
                return `Correo institucional (${this.universidadData.dominio})`
            }
            return 'Correo institucional'
        },
        pageTitle() {
            if (this.universidadData.nombre) {
                return 'COMPLETA TU REGISTRO'
            }
            return 'CONECTA EN TU CAMPUS'
        },
        pageDescription() {
            if (this.universidadData.nombre) {
                return 'Completa tus datos para unirte a la comunidad universitaria.'
            }
            return 'Encuentra a tus compañeros de carrera, comparte apuntes y playlists, y descubre qué pasa en tu universidad.'
        }
    },
    methods: {

        // Método para cambiar la vista activa
        cambiarVista(nuevaVista) {
        this.vistaActiva = nuevaVista;
        },
        
        // Método para ocultar los botones de navegación
        ocultarBotones() {
        this.botonesVisibles = false;
        },

        

        async loginWithGoogle() {
            try {
                console.log("[OAUTH] Iniciando login con Google...");
                oauthService.login("google");
            } catch (e) {
                console.error("[OAUTH] Error Google:", e);
            }
        },

        async loginWithMicrosoft() {
            try {
                console.log("[OAUTH] Iniciando login con Microsoft...");
                oauthService.login("microsoft");
            } catch (e) {
                console.error("[OAUTH] Error Microsoft:", e);
            }
        },

        validateForm() {
            // Validación según el controlador de la API
            // Si hay universidad seleccionada, validar con su dominio
            let emailRegex
            if (this.universidadData.dominio) {
                // Escapar el dominio para regex (convertir puntos en \.)
                const escapedDomain = this.universidadData.dominio.replace(/\./g, '\\.')
                emailRegex = new RegExp(`^[^\\s@]+${escapedDomain}$`)
            } else {
                // Por defecto, validar correo genérico
                emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            }

            const isNameValid = this.formData.name && this.formData.name.trim().length > 0 && this.formData.name.length <= 255
            const isUsernameValid = this.formData.username && this.formData.username.trim().length > 0 && this.formData.username.length <= 15
            const isEmailValid = this.formData.email && emailRegex.test(this.formData.email)
            const isPasswordValid = this.formData.password && this.formData.password.length >= 8
            const isPasswordConfirmValid = this.formData.password === this.formData.password_confirmation

            return isNameValid && isUsernameValid && isEmailValid && isPasswordValid && isPasswordConfirmValid
        },

        async handleRegister() {
            this.errorMessage = ''
            // Resetear errores visuales
            this.errors.name = false
            this.errors.username = false
            this.errors.email = false
            this.errors.password = false
            this.errors.password_confirmation = false

            // Validaciones específicas con mensajes claros
            if (!this.formData.name || this.formData.name.trim().length === 0) {
                this.errorMessage = 'Por favor, ingresa tu nombre'
                this.errors.name = true
                const toast = await toastController.create({
                    message: this.errorMessage,
                    duration: 3000,
                    position: 'top',
                    cssClass: 'danger-toast'
                })
                await toast.present()
                return
            }

            if (!this.formData.username || this.formData.username.trim().length === 0) {
                this.errorMessage = 'Por favor, ingresa un nombre de usuario'
                this.errors.username = true
                const toast = await toastController.create({
                    message: this.errorMessage,
                    duration: 3000,
                    position: 'top',
                    cssClass: 'danger-toast'
                })
                await toast.present()
                return
            }

            if (this.formData.username.length > 15) {
                this.errorMessage = 'El nombre de usuario no puede tener más de 15 caracteres'
                this.errors.username = true
                const toast = await toastController.create({
                    message: this.errorMessage,
                    duration: 3000,
                    position: 'top',
                    cssClass: 'danger-toast'
                })
                await toast.present()
                return
            }

            if (!this.formData.email || this.formData.email.trim().length === 0) {
                this.errorMessage = 'Por favor, ingresa tu correo institucional'
                this.errors.email = true
                const toast = await toastController.create({
                    message: this.errorMessage,
                    duration: 3000,
                    position: 'top',
                    cssClass: 'danger-toast'
                })
                await toast.present()
                return
            }

            // Validar dominio específico si hay universidad seleccionada
            if (this.universidadData.dominio) {
                if (!this.formData.email.endsWith(this.universidadData.dominio)) {
                    this.errorMessage = `Solo se aceptan correos institucionales ${this.universidadData.dominio}`
                    this.errors.email = true
                    const toast = await toastController.create({
                        message: this.errorMessage,
                        duration: 3000,
                        position: 'top',
                        cssClass: 'danger-toast'
                    })
                    await toast.present()
                    return
                }
            } else {
                // Validar que sea un correo válido genérico
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                if (!emailRegex.test(this.formData.email)) {
                    this.errorMessage = 'Por favor, ingresa un correo válido'
                    this.errors.email = true
                    const toast = await toastController.create({
                        message: this.errorMessage,
                        duration: 3000,
                        position: 'top',
                        cssClass: 'danger-toast'
                    })
                    await toast.present()
                    return
                }
            }

            if (!this.formData.password || this.formData.password.length < 8) {
                this.errorMessage = 'La contraseña debe tener al menos 8 caracteres'
                this.errors.password = true
                const toast = await toastController.create({
                    message: this.errorMessage,
                    duration: 3000,
                    position: 'top',
                    cssClass: 'danger-toast'
                })
                await toast.present()
                return
            }

            if (this.formData.password !== this.formData.password_confirmation) {
                this.errorMessage = 'Las contraseñas no coinciden'
                this.errors.password = true
                this.errors.password_confirmation = true
                const toast = await toastController.create({
                    message: this.errorMessage,
                    duration: 3000,
                    position: 'top',
                    cssClass: 'danger-toast'
                })
                await toast.present()
                return
            }

            this.loading = true

            try {
                await AuthService.register(this.formData)

                // Mostrar mensaje de éxito
                const toast = await toastController.create({
                    message: '¡Registro exitoso! Bienvenido a LaÚ',
                    duration: 2000,
                    position: 'top',
                    cssClass: 'success-toast'
                })
                await toast.present()

                // Redirigir al home o dashboard
                this.$router.replace('/tabs/tab1')
            } catch (error) {
                console.error('Error en registro:', error)

                // Marcar campos con error
                this.errors.name = true
                this.errors.username = true
                this.errors.email = true
                this.errors.password = true
                this.errors.password_confirmation = true

                // Mostrar mensaje de error específico de la API
                if (error.response?.data?.message) {
                    this.errorMessage = error.response.data.message
                } else if (error.response?.data?.errors) {
                    // Si hay errores de validación del backend
                    const errors = error.response.data.errors

                    // Manejar errores específicos del backend
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

        togglePasswordConfirm() {
            this.showPasswordConfirm = !this.showPasswordConfirm
        },

        goToWelcome() {
            // Si vino de university-select, volver ahí
            if (this.universidadData.id) {
                this.$router.push('/university-select')
            } else {
                this.$router.push('/welcome')
            }
        },

        goToLogin() {
            this.$router.push('/login')
        }
    }
}
</script>

<style scoped>
/* Fondo */
.register-page {
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
.register-container {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    padding: 1.5rem 1.5rem 2rem 1.5rem;
}

/* Header */
.register-header {
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
.register-content {
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

/* Formulario */
.register-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

/*Botones de pantalla para tipo de usuario*/
.cssbuttons-io {
  width: 100%;
  position: relative;
  font-family: inherit;
  font-weight: 500;
  font-size: 18px;
  letter-spacing: 0.05em;
  border-radius: 0.8em;
  cursor: pointer;
  border: none;
  background: linear-gradient(to right, #8e2de2, #4a00e0);
  color: #000;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.cssbuttons-io span {
  position: relative;
  z-index: 10;
  transition: color 0.4s;
  display: inline-flex;
  align-items: center;
  padding: 0.8em 1.2em 0.8em 1.05em;
}

.cssbuttons-io::before,
.cssbuttons-io::after {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.cssbuttons-io::before {
  content: "";
  background: #FFF;
  width: 120%;
  left: -10%;
  transform: skew(30deg);
  transition: transform 0.4s cubic-bezier(0.3, 1, 0.8, 1);
}

.cssbuttons-io:hover::before {
  transform: translate3d(100%, 0, 0);
}

.cssbuttons-io:active {
  transform: scale(0.95);
}


/*botones de login de google y microsoft*/
.login-google,
.login-microsoft {
    --background: #FFFFFF;
    font-weight: 900;
    font-size: 0.7rem;
    margin: 0;
}

.text-google {
    background: linear-gradient(120deg, #DB4437, #F4B400, #0F9D58, #4285F4);
    -webkit-text-fill-color: transparent;
    -webkit-background-clip: text;
}

.text-microsoft {
    background: linear-gradient(120deg, #F25022, #7FBA00, #00A4EF, #FFB900);
    -webkit-text-fill-color: transparent;
    -webkit-background-clip: text;
}

.login-google img,
.login-microsoft img {
    width: 1.0rem;
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

.register-input {
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

.register-input.ion-focused {
    --background: rgba(55, 65, 81, 0.5);
    --color: #FFFFFF;
    --highlight-color: transparent !important;
    --highlight-color-focused: transparent !important;
    --highlight-color-valid: transparent !important;
    --highlight-color-invalid: transparent !important;
    --border-color: transparent !important;
    border: none !important;
}

.register-input:hover {
    --background: rgba(55, 65, 81, 0.5);
    --border-color: transparent !important;
    border: none !important;
}

.register-input::part(native) {
    border-radius: 0.5rem 0.5rem 0 0 !important;
    background: rgba(55, 65, 81, 0.5) !important;
    caret-color: #8A2BE2 !important;
    box-shadow: none !important;
    border: none !important;
    border-bottom: none !important;
}

.register-input::part(native):focus {
    box-shadow: none !important;
    border: none !important;
    border-bottom: none !important;
    outline: none !important;
}

/* Eliminar cualquier elemento de highlight interno de Ionic */
.register-input .input-highlight,
.register-input .input-bottom {
    display: none !important;
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

.error-message {
    color: #ef4444;
    font-size: 0.875rem;
    margin: -0.5rem 0 0 0;
    text-align: center;
}

.register-button {
    --background: #8A2BE2;
    --color: #FFFFFF;
    --border-radius: 0.5rem;
    font-weight: 700;
    font-size: 1.125rem;
    height: 3.5rem;
    margin-top: 0.5rem;
    text-transform: none;
}

.register-button:hover {
    --background: #7a24c7;
}

.register-button::part(native) {
    border-radius: 0.5rem;
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

/* Eliminar línea azul de Ionic completamente */
.register-input.sc-ion-input-md-h,
.register-input.sc-ion-input-ios-h {
    --highlight-color-focused: transparent !important;
    --highlight-color-valid: transparent !important;
    --highlight-color-invalid: transparent !important;
    --border-color: transparent !important;
}

.register-input .input-bottom .counter,
.register-input .input-bottom .helper-text,
.register-input .input-bottom .error-text {
    display: none !important;
}

/* Sobrescribir estilos de Ionic profundamente */
.register-input::part(native)::before,
.register-input::part(native)::after {
    display: none !important;
}

ion-input.register-input {
    --border-style: none !important;
    --border-width: 0 !important;
}

ion-input.register-input::part(native) {
    border-style: none !important;
    border-width: 0 !important;
}

/* Ocultar elementos internos de Ionic que crean la línea azul */
.register-input .input-highlight,
.register-input .input-bottom,
ion-input.register-input .input-highlight,
ion-input.register-input .input-bottom {
    display: none !important;
    opacity: 0 !important;
    visibility: hidden !important;
    height: 0 !important;
}

/* Forzar ocultar con selectores muy específicos */
.input-wrapper ion-input::part(native)::after,
.input-wrapper ion-input::part(native)::before {
    content: none !important;
    display: none !important;
}

/* Responsive */
@media (min-width: 768px) {
    .register-container {
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
.register-page .input-wrapper ion-input {
    --highlight-color-focused: transparent !important;
    --highlight-color-valid: transparent !important;
    --highlight-color-invalid: transparent !important;
    --highlight-height: 0 !important;
}

.register-page .input-wrapper ion-input .input-highlight {
    display: none !important;
}

.register-page .input-wrapper ion-input .input-bottom {
    display: none !important;
}

/* Cubrir absolutamente cualquier línea que aparezca */
.register-page .input-wrapper::before {
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

.register-page .input-wrapper.focused::before,
.register-page .input-wrapper.invalid::before {
    display: none;
}
</style>
