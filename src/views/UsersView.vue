<template>
    <ion-page>
        <ion-header>
            <ion-toolbar class="pt-safe-top">
                <ion-buttons slot="start">
                    <ion-button @click="goBack">
                        <ion-icon slot="icon-only" :icon="closeOutline"></ion-icon>
                    </ion-button>
                </ion-buttons>
                <ion-title>Miembros de laÚ</ion-title>
            </ion-toolbar>
            <ion-toolbar>
                <ion-searchbar v-model="searchText" placeholder="Buscar por Nombre, Universidad..." :debounce="500"
                    :search-icon="searchOutline" @ionInput="filterUsers">
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
                            v-model="filters.order" @ionChange="applyFilters">
                            <ion-select-option value="ASC">Ascendiente</ion-select-option>
                            <ion-select-option value="DESC">Descendiente</ion-select-option>
                            <ion-select-option value="ABC">Alfabético</ion-select-option>
                            <ion-select-option value="CBA">Alfabético Inverso</ion-select-option>
                        </ion-select>
                    </ion-col>
                    <ion-col>
                        <ion-select :toggle-icon="chevronDownOutline" aria-label="Universidad"
                            v-model="filters.universidad_id" placeholder="Universidad" @ionChange="onUniversidadChange">
                            <ion-select-option v-for="uni in universidades" :key="uni.id" :value="uni.id">
                                {{ uni.nombre }}
                            </ion-select-option>
                        </ion-select>
                    </ion-col>
                    <ion-col>
                        <ion-select :toggle-icon="chevronDownOutline" aria-label="Carrera" placeholder="Carrera"
                            v-model="filters.carrera_id" @ionChange="applyFilters" :disabled="!filters.universidad_id">
                            <ion-select-option v-for="carrera in carreras" :key="carrera.id" :value="carrera.id">
                                {{ carrera.nombre }}
                            </ion-select-option>
                        </ion-select>
                    </ion-col>
                </ion-row>
                <ion-row v-if="hasActiveFilters" class="clear-filters-row">
                    <ion-col>
                        <ion-button fill="clear" size="small" @click="clearFilters" class="clear-filters-btn">
                            <ion-icon slot="start" :icon="closeCircleOutline"></ion-icon>
                            Limpiar Filtros
                        </ion-button>
                    </ion-col>
                </ion-row>
            </ion-grid>
            <ion-list v-if="!loading && filteredUsers.length > 0">
                <div v-for="(u, index) in filteredUsers" :key="index" v-memo="[u.id, followingIds.includes(u.id)]">
                    <ion-item v-if="u.id !== currentUserId">
                        <ion-avatar slot="start">
                            <img v-if="u.imagen_url" :src="u.imagen_url" alt="avatar" loading="lazy"
                                @error="handleImageError" />
                            <ion-icon v-else :icon="personCircle" class="avatar-icon"></ion-icon>
                        </ion-avatar>
                        <ion-label>
                            <h3 @click="goToProfile(u)" style="cursor: pointer;">
                                <strong>
                                    {{ u.name }}
                                </strong>
                            </h3>
                            <!-- Mostrar universidad solo si existe -->
                            <p v-if="u.universidad" class="user-university">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round" class="info-svg-icon">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                    <path d="M22 9l-10 -4l-10 4l10 4l10 -4v6" />
                                    <path d="M6 10.6v5.4a6 3 0 0 0 12 0v-5.4" />
                                </svg>
                                <span>{{ u.universidad.nombre }}</span>
                            </p>
                            <!-- Mostrar carrera solo si existe -->
                            <p v-if="u.carrera" class="user-career">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round" class="info-svg-icon">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                    <path d="M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0" />
                                    <path d="M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0" />
                                    <path d="M3 6l0 13" />
                                    <path d="M12 6l0 13" />
                                    <path d="M21 6l0 13" />
                                </svg>
                                <span>{{ u.carrera.nombre }}</span>
                            </p>
                            <!-- Mensaje si no tiene universidad ni carrera -->
                            <p v-if="!u.universidad && !u.carrera" class="no-university-message">
                                Sin información universitaria
                            </p>
                        </ion-label>
                        <FollowButton slot="end" :userId="u.id"
                            :initialFollowStatus="u.is_following || false" :followersCount="u.followers_count || 0"
                            @update="handleFollowUpdate(u, $event)" />
                    </ion-item>
                </div>
            </ion-list>

            <div v-if="!loading && filteredUsers.length === 0" class="no-results">
                <ion-icon :icon="searchOutline" class="no-results-icon"></ion-icon>
                <p>No se encontraron usuarios</p>
                <ion-button size="small" fill="clear" @click="clearFilters">
                    Limpiar filtros
                </ion-button>
            </div>

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
import { UniversidadService } from "@/services/universidad";
import { closeOutline, chevronDownOutline, personCircle, searchOutline, schoolOutline, bookOutline, alertCircleOutline, closeCircleOutline } from "ionicons/icons";
import { AuthService } from "@/services/auth";
import { useDarkMode } from '@/utils/useDarkMode';
import FollowButton from '@/components/FollowButton.vue';
import { followersService } from '@/services/followersService';

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
        FollowButton,
    },
    setup() {
        const { isDarkMode } = useDarkMode();
        return { isDarkMode };
    },
    data() {
        return {
            filteredUsers: [],
            filters: {
                order: null,
                universidad_id: null,
                carrera_id: null,
            },
            users: [],
            universidades: [],
            carreras: [],
            user: { imagen_url: null, name: "Usuario", username: "usuario" },
            closeOutline,
            chevronDownOutline,
            personCircle,
            searchOutline,
            schoolOutline,
            bookOutline,
            alertCircleOutline,
            closeCircleOutline,
            isAuthenticated: false,
            loading: false,
            searchText: '',
            currentUserId: null,
            followingIds: [], // Array de IDs de usuarios que sigo
        };
    },
    computed: {
        hasActiveFilters() {
            return (
                this.filters.order !== null ||
                this.filters.universidad_id !== null ||
                this.filters.carrera_id !== null ||
                (this.searchText && this.searchText.trim() !== '')
            );
        }
    },
    async created() {
        // Verificar autenticación
        this.isAuthenticated = AuthService.isAuthenticated();

        // Si no está autenticado, redirigir inmediatamente
        if (!this.isAuthenticated) {
            this.$router.replace("/login");
            return;
        }

        // Cargar usuario autenticado
        await this.loadCurrentUser();

        // Cargar la lista de usuarios que sigo (para sincronizar estado)
        await this.loadFollowingIds();

        // Cargar universidades PRIMERO (importante para normalizar datos)
        await this.loadUniversidades();

        // Obtener usuarios DESPUÉS de cargar universidades
        await this.getUsers();
    },

    methods: {
        async loadCurrentUser() {
            try {
                // Obtener el usuario del localStorage
                const localUser = AuthService.getUser();
                if (localUser) {
                    this.user = localUser;
                    this.currentUserId = localUser.id;
                }
            } catch (error) {
                console.error("Error cargando usuario:", error);
            }
        },

        async loadFollowingIds() {
            try {
                /* console.log('[UsersView] Cargando lista de usuarios que sigo...'); */
                this.followingIds = await followersService.getFollowingIds();
                /* console.log('[UsersView] ✅ Usuarios que sigo (IDs):', this.followingIds); */
            } catch (error) {
                console.error('[UsersView] Error cargando following IDs:', error);
                this.followingIds = [];
            }
        },

        async loadUniversidades() {
            try {
                const response = await UniversidadService.getUniversidades();
                this.universidades = response.data || response;
            } catch (error) {
                console.error("Error al cargar universidades:", error);
                // No mostrar error al usuario, simplemente no tendrá filtros
            }
        },

        async onUniversidadChange() {
            if (this.filters.universidad_id) {
                try {
                    const response = await UniversidadService.getCarreras(this.filters.universidad_id);
                    this.carreras = response.data || response;
                } catch (error) {
                    console.error("Error al cargar carreras:", error);
                    this.carreras = [];
                }
            } else {
                this.carreras = [];
                this.filters.carrera_id = null;
            }
            this.applyFilters();
        },

        applyFilters() {
            let filtered = [...this.users];

            // Filtrar por búsqueda de texto
            if (this.searchText && this.searchText.trim()) {
                const searchTerm = this.searchText.toLowerCase();
                filtered = filtered.filter((user) => {
                    return (
                        (user.name && user.name.toLowerCase().includes(searchTerm)) ||
                        (user.universidad?.nombre && user.universidad.nombre.toLowerCase().includes(searchTerm)) ||
                        (user.carrera?.nombre && user.carrera.nombre.toLowerCase().includes(searchTerm))
                    );
                });
            }

            // Filtrar por universidad
            if (this.filters.universidad_id) {
                filtered = filtered.filter(user => user.universidad?.id === this.filters.universidad_id);
            }

            // Filtrar por carrera
            if (this.filters.carrera_id) {
                filtered = filtered.filter(user => user.carrera?.id === this.filters.carrera_id);
            }

            // Ordenar
            if (this.filters.order === 'ABC') {
                filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            } else if (this.filters.order === 'CBA') {
                filtered.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
            } else if (this.filters.order === 'ASC') {
                filtered.sort((a, b) => a.id - b.id);
            } else if (this.filters.order === 'DESC') {
                filtered.sort((a, b) => b.id - a.id);
            }

            this.filteredUsers = filtered;
        },

        clearFilters() {
            this.filters = {
                order: null,
                universidad_id: null,
                carrera_id: null,
            };
            this.searchText = '';
            this.carreras = [];
            this.filteredUsers = this.users;
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

                // Obtener el ID del usuario actual
                const currentUserId = this.currentUserId;

                /* console.log('[UsersView] Procesando usuarios - currentUserId:', currentUserId); */

                if (usersData.length > 0) {
                    /* console.log('[UsersView] ===== DIAGNÓSTICO DEL BACKEND =====');
                    console.log('[UsersView] Ejemplo de usuario raw del backend:', JSON.stringify(usersData[0], null, 2));
                    console.log('[UsersView] ¿Tiene is_following?', usersData[0].is_following);
                    console.log('[UsersView] ¿Tiene followers?', usersData[0].followers);
                    console.log('[UsersView] ¿Tiene following?', usersData[0].following);
                    console.log('[UsersView] ========================================'); */
                }

                // Enriquecer usuarios con información de seguimiento (igual que user_has_liked en posts)
                const enrichedUsers = usersData.map((user) => {
                    let isFollowing = false;

                    // PRIORIDAD 1: Verificar si el ID está en la lista de followingIds cargada previamente
                    if (this.followingIds.includes(user.id)) {
                        isFollowing = true;
                        /* console.log(`[UsersView] ✅ Usuario ${user.id} (${user.name}) - ESTÁ en followingIds`); */
                    }
                    // PRIORIDAD 2: Verificar si el backend envía is_following directamente
                    else if (user.is_following !== undefined && user.is_following !== null) {
                        isFollowing = Boolean(user.is_following);
                        /* console.log(`[UsersView] Usuario ${user.id} (${user.name}) - is_following del backend:`, isFollowing); */
                    }
                    // PRIORIDAD 3: Si no viene is_following pero sí el array de followers, calcularlo
                    else if (user.followers && Array.isArray(user.followers) && currentUserId) {
                        isFollowing = user.followers.some(follower => {
                            const followerId = follower.follower_id || follower.user_id || follower.id;
                            const isMatch = followerId === currentUserId;
                            if (isMatch) {
                                /* console.log(`[UsersView] ✅ Usuario ${user.id} - YO lo sigo (encontrado en followers)`, follower); */
                            }
                            return isMatch;
                        });
                        /* console.log(`[UsersView] Usuario ${user.id} (${user.name}) - calculado desde followers[]:`, isFollowing, '| Total followers:', user.followers.length); */
                    }
                    else {
                        /* console.log(`[UsersView] Usuario ${user.id} (${user.name}) - No sigo a este usuario`); */
                    }

                    return {
                        ...user,
                        is_following: isFollowing,
                        followers_count: user.followers_count !== undefined
                            ? user.followers_count
                            : (user.followers?.length || 0),
                    };
                });

                // Asignar usuarios enriquecidos
                this.users = enrichedUsers;
                this.filteredUsers = this.users;

                /* console.log('Usuarios cargados:', this.users.length); */
                /* if (this.users.length > 0) {
                    console.log('Primer usuario:', {
                        id: this.users[0].id,
                        name: this.users[0].name,
                        is_following: this.users[0].is_following,
                        followers_count: this.users[0].followers_count,
                        followers: this.users[0].followers
                    });
                } */
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
            this.searchText = ev.detail.value || '';
            this.applyFilters();
        },
        handleImageError(ev) {
            // evita errores en consola si la imagen falla
            ev.target.src = "https://www.gravatar.com/avatar/?d=mp&f=y";
        },
        handleFollowUpdate(user, event) {
            // Actualizar el estado del usuario en la lista
            user.is_following = event.isFollowing;
            user.followers_count = event.followersCount;

            // IMPORTANTE: Actualizar también el array followingIds para persistencia
            if (event.isFollowing) {
                // Si ahora lo sigo, agregar al array si no está
                if (!this.followingIds.includes(user.id)) {
                    this.followingIds.push(user.id);
                    /* console.log('[UsersView] ✅ Usuario agregado a followingIds:', user.id); */
                }
            } else {
                // Si dejé de seguirlo, remover del array
                const index = this.followingIds.indexOf(user.id);
                if (index > -1) {
                    this.followingIds.splice(index, 1);
                    /* console.log('[UsersView] ❌ Usuario removido de followingIds:', user.id); */
                }
            }

            /* console.log('[UsersView] Follow actualizado:', {
                userId: user.id,
                userName: user.name,
                isFollowing: user.is_following,
                followersCount: user.followers_count,
                followingIds: this.followingIds
            }); */
        },
        onIonInfinite(ev) {
            // Deshabilitado: no cargar usuarios falsos
            ev.target.disabled = true;
            ev.target.complete();
        },
        goToProfile(user) {
            // Navegar al perfil del usuario usando su username o id
            const identifier = user.username || user.id;
            this.$router.push(`/tabs/perfil/${identifier}`);
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
    background: var(--ion-background-color);
    padding: 8px;
}

ion-list ion-item {
    --ion-item-background: var(--ion-card-background);
    --color: var(--ion-text-color);
    --min-height: 100px;
    margin: 8px 0;
    border-radius: 8px;
    border: 1px solid var(--ion-border-color);
}

.filters {
    background: var(--ion-background-color);
    padding: 0;
    margin: 0;
    --ion-grid-padding: 0;
    border-bottom: 1px solid var(--ion-border-color);
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

.clear-filters-row {
    padding-top: 0 !important;
    padding-bottom: 8px !important;
}

.clear-filters-btn {
    --color: #8A2BE2;
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: none;
    margin: 0;
    height: 32px;
}

.clear-filters-btn ion-icon {
    font-size: 18px;
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
    color: var(--ion-text-color-secondary);
    font-size: 14px;
}

/* Toolbar styles */
ion-header {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

ion-toolbar {
    --background: var(--ion-toolbar-background);
    --border-width: 0;
}

ion-toolbar ion-title {
    font-weight: bold;
    font-size: 18px;
    color: var(--ion-text-color);
}

ion-toolbar ion-button {
    --color: var(--ion-text-color-secondary);
}

ion-toolbar ion-icon {
    font-size: 24px;
}

ion-searchbar {
    --background: var(--ion-background-color);
    --color: var(--ion-text-color);
    --border-radius: 10px;
    --box-shadow: none;
    --placeholder-color: var(--ion-text-color-secondary);
    --placeholder-font-style: normal;
    --icon-color: var(--ion-text-color-secondary);
    padding: 8px 16px;
}

ion-content {
    --background: var(--ion-background-color);
}

/* Info de universidad y carrera */
.user-university,
.user-career {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.75rem;
    color: var(--ion-text-color-secondary);
    margin: 4px 0;
}

.user-university span,
.user-career span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.info-svg-icon {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    stroke: #8A2BE2;
}

.no-university-message {
    font-size: 0.75rem;
    color: #f59e0b;
    font-style: italic;
    margin: 4px 0;
}

/* No results */
.no-results {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
}

.no-results-icon {
    font-size: 64px;
    color: var(--ion-text-color-secondary);
    opacity: 0.5;
    margin-bottom: 16px;
}

.no-results p {
    color: var(--ion-text-color-secondary);
    font-size: 16px;
    margin: 0 0 16px 0;
}

/* Estilos para el nombre clickeable */
ion-label h3 {
    transition: color 0.2s ease;
}

ion-label h3:hover {
    color: #8A2BE2;
}

ion-label h3:active {
    opacity: 0.7;
}

.no-results ion-button {
    --color: #8A2BE2;
}
</style>