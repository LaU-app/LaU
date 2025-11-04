<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <ion-buttons slot="start">
                    <ion-button @click="goBack">
                        <ion-icon slot="icon-only" :icon="closeOutline"></ion-icon>
                    </ion-button>
                </ion-buttons>
                <ion-title>Miembros de laÚ</ion-title>
            </ion-toolbar>
            <ion-toolbar>
                <ion-searchbar v-model="searchText" placeholder="Buscar por Nombre, Universidad..." :debounce="300"
                    :search-icon="searchOutline" @ionInput="filterUsers($event)">
                </ion-searchbar>
            </ion-toolbar>
        </ion-header>

        <ion-content :fullscreen="true">

            <div v-if="loading" class="loading-container">
                <ion-spinner name="crescent"></ion-spinner>
                <ion-text>
                    <p>Cargando usuarios...</p>
                </ion-text>
            </div>

            <ion-grid v-if="!loading" class="filters">
                <ion-row>
                    <ion-col>
                        <ion-select :toggle-icon="chevronDownOutline" aria-label="ASC/DESC" placeholder="Ordenar Por"
                            v-model="filters.order">
                            <ion-select-option value="ASC">Ascendiente</ion-select-option>
                            <ion-select-option value="DESC">Descendiente</ion-select-option>
                            <ion-select-option value="ABC">Alfabético</ion-select-option>
                            <ion-select-option value="CBA">Alfabético Inverso</ion-select-option>
                        </ion-select>
                    </ion-col>
                    <ion-col><ion-select :toggle-icon="chevronDownOutline" aria-label="Universidad"
                            v-model="filters.universidad" placeholder="Universidad">
                            <ion-select-option value="itca-fepade">ITCA-Fepade</ion-select-option>
                            <ion-select-option value="ues">Universidad de El Salvador (UES)</ion-select-option>
                            <ion-select-option value="upes">Universidad Pedagógica de El Salvador
                                (UPES)</ion-select-option>
                            <ion-select-option value="uca">Universidad Centroamericana José Simeón Cañas
                                (UCA)</ion-select-option>
                            <ion-select-option value="ucd">Universidad Cristiana de El Salvador
                                (UCES)</ion-select-option>
                            <ion-select-option value="unab">Universidad Nacional Alberto Masferrer
                                (UNAB)</ion-select-option>
                            <ion-select-option value="ufg">Universidad Francisco Gavidia (UFG)</ion-select-option>
                            <ion-select-option value="umg">Universidad Modular Abierta (UMA)</ion-select-option>
                            <ion-select-option value="upes">Universidad Politécnica de El Salvador
                                (UPES)</ion-select-option>
                        </ion-select></ion-col>
                    <ion-col><ion-select :toggle-icon="chevronDownOutline" aria-label="Carrera" placeholder="Carrera"
                            v-model="filters.carrera">
                            >
                            <ion-select-option value="ingenieria_sistemas">Ingeniería en Sistemas</ion-select-option>
                            <ion-select-option value="administracion_empresas">Administración de
                                Empresas</ion-select-option>
                            <ion-select-option value="medicina">Medicina</ion-select-option>
                            <ion-select-option value="derecho">Derecho</ion-select-option>
                            <ion-select-option value="arquitectura">Arquitectura</ion-select-option>
                            <ion-select-option value="contabilidad">Contabilidad</ion-select-option>
                            <ion-select-option value="ingenieria_civil">Ingeniería Civil</ion-select-option>
                            <ion-select-option value="ingenieria_electronica">Ingeniería Electrónica</ion-select-option>
                            <ion-select-option value="psicologia">Psicología</ion-select-option>
                            <ion-select-option value="enfermeria">Enfermería</ion-select-option>
                            <ion-select-option value="comunicacion">Comunicación</ion-select-option>
                            <ion-select-option value="mercadeo">Mercadeo</ion-select-option>
                            <ion-select-option value="ingenieria_industrial">Ingeniería Industrial</ion-select-option>
                            <ion-select-option value="sociologia">Sociología</ion-select-option>
                            <ion-select-option value="educacion">Educación</ion-select-option>
                        </ion-select></ion-col>
                </ion-row>
            </ion-grid>
            <ion-list v-if="!loading && filteredUsers.length > 0">
                <ion-item v-for="(u, index) in filteredUsers" :key="index">
                    <ion-avatar slot="start">
                        <img v-if="u.imagen_url" :src="u.imagen_url" alt="avatar" @error="handleImageError" />
                        <ion-icon v-else :icon="personCircle" class="avatar-icon"></ion-icon>
                    </ion-avatar>
                    <ion-label>
                        <h3>
                            <strong>
                                {{ u.name }}
                            </strong>
                        </h3>
                        <h3>{{ u.universidad || "Itca-Fepade" }}</h3>
                        <h3>{{ u.profession || "Estudiante" }}</h3>
                    </ion-label>
                    <ion-button id="btnAction" slot="end">Seguir</ion-button>
                </ion-item>
            </ion-list>

            <ion-infinite-scroll @ionInfinite="onIonInfinite">
                <ion-infinite-scroll-content />
            </ion-infinite-scroll>
        </ion-content>
    </ion-page>
</template>

<script>
import {
    IonPage,
    IonHeader,
    IonContent,
    IonList,
    IonItem,
    IonAvatar,
    IonLabel,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonSearchbar,
    IonSpinner,
    IonText,
    IonIcon,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonGrid,
    IonRow,
    IonCol,
    IonSelect,
    IonSelectOption,
} from "@ionic/vue";
import api from "@/services/api";
import { closeOutline, chevronDownOutline, personCircle, searchOutline } from "ionicons/icons";
import { AuthService } from "@/services/auth";

export default {
    name: "UsersView",
    components: {
        IonPage,
        IonHeader,
        IonContent,
        IonList,
        IonItem,
        IonAvatar,
        IonLabel,
        IonInfiniteScroll,
        IonInfiniteScrollContent,
        IonSearchbar,
        IonSpinner,
        IonText,
        IonIcon,
        IonToolbar,
        IonTitle,
        IonButtons,
        IonButton,
        IonGrid,
        IonRow,
        IonCol,
        IonSelect,
        IonSelectOption,
    },
    data() {
        return {
            filteredUsers: [],
            filters: {
                order: null,
                universidad: null,
                carrera: null,
            },
            users: [],
            user: { imagen_url: null, name: "Usuario", username: "usuario" },
            isDarkMode: false,
            closeOutline,
            chevronDownOutline,
            personCircle,
            searchOutline,
            isAuthenticated: false,
            loading: false,
        };
    },
    async created() {
        this.loadDarkModePreference();

        // Verificar autenticación
        this.isAuthenticated = AuthService.isAuthenticated();

        // Si no está autenticado, redirigir inmediatamente
        if (!this.isAuthenticated) {
            this.$router.replace("/login");
            return;
        }

        // Cargar usuario autenticado
        await this.loadCurrentUser();

        // Obtener usuarios
        await this.getUsers();
    },

    methods: {
        async loadCurrentUser() {
            try {
                // Obtener el usuario del localStorage
                const localUser = AuthService.getUser();
                if (localUser) {
                    this.user = localUser;
                }
            } catch (error) {
                console.error("Error cargando usuario:", error);
            }
        },
        async getUsers() {
            try {
                this.loading = true;
                const response = await api.getUsers();

                // Soporta varias formas de respuesta comunes
                let usersData = [];
                if (response && response.data) {
                    usersData =
                        response.data.data?.data ||
                        response.data.data ||
                        response.data ||
                        [];
                }
                if (!Array.isArray(usersData)) {
                    usersData = [];
                }

                this.users = usersData;
                this.filteredUsers = this.users;
            } catch (error) {
                console.error("Error obteniendo usuarios:", error);

                // Si es error 401, el token es inválido
                if (error.response?.status === 401) {
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user');
                    localStorage.removeItem('token_expiry');
                    localStorage.removeItem('remember_me');
                    sessionStorage.removeItem('auth_token');
                    sessionStorage.removeItem('user');
                    sessionStorage.removeItem('token_expiry');
                    this.$router.replace("/login");
                }
            } finally {
                this.loading = false;
            }
        },
        goBack() {
            this.$router.back();
        },
        filterUsers(ev) {
            const searchTerm = ev.detail.value.toLowerCase();
            if (!searchTerm) {
                this.filteredUsers = this.users;
                return;
            }
            this.filteredUsers = this.users.filter((user) => {
                return (
                    (user.name && user.name.toLowerCase().includes(searchTerm)) ||
                    (user.profession &&
                        user.profession.toLowerCase().includes(searchTerm)) ||
                    (user.universidad &&
                        user.universidad.toLowerCase().includes(searchTerm))
                );
            });
        },
        loadDarkModePreference() {
            const savedMode = localStorage.getItem("darkMode");
            if (savedMode !== null) {
                this.isDarkMode = savedMode === "true";
            } else {
                const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
                this.isDarkMode = prefersDark.matches;
            }
            this.applyDarkMode();
        },
        toggleDarkMode() {
            this.isDarkMode = !this.isDarkMode;
            localStorage.setItem("darkMode", this.isDarkMode.toString());
            this.applyDarkMode();
        },
        applyDarkMode() {
            document.documentElement.classList.toggle(
                "ion-palette-dark",
                this.isDarkMode
            );
            if (this.isDarkMode) {
                document.documentElement.style.setProperty(
                    "--ion-background-color",
                    "#121212"
                );
                document.documentElement.style.setProperty(
                    "--ion-card-background",
                    "#1E1E1E"
                );
            } else {
                document.documentElement.style.setProperty(
                    "--ion-background-color",
                    "#F3F4F6"
                );
                document.documentElement.style.setProperty(
                    "--ion-card-background",
                    "#FFFFFF"
                );
            }
        },
        handleImageError(ev) {
            // evita errores en consola si la imagen falla
            ev.target.src = "https://www.gravatar.com/avatar/?d=mp&f=y";
        },
        onIonInfinite(ev) {
            setTimeout(() => {
                const start = this.users.length + 1;
                const more = Array.from({ length: 10 }, (_, i) => ({
                    id: start + i,
                    name: `User ${start + i}`,
                    username: `user${start + i}`,
                    imagen_url: "https://www.gravatar.com/avatar/?d=mp&f=y",
                    universidad: null,
                }));
                this.users = [...this.users, ...more];

                if (this.users.length >= 200) {
                    ev.target.disabled = true;
                }
                ev.target.complete();
            }, 800);
        },
    },
};
</script>

<style scoped>
/* estilos mínimos */
@import url("https://cdn.jsdelivr.net/npm/plusplusjakartasans@latest/plusjakartasans.css");

h3,
ion-select,
ion-label,
ion-button,
ion-title,
ion-searchbar {
    font-family: "Plus Jakarta Sans", sans-serif;
}

ion-avatar img {
    object-fit: cover;
    width: 100%;
    height: 100%;
}

ion-avatar {
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.avatar-icon {
    width: 60px !important;
    height: 60px !important;
    font-size: 60px !important;
    color: #9CA3AF;
}

ion-list {
    background: #ffffff;
    padding: 8px;
}

ion-list ion-item {
    --ion-item-background: #ffffff;
    --min-height: 100px;
    margin: 8px 0;
    border-radius: 8px;
    border: 1px solid #F3F4F6;
}

.filters {
    background: #F9FAFB;
    padding: 0;
    margin: 0;
    --ion-grid-padding: 0;
    border-bottom: 1px solid #E5E7EB;
}

.filters ion-row {
    font-weight: bolder;
    padding: 10px 16px;
}

.filters ion-col {
    padding: 0 4px;
}

.filters ion-row ion-select {
    border-radius: 8px;
    letter-spacing: -0.3px;
    width: fit-content;
    padding: 5px;
    min-height: 20px;
}

#btnAction {
    --padding-top: 10px;
    --padding-bottom: 10px;
    --padding-end: 10px;
    --padding-start: 10px;
    width: 100px;
}

.loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
}

.loading-container ion-spinner {
    margin-bottom: 16px;
    width: 40px;
    height: 40px;
}

.loading-container p {
    color: var(--ion-color-medium);
    font-size: 14px;
}

/* Toolbar styles */
ion-header {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

ion-toolbar {
    --background: #ffffff;
    --border-width: 0;
}

ion-toolbar ion-title {
    font-weight: bold;
    font-size: 18px;
    color: #1f2937;
}

ion-toolbar ion-button {
    --color: #6b7280;
}

ion-toolbar ion-icon {
    font-size: 24px;
}

ion-searchbar {
    --background: #F9FAFB;
    --border-radius: 10px;
    --box-shadow: none;
    --placeholder-color: #9ca3af;
    --placeholder-font-style: normal;
    --icon-color: #6b7280;
    padding: 8px 16px;
}

ion-content {
    --background: #ffffff;
}
</style>