<template>
    <ion-page>
        <ion-content :fullscreen="true" class="register-page" :class="{ 'purple-background': currentStepr === 1 }">
            <!-- Logos animados de fondo para paso 1 -->
            <div v-if="currentStepr === 1" class="background-container">
                <img v-for="(logo, index) in logos" :key="index" src="/LaU1.png" class="floating-logo" :style="{
                    top: logo.top + '%',
                    left: logo.left + '%',
                    width: logo.size + 'px',
                    animationDuration: logo.duration + 's',
                    animationDelay: logo.delay + 's'
                }" alt="Logo de fondo" />
            </div>

            <!-- Imagen de fondo -->
            <div class="background-image" v-if="currentStepr !== 1"></div>
            <div class="background-overlay" v-if="currentStepr !== 1"></div>

            <!-- Contenido -->
            <div class="register-container" :class="{ 'purple-container': currentStepr === 1 }">
                <!-- Header -->
                <div class="register-header" style="padding-top: env(safe-area-inset-top) !important;">
                    <ion-button fill="clear" class="back-button" @click="goToWelcome">
                        <ion-icon :icon="arrowBack" slot="icon-only"></ion-icon>
                    </ion-button>
                </div>

                <!-- Progress bar -->
                <div class="progress-container">
                    <div class="progress-step" v-for="step in totalSteps" :key="step"
                        :class="{ active: currentStepr >= step }"></div>
                </div>

                <!-- Contenido principal -->
                <div class="register-content" :class="{ 'centered-content': currentStepr === 1 }">
                    <div class="title-section" :class="{ 'centered-title': currentStepr === 1 }">
                        <img :src="currentStepr === 1 ? '/LaU1.png' : '/LaU1.png'" alt="LaU" class="app-logo"
                            :class="{ 'logo-large': currentStepr === 1 }" />
                        <h2 v-if="currentStepr !== 1" class="subtitle">{{ pageTitle }}</h2>
                        <p v-if="currentStepr !== 1" class="description">{{ pageDescription }}</p>
                    </div>

                    <div v-if="currentStepr === 1" class="step-container step-one">
                        <p class="profile-question">¿Cuál es tu perfil actual?</p>
                        <button class="cssbuttons-io" @click="selectRole('aspirante')">
                            <span>Aspirante</span>
                        </button>
                        <button class="cssbuttons-io" @click="selectRole('estudiante')">
                            <span>Estudiante</span>
                        </button>
                        <button class="cssbuttons-io" @click="selectRole('egresado')">
                            <span>Egresado</span>
                        </button>
                    </div>

                    <div v-if="currentStepr === 2" class="step-container">
                        <form @submit.prevent="handlePersonalDataStep" class="register-form">
                            <div class="input-wrapper" :class="{ 'focused': nameFocused }">
                                <ion-input v-model="formData.name" placeholder="Tu nombre y apellido"
                                    class="register-input" @ionFocus="nameFocused = true"
                                    @ionBlur="nameFocused = false"></ion-input>
                                <div class="input-line"></div>
                            </div>

                            <div class="input-wrapper" :class="{ 'focused': usernameFocused }">
                                <ion-input v-model="formData.username" :placeholder="usernamePlaceholder"
                                    class="register-input" maxlength="15" @ionFocus="usernameFocused = true"
                                    @ionBlur="usernameFocused = false"></ion-input>
                                <div class="input-line"></div>
                            </div>

                            <div class="input-wrapper" :class="{ 'focused': emailFocused }">
                                <ion-input v-model="formData.email" type="email" :placeholder="emailPlaceholder"
                                    class="register-input" :disabled="isSocialAuth" @ionFocus="emailFocused = true"
                                    @ionBlur="emailFocused = false">
                                </ion-input>
                                <div class="input-line"></div>
                            </div>

                            <ion-button expand="block" class="register-button" @click="handlePersonalDataStep"
                                :disabled="loading">
                                <ion-spinner v-if="loading" name="crescent"></ion-spinner>
                                <span v-else>Siguiente</span>
                            </ion-button>
                        </form>

                        <div v-if="!isSocialAuth">
                            <div class="social-divider"><span>O continúa con</span></div>
                            <div class="social-container">
                                <ion-button v-if="userRole === 'aspirante' || userRole === 'egresado'" expand="block"
                                    class="login-google" @click="loginWithGoogle">
                                    <img src="https://res.cloudinary.com/dksv7n9bg/image/upload/v1764973131/pngwing.com_2_mmyosg.png"
                                        class="icon-provider" />
                                    <span class="text-google">Google</span>
                                </ion-button>

                                <ion-button v-if="userRole === 'estudiante' || userRole === 'egresado'" expand="block"
                                    class="login-microsoft" @click="loginWithMicrosoft">
                                    <img src="https://res.cloudinary.com/dksv7n9bg/image/upload/v1764973132/pngwing.com_1_aofhph.png"
                                        class="icon-provider" />
                                    <span class="text-microsoft">Microsoft</span>
                                </ion-button>
                            </div>
                        </div>
                    </div>

                    <div v-if="currentStepr === 3" class="step-container">
                        <div class="register-form">
                            <div class="input-wrapper" :class="{ 'focused': passwordFocused }">
                                <ion-input v-model="formData.password" :type="showPassword ? 'text' : 'password'"
                                    placeholder="Contraseña" class="register-input" @ionFocus="passwordFocused = true"
                                    @ionBlur="passwordFocused = false">
                                    <ion-icon :icon="showPassword ? eyeOffOutline : eyeOutline" slot="end"
                                        @click="togglePassword" class="password-toggle"></ion-icon>
                                </ion-input>
                                <div class="input-line"></div>
                            </div>

                            <div class="input-wrapper" :class="{ 'focused': passwordConfirmFocused }">
                                <ion-input v-model="formData.password_confirmation"
                                    :type="showPasswordConfirm ? 'text' : 'password'" placeholder="Confirmar contraseña"
                                    class="register-input" @ionFocus="passwordConfirmFocused = true"
                                    @ionBlur="passwordConfirmFocused = false">
                                    <ion-icon :icon="showPasswordConfirm ? eyeOffOutline : eyeOutline" slot="end"
                                        @click="togglePasswordConfirm" class="password-toggle"></ion-icon>
                                </ion-input>
                                <div class="input-line"></div>
                            </div>

                            <ion-button expand="block" class="register-button" @click="handlePasswordStep"
                                :disabled="loading">
                                <ion-spinner v-if="loading" name="crescent"></ion-spinner>
                                <span v-else>Siguiente</span>
                            </ion-button>
                            <ion-button fill="clear" color="light" @click="goToWelcome">Volver atrás</ion-button>
                        </div>
                    </div>

                    <!-- Paso 4: Selección de Universidad/Carrera -->
                    <div v-if="currentStepr === 4" class="step-container">
                        <!-- Para Aspirante: Solo Carrera (OPCIONAL) -->
                        <div v-if="userRole === 'aspirante'">
                            <p class="section-title">¿Tienes alguna carrera de interés?</p>
                            <p style="color: #999; font-size: 14px; margin-bottom: 10px;">Opcional: Puedes omitir este
                                paso si aún no decides</p>

                            <!-- Buscador de carreras -->
                            <ion-searchbar v-model="carreraSearchQuery" placeholder="Buscar carrera..."
                                :disabled="loadingCarreras" animated show-clear-button="focus"
                                style="--background: #2d2d3a; --color: white; --placeholder-color: #999; --icon-color: #8A2BE2; padding: 0;">
                            </ion-searchbar>

                            <!-- Lista de carreras filtradas -->
                            <div v-if="selectedCarrera"
                                style="margin: 10px 0; padding: 12px; background: rgba(138, 43, 226, 0.2); border-left: 3px solid #8A2BE2; color: white;">
                                <strong>Seleccionada:</strong> {{ selectedCarrera.nombre }}
                                <ion-button size="small" fill="clear"
                                    style="float: right; color: #8A2BE2; font-size: 24px; margin-top: -5px;"
                                    @click="selectedCarrera = null">×</ion-button>
                            </div>

                            <div class="carreras-list" style="max-height: 350px; overflow-y: auto; margin-top: 10px;">
                                <ion-list style="background: transparent; padding: 0;">
                                    <ion-item v-for="carrera in filteredCarreras" :key="carrera.id"
                                        @click="selectedCarrera = carrera" button lines="none" class="carrera-item"
                                        :class="{ 'carrera-selected': selectedCarrera && selectedCarrera.id === carrera.id }"
                                        style="--background: transparent; --color: white; --padding-start: 0; --padding-end: 0; --inner-padding-end: 0;">
                                        <span>{{ carrera.nombre }}</span>
                                    </ion-item>
                                    <ion-item v-if="filteredCarreras.length === 0" lines="none"
                                        style="--background: transparent; --color: #999; text-align: center; --padding-start: 0;">
                                        No se encontraron carreras
                                    </ion-item>
                                </ion-list>
                            </div>
                        </div>

                        <!-- Para Estudiante/Egresado: Primero Universidad, luego Carrera -->
                        <div v-else>
                            <!-- Mensaje si la universidad fue detectada automáticamente -->
                            <p v-if="isUniversidadLocked" class="section-title" style="color: #8A2BE2;">
                                ✓ Universidad detectada: {{ selectedUniversidad.nombre }}
                            </p>
                            <p v-else class="section-title">¿En qué universidad {{ userRole === 'estudiante' ?
                                'estudias' :
                                'estudiaste' }}?</p>

                            <div class="select-wrapper" v-if="!isUniversidadLocked">
                                <ion-list class="select-list">
                                    <ion-item lines="none" class="select-item">
                                        <ion-select v-model="selectedUniversidad"
                                            placeholder="Selecciona tu universidad" interface="action-sheet"
                                            @ionChange="onUniversidadChange" :disabled="loadingUniversidades">
                                            <ion-select-option v-for="uni in universidades" :key="uni.id" :value="uni">
                                                {{ uni.nombre }}
                                            </ion-select-option>
                                        </ion-select>
                                    </ion-item>
                                </ion-list>
                            </div>

                            <div v-if="selectedUniversidad">
                                <p class="section-title">{{ userRole === 'estudiante' ? '¿Qué carrera estás estudiando?'
                                    : '¿Qué carrera estudiaste?' }}</p>
                                <div class="select-wrapper">
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

                        <ion-button expand="block" class="register-button" @click="handleUniversityCarreraStep"
                            :disabled="!canFinishRegistration || loading">
                            <ion-spinner v-if="loading" name="crescent"></ion-spinner>
                            <span v-else>Finalizar Registro</span>
                        </ion-button>
                        <ion-button fill="clear" color="light" @click="currentStepr = 3">Volver atrás</ion-button>
                    </div>

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
    IonSelect,
    IonSelectOption,
    IonList,
    IonItem,
    IonSearchbar,
    toastController
} from '@ionic/vue'
import { arrowBack, eyeOutline, eyeOffOutline } from 'ionicons/icons'
import { AuthService } from '@/services/auth'
import { UniversidadService } from '@/services/universidad'
import oauthService from "@/services/oauthServices"
import api from '@/services/api';

export default {
    name: 'RegisterView',
    components: {
        IonPage,
        IonContent,
        IonButton,
        IonInput,
        IonIcon,
        IonSpinner,
        IonSelect,
        IonSelectOption,
        IonList,
        IonItem,
        IonSearchbar
    },
    data() {
        return {
            // 1. Estado para controlar qué contenido mostrar ('inicio', 'vistaA', 'vistaB')
            vistaActiva: 'inicio',

            // 2. Estado para controlar la visibilidad de los botones de navegación
            botonesVisibles: true,

            currentStepr: 1,
            userRole: null,
            isSocialRegistration: false, // Nueva: indica si viene de Google/Microsoft
            socialToken: null,           // Nueva: guarda el token temporalmente
            socialProvider: null,        // Nueva: 'google' o 'microsoft'

            isSocialAuth: false,

            arrowBack,
            eyeOutline,
            eyeOffOutline,
            formData: {
                id: null,
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
            },
            // Listas para paso 4
            universidades: [],
            carreras: [],
            todasLasCarreras: [], // Para aspirantes: todas las carreras disponibles
            carreraSearchQuery: '', // Término de búsqueda para carreras
            selectedUniversidad: null,
            selectedCarrera: null,
            loadingUniversidades: false,
            loadingCarreras: false,
            isUniversidadLocked: false, // Indica si la universidad fue detectada automáticamente
            // Logos animados para el fondo del paso 1
            logos: []
        }
    },
    mounted() {
        // Generar logos aleatorios para el fondo animado
        this.generateBackgroundLogos();

        if (localStorage.getItem('social_temp_token')) {
            this.formData.name = localStorage.getItem('social_temp_name');
            this.formData.email = localStorage.getItem('social_temp_email');

            // Guardamos las credenciales de la red social en variables del componente
            this.socialToken = localStorage.getItem('social_temp_token');
            this.socialProvider = localStorage.getItem('social_temp_provider');

            // Si el backend identificó una universidad por el dominio del correo
            const universidadDetectada = localStorage.getItem('social_temp_universidad');
            if (universidadDetectada) {
                try {
                    const uniData = JSON.parse(universidadDetectada);
                    this.selectedUniversidad = uniData;
                    this.universidadData.id = uniData.id;
                    this.universidadData.nombre = uniData.nombre;
                    this.universidadData.dominio = uniData.dominio;
                    this.formData.universidad_id = uniData.id;
                    this.isUniversidadLocked = true;

                    // NO cargamos las carreras aquí porque todavía no sabemos el rol
                    // Las cargaremos cuando seleccione "Estudiante" o "Egresado"
                } catch (e) {
                    // Error silencioso
                }
            }

            this.isSocialAuth = true;

            // Recuperar el rol que el usuario seleccionó antes de hacer login con Google/Microsoft
            const rolGuardado = localStorage.getItem('rol_registro_social');

            // Si es registro social con correo institucional, ir directo a paso 2
            // No volver al paso 1 (selección de rol)
            this.currentStepr = 2;

            // Si hay universidad detectada O el correo es institucional
            if (this.isUniversidadLocked || this.formData.email.endsWith('.edu.sv')) {
                // Usar el rol que seleccionó (estudiante o egresado), o 'estudiante' por defecto
                this.userRole = rolGuardado || 'estudiante';

                // Si no se detectó universidad desde el backend, intentar detectarla del email
                if (!this.isUniversidadLocked && this.formData.email.endsWith('.edu.sv')) {
                    // Detectar universidad y cargar carreras
                    this.detectUniversidadFromEmail(this.formData.email);
                } else if (this.isUniversidadLocked && this.selectedUniversidad) {
                    // Si ya tenemos universidad detectada, cargar carreras inmediatamente
                    this.loadCarrerasForUniversidad(this.selectedUniversidad.id);
                }
            } else {
                // Para correos NO institucionales (Gmail, Outlook, etc.), usar el rol que seleccionó
                this.userRole = rolGuardado || 'aspirante';
            }

            // Limpiamos todo el localStorage temporal por seguridad
            localStorage.removeItem('social_temp_token');
            localStorage.removeItem('social_temp_provider');
            localStorage.removeItem('social_temp_name');
            localStorage.removeItem('social_temp_email');
            localStorage.removeItem('social_temp_universidad');
            localStorage.removeItem('rol_registro_social');
            localStorage.removeItem('flujo_registro_social');
        }

        // Dentro de mounted() -> listenForAuth
        oauthService.listenForAuth(async (response, error) => {
            if (error) {
                return;
            }

            if (response) {
                try {
                    this.loading = true;
                    const provider = localStorage.getItem('auth_provider') || 'google';

                    // Llamamos a tu servicio social, el cual ya guarda el token
                    const authData = await AuthService.socialLogin(provider, response.accessToken);

                    // 1. LLENAR LOS DATOS DEL FORMULARIO
                    this.formData.id = authData.user.id;
                    this.formData.name = authData.user.name;
                    this.formData.username = authData.user.username;
                    this.formData.email = authData.user.email;

                    // 2. CAMBIAR EL ESTADO A MODO SOCIAL
                    this.isSocialAuth = true;

                    // 3. MOSTRAR MENSAJE AL USUARIO (opcional)
                    const toast = await toastController.create({
                        message: 'Cuenta vinculada. Verifica tu usuario para finalizar.',
                        duration: 3000,
                        position: 'top',
                        color: 'success'
                    });
                    await toast.present();

                    // Nota: Nos quedamos en el currentStepr === 2, NO redirigimos.

                } catch (apiError) {
                    const toast = await toastController.create({
                        message: 'Error al vincular cuenta social.',
                        duration: 3000,
                        position: 'top',
                        cssClass: 'danger-toast'
                    });
                    await toast.present();
                } finally {
                    this.loading = false;
                }
            }
        });
    },
    computed: {
        totalSteps() {
            // Todos ahora tienen 4 pasos: rol, datos, contraseña, universidad/carrera
            return 4;
        },
        emailPlaceholder() {
            if (this.userRole === 'aspirante') {
                return 'Correo electrónico'
            }
            if (this.universidadData.dominio) {
                return `Correo institucional (${this.universidadData.dominio})`
            }
            return 'Correo institucional'
        },
        usernamePlaceholder() {
            return '@nombre de usuario'
        },
        pageTitle() {
            if (this.universidadData.nombre) {
                return 'COMPLETA TU REGISTRO'
            }
            return this.currentStepr === 1 ? 'CONECTA EN TU CAMPUS' : 'COMPLETA TU REGISTRO'
        },
        pageDescription() {
            if (this.universidadData.nombre) {
                return 'Completa tus datos para unirte a la comunidad universitaria.'
            }
            return this.currentStepr === 1
                ? 'Encuentra a tus compañeros de carrera, comparte apuntes y playlists, y descubre qué pasa en tu universidad.'
                : 'Completa tus datos para unirte a la red universitaria.'
        },
        canFinishRegistration() {
            // Aspirantes: pueden registrarse con o sin carrera
            if (this.userRole === 'aspirante') {
                return true;
            }
            // Estudiantes/Egresados: necesitan universidad Y carrera
            return this.selectedUniversidad !== null && this.selectedCarrera !== null;
        },
        filteredCarreras() {
            // Filtrar carreras según el término de búsqueda
            if (!this.carreraSearchQuery || this.carreraSearchQuery.trim() === '') {
                return this.todasLasCarreras;
            }

            const query = this.carreraSearchQuery.toLowerCase().trim();
            return this.todasLasCarreras.filter(carrera =>
                carrera.nombre.toLowerCase().includes(query)
            );
        }
    },
    methods: {
        cambiarVista(nuevaVista) {
            this.vistaActiva = nuevaVista;
        },

        // Método para ocultar los botones de navegación
        ocultarBotones() {
            this.botonesVisibles = false;
        },

        // Generar logos con posiciones aleatorias para animación de fondo
        generateBackgroundLogos() {
            const numberOfLogos = 12; // Cantidad de logos en pantalla
            this.logos = [];

            for (let i = 0; i < numberOfLogos; i++) {
                this.logos.push({
                    top: Math.random() * 120 - 20, // Entre -20% y 100% para que algunos empiecen fuera de pantalla
                    left: Math.random() * 100, // Entre 0% y 100%
                    size: Math.floor(Math.random() * 100) + 60, // Entre 60px y 160px
                    duration: Math.floor(Math.random() * 10) + 15, // Duración entre 15s y 25s
                    delay: Math.random() * 1 // Delay aleatorio para que no todos empiecen al mismo tiempo
                });
            }
        },

        selectRole(role) {
            this.userRole = role;

            // Si es registro social Y es estudiante/egresado Y hay universidad detectada, cargar carreras
            if (this.isSocialAuth && (role === 'estudiante' || role === 'egresado')) {
                if (this.isUniversidadLocked && this.selectedUniversidad) {
                    this.loadCarrerasForUniversidad(this.selectedUniversidad.id);
                }
            }

            // Todos continúan al paso 2 (datos personales)
            this.currentStepr = 2;
        },

        async handlePersonalDataStep() {
            try {
                this.loading = true;
                this.errorMessage = '';

                // 1. Validar que los campos no estén vacíos
                if (!this.formData.name || this.formData.name.trim().length === 0) {
                    const toast = await toastController.create({
                        message: 'El nombre es obligatorio',
                        duration: 2500,
                        position: 'top',
                        cssClass: 'danger-toast'
                    });
                    await toast.present();
                    return;
                }

                if (!this.formData.username || this.formData.username.trim().length === 0) {
                    const toast = await toastController.create({
                        message: 'El nombre de usuario es obligatorio',
                        duration: 2500,
                        position: 'top',
                        cssClass: 'danger-toast'
                    });
                    await toast.present();
                    return;
                }

                // Validar formato de username (sin espacios, caracteres especiales)
                const usernameRegex = /^[a-zA-Z0-9_]+$/;
                if (!usernameRegex.test(this.formData.username)) {
                    const toast = await toastController.create({
                        message: 'El username solo puede contener letras, números y guiones bajos',
                        duration: 2500,
                        position: 'top',
                        cssClass: 'danger-toast'
                    });
                    await toast.present();
                    return;
                }

                if (!this.formData.email || this.formData.email.trim().length === 0) {
                    const toast = await toastController.create({
                        message: 'El correo electrónico es obligatorio',
                        duration: 2500,
                        position: 'top',
                        cssClass: 'danger-toast'
                    });
                    await toast.present();
                    return;
                }

                // 2. Validar formato de email
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(this.formData.email)) {
                    const toast = await toastController.create({
                        message: 'El formato del correo electrónico no es válido',
                        duration: 2500,
                        position: 'top',
                        cssClass: 'danger-toast'
                    });
                    await toast.present();
                    return;
                }

                // 3. Validar restricciones por rol
                if (this.userRole === 'aspirante' && this.formData.email.toLowerCase().endsWith('.edu.sv')) {
                    const toast = await toastController.create({
                        message: 'Los aspirantes no pueden usar correos institucionales (.edu.sv)',
                        duration: 3000,
                        position: 'top',
                        cssClass: 'danger-toast'
                    });
                    await toast.present();
                    return;
                }

                // 4. Verificar disponibilidad de username en el backend
                try {
                    const usernameResponse = await api.checkUsernameAvailability(this.formData.username);
                    if (!usernameResponse.data.available) {
                        const toast = await toastController.create({
                            message: `El nombre de usuario "${this.formData.username}" ya está en uso`,
                            duration: 3000,
                            position: 'top',
                            cssClass: 'danger-toast'
                        });
                        await toast.present();
                        return;
                    }
                } catch (error) {
                    // Si el endpoint no existe (404) o hay error de red, permitir continuar
                    // El backend validará al hacer el registro final
                }

                // 5. Verificar disponibilidad de email en el backend
                try {
                    const emailResponse = await api.checkEmailAvailability(this.formData.email);
                    if (!emailResponse.data.available) {
                        const toast = await toastController.create({
                            message: `El correo "${this.formData.email}" ya está registrado`,
                            duration: 3000,
                            position: 'top',
                            cssClass: 'danger-toast'
                        });
                        await toast.present();
                        return;
                    }
                } catch (error) {
                    // Si el endpoint no existe (404) o hay error de red, permitir continuar
                    // El backend validará al hacer el registro final
                }

                // Si todo está bien, decidir el siguiente paso
                if (this.isSocialAuth) {
                    // Para registro social: saltamos al paso 4 (universidad/carrera)
                    // y generamos una contraseña automática
                    this.formData.password = Math.random().toString(36).slice(-12) + 'Aa1!';
                    this.formData.password_confirmation = this.formData.password;

                    // IMPORTANTE: Antes de ir al paso 4, detectar universidad si no está detectada
                    if (!this.isUniversidadLocked && this.formData.email.endsWith('.edu.sv')) {
                        await this.detectUniversidadFromEmail(this.formData.email);
                    }

                    this.currentStepr = 4;

                    // Cargar datos según el rol y si la universidad está pre-identificada
                    if (this.userRole === 'aspirante') {
                        this.loadAllCarreras();
                    } else {
                        // Si la universidad está bloqueada, las carreras ya deberían estar cargadas
                        if (this.isUniversidadLocked && this.selectedUniversidad) {
                            if (this.carreras.length === 0) {
                                await this.loadCarrerasForUniversidad(this.selectedUniversidad.id);
                            }
                        } else {
                            this.loadUniversidades();
                        }
                    }
                } else {
                    // Para registro manual: ir al paso 3 (contraseña)
                    this.currentStepr = 3;
                }

            } catch (error) {
                const toast = await toastController.create({
                    message: 'Error al validar los datos',
                    duration: 2500,
                    position: 'top',
                    cssClass: 'danger-toast'
                });
                await toast.present();
            } finally {
                this.loading = false;
            }
        },

        async handlePasswordStep() {
            try {
                this.loading = true;
                this.errorMessage = '';

                // Validar contraseñas
                if (!this.formData.password || this.formData.password.length < 8) {
                    const toast = await toastController.create({
                        message: 'La contraseña debe tener al menos 8 caracteres',
                        duration: 2500,
                        position: 'top',
                        cssClass: 'danger-toast'
                    });
                    await toast.present();
                    return;
                }

                if (this.formData.password !== this.formData.password_confirmation) {
                    const toast = await toastController.create({
                        message: 'Las contraseñas no coinciden',
                        duration: 2500,
                        position: 'top',
                        cssClass: 'danger-toast'
                    });
                    await toast.present();
                    return;
                }

                // Si todo está bien, ir al paso 4 (selección de universidad/carrera)
                this.currentStepr = 4;

                // Cargar datos según el rol y si la universidad está pre-identificada
                if (this.userRole === 'aspirante') {
                    this.loadAllCarreras();
                } else {
                    // Si la universidad ya está pre-identificada (registro social), cargar sus carreras
                    if (this.isUniversidadLocked && this.selectedUniversidad) {
                        await this.onUniversidadChange();
                    } else {
                        this.loadUniversidades();
                    }
                }
            } finally {
                this.loading = false;
            }
        },

        async loadUniversidades() {
            try {
                this.loadingUniversidades = true;
                const response = await UniversidadService.getUniversidades();
                this.universidades = response.data || response;
            } catch (error) {
                const toast = await toastController.create({
                    message: 'Error al cargar universidades',
                    duration: 2000,
                    position: 'top',
                    cssClass: 'danger-toast'
                });
                await toast.present();
            } finally {
                this.loadingUniversidades = false;
            }
        },

        async loadAllCarreras() {
            try {
                this.loadingCarreras = true;
                const response = await UniversidadService.getAllCarreras();
                this.todasLasCarreras = response.data || response;
            } catch (error) {
                const toast = await toastController.create({
                    message: 'Error al cargar carreras',
                    duration: 2000,
                    position: 'top',
                    cssClass: 'danger-toast'
                });
                await toast.present();
            } finally {
                this.loadingCarreras = false;
            }
        },

        async onUniversidadChange() {
            if (!this.selectedUniversidad) return;

            this.selectedCarrera = null;
            this.carreras = [];

            try {
                this.loadingCarreras = true;
                const response = await UniversidadService.getCarreras(this.selectedUniversidad.id);
                this.carreras = response.data || response;
            } catch (error) {
                const toast = await toastController.create({
                    message: 'Error al cargar carreras de la universidad',
                    duration: 2000,
                    position: 'top',
                    cssClass: 'danger-toast'
                });
                await toast.present();
            } finally {
                this.loadingCarreras = false;
            }
        },

        async loadCarrerasForUniversidad(universidadId) {
            if (!universidadId) return;

            try {
                this.loadingCarreras = true;
                const response = await UniversidadService.getCarreras(universidadId);
                this.carreras = response.data || response;
            } catch (error) {
                const toast = await toastController.create({
                    message: 'Error al cargar carreras de la universidad',
                    duration: 2000,
                    position: 'top',
                    cssClass: 'danger-toast'
                });
                await toast.present();
            } finally {
                this.loadingCarreras = false;
            }
        },

        async detectUniversidadFromEmail(email) {
            // Extraer el dominio del email
            const domain = email.split('@')[1];
            if (!domain) return;

            try {
                // Cargar todas las universidades y buscar por dominio
                const response = await UniversidadService.getUniversidades();
                const universidades = response.data || response;

                const universidad = universidades.find(u => u.dominio === domain);

                if (universidad) {
                    this.selectedUniversidad = universidad;
                    this.formData.universidad_id = universidad.id;
                    this.isUniversidadLocked = true;

                    // Cargar carreras automáticamente para estudiantes/egresados
                    if (this.userRole === 'estudiante' || this.userRole === 'egresado') {
                        await this.loadCarrerasForUniversidad(universidad.id);
                    }
                }
            } catch (error) {
                // Error silencioso
            }
        },

        async onCarreraChangeForAspirante() {
            if (!this.selectedCarrera) return;

            this.selectedUniversidad = null;

            try {
                this.loadingUniversidades = true;
                // Cargar todas las universidades y filtrar las que tienen esta carrera
                const response = await UniversidadService.getUniversidades();
                const todasUniversidades = response.data || response;

                // Filtrar universidades que tienen la carrera seleccionada
                // Esto requiere que el backend devuelva las carreras de cada universidad o hacer peticiones individuales
                // Por ahora, mostramos todas las universidades (el backend debería optimizar esto)
                this.universidades = todasUniversidades;
            } catch (error) {
                const toast = await toastController.create({
                    message: 'Error al cargar universidades',
                    duration: 2000,
                    position: 'top',
                    cssClass: 'danger-toast'
                });
                await toast.present();
            } finally {
                this.loadingUniversidades = false;
            }
        },

        async handleUniversityCarreraStep() {
            this.loading = true;

            try {
                // Validar según el rol
                if (this.userRole === 'aspirante') {
                    // Aspirantes: la carrera es OPCIONAL
                    // Si seleccionó carrera, guardarla; si no, dejar null
                    if (this.selectedCarrera) {
                        this.formData.carrera_id = this.selectedCarrera.id;
                        this.carreraData.id = this.selectedCarrera.id;
                        this.carreraData.nombre = this.selectedCarrera.nombre;
                    } else {
                        this.formData.carrera_id = null;
                    }
                } else {
                    // Estudiantes/Egresados necesitan universidad Y carrera
                    if (!this.selectedUniversidad || !this.selectedCarrera) {
                        const toast = await toastController.create({
                            message: 'Debes seleccionar universidad y carrera',
                            duration: 2500,
                            position: 'top',
                            cssClass: 'danger-toast'
                        });
                        await toast.present();
                        return;
                    }

                    // Guardar carrera para estudiantes/egresados
                    this.formData.carrera_id = this.selectedCarrera.id;
                    this.carreraData.id = this.selectedCarrera.id;
                    this.carreraData.nombre = this.selectedCarrera.nombre;
                }

                // Guardar universidad solo para estudiantes/egresados
                if (this.userRole !== 'aspirante' && this.selectedUniversidad) {
                    this.formData.universidad_id = this.selectedUniversidad.id;
                    this.universidadData.id = this.selectedUniversidad.id;
                    this.universidadData.nombre = this.selectedUniversidad.nombre;
                    this.universidadData.dominio = this.selectedUniversidad.dominio;
                }

                // Proceder con el registro según el tipo
                if (this.isSocialAuth) {
                    // Registro social: usar socialLogin con todos los datos
                    await AuthService.socialLogin(this.socialProvider, this.socialToken, {
                        name: this.formData.name,
                        username: this.formData.username,
                        universidad_id: this.formData.universidad_id,
                        carrera_id: this.formData.carrera_id
                    });

                    const toast = await toastController.create({
                        message: '¡Registro exitoso! Bienvenido a LaU',
                        duration: 2000,
                        position: 'top',
                        cssClass: 'success-toast'
                    });
                    await toast.present();

                    this.$router.replace('/tabs/tab1');
                } else {
                    // Registro manual: usar el método normal
                    await this.handleRegister();
                }
            } finally {
                this.loading = false;
            }
        },



        async loginWithGoogle() {
            try {
                // DEJAMOS LA MIGA DE PAN AQUÍ
                localStorage.setItem('flujo_registro_social', 'true');
                localStorage.setItem('rol_registro_social', this.userRole || 'aspirante');

                oauthService.login("google");
            } catch (e) {
                // Error silencioso
            }
        },

        async loginWithMicrosoft() {
            try {
                // DEJAMOS LA MIGA DE PAN AQUÍ
                localStorage.setItem('flujo_registro_social', 'true');
                localStorage.setItem('rol_registro_social', this.userRole || 'aspirante');

                oauthService.login("microsoft");
            } catch (e) {
                // Error silencioso
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
                this.errorMessage = this.userRole === 'aspirante'
                    ? 'Por favor, ingresa tu correo electrónico'
                    : 'Por favor, ingresa tu correo institucional'
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
                // Construir objeto de registro limpio (sin campos null innecesarios)
                const registroData = {
                    name: this.formData.name,
                    username: this.formData.username,
                    email: this.formData.email,
                    password: this.formData.password,
                    password_confirmation: this.formData.password_confirmation,
                    role: this.userRole // 'aspirante', 'estudiante', o 'egresado'
                };

                // Agregar carrera (todos los roles)
                if (this.formData.carrera_id) {
                    registroData.carrera_id = this.formData.carrera_id;
                }

                // Agregar universidad solo para estudiantes/egresados
                if (this.userRole !== 'aspirante' && this.formData.universidad_id) {
                    registroData.universidad_id = this.formData.universidad_id;
                }

                await AuthService.register(registroData)

                // Mostrar mensaje de éxito
                const toast = await toastController.create({
                    message: '¡Registro exitoso! Bienvenido a LaU',
                    duration: 2000,
                    position: 'top',
                    cssClass: 'success-toast'
                })
                await toast.present()

                // Redirigir al home o dashboard
                this.$router.replace('/tabs/tab1')
            } catch (error) {
                let errorMessage = '';
                let errorField = null;

                // Extraer el mensaje de error del backend
                if (error.response?.data?.errors) {
                    const errors = error.response.data.errors;

                    // Manejar errores específicos y traducir
                    if (errors.username) {
                        const rawError = Array.isArray(errors.username) ? errors.username[0] : errors.username;
                        if (rawError.includes('already been taken') || rawError.includes('ya está en uso')) {
                            errorMessage = `El nombre de usuario "${this.formData.username}" ya está en uso`;
                        } else {
                            errorMessage = 'El nombre de usuario no es válido';
                        }
                        errorField = 'username';
                        this.errors.username = true;
                        this.currentStepr = 2; // Regresar al paso de datos personales
                    } else if (errors.email) {
                        const rawError = Array.isArray(errors.email) ? errors.email[0] : errors.email;
                        if (rawError.includes('already been taken') || rawError.includes('ya está registrado')) {
                            errorMessage = `El correo "${this.formData.email}" ya está registrado`;
                        } else if (rawError.includes('institucional') || rawError.includes('edu.sv')) {
                            errorMessage = rawError;
                        } else {
                            errorMessage = 'El correo electrónico no es válido';
                        }
                        errorField = 'email';
                        this.errors.email = true;
                        this.currentStepr = 2; // Regresar al paso de datos personales
                    } else if (errors.password) {
                        errorMessage = 'La contraseña no cumple con los requisitos';
                        this.errors.password = true;
                        this.currentStepr = 3; // Regresar al paso de contraseña
                    } else if (errors.carrera_id || errors.universidad_id) {
                        errorMessage = 'Debes seleccionar una universidad y carrera válidas';
                        this.currentStepr = 4; // Regresar al paso de universidad/carrera
                    } else {
                        const firstError = Object.values(errors)[0];
                        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
                    }
                } else if (error.response?.data?.message) {
                    // Traducir mensajes generales del backend
                    const msg = error.response.data.message;
                    if (msg.includes('already been taken')) {
                        errorMessage = 'Este usuario ya está registrado';
                    } else if (msg.includes('validation')) {
                        errorMessage = 'Error de validación. Verifica los datos ingresados';
                    } else {
                        errorMessage = msg;
                    }
                } else {
                    errorMessage = 'Error al registrarse. Por favor, intenta de nuevo.';
                }

                const toast = await toastController.create({
                    message: errorMessage,
                    duration: 3500,
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
            // Caso 1: Si estamos en el Paso 2 o 3, solo retrocedemos un nivel
            if (this.currentStepr > 1) {
                this.currentStepr--;

                // Opcional: Si regresas al paso 1, podrías querer resetear el rol
                if (this.currentStepr === 1) {
                    this.userRole = null;
                }
            }
            // Caso 2: Si ya estamos en el Paso 1, ejecutamos la salida de la vista
            else {
                if (this.universidadData.id) {
                    this.$router.push('/university-select');
                } else {
                    this.$router.push('/welcome');
                }
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

.register-page.purple-background {
    --background: #8A2BE2;
}

/* Contenedor de logos animados en el fondo */
.background-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: #8A2BE2;
    z-index: 0;
    overflow: hidden;
    pointer-events: none;
}

/* Estilo de los logos flotantes */
.floating-logo {
    position: absolute;
    opacity: 0.08;
    animation: floatUp linear infinite;
    pointer-events: none;
}

/* Animación de flotación hacia arriba con rotación */
@keyframes floatUp {
    0% {
        transform: translateY(0) rotate(0deg);
    }

    100% {
        transform: translateY(-120vh) rotate(360deg);
    }
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
    padding: 8px 1.5rem 2rem 1.5rem;
}

.register-container.purple-container {
    background: transparent;
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

.purple-container .back-button {
    --background: rgba(255, 255, 255, 0.2);
    --color: #FFFFFF;
}

/* Contenido */
.register-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
}

.register-content.centered-content {
    justify-content: center;
    align-items: center;
}

/* Título */
.title-section {
    margin-bottom: 2rem;
}

.title-section.centered-title {
    text-align: center;
    margin-bottom: 3rem;
}

.app-logo {
    width: 150px;
    height: auto;
}

.app-logo.logo-large {
    width: 200px;
    margin: 0 auto;
    display: block;
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
    color: #FFFFFF;
    overflow: hidden;
    margin-bottom: 0.5rem;
}

.step-one .cssbuttons-io {
    background: transparent !important;
    border: 2px solid rgba(255, 255, 255, 0.8) !important;
    transition: all 0.3s ease;
}

.step-one .cssbuttons-io:hover {
    background: rgba(255, 255, 255, 0.1) !important;
    border-color: #FFFFFF !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
}

.step-one .cssbuttons-io span {
    color: #FFFFFF !important;
    z-index: 10;
}

.step-one .cssbuttons-io::before {
    display: none;
}

.step-one .cssbuttons-io:hover::before {
    display: none;
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

.purple-container .progress-step {
    background: rgba(255, 255, 255, 0.3);
}

.progress-step.active {
    background: #FFFFFF;
}

.purple-container .progress-step.active {
    background: #FFFFFF;
}


/*botones de login de google y microsoft*/
.login-google,
.login-microsoft {
    --background: #FFFFFF;
    font-weight: 900;
    font-size: 0.7rem;
    margin: 0;
    --border-radius: 20px;
}

.vista-inicio,
.contenedor-botones p {
    color: #FFFFFF !important;
}

.text-google {
    background: linear-gradient(120deg, #DB4437, #F4B400, #0F9D58, #4285F4);
    -webkit-text-fill-color: transparent;
    -webkit-background-clip: text;
    padding-left: 5px;
}

.text-microsoft {
    background: linear-gradient(120deg, #F25022, #7FBA00, #00A4EF, #FFB900);
    -webkit-text-fill-color: transparent;
    -webkit-background-clip: text;
    padding-left: 5px;
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


/* divisor de login opciones de login social */
.white-text {
    color: white;
    text-align: center;
    margin-bottom: 1.5rem;
}

.profile-question {
    color: #FFFFFF;
    text-align: center;
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 2rem;
}

.step-container {
    animation: fadeIn 0.4s ease-in-out;
}

.social-divider {
    text-align: center;
    margin: 1.5rem 0;
    position: relative;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.8rem;
}

.social-divider::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 0;
    width: 35%;
    height: 1px;
    background: rgba(255, 255, 255, 0.2);
}

.social-divider::after {
    content: "";
    position: absolute;
    top: 50%;
    right: 0;
    width: 35%;
    height: 1px;
    background: rgba(255, 255, 255, 0.2);
}

.social-container {
    display: flex;
    gap: 10px;
    flex-direction: column;
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

.register-input.ion-disabled {
    opacity: 0.6;
    pointer-events: none;
    --color: #a3a3a3;
    /* Un gris claro para indicar que no se puede editar */
}

/* Estilos para selección de universidad/carrera en paso 4 */
.section-title {
    color: #FFFFFF;
    font-size: 1.125rem;
    font-weight: 600;
    margin: 1.5rem 0 1rem 0;
    text-align: left;
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

.select-item ion-select {
    --placeholder-color: rgba(255, 255, 255, 0.6);
    color: #FFFFFF;
    font-size: 1rem;
    width: 100%;
}

.select-item::part(native) {
    border-radius: 0.5rem;
    background: rgba(55, 65, 81, 0.5);
}

/* Estilos para la lista de carreras con búsqueda */
.carreras-list {
    scrollbar-width: thin;
    scrollbar-color: #8A2BE2 transparent;
}

.carreras-list::-webkit-scrollbar {
    width: 4px;
}

.carreras-list::-webkit-scrollbar-track {
    background: transparent;
}

.carreras-list::-webkit-scrollbar-thumb {
    background: #8A2BE2;
    border-radius: 10px;
}

.carrera-item {
    cursor: pointer;
    transition: all 0.2s ease;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    padding: 12px 0 !important;
    margin: 0;
}

.carrera-item span {
    font-size: 15px;
    color: rgba(255, 255, 255, 0.9);
}

.carrera-item:hover {
    border-bottom-color: rgba(138, 43, 226, 0.6);
}

.carrera-item:hover span {
    color: #8A2BE2;
}

.carrera-item.carrera-selected {
    border-bottom: 2px solid #8A2BE2;
}

.carrera-item.carrera-selected span {
    color: #8A2BE2;
    font-weight: 500;
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
