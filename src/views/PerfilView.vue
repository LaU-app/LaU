<template>
    <ion-page>
        <AppHeader :isDarkMode="isDarkMode" :user="user" :isAuthenticated="isAuthenticated"
            @toggleDarkMode="toggleDarkMode" />
        <ion-content>
            <div class="container centered">
                <ion-card v-if="error && !loading" color="danger">
                    <ion-card-content>
                        <p>{{ error }}</p>
                    </ion-card-content>
                </ion-card>
                <div v-if="loading" class="loading-container">
                    <ion-spinner name="crescent"></ion-spinner>
                    <ion-text centered>
                        <p>Cargando perfil...</p>
                    </ion-text>
                </div>
                <div v-if="!loading" class="profile-container">
                    <ion-card>
                        <ion-card-header>
                            <ion-grid class="profile-header">
                                <ion-row>
                                    <ion-col size="4">
                                        <ion-avatar class="profile-avatar">
                                            <img v-if="user.imagen_url" :src="user.imagen_url" alt="Profile Picture" />
                                            <ion-icon v-else :icon="personCircle"
                                                class="profile-avatar-icon"></ion-icon>
                                        </ion-avatar>
                                    </ion-col>
                                    <ion-col size="7">
                                        <div class="username-container">
                                            <ion-card-title>{{ user.name }}</ion-card-title>
                                            <ion-card-subtitle class="ion-text-capitalize">@{{ user.username
                                                }}</ion-card-subtitle>
                                            <ion-card-subtitle style="font-style: italic"
                                                class="ion-text-capitalize">Universidad de usuario</ion-card-subtitle>
                                        </div>
                                    </ion-col>
                                    <ion-col size="1">
                                        <ion-button fill="clear" @click="openMenu" id="open-menu-button">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                                                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                                stroke-linecap="round" stroke-linejoin="round"
                                                class="icon icon-tabler icons-tabler-outline icon-tabler-dots-vertical">
                                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                                <path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                                                <path d="M12 19m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                                                <path d="M12 5m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                                            </svg>
                                        </ion-button>
                                    </ion-col>
                                </ion-row>
                            </ion-grid>
                        </ion-card-header>

                        <ion-card-content>
                            <ion-grid class="stats-grid">
                                <ion-row class="button-row">
                                    <ion-col class="stat-col">
                                        <ion-button id="seguir-button">Seguir</ion-button>
                                    </ion-col>
                                    <ion-col class="stat-col">
                                        <ion-button id="ms-button">Enviar mensaje</ion-button>
                                    </ion-col>
                                </ion-row>
                                <ion-row>
                                    <ion-col class="stat-col">
                                        <ion-text>
                                            <h2>{{ posts.length }}</h2>
                                            <p>Publicaciones</p>
                                        </ion-text>
                                    </ion-col>
                                    <ion-col class="stat-col clickable" @click="openFollowers">
                                        <ion-text>
                                            <h2>{{ seguidores.length }}</h2>
                                            <p>Seguidores</p>
                                        </ion-text>
                                    </ion-col>
                                    <ion-col class="stat-col clickable" @click="openFollowing">
                                        <ion-text>
                                            <h2>{{ siguiendo.length }}</h2>
                                            <p>Seguidos</p>
                                        </ion-text>
                                    </ion-col>
                                </ion-row>
                                <ion-row class="tab-row">
                                    <ion-segment v-model="selectedTab">
                                        <ion-segment-button value="1">
                                            <ion-label><ion-icon :icon="grid"></ion-icon></ion-label>
                                        </ion-segment-button>
                                        <ion-segment-button value="2">
                                            <ion-label><ion-icon :icon="folderOutline"></ion-icon></ion-label>
                                        </ion-segment-button>
                                        <ion-segment-button value="3">
                                            <ion-label><ion-icon :icon="musicalNoteOutline"></ion-icon></ion-label>
                                        </ion-segment-button>
                                    </ion-segment>
                                </ion-row>
                            </ion-grid>
                        </ion-card-content>
                    </ion-card>
                </div>
                <ion-infinite-scroll v-if="!loading && hasMorePages" @ionInfinite="loadMorePosts" threshold="100px">
                    <ion-infinite-scroll-content loading-spinner="bubbles" loading-text="Cargando más posts...">
                    </ion-infinite-scroll-content>
                </ion-infinite-scroll>
            </div>
            <ion-card class="centered tab-content">
                <div v-if="selectedTab === '1'">
                    <ion-grid>
                        <ion-row>
                            <ion-col v-for="(pub, index) in posts" :key="index" size="4">
                                <ion-card>
                                    <ion-card-content>{{ pub.titulo }}</ion-card-content>
                                </ion-card>
                            </ion-col>
                        </ion-row>
                        <div v-if="posts.length === 0" class="empty-message">
                            Aún no hay publicaciones
                        </div>
                    </ion-grid>
                </div>

                <div v-else-if="selectedTab === '2'">
                    <ion-grid>
                        <ion-row>
                            <ion-col v-for="(archivo, index) in archivos" :key="index" size="4">
                                <ion-card>
                                    <ion-card-content>{{ archivo.nombre }}</ion-card-content>
                                </ion-card>
                            </ion-col>
                        </ion-row>
                        <div v-if="archivos.length === 0" class="empty-message">
                            Aún no hay archivos
                        </div>
                    </ion-grid>
                </div>

                <div v-else>
                    <ion-grid>
                        <ion-row>
                            <ion-col v-for="(cancion, index) in canciones" :key="index" size="4">
                                <ion-card>
                                    <ion-card-content>{{ cancion.titulo }}</ion-card-content>
                                </ion-card>
                            </ion-col>
                        </ion-row>
                        <div v-if="canciones.length === 0" class="empty-message">
                            Aún no hay canciones
                        </div>
                    </ion-grid>
                </div>
            </ion-card>

            <!-- Modal Seguidores -->
            <ion-modal :is-open="showFollowersModal" @didDismiss="closeFollowers">
                <ion-header>
                    <ion-toolbar>
                        <ion-title>Seguidores</ion-title>
                        <ion-buttons slot="end">
                            <ion-button @click="closeFollowers">Cerrar</ion-button>
                        </ion-buttons>
                    </ion-toolbar>
                </ion-header>
                <ion-content>
                    <ion-list>
                        <ion-item v-if="seguidores.length === 0">
                            <ion-avatar slot="start">
                                <img src="https://www.gravatar.com/avatar/?d=mp&f=y" />
                            </ion-avatar>
                            <ion-label>No hay seguidores</ion-label>
                        </ion-item>
                        <ion-item v-for="(f, i) in seguidores" :key="i">
                            <ion-avatar slot="start">
                                <img :src="f.imagen_url || 'https://www.gravatar.com/avatar/?d=mp&f=y'
                                    " />
                            </ion-avatar>
                            <ion-label>
                                <h3>{{ f.name || f.username || "Usuario" }}</h3>
                                <p class="ion-text-wrap">@{{ f.username || "" }}</p>
                            </ion-label>
                        </ion-item>
                    </ion-list>
                </ion-content>
            </ion-modal>

            <!-- Modal Seguidos -->
            <ion-modal :is-open="showFollowingModal" @didDismiss="closeFollowing">
                <ion-header>
                    <ion-toolbar>
                        <ion-title>Seguidos</ion-title>
                        <ion-buttons slot="end">
                            <ion-button @click="closeFollowing">Cerrar</ion-button>
                        </ion-buttons>
                    </ion-toolbar>
                </ion-header>
                <ion-content>
                    <ion-list>
                        <ion-item v-if="siguiendo.length === 0">
                            <ion-avatar slot="start">
                                <img src="https://www.gravatar.com/avatar/?d=mp&f=y" />
                            </ion-avatar>
                            <ion-label>No sigue a nadie</ion-label>
                        </ion-item>
                        <ion-item v-for="(f, i) in siguiendo" :key="i">
                            <ion-avatar slot="start">
                                <img :src="f.imagen_url || 'https://www.gravatar.com/avatar/?d=mp&f=y'
                                    " />
                            </ion-avatar>
                            <ion-label>
                                <h3>{{ f.name || f.username || "Usuario" }}</h3>
                                <p class="ion-text-wrap">@{{ f.username || "" }}</p>
                            </ion-label>
                        </ion-item>
                    </ion-list>
                </ion-content>
            </ion-modal>

            <!-- Menu Popover -->
            <ion-popover :is-open="isMenuOpen" @didDismiss="closeMenu" trigger="open-menu-button">
                <ion-content>
                    <ion-list>
                        <ion-item button @click="handleLogout">
                            <ion-icon slot="start" :icon="logOutOutline"></ion-icon>
                            <ion-label>Cerrar sesión</ion-label>
                        </ion-item>
                    </ion-list>
                </ion-content>
            </ion-popover>
        </ion-content>
    </ion-page>
</template>

<script>
import {
    IonPage,
    IonContent,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonSpinner,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonIcon,
    IonText,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonModal,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonTitle,
    IonList,
    IonItem,
    IonAvatar,
    IonButton,
    IonGrid,
    IonRow,
    IonCol,
    IonPopover,
} from "@ionic/vue";
import AppHeader from "@/components/AppHeader.vue";
import {
    ellipsisVerticalOutline,
    grid,
    folderOutline,
    musicalNoteOutline,
    logOutOutline,
    personCircle,
} from "ionicons/icons";

import postsService from "@/services/postsService";
import { AuthService } from "@/services/auth";

export default {
    name: "PerfilView",
    components: {
        IonPage,
        IonContent,
        IonCard,
        IonCardContent,
        IonCardHeader,
        IonCardTitle,
        IonCardSubtitle,
        IonIcon,
        IonSpinner,
        IonSegment,
        IonSegmentButton,
        IonLabel,
        IonText,
        IonInfiniteScroll,
        IonInfiniteScrollContent,
        IonModal,
        IonHeader,
        IonToolbar,
        IonButtons,
        IonTitle,
        IonList,
        IonItem,
        IonAvatar,
        IonButton,
        IonGrid,
        IonRow,
        IonCol,
        IonPopover,
        AppHeader,
    },
    data() {
        return {
            posts: [],
            seguidores: [],
            siguiendo: [],
            canciones: [],
            archivos: [],
            loading: false,
            error: null,
            selectedTab: "1",
            currentPage: 1,
            lastPage: 1,
            hasMorePages: false,
            isDarkMode: false,
            user: { imagen_url: null, name: "Usuario", username: "usuario" },
            isAuthenticated: false,
            ellipsisVerticalOutline,
            grid,
            folderOutline,
            musicalNoteOutline,
            logOutOutline,
            personCircle,
            // modals
            showFollowersModal: false,
            showFollowingModal: false,
            // menu
            isMenuOpen: false,
        };
    },
    async created() {
        // Verificar autenticación
        this.isAuthenticated = AuthService.isAuthenticated();

        await this.loadCurrentUser();
        this.loadDarkModePreference();
    },
    ionViewWillEnter() {
        // Actualizar estado de autenticación cada vez que se entra a la vista
        this.isAuthenticated = AuthService.isAuthenticated();
    },
    methods: {
        async loadCurrentUser() {
            try {
                // Primero intenta obtener el usuario del localStorage
                const localUser = AuthService.getUser();
                if (localUser) {
                    this.user = localUser;
                }

                // Luego valida el token con la API y actualiza los datos (en background, sin bloquear)
                try {
                    const apiUser = await AuthService.fetchProfile();
                    if (apiUser) {
                        this.user = apiUser;
                    }
                } catch (apiError) {
                    // Si falla la validación con la API
                    console.warn("No se pudo validar el token con la API:", apiError);

                    // Solo redirigimos al login si es un error 401 (token inválido)
                    if (apiError.response?.status === 401) {
                        AuthService.logout();
                        this.$router.replace("/login");
                    }
                    // Si es otro tipo de error (red, servidor caído, etc.) y tenemos usuario local, continuamos
                    else if (!localUser) {
                        // Solo redirigimos si no hay usuario local tampoco
                        this.$router.replace("/login");
                    }
                }
            } catch (error) {
                console.error("Error cargando usuario:", error);
                // Solo redirige si es un error crítico
                if (!AuthService.isAuthenticated()) {
                    this.$router.replace("/login");
                }
            }
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
        async fetchPosts(page = 1) {
            this.loading = page === 1;
            this.error = null;

            const userId =
                this.user && (this.user.id || this.user.user_id || this.user._id);

            let result;
            try {
                if (userId && typeof postsService.fetchPostsByUser === "function") {
                    // preferred: service provides a user-scoped fetch
                    result = await postsService.fetchPostsByUser(userId, page);
                } else if (userId) {
                    // fallback: service accepts an options object { page, userId }
                    result = await postsService.fetchPosts({ page, userId });
                } else {
                    // no user id -> fetch default (all) or return empty set
                    result = await postsService.fetchPosts(page);
                }
            } catch (err) {
                result = {
                    success: false,
                    error: err.message || "Error fetching posts",
                };
            }

            if (result.success) {
                if (page === 1) {
                    this.posts = result.data;
                } else {
                    this.posts = [...this.posts, ...result.data];
                }
                this.currentPage = result.pagination.currentPage;
                this.lastPage = result.pagination.lastPage;
                this.hasMorePages = result.pagination.hasMorePages;
            } else {
                this.error = result.error;
                if (page === 1) this.posts = [];
            }
            this.loading = false;
        },
        async loadMorePosts(event) {
            if (this.hasMorePages) {
                await this.fetchPosts(this.currentPage + 1);
            }
            event.target.complete();
        },
        openFollowers() {
            console.log("Opening followers modal");
            this.showFollowersModal = true;
        },
        closeFollowers() {
            this.showFollowersModal = false;
        },
        openFollowing() {
            this.showFollowingModal = true;
        },
        closeFollowing() {
            this.showFollowingModal = false;
        },
        openMenu() {
            this.isMenuOpen = true;
        },
        closeMenu() {
            this.isMenuOpen = false;
        },
        async handleLogout() {
            try {
                // Cerrar el menú primero
                this.closeMenu();

                // Cerrar sesión usando AuthService (esto limpia localStorage)
                // Esperamos a que termine completamente
                await AuthService.logout();

                // Pequeña pausa para asegurar que el localStorage se limpió
                await new Promise(resolve => setTimeout(resolve, 100));

                // Usar window.location para forzar una navegación completa
                // Esto asegura que todo el estado se limpie correctamente
                window.location.href = '/welcome';
            } catch (error) {
                console.error('Error al cerrar sesión:', error);
                // En caso de error, igualmente limpiar y redirigir
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user');
                window.location.href = '/welcome';
            }
        },
    },
};
</script>

<style scoped>
.container {
    padding: 0;
}

ion-avatar {
    width: 100px;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
}

ion-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.profile-avatar-icon {
    width: 100px !important;
    height: 100px !important;
    font-size: 100px !important;
    color: #9CA3AF;
}

.username-container {
    align-items: center;
    padding-top: 20px;
    padding-left: 20px;
}

.username-container ion-card-subtitle {
    font-weight: normal;
    color: gray;
}

ion-grid {
    margin: 0;
    padding: 0;
}

ion-icon {
    color: gray;
    font-size: 24px;
}

#open-menu-button {
    --padding-start: 0;
    --padding-end: 0;
    margin: 0;
}

#open-menu-button svg {
    width: 24px;
    height: 24px;
    color: gray;
    stroke: gray;
}

.button-row {
    text-align: center;
}

ion-segment-button ion-label {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
}

ion-segment {
    background-color: white !important;
    border-radius: 0px;
    height: 65px;
    box-shadow: none !important;
    border-bottom: 1px solid #e0e0e0 !important;
}

ion-segment-button {
    --background: white !important;
    --background-checked: white !important;
    --color: black !important;
    --color-checked: black !important;
    --indicator-color: transparent !important;
    --indicator-box-shadow: none;
    border: none !important;
    --border-color: none;
    border-bottom: 1px solid transparent !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    text-transform: none;
    font-weight: normal;
}

ion-segment-button.segment-button-checked ion-label {
    border-bottom: 2px solid #137fec !important;
}

ion-segment-button.segment-button-checked ion-icon {
    color: #137fec !important;
}

.tab-content ion-grid {
    padding: 5px;
    text-align: center;
}

.button-row ion-button {
    width: 100%;
    --padding-top: 1px;
    --padding-bottom: 1px;
    --padding-start: 1px;
    --padding-end: 1px;
    font-size: 15px;
    min-height: 35px;
    font-weight: bold;
}

#seguir-button {
    --ion-color-primary: #3880ff;
    --ion-color-primary-contrast: #ffffff;
}

#ms-button {
    --ion-color-primary: #d0e5fb;
    --ion-color-primary-contrast: #137fec;
}

.stat-col ion-text {
    text-align: center;
}

.empty-message {
    text-align: center;
    padding: 20px;
    color: gray;
    font-style: italic;
}

.loading-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 200px;
}

@media (min-width: 600px) {
    .tab-content {
        position: relative;
        margin: 0;
        left: 50%;
        margin-top: 10px;
        padding: 5px;
        transform: translateX(-50%);
    }

    ion-card {
        margin: 0 20px;
        max-width: 50vw;
    }

    .centered {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
    }

    .button-row {
        width: 50%;
    }

    .button-row ion-button {
        font-size: 16px;
        letter-spacing: 0.05cap;
        text-transform: initial;
    }
}

.clickable {
    cursor: pointer;
}

ion-avatar img {
    object-fit: cover;
}
</style>
