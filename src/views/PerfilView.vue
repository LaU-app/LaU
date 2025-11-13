<template>
    <ion-page>
        <!-- Header del perfil -->
        <ion-header class="ion-no-border">
            <ion-toolbar>
                <ion-buttons slot="start">
                    <div class="logo-container">
                        <img src="/LaU.png" alt="LaÚ" class="header-logo" />
                    </div>
                </ion-buttons>
                <ion-title class="username-title">
                    <span class="username-purple">@{{ user.username }}</span>
                </ion-title>
                <ion-buttons slot="end">
                    <ion-button fill="clear" @click="toggleDarkMode">
                        <ion-icon :icon="isDarkMode ? sunny : moon" class="header-icon"></ion-icon>
                    </ion-button>
                    <ion-button v-if="isMe" id="open-menu-button" fill="clear" @click="toggleMenu">
                        <ion-icon :icon="ellipsisVertical" class="header-icon"></ion-icon>
                    </ion-button>
                </ion-buttons>
            </ion-toolbar>
        </ion-header>

        <ion-content>
            <!-- Refresh -->
            <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
                <ion-refresher-content></ion-refresher-content>
            </ion-refresher>

            <!-- Error message -->
            <ion-card v-if="error && !loading" color="danger">
                <ion-card-content>
                    <p>{{ error }}</p>
                    <ion-button size="small" @click="retry">Reintentar</ion-button>
                </ion-card-content>
            </ion-card>

            <!-- Loading Skeleton -->
            <div v-if="loading && !user.id" class="profile-section ion-padding">
                <div class="ion-text-center">
                    <ion-skeleton-text animated
                        style="width: 80px; height: 80px; border-radius: 50%; margin: 0 auto;"></ion-skeleton-text>
                    <ion-skeleton-text animated style="width: 60%; margin: 12px auto;"></ion-skeleton-text>
                    <ion-skeleton-text animated style="width: 80%; margin: 8px auto;"></ion-skeleton-text>
                </div>
                <ion-grid class="stats-grid">
                    <ion-row>
                        <ion-col size="4" v-for="i in 3" :key="i">
                            <ion-skeleton-text animated style="width: 60%; margin: 0 auto;"></ion-skeleton-text>
                        </ion-col>
                    </ion-row>
                </ion-grid>
            </div>

            <!-- Perfil de usuario -->
            <div v-else class="profile-section ion-text-center ion-padding">
                <!-- Avatar y botón de menú -->
                <div class="profile-header-row">
                    <ion-avatar class="profile-avatar" @click="isMe ? openImagePicker() : null"
                        :style="{ cursor: isMe ? 'pointer' : 'default' }">
                        <img v-if="user.imagen_url" :src="user.imagen_url" alt="Foto de perfil" />
                        <ion-icon v-else :icon="personCircle" class="profile-avatar-icon"></ion-icon>
                        <div v-if="isMe" class="avatar-overlay">
                            <ion-icon :icon="cameraOutline" color="light"></ion-icon>
                        </div>
                    </ion-avatar>
                    <ion-button v-if="isMe" fill="clear" @click="openMenu" id="open-menu-button"
                        class="menu-button-inline">
                        <ion-icon :icon="ellipsisVerticalOutline" color="medium"></ion-icon>
                    </ion-button>
                </div>

                <!-- Nombre y descripción -->
                <h3 class="profile-name">{{ user.name }}</h3>
                <p class="profile-description">
                    {{ universidad?.nombre || user.universidad?.nombre || "Sin información académica" }}
                    <br
                        v-if="(universidad?.nombre || user.universidad?.nombre) && (carrera?.nombre || user.carrera?.nombre)" />
                    {{ carrera?.nombre || user.carrera?.nombre || "" }}
                </p>

                <!-- Botón Seguir / Editar -->
                <div class="action-buttons">
                    <ion-button v-if="!isMe" color="primary" @click="handleFollow">
                        {{ isFollowing ? 'Siguiendo' : 'Seguir' }}
                    </ion-button>
                    <ion-button v-else color="primary" @click="openSettings">Editar Perfil</ion-button>
                </div>

                <!-- Contadores -->
                <ion-grid class="stats-grid">
                    <ion-row class="ion-text-center">
                        <ion-col size="4">
                            <div class="stat-number">{{ stats.posts }}</div>
                            <div class="stat-label">Publicaciones</div>
                        </ion-col>
                        <ion-col size="4" class="clickable" @click="openFollowers">
                            <div class="stat-number">{{ stats.seguidores }}</div>
                            <div class="stat-label">Seguidores</div>
                        </ion-col>
                        <ion-col size="4" class="clickable" @click="openFollowing">
                            <div class="stat-number">{{ stats.siguiendo }}</div>
                            <div class="stat-label">Seguidos</div>
                        </ion-col>
                    </ion-row>
                </ion-grid>

                <!-- Divider -->
                <div class="divider"></div>

                <!-- Tabs -->
                <ion-segment v-model="selectedTab" mode="md" color="primary">
                    <ion-segment-button value="posts">
                        <ion-label class="tab-label">
                            <ion-icon :icon="grid"></ion-icon>
                            <span>Posts</span>
                        </ion-label>
                    </ion-segment-button>
                    <ion-segment-button value="archivos">
                        <ion-label class="tab-label">
                            <ion-icon :icon="folderOutline"></ion-icon>
                            <span>Archivos</span>
                        </ion-label>
                    </ion-segment-button>
                    <ion-segment-button value="musica">
                        <ion-label class="tab-label">
                            <ion-icon :icon="musicalNoteOutline"></ion-icon>
                            <span>Música</span>
                        </ion-label>
                    </ion-segment-button>
                </ion-segment>

                <!-- Contenido de los tabs -->
                <div class="tabs-content">
                    <!-- Posts Tab (Imagen/Texto) -->
                    <div v-if="selectedTab === 'posts'">
                        <ion-grid>
                            <ion-row>
                                <ion-col v-for="post in postsImagenTexto" :key="post.id" size="6">
                                    <div class="post-card" @click="goToPostDetail(post.id)">
                                        <img v-if="post.imagen_url" :src="post.imagen_url" class="post-thumbnail"
                                            :alt="post.titulo || 'Post'" />
                                        <div v-else class="post-placeholder">
                                            <ion-icon :icon="documentTextOutline" size="large"
                                                color="medium"></ion-icon>
                                        </div>
                                        <div class="post-info">
                                            <p class="post-title">{{ post.titulo || 'Post' }}</p>
                                            <p class="post-text" v-if="post.texto">{{ post.texto }}</p>
                                        </div>
                                    </div>
                                </ion-col>
                            </ion-row>
                        </ion-grid>
                        <div v-if="postsImagenTexto.length === 0 && !loadingPosts" class="empty-message">
                            <ion-icon :icon="imagesOutline" size="large" color="medium"></ion-icon>
                            <p>Aún no hay publicaciones</p>
                        </div>
                    </div>

                    <!-- Archivos Tab -->
                    <div v-else-if="selectedTab === 'archivos'">
                        <ion-grid>
                            <ion-row>
                                <ion-col v-for="post in postsArchivos" :key="post.id" size="6">
                                    <div class="file-card" @click="goToPostDetail(post.id)">
                                        <div class="file-icon-container">
                                            <ion-icon :icon="documentAttachOutline" size="large"
                                                color="primary"></ion-icon>
                                        </div>
                                        <div class="file-info">
                                            <p class="file-title">{{ post.titulo || "Archivo" }}</p>
                                            <p class="file-name" v-if="post.archivo">{{ getFileName(post.archivo) }}</p>
                                        </div>
                                    </div>
                                </ion-col>
                            </ion-row>
                        </ion-grid>
                        <div v-if="postsArchivos.length === 0 && !loadingPosts" class="empty-message">
                            <ion-icon :icon="folderOpenOutline" size="large" color="medium"></ion-icon>
                            <p>Sin archivos todavía</p>
                        </div>
                    </div>

                    <!-- Música Tab -->
                    <div v-else>
                        <ion-grid>
                            <ion-row>
                                <ion-col v-for="post in postsMusica" :key="post.id" size="6">
                                    <div class="music-card" @click="goToPostDetail(post.id)">
                                        <!-- Buscar imagen en múltiples campos posibles -->
                                        <img v-if="getMusicCover(post)" :src="getMusicCover(post)"
                                            class="music-thumbnail" :alt="post.track_name || post.titulo || 'Portada'"
                                            @error="handleImageError($event, post)" />
                                        <ion-icon v-else :icon="musicalNoteOutline" size="large" color="medium"
                                            class="music-icon"></ion-icon>
                                        <div class="music-info">
                                            <p class="music-title">
                                                {{ post.itunes_track_name || post.track_name || post.titulo || "Sin título" }}
                                            </p>
                                            <p class="music-artist" v-if="post.itunes_artist_name || post.artist_name">
                                                {{ post.itunes_artist_name || post.artist_name }}
                                            </p>
                                        </div>
                                    </div>
                                </ion-col>
                            </ion-row>
                        </ion-grid>
                        <div v-if="postsMusica.length === 0 && !loadingPosts" class="empty-message">
                            <ion-icon :icon="musicalNotesOutline" size="large" color="medium"></ion-icon>
                            <p>No hay música compartida</p>
                        </div>
                    </div>

                    <!-- Loading más posts -->
                    <div v-if="loadingPosts" class="loading-more">
                        <ion-spinner name="crescent"></ion-spinner>
                    </div>
                </div>

                <!-- Infinite Scroll -->
                <ion-infinite-scroll v-if="!loadingPosts && hasMorePages" @ionInfinite="loadMorePosts"
                    threshold="100px">
                    <ion-infinite-scroll-content loading-spinner="bubbles"
                        loading-text="Cargando más..."></ion-infinite-scroll-content>
                </ion-infinite-scroll>
            </div>

            <!-- Modal Settings -->
            <ion-modal :is-open="showSettingsModal" @didDismiss="closeSettings">
                <ion-header>
                    <ion-toolbar>
                        <ion-title>Editar Perfil</ion-title>
                        <ion-buttons slot="end">
                            <ion-button @click="closeSettings">Cerrar</ion-button>
                        </ion-buttons>
                    </ion-toolbar>
                </ion-header>
                <ion-content class="ion-padding">
                    <ion-list>
                        <ion-list-header>
                            <ion-label>Información Personal</ion-label>
                        </ion-list-header>

                        <ion-item lines="full">
                            <ion-input label="Nombre completo" label-placement="floating" v-model="formData.name"
                                required></ion-input>
                        </ion-item>

                        <ion-item lines="full">
                            <ion-input label="Username" label-placement="floating" v-model="formData.username"
                                required></ion-input>
                        </ion-item>

                        <ion-item lines="full">
                            <ion-input type="email" label="Correo" label-placement="floating" v-model="formData.email"
                                required></ion-input>
                        </ion-item>

                        <ion-item lines="full">
                            <ion-input label="Profesión" label-placement="floating"
                                v-model="formData.profession"></ion-input>
                        </ion-item>
                    </ion-list>

                    <ion-list>
                        <ion-list-header>
                            <ion-label>Información Académica</ion-label>
                        </ion-list-header>

                        <ion-item lines="full">
                            <ion-label position="floating">Universidad</ion-label>
                            <ion-select v-model="formData.universidad_id" placeholder="Selecciona"
                                interface="action-sheet">
                                <ion-select-option v-for="uni in universidades" :key="uni.id" :value="Number(uni.id)">
                                    {{ uni.nombre }}
                                </ion-select-option>
                            </ion-select>
                        </ion-item>

                        <ion-item lines="full">
                            <ion-label position="floating">Carrera</ion-label>
                            <ion-select v-model="formData.carrera_id" placeholder="Selecciona" interface="action-sheet">
                                <ion-select-option v-for="carr in carreras" :key="carr.id" :value="Number(carr.id)">
                                    {{ carr.nombre }}
                                </ion-select-option>
                            </ion-select>
                        </ion-item>
                    </ion-list>

                    <ion-list>
                        <ion-list-header>
                            <ion-label>Otros Datos</ion-label>
                        </ion-list-header>

                        <ion-item lines="full">
                            <ion-label position="floating">Género</ion-label>
                            <ion-select v-model="formData.gender" placeholder="Selecciona" interface="action-sheet">
                                <ion-select-option value="Male">Masculino</ion-select-option>
                                <ion-select-option value="Female">Femenino</ion-select-option>
                                <ion-select-option value="Other">Otro</ion-select-option>
                            </ion-select>
                        </ion-item>
                    </ion-list>

                    <ion-button expand="block" @click="updateProfile" class="ion-margin-top" :disabled="savingProfile">
                        <ion-spinner v-if="savingProfile" name="crescent"></ion-spinner>
                        <span v-else>Guardar Cambios</span>
                    </ion-button>
                </ion-content>
            </ion-modal>

            <!-- Modal Actualizar Imagen -->
            <ion-modal :is-open="isImagePickerOpen" @didDismiss="closeImagePicker">
                <ion-header>
                    <ion-toolbar>
                        <ion-title>Actualizar Foto de Perfil</ion-title>
                        <ion-buttons slot="end">
                            <ion-button @click="closeImagePicker">Cerrar</ion-button>
                        </ion-buttons>
                    </ion-toolbar>
                </ion-header>
                <ion-content class="ion-padding">
                    <!-- Vista previa -->
                    <div v-if="imagenPreview" class="preview-container">
                        <img :src="imagenPreview" alt="Preview" />
                        <ion-button fill="clear" color="danger" @click="removeImage" class="remove-btn">
                            <ion-icon slot="icon-only" :icon="closeCircle"></ion-icon>
                        </ion-button>
                    </div>

                    <!-- Selector de imagen -->
                    <div v-else class="upload-box" @click="showPhotoActionSheet">
                        <ion-icon :icon="cameraOutline" size="large" color="primary"></ion-icon>
                        <h3>Seleccionar o tomar foto</h3>
                        <p>JPG, PNG. Máximo 20MB</p>
                    </div>

                    <ion-button expand="block" @click="guardarImagen" :disabled="!archivo || uploadingImage"
                        class="ion-margin-top">
                        <ion-spinner v-if="uploadingImage" name="crescent"></ion-spinner>
                        <span v-else>Guardar Imagen</span>
                    </ion-button>
                </ion-content>
            </ion-modal>

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
                            <ion-label class="ion-text-center">No hay seguidores</ion-label>
                        </ion-item>
                        <ion-item button v-for="follower in seguidores" :key="follower.id"
                            @click="goToUserProfile(follower)">
                            <ion-avatar slot="start">
                                <img :src="follower.imagen_url || 'https://www.gravatar.com/avatar/?d=mp&f=y'" />
                            </ion-avatar>
                            <ion-label>
                                <h3>{{ follower.name || follower.username }}</h3>
                                <p>@{{ follower.username }}</p>
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
                            <ion-label class="ion-text-center">No sigue a nadie</ion-label>
                        </ion-item>
                        <ion-item button v-for="following in siguiendo" :key="following.id"
                            @click="goToUserProfile(following)">
                            <ion-avatar slot="start">
                                <img :src="following.imagen_url || 'https://www.gravatar.com/avatar/?d=mp&f=y'" />
                            </ion-avatar>
                            <ion-label>
                                <h3>{{ following.name || following.username }}</h3>
                                <p>@{{ following.username }}</p>
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
    IonSpinner,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonIcon,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonModal,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonTitle,
    IonList,
    IonListHeader,
    IonItem,
    IonAvatar,
    IonButton,
    IonGrid,
    IonRow,
    IonCol,
    IonPopover,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonRefresher,
    IonRefresherContent,
    IonSkeletonText,
    actionSheetController,
    toastController,
} from "@ionic/vue";

import {
    ellipsisVerticalOutline,
    ellipsisVertical,
    grid,
    folderOutline,
    folderOpenOutline,
    musicalNoteOutline,
    musicalNotesOutline,
    logOutOutline,
    personCircle,
    documentTextOutline,
    documentAttachOutline,
    pencil,
    closeCircle,
    cameraOutline,
    imagesOutline,
    closeOutline,
    moon,
    sunny,
} from "ionicons/icons";

import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { UniversidadService } from "@/services/universidad";
import { AuthService } from "@/services/auth";
import { useDarkMode } from "@/utils/useDarkMode";

export default {
    name: "PerfilView",
    setup() {
        const { isDarkMode, toggleDarkMode, initDarkMode } = useDarkMode();
        if (typeof window !== 'undefined') {
            initDarkMode();
        }
        return { isDarkMode, toggleDarkMode };
    },
    components: {
        IonPage,
        IonContent,
        IonCard,
        IonCardContent,
        IonIcon,
        IonSpinner,
        IonSegment,
        IonSegmentButton,
        IonLabel,
        IonInfiniteScroll,
        IonInfiniteScrollContent,
        IonModal,
        IonHeader,
        IonToolbar,
        IonButtons,
        IonTitle,
        IonList,
        IonListHeader,
        IonItem,
        IonAvatar,
        IonButton,
        IonGrid,
        IonRow,
        IonCol,
        IonPopover,
        IonInput,
        IonSelect,
        IonSelectOption,
        IonRefresher,
        IonRefresherContent,
        IonSkeletonText,
    },
    data() {
        return {
            // Datos del usuario
            user: {
                imagen_url: null,
                name: "Usuario",
                username: "usuario",
                id: null,
            },
            user_viewer: null,

            // Estados
            loading: false,
            loadingPosts: false,
            isMe: true,
            isFollowing: false,
            error: null,
            selectedTab: "posts",

            // Posts y paginación
            posts: [],
            currentPage: 1,
            lastPage: 1,
            hasMorePages: false,

            // Estadísticas
            stats: {
                posts: 0,
                seguidores: 0,
                siguiendo: 0,
            },
            seguidores: [],
            siguiendo: [],

            // Universidad y carrera
            universidad: null,
            carrera: null,
            universidades: [],
            carreras: [],

            // Formulario de edición
            formData: {
                id: null,
                name: "",
                username: "",
                email: "",
                profession: "",
                gender: "",
                universidad_id: null,
                carrera_id: null,
            },
            savingProfile: false,

            // Imagen de perfil
            imagenPreview: null,
            archivo: null,
            uploadingImage: false,

            // Modales
            showFollowersModal: false,
            showFollowingModal: false,
            showSettingsModal: false,
            isMenuOpen: false,
            isImagePickerOpen: false,

            // Icons
            ellipsisVerticalOutline,
            ellipsisVertical,
            grid,
            folderOutline,
            folderOpenOutline,
            musicalNoteOutline,
            musicalNotesOutline,
            logOutOutline,
            personCircle,
            documentTextOutline,
            documentAttachOutline,
            pencil,
            closeCircle,
            cameraOutline,
            imagesOutline,
            closeOutline,
            moon,
            sunny,
        };
    },

    async created() {
        await this.initializeProfile();
    },

    watch: {
        "$route.params.username": {
            async handler(newUsername, oldUsername) {
                if (newUsername !== oldUsername) {
                    this.resetState();
                    await this.initializeProfile();
                }
            },
        },
    },

    computed: {
        /**
         * Posts de imagen o texto
         * - Tipo "imagen": Posts con imagen_url
         * - Tipo "texto": Posts solo de texto sin multimedia
         */
        postsImagenTexto() {
            return this.posts.filter((post) => {
                // Soportar tanto 'tipo' como 'tipo_contenido' del backend
                const tipo = (post.tipo || post.tipo_contenido || "").toString().toLowerCase().trim();

                // Imágenes: tipo === 'imagen' O tiene imagen_url
                if (tipo === "imagen" || post.imagen_url) {
                    return true;
                }

                // Texto: tipo === 'texto' O (tiene campo texto Y no tiene otros archivos)
                if (tipo === "texto" || (post.texto && !post.imagen_url && !post.archivo && !post.itunes_track_id)) {
                    return true;
                }

                // Si no tiene tipo definido pero tiene imagen
                if (!tipo && post.imagen_url) {
                    return true;
                }

                return false;
            });
        },

        /**
         * Posts de música
         * - Tipo "musica": Posts con metadatos de iTunes/Apple Music
         * - Detecta también por la presencia de campos de música
         */
        postsMusica() {
            return this.posts.filter((post) => {
                const tipo = (post.tipo || post.tipo_contenido || "").toString().toLowerCase().trim();

                // Música explícita
                if (tipo === "musica" || tipo === "música") {
                    return true;
                }

                // Detectar por metadatos de música (campos de iTunes)
                if (post.itunes_track_id || post.itunes_track_name ||
                    post.track_name || post.artist_name) {
                    return true;
                }

                return false;
            });
        },

        /**
         * Posts de archivos
         * - Tipo "archivo": Posts con archivos adjuntos (PDF, DOC, ZIP)
         * - Excluye posts de música que puedan tener archivos
         */
        postsArchivos() {
            return this.posts.filter((post) => {
                const tipo = (post.tipo || post.tipo_contenido || "").toString().toLowerCase().trim();

                // Archivo explícito
                if (tipo === "archivo") {
                    // Asegurarse que NO es música
                    if (post.itunes_track_id || post.track_name) {
                        return false;
                    }
                    return true;
                }

                // Detectar por campo archivo (pero excluir música)
                if (post.archivo && !post.itunes_track_id && !post.track_name &&
                    tipo !== "musica" && tipo !== "música") {
                    return true;
                }

                return false;
            });
        },
    },

    methods: {
        // ===== INICIALIZACIÓN =====

        async initializeProfile() {
            this.loading = true;
            this.error = null;

            try {
                await this.loadCurrentUser();

                if (this.user?.id) {
                    // Cargar datos en paralelo para mejor rendimiento
                    await Promise.all([
                        this.loadProfileData(),
                        this.loadUniversidades(),
                    ]);
                }
            } catch (err) {
                console.error("[PERFIL] Error al inicializar:", err);
                this.error = "Error al cargar el perfil";
            } finally {
                this.loading = false;
            }
        },

        resetState() {
            this.posts = [];
            this.seguidores = [];
            this.siguiendo = [];
            this.currentPage = 1;
            this.hasMorePages = false;
            this.error = null;
            this.stats = { posts: 0, seguidores: 0, siguiendo: 0 };
        },

        async loadCurrentUser() {
            try {
                const localUser = AuthService.getUser();
                if (localUser) {
                    this.user_viewer = localUser;
                }

                // Validar token con API
                try {
                    const apiUser = await AuthService.fetchProfile();
                    if (apiUser) {
                        this.user_viewer = apiUser;
                    }
                } catch (apiError) {
                    // Token validation failed
                    if (apiError.response?.status === 401) {
                        await AuthService.logout();
                        this.$router.replace("/login");
                        return;
                    }
                }

                // Determinar si es perfil propio o ajeno
                const routeParam = (this.$route.params.username || "me").toString().trim().toLowerCase();

                if (routeParam === "me" || (this.user_viewer?.username && routeParam === this.user_viewer.username.toLowerCase())) {
                    // Perfil propio
                    this.isMe = true;
                    this.user = this.user_viewer;
                } else {
                    // Perfil ajeno
                    this.isMe = false;
                    const response = await AuthService.fetchForeignProfile(routeParam);
                    this.user = response.data || response;
                }
            } catch (error) {
                console.error("[PERFIL] Error cargando usuario:", error);
                throw error;
            }
        },

        async loadProfileData() {
            try {
                const userId = this.user.id || this.user.username;

                // Cargar todos los datos en paralelo
                const [postsResponse, followersResponse, followingResponse] = await Promise.all([
                    AuthService.getUserPosts(userId, 1).catch(() => ({ data: [] })),
                    AuthService.getFollowers(userId).catch(() => ({ followers: [] })),
                    AuthService.getFollowing(userId).catch(() => ({ following: [] })),
                ]);

                // Procesar posts
                this.processPosts(postsResponse);

                // Procesar seguidores
                this.seguidores = this.extractDataArray(followersResponse, 'followers');

                // Procesar seguidos
                this.siguiendo = this.extractDataArray(followingResponse, 'following');

                // Actualizar estadísticas
                this.updateStats();

            } catch (error) {
                console.error("[PERFIL] Error al cargar datos:", error);
                throw error;
            }
        },

        processPosts(response) {
            let postsData = [];

            if (Array.isArray(response)) {
                postsData = response;
            } else if (response?.data) {
                postsData = Array.isArray(response.data) ? response.data : (response.data.data || []);
            }

            // Configurar paginación
            if (response?.data?.current_page || response?.current_page) {
                const pag = response.data || response;
                this.currentPage = pag.current_page || 1;
                this.lastPage = pag.last_page || 1;
                this.hasMorePages = this.currentPage < this.lastPage;
            } else {
                this.currentPage = 1;
                this.lastPage = 1;
                this.hasMorePages = false;
            }

            this.posts = postsData;
        },

        extractDataArray(response, key) {
            if (response?.success && response?.data) {
                if (Array.isArray(response.data.data)) return response.data.data;
                if (Array.isArray(response.data)) return response.data;
            }
            if (response?.data) {
                if (Array.isArray(response.data.data)) return response.data.data;
                if (Array.isArray(response.data)) return response.data;
            }
            if (response?.[key]) return response[key];
            if (Array.isArray(response)) return response;
            return [];
        },

        updateStats() {
            this.stats = {
                posts: this.posts.length,
                seguidores: this.seguidores.length,
                siguiendo: this.siguiendo.length,
            };
        },

        async loadUniversidades() {
            try {
                const [unisResp, carrResp] = await Promise.all([
                    UniversidadService.getUniversidades(),
                    UniversidadService.getAllCarreras(),
                ]);

                this.universidades = unisResp.data || [];
                this.carreras = carrResp.data || [];

                // Buscar universidad y carrera del usuario
                if (this.user.universidad_id) {
                    this.universidad = this.universidades.find(u => u.id === this.user.universidad_id) || null;
                } else if (this.user.universidad?.id) {
                    this.universidad = this.universidades.find(u => u.id === this.user.universidad.id) || null;
                }

                if (this.user.carrera_id) {
                    this.carrera = this.carreras.find(c => c.id === this.user.carrera_id) || null;
                } else if (this.user.carrera?.id) {
                    this.carrera = this.carreras.find(c => c.id === this.user.carrera.id) || null;
                }
            } catch (error) {
                console.error("Error al cargar universidades:", error);
            }
        },

        // ===== PAGINACIÓN =====

        async loadMorePosts(event) {
            if (this.hasMorePages && !this.loadingPosts) {
                this.loadingPosts = true;
                try {
                    const userId = this.user.id || this.user.username;
                    const nextPage = this.currentPage + 1;
                    const response = await AuthService.getUserPosts(userId, nextPage);

                    let newPosts = [];
                    if (Array.isArray(response)) {
                        newPosts = response;
                    } else if (response?.data) {
                        newPosts = Array.isArray(response.data) ? response.data : (response.data.data || []);
                    }

                    this.posts = [...this.posts, ...newPosts];
                    this.currentPage = nextPage;

                    if (response?.data?.last_page) {
                        this.hasMorePages = nextPage < response.data.last_page;
                    }

                    this.updateStats();
                } catch (error) {
                    console.error("Error al cargar más posts:", error);
                    await this.showToast("Error al cargar más publicaciones", "danger");
                } finally {
                    this.loadingPosts = false;
                    event.target.complete();
                }
            } else {
                event.target.complete();
            }
        },

        async handleRefresh(event) {
            try {
                this.resetState();
                await this.loadCurrentUser();
                if (this.user?.id) {
                    await this.loadProfileData();
                }
                await this.showToast("Perfil actualizado", "success");
            } catch (error) {
                console.error("Error al refrescar:", error);
                await this.showToast("Error al actualizar", "danger");
            } finally {
                event.target.complete();
            }
        },

        async retry() {
            await this.initializeProfile();
        },

        // ===== IMAGEN DE PERFIL =====

        async showPhotoActionSheet() {
            const actionSheet = await actionSheetController.create({
                header: "Seleccionar foto",
                buttons: [
                    {
                        text: "Tomar foto",
                        icon: this.cameraOutline,
                        handler: () => this.takePicture(),
                    },
                    {
                        text: "Elegir de la galería",
                        icon: this.imagesOutline,
                        handler: () => this.pickFromGallery(),
                    },
                    {
                        text: "Cancelar",
                        icon: this.closeOutline,
                        role: "cancel",
                    },
                ],
            });
            await actionSheet.present();
        },

        async takePicture() {
            try {
                const image = await Camera.getPhoto({
                    quality: 90,
                    allowEditing: true,
                    resultType: CameraResultType.Uri,
                    source: CameraSource.Camera,
                });
                await this.processImage(image);
            } catch (error) {
                console.error("Error al tomar foto:", error);
                if (error.message !== "User cancelled photos app") {
                    await this.showToast("Error al acceder a la cámara", "danger");
                }
            }
        },

        async pickFromGallery() {
            try {
                const image = await Camera.getPhoto({
                    quality: 90,
                    allowEditing: true,
                    resultType: CameraResultType.Uri,
                    source: CameraSource.Photos,
                });
                await this.processImage(image);
            } catch (error) {
                console.error("Error al seleccionar foto:", error);
                if (error.message !== "User cancelled photos app") {
                    await this.showToast("Error al acceder a la galería", "danger");
                }
            }
        },

        async processImage(image) {
            try {
                this.imagenPreview = image.webPath;

                const response = await fetch(image.webPath);
                const blob = await response.blob();

                const fileName = `photo_${Date.now()}.${image.format || "jpg"}`;
                const file = new File([blob], fileName, {
                    type: `image/${image.format || "jpeg"}`,
                });

                // Validar tamaño (20MB según el backend)
                const maxSize = 20 * 1024 * 1024; // 20 MB en bytes
                if (file.size > maxSize) {
                    await this.showToast("La imagen no debe superar 20MB", "warning");
                    this.imagenPreview = null;
                    return;
                }

                this.archivo = file;
            } catch (error) {
                console.error("Error al procesar imagen:", error);
                await this.showToast("Error al procesar la imagen", "danger");
            }
        },

        removeImage() {
            this.imagenPreview = null;
            this.archivo = null;
        },

        // ===== IMAGEN DE PERFIL =====

        /**
         * Actualiza la imagen de perfil del usuario
         * 
         * FLUJO:
         * 1. Usuario selecciona/toma foto con Capacitor Camera
         * 2. Se procesa y valida la imagen (máx 20MB)
         * 3. Se envía PUT a /api/user/edit con FormData
         * 4. Backend redimensiona y guarda la imagen
         * 5. Se actualiza la sesión con la nueva imagen_url
         * 
         * IMPORTANTE:
         * - El endpoint requiere TODOS los campos obligatorios del usuario
         * - Método: PUT (no POST)
         * - Content-Type: multipart/form-data
         * - Backend elimina automáticamente la imagen anterior
         */
        async guardarImagen() {
            // Validar que existe imagen
            if (!this.archivo) {
                await this.showToast("Por favor selecciona una imagen", "warning");
                return;
            }

            // Verificar que es un File válido
            if (!(this.archivo instanceof File)) {
                await this.showToast("Archivo inválido. Por favor selecciona otra imagen", "danger");
                return;
            }

            // Verificar tipo de archivo
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!validTypes.includes(this.archivo.type)) {
                await this.showToast("Solo se permiten imágenes JPG, JPEG o PNG", "warning");
                return;
            }

            // Validar campos obligatorios del usuario antes de enviar
            if (!this.user.id || !this.user.name || !this.user.username || !this.user.email) {
                await this.showToast("Error: Datos de usuario incompletos", "danger");
                return;
            }

            this.uploadingImage = true;

            try {
                const formData = new FormData();

                // IMPORTANTE: Laravel requiere _method=PUT para procesar FormData como PUT
                formData.append('_method', 'PUT');

                // IMPORTANTE: El backend requiere todos los campos obligatorios
                formData.append('id', this.user.id.toString());
                formData.append('name', this.user.name);
                formData.append('username', this.user.username);
                formData.append('email', this.user.email);

                // Campos opcionales - solo agregar si tienen valor
                if (this.user.profession && this.user.profession.trim() !== '') {
                    formData.append('profession', this.user.profession);
                }
                if (this.user.universidad_id) {
                    formData.append('universidad_id', this.user.universidad_id.toString());
                }
                if (this.user.carrera_id) {
                    formData.append('carrera_id', this.user.carrera_id.toString());
                }
                if (this.user.gender && this.user.gender.trim() !== '') {
                    formData.append('gender', this.user.gender);
                }

                // Agregar la imagen con los 3 parámetros
                const fileName = this.archivo.name || 'perfil.jpg';
                formData.append('imagen', this.archivo, fileName);

                const updatedUser = await AuthService.updateProfileImage(formData);

                // Actualizar usuario en la sesión
                if (updatedUser) {
                    const userData = updatedUser.data || updatedUser;
                    const rememberMe = localStorage.getItem("remember_me") === "true";
                    AuthService.setUser(userData, rememberMe);

                    // Actualizar usuario actual y viewer
                    this.user = { ...userData };
                    this.user_viewer = { ...userData };
                }

                await this.showToast("Foto de perfil actualizada", "success");
                this.closeImagePicker();

                // Limpiar archivo y preview
                this.archivo = null;
                this.imagenPreview = null;
            } catch (error) {
                let errorMessage = "Error al actualizar la foto";

                if (error.response?.status === 422) {
                    if (error.response.data?.errors) {
                        const errors = error.response.data.errors;
                        if (errors.imagen) {
                            const imgErrors = Array.isArray(errors.imagen) ? errors.imagen : [errors.imagen];
                            errorMessage = imgErrors.join(', ');
                        } else {
                            const errorsList = Object.entries(errors)
                                .map(([field, messages]) => {
                                    const msgArray = Array.isArray(messages) ? messages : [messages];
                                    return `${field}: ${msgArray.join(', ')}`;
                                })
                                .join('\n');
                            errorMessage = `Errores de validación:\n${errorsList}`;
                        }
                    } else if (error.response.data?.message) {
                        errorMessage = error.response.data.message;
                    }
                } else if (error.response?.status === 413) {
                    errorMessage = 'La imagen es demasiado grande. Máximo 20MB';
                } else if (error.response?.status === 401) {
                    errorMessage = 'Sesión expirada. Por favor inicia sesión nuevamente';
                } else if (error.response?.data?.message) {
                    errorMessage = error.response.data.message;
                } else if (error.message) {
                    errorMessage = error.message;
                } await this.showToast(errorMessage, "danger");
            } finally {
                this.uploadingImage = false;
            }
        },

        // ===== EDITAR PERFIL =====

        async openSettings() {
            try {
                // Solo copiar los campos que se pueden editar
                this.formData = {
                    id: this.user.id,
                    name: this.user.name || '',
                    username: this.user.username || '',
                    email: this.user.email || '',
                    profession: this.user.profession || '',
                    gender: this.user.gender || '',
                    universidad_id: this.user.universidad_id
                        ? Number(this.user.universidad_id)
                        : this.user.universidad?.id ? Number(this.user.universidad.id) : null,
                    carrera_id: this.user.carrera_id
                        ? Number(this.user.carrera_id)
                        : this.user.carrera?.id ? Number(this.user.carrera.id) : null,
                };
                this.showSettingsModal = true;
            } catch (error) {
                console.error("Error al abrir configuración:", error);
            }
        },

        closeSettings() {
            this.showSettingsModal = false;
        },

        async updateProfile() {
            // Validar campos obligatorios
            if (!this.formData.name || !this.formData.username || !this.formData.email) {
                await this.showToast("Por favor completa los campos obligatorios", "warning");
                return;
            }

            // Validar email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(this.formData.email)) {
                await this.showToast("Por favor ingresa un email válido", "warning");
                return;
            }

            this.savingProfile = true;

            try {
                const updatedUser = await AuthService.updateProfile(this.formData);

                if (updatedUser) {
                    const userData = updatedUser.data || updatedUser;
                    
                    // Actualizar usuario en la sesión
                    this.user = { ...userData };
                    this.user_viewer = { ...userData };
                    
                    // Recargar universidades por si cambió la relación
                    await this.loadUniversidades();
                }

                await this.showToast("Perfil actualizado correctamente", "success");
                this.closeSettings();
            } catch (error) {
                let errorMessage = "Error al actualizar el perfil";

                if (error.response?.status === 422) {
                    // Errores de validación
                    if (error.response.data?.errors) {
                        const errors = error.response.data.errors;
                        const firstError = Object.values(errors)[0];
                        errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
                    } else if (error.response.data?.message) {
                        errorMessage = error.response.data.message;
                    }
                } else if (error.response?.data?.message) {
                    errorMessage = error.response.data.message;
                }

                await this.showToast(errorMessage, "danger");
            } finally {
                this.savingProfile = false;
            }
        },

        // ===== SEGUIR/DEJAR DE SEGUIR =====

        async handleFollow() {
            // TODO: Implementar funcionalidad de seguir
            this.isFollowing = !this.isFollowing;
            await this.showToast(
                this.isFollowing ? "Ahora sigues a este usuario" : "Dejaste de seguir",
                "success"
            );
        },

        // ===== MODALES =====

        openFollowers() {
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

        toggleMenu() {
            this.isMenuOpen = !this.isMenuOpen;
        },

        closeMenu() {
            this.isMenuOpen = false;
        },

        openImagePicker() {
            if (this.isMe) {
                this.isImagePickerOpen = true;
            }
        },

        closeImagePicker() {
            this.isImagePickerOpen = false;
            this.imagenPreview = null;
            this.archivo = null;
        },

        // ===== HELPERS DE MÚSICA =====

        /**
         * Obtiene la URL de la portada de un post de música
         * Busca en múltiples campos posibles del backend
         */
        getMusicCover(post) {
            if (!post) return null;

            // Lista de campos posibles donde podría estar la imagen
            // IMPORTANTE: Los campos del backend tienen prefijo 'itunes_'
            const imageFields = [
                'itunes_artwork_url',   // ✅ Campo principal (600x600 de alta calidad)
                'artwork_url',          // Fallback sin prefijo
                'artworkUrl100',        // iTunes API directo (100x100)
                'artworkUrl60',         // iTunes API directo (60x60)
                'track_image',          // Campo personalizado alternativo
                'album_image',          // Campo personalizado alternativo
                'cover_url',            // Campo personalizado alternativo
                'imagen_url',           // Si tiene imagen adjunta
                'image'                 // Campo genérico
            ];

            // Buscar la primera imagen disponible
            for (const field of imageFields) {
                if (post[field] && typeof post[field] === 'string' && post[field].trim() !== '') {
                    let imageUrl = post[field];

                    // Si es artworkUrl60 o artworkUrl100, mejorar a 600x600
                    if (field === 'artworkUrl60' && imageUrl.includes('60x60')) {
                        imageUrl = imageUrl.replace('60x60bb', '600x600bb');
                    }
                    if (field === 'artworkUrl100' && imageUrl.includes('100x100')) {
                        imageUrl = imageUrl.replace('100x100bb', '600x600bb');
                    }

                    return imageUrl;
                }
            }

            return null;
        },

        /**
         * Maneja el error cuando una imagen no se puede cargar
         */
        handleImageError(event, post) {
            // Ocultar la imagen y mostrar el icono
            if (event.target) {
                event.target.style.display = 'none';
            }
        },

        // ===== NAVEGACIÓN =====

        async handleLogout() {
            try {
                this.closeMenu();
                await AuthService.logout();
                await new Promise(resolve => setTimeout(resolve, 100));
                window.location.href = "/welcome";
            } catch (error) {
                console.error("Error al cerrar sesión:", error);
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = "/welcome";
            }
        },

        goToPostDetail(postId) {
            if (!postId) return;
            this.$router.push(`/tabs/post/${postId}`);
        },

        goToUserProfile(user) {
            this.closeFollowers();
            this.closeFollowing();

            const identifier = user.username || user.id;
            if (!identifier) return;

            const currentRouteUsername = this.$route.params.username || "me";
            const isSameAsViewer = this.user_viewer?.username &&
                (identifier === this.user_viewer.username || identifier === this.user_viewer.id);
            const isSameAsCurrentProfile = identifier === currentRouteUsername ||
                (this.user.username && identifier === this.user.username) ||
                (this.user.id && identifier === this.user.id);

            if (isSameAsCurrentProfile) return;

            if (isSameAsViewer) {
                this.$router.push("/tabs/perfil/me");
            } else {
                this.$router.push(`/tabs/perfil/${identifier}`);
            }
        },

        // ===== UTILIDADES =====

        getFileName(filePath) {
            if (!filePath) return "";
            const parts = filePath.split("/");
            return parts[parts.length - 1];
        },

        formatDate(dateString) {
            if (!dateString) return "";
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        },

        async showToast(message, color = "primary") {
            const toast = await toastController.create({
                message,
                duration: 2000,
                color,
                position: "top",
            });
            await toast.present();
        },
    },
};
</script>

<style scoped>
/* Header */
ion-header ion-toolbar {
    --background: var(--app-background);
    --color: var(--app-text);
    --border-color: var(--app-border);
}

.logo-container {
    display: flex;
    align-items: center;
    padding-left: 16px;
}

.header-logo {
    height: 40px;
    width: auto;
    object-fit: contain;
}

.header-icon {
    width: 22px;
    height: 22px;
    font-size: 22px;
    color: #6B7280 !important;
}

ion-header ion-button:hover .header-icon {
    color: #8A2BE2 !important;
}

.username-title {
    text-align: center;
    font-size: 14px;
    font-weight: 600;
    padding: 0;
}

.username-purple {
    color: #8A2BE2;
    font-size: 14px;
    font-weight: 600;
}

/* Content */
ion-content {
    --background: var(--app-background);
}

/* Profile Section */
.profile-section {
    background: var(--app-background);
    padding: 24px 16px 16px 16px;
    max-width: 600px;
    margin: 0 auto;
}

.profile-header-row {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    position: relative;
    margin-bottom: 12px;
}

.profile-avatar {
    width: 80px;
    height: 80px;
    position: relative;
    transition: opacity 0.3s;
}

.profile-avatar:hover {
    opacity: 0.9;
}

.profile-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.profile-avatar-icon {
    width: 80px !important;
    height: 80px !important;
    font-size: 80px !important;
    color: var(--ion-color-medium);
}

.avatar-overlay {
    position: absolute;
    bottom: 0;
    right: 0;
    background: var(--ion-color-primary);
    border-radius: 50%;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--app-background);
}

.avatar-overlay ion-icon {
    font-size: 16px;
}

.menu-button-inline {
    position: absolute;
    right: 16px;
    top: 0;
    --padding-start: 8px;
    --padding-end: 8px;
}

/* Profile Info */
.profile-name {
    margin-top: 0;
    margin-bottom: 4px;
    font-size: 20px;
    font-weight: 600;
    color: var(--ion-text-color);
}

.profile-description {
    font-size: 12px;
    color: var(--ion-text-color-secondary);
    margin: 0;
    line-height: 1.5;
}

/* Action Buttons */
.action-buttons {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-top: 16px;
}

.action-buttons ion-button {
    text-transform: none;
    font-weight: 600;
    min-width: 120px;
}

/* Stats */
.stats-grid {
    margin-top: 24px;
    margin-bottom: 0;
    padding: 0;
}

.stat-number {
    font-size: 16px;
    font-weight: 600;
    color: var(--ion-text-color);
    margin-bottom: 4px;
}

.stat-label {
    font-size: 12px;
    color: var(--ion-text-color-secondary);
}

.clickable {
    cursor: pointer;
    transition: transform 0.2s;
}

.clickable:active {
    transform: scale(0.95);
}

/* Divider */
.divider {
    height: 1px;
    background-color: var(--ion-border-color);
    margin: 16px 0;
}

/* Tabs */
ion-segment {
    --background: var(--app-background);
    margin-bottom: 16px;
}

ion-segment-button {
    text-transform: none;
    font-size: 14px;
    font-weight: 500;
    min-height: 60px;
}

.tab-label {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
}

.tab-label ion-icon {
    font-size: 20px;
}

.tab-label span {
    font-size: 11px;
}

/* Tabs Content */
.tabs-content {
    padding: 8px 0;
    min-height: 200px;
}

/* Post Cards */
.post-card {
    background-color: var(--ion-card-background);
    border-radius: 12px;
    height: 120px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.post-card:active {
    transform: scale(0.95);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.post-thumbnail {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.post-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 8px;
    height: 100%;
}

.post-title {
    margin: 8px 0 0 0;
    font-size: 10px;
    text-align: center;
    color: var(--ion-text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.post-date {
    font-size: 11px;
    color: var(--ion-text-color-step-400);
}

/* Music Cards */
.music-card {
    background-color: var(--ion-card-background);
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.music-card:active {
    transform: scale(0.95);
}

/* Post Cards (Imagen/Texto) */
.post-card {
    background-color: var(--ion-card-background);
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    height: 100%;
}

.post-card:active {
    transform: scale(0.95);
}

.post-thumbnail {
    width: 100%;
    height: 140px;
    object-fit: cover;
}

.post-placeholder {
    width: 100%;
    height: 140px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: var(--ion-color-light);
    padding: 12px;
}

.post-placeholder ion-icon {
    font-size: 40px !important;
    margin-bottom: 8px;
    opacity: 0.5;
}

.post-placeholder .post-title {
    margin: 0;
    font-size: 12px;
    font-weight: 500;
    color: var(--ion-text-color-secondary);
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.post-info {
    padding: 12px;
}

.post-info .post-title {
    margin: 0 0 4px 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--ion-text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.post-info .post-text {
    margin: 0;
    font-size: 11px;
    color: var(--ion-text-color-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

/* File Cards (Archivos) */
.file-card {
    background-color: var(--ion-card-background);
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    height: 100%;
}

.file-card:active {
    transform: scale(0.95);
}

.file-icon-container {
    width: 100%;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--ion-color-primary-tint), var(--ion-color-primary));
}

.file-icon-container ion-icon {
    font-size: 48px !important;
    color: white;
}

.file-info {
    padding: 12px;
}

.file-title {
    margin: 0 0 4px 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--ion-text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.file-name {
    margin: 0;
    font-size: 11px;
    color: var(--ion-text-color-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* Music Cards */
.music-card {
    background-color: var(--ion-card-background);
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.music-card:active {
    transform: scale(0.95);
}

.music-thumbnail {
    width: 100%;
    height: 120px;
    object-fit: cover;
}

.music-icon {
    width: 100%;
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--ion-color-light);
    font-size: 48px !important;
}

.music-info {
    padding: 12px;
}

.music-title {
    margin: 0 0 4px 0;
    font-size: 13px;
    font-weight: 600;
    color: var(--ion-text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.music-artist {
    margin: 0;
    font-size: 11px;
    color: var(--ion-text-color-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* Empty State */
.empty-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: var(--ion-text-color-secondary);
}

.empty-message ion-icon {
    font-size: 64px;
    margin-bottom: 16px;
    opacity: 0.5;
}

.empty-message p {
    margin: 0;
    font-size: 14px;
}

/* Loading */
.loading-more {
    display: flex;
    justify-content: center;
    padding: 20px;
}

/* Image Picker Modal */
.preview-container {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 16px;
}

.preview-container img {
    width: 100%;
    height: auto;
    display: block;
    border-radius: 12px;
}

.remove-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    --background: rgba(0, 0, 0, 0.6);
    --border-radius: 50%;
}

.upload-box {
    border: 2px dashed var(--ion-border-color);
    border-radius: 12px;
    padding: 48px 24px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s;
    background: var(--ion-card-background);
}

.upload-box:hover {
    border-color: var(--ion-color-primary);
    background: var(--ion-color-light);
}

.upload-box ion-icon {
    font-size: 64px;
    margin-bottom: 16px;
}

.upload-box h3 {
    margin: 0 0 8px 0;
    font-size: 16px;
    color: var(--ion-text-color);
}

.upload-box p {
    font-size: 12px;
    color: var(--ion-text-color-secondary);
    margin: 4px 0;
}

/* Dark Mode Adjustments */
.ion-palette-dark .post-card,
.ion-palette-dark .music-card {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* Responsive */
@media (min-width: 768px) {
    .profile-section {
        padding: 32px 24px;
    }

    .profile-avatar {
        width: 120px;
        height: 120px;
    }

    .profile-avatar-icon {
        width: 120px !important;
        height: 120px !important;
        font-size: 120px !important;
    }
}
</style>
