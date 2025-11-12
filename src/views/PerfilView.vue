<template>
  <ion-page>
    <!-- Header del perfil -->
    <ion-header>
      <ion-toolbar color="light">
        <ion-grid class="header-grid">
          <ion-row class="ion-align-items-center ion-justify-content-between">
            <ion-col size="auto">
              <img src="/LaU.png" alt="LaÚ" class="header-logo" />
            </ion-col>
            <ion-col size="auto">
              <ion-text class="username-purple">
                <strong>@{{ user.username }}</strong>
              </ion-text>
            </ion-col>
            <ion-col size="auto">
              <ion-button fill="clear">
                <ion-icon :icon="notifications" color="medium"></ion-icon>
              </ion-button>
            </ion-col>
          </ion-row>
        </ion-grid>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-background-white">
      <!-- Error message -->
      <ion-card v-if="error && !loading" color="danger">
        <ion-card-content>
          <p>{{ error }}</p>
        </ion-card-content>
      </ion-card>

      <!-- Loading -->
      <div v-if="loading" class="loading-container">
        <ion-spinner name="crescent"></ion-spinner>
        <ion-text>
          <p>Cargando perfil...</p>
        </ion-text>
      </div>

      <!-- Perfil de usuario -->
      <div v-if="!loading" class="profile-section ion-text-center ion-padding">
        <!-- Avatar y botón de menú -->
        <div class="profile-header-row">
          <ion-avatar class="profile-avatar">
            <img v-if="user.imagen_url" :src="user.imagen_url" alt="Profile Picture" />
            <ion-icon v-else :icon="personCircle" class="profile-avatar-icon"></ion-icon>
          </ion-avatar>
          <ion-button fill="clear" @click="openMenu" id="open-menu-button" class="menu-button-inline">
            <ion-icon :icon="ellipsisVerticalOutline" color="medium"></ion-icon>
          </ion-button>
        </div>

        <!-- Nombre y descripción -->
        <h3 class="profile-name">{{ user.name }}</h3>
        <p class="profile-description">
          {{ universidad?.nombre || user.universidad?.nombre || 'Sin información académica' }}
          <br v-if="(universidad?.nombre || user.universidad?.nombre) && (carrera?.nombre || user.carrera?.nombre)" />
          {{ carrera?.nombre || user.carrera?.nombre || '' }}
        </p>

        <!-- Botón Seguir / Editar -->
        <div class="action-buttons">
          <ion-button v-if="!isMe" color="primary">Seguir</ion-button>
          <ion-button v-else color="primary" @click="openSettings">Editar</ion-button>
        </div>

        <!-- Contadores -->
        <ion-grid class="stats-grid">
          <ion-row class="ion-text-center">
            <ion-col size="4">
              <div class="stat-number">{{ posts.length }}</div>
              <div class="stat-label">Publicaciones</div>
            </ion-col>
            <ion-col size="4" class="clickable" @click="openFollowers">
              <div class="stat-number">{{ seguidores.length }}</div>
              <div class="stat-label">Seguidores</div>
            </ion-col>
            <ion-col size="4" class="clickable" @click="openFollowing">
              <div class="stat-number">{{ siguiendo.length }}</div>
              <div class="stat-label">Seguidos</div>
            </ion-col>
          </ion-row>
        </ion-grid>

        <!-- Divider -->
        <div class="divider"></div>

        <!-- Tabs -->
        <ion-segment v-model="selectedTab" mode="md" color="primary">
          <ion-segment-button value="1">
            <ion-label class="tab-label">
              <ion-icon :icon="grid"></ion-icon>
              <span>Posts</span>
            </ion-label>
          </ion-segment-button>
          <ion-segment-button value="2">
            <ion-label class="tab-label">
              <ion-icon :icon="folderOutline"></ion-icon>
              <span>Folders</span>
            </ion-label>
          </ion-segment-button>
          <ion-segment-button value="3">
            <ion-label class="tab-label">
              <ion-icon :icon="musicalNoteOutline"></ion-icon>
              <span>Playlist</span>
            </ion-label>
          </ion-segment-button>
        </ion-segment>

        <!-- Contenido de los tabs -->
        <div class="tabs-content">
          <!-- Posts Tab (Imagen/Texto) -->
          <div v-if="selectedTab === '1'">
            <ion-grid>
              <ion-row>
                <ion-col v-for="post in postsImagenTexto" :key="post.id || post._id || post.titulo" size="6">
                  <div class="post-card" @click="goToPostDetail(post.id || post._id)">
                    <img v-if="post.imagen_url" :src="post.imagen_url" class="post-thumbnail" :alt="post.titulo" />
                    <ion-icon v-else :icon="documentOutline" size="large" color="medium"></ion-icon>
                    <p class="post-title">{{ post.titulo || 'Sin título' }}</p>
                  </div>
                </ion-col>
              </ion-row>
            </ion-grid>
            <div v-if="postsImagenTexto.length === 0" class="empty-message">Aún no hay publicaciones</div>
          </div>

          <!-- Folders Tab (Archivos) -->
          <div v-else-if="selectedTab === '2'">
            <ion-grid>
              <ion-row>
                <ion-col v-for="post in postsFolders" :key="post.id || post._id || post.titulo" size="6">
                  <div class="post-card" @click="goToPostDetail(post.id || post._id)">
                    <ion-icon :icon="folderOutline" size="large" color="medium"></ion-icon>
                    <p class="post-title">{{ post.titulo || 'Archivo' }}</p>
                    <p class="post-subtitle" v-if="post.archivo">{{ getFileName(post.archivo) }}</p>
                  </div>
                </ion-col>
              </ion-row>
            </ion-grid>
            <div v-if="postsFolders.length === 0" class="empty-message">Sin archivos todavía</div>
          </div>

          <!-- Playlist Tab (Música) -->
          <div v-else>
            <ion-grid>
              <ion-row>
                <ion-col v-for="post in postsMusicaPlaylist" :key="post.id || post._id || post.track_name" size="6">
                  <div class="post-card" @click="goToPostDetail(post.id || post._id)">
                    <img v-if="post.track_image" :src="post.track_image" class="post-thumbnail"
                      :alt="post.track_name" />
                    <ion-icon v-else :icon="musicalNoteOutline" size="large" color="medium"></ion-icon>
                    <p class="post-title">{{ post.track_name || post.titulo || 'Sin título' }}</p>
                    <p class="post-subtitle" v-if="post.artist_name">{{ post.artist_name }}</p>
                  </div>
                </ion-col>
              </ion-row>
            </ion-grid>
            <div v-if="postsMusicaPlaylist.length === 0" class="empty-message">No hay playlists creadas</div>
          </div>
        </div>

        <!-- Infinite Scroll -->
        <ion-infinite-scroll v-if="!loading && hasMorePages" @ionInfinite="loadMorePosts" threshold="100px">
          <ion-infinite-scroll-content loading-spinner="bubbles"
            loading-text="Cargando más posts..."></ion-infinite-scroll-content>
        </ion-infinite-scroll>
      </div>

      <!-- Modal Settings -->
      <ion-modal :is-open="showSettingsModal" @didDismiss="closeSettings">
        <ion-content class="settings-modal-content">
          <h2 class="modal-title">Editar Perfil</h2>
          <form @submit.prevent="updateProfile" class="settings-form">
            <ion-input label="Nombre completo" label-placement="stacked" v-model="formData.name" />
            <ion-input label="Username" label-placement="stacked" v-model="formData.username" />
            <ion-input type="email" label="Correo" label-placement="stacked" v-model="formData.email" />
            <ion-input label="Profesión" label-placement="stacked" v-model="formData.profession" />
            <ion-item>
              <ion-label>Universidad</ion-label>
              <ion-select v-model="formData.universidad_id" placeholder="Selecciona una Universidad">
                <ion-select-option v-for="uni in universidades" :key="uni.id" :value="Number(uni.id)">{{ uni.nombre
                }}</ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item>
              <ion-label>Carrera</ion-label>
              <ion-select v-model="formData.carrera_id" placeholder="Selecciona una Carrera">
                <ion-select-option v-for="carr in carreras" :key="carr.id" :value="Number(carr.id)">{{ carr.nombre
                }}</ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item>
              <ion-label>Género</ion-label>
              <ion-select v-model="formData.gender" placeholder="Selecciona un género">
                <ion-select-option value="Male">Male</ion-select-option>
                <ion-select-option value="Female">Female</ion-select-option>
              </ion-select>
            </ion-item>

            <ion-button expand="block" type="submit">Guardar Cambios</ion-button>
            <ion-button expand="block" fill="clear" color="medium" @click="closeSettings">Cancelar</ion-button>
          </form>
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
              <ion-avatar slot="start"><img src="https://www.gravatar.com/avatar/?d=mp&f=y" /></ion-avatar>
              <ion-label>No hay seguidores</ion-label>
            </ion-item>
            <ion-item button v-for="(f, i) in seguidores" :key="i" @click="goToUserProfile(f)">
              <ion-avatar slot="start"><img
                  :src="f.imagen_url || 'https://www.gravatar.com/avatar/?d=mp&f=y'" /></ion-avatar>
              <ion-label>
                <h3>{{ f.name || f.username || 'Usuario' }}</h3>
                <p class="ion-text-wrap">@{{ f.username || '' }}</p>
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
              <ion-avatar slot="start"><img src="https://www.gravatar.com/avatar/?d=mp&f=y" /></ion-avatar>
              <ion-label>No sigue a nadie</ion-label>
            </ion-item>
            <ion-item button v-for="(f, i) in siguiendo" :key="i" @click="goToUserProfile(f)">
              <ion-avatar slot="start"><img
                  :src="f.imagen_url || 'https://www.gravatar.com/avatar/?d=mp&f=y'" /></ion-avatar>
              <ion-label>
                <h3>{{ f.name || f.username || 'Usuario' }}</h3>
                <p class="ion-text-wrap">@{{ f.username || '' }}</p>
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
  IonInput,
  IonSelect,
  IonSelectOption,
} from "@ionic/vue";

import {
  ellipsisVerticalOutline,
  grid,
  folderOutline,
  musicalNoteOutline,
  logOutOutline,
  personCircle,
  documentOutline,
  notifications,
} from "ionicons/icons";

import { UniversidadService } from "@/services/universidad";
import postsService from "@/services/postsService";
import { AuthService } from "@/services/auth";

export default {
  name: "PerfilView",
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
    IonInput,
    IonSelect,
    IonSelectOption,
  },
  data() {
    return {
      posts: [],
      seguidores: [],
      siguiendo: [],
      canciones: [],
      archivos: [],
      universidad: null,
      carrera: null,
      universidades: [],
      carreras: [],
      loading: false,
      isMe: true,
      error: null,
      selectedTab: "1",
      currentPage: 1,
      lastPage: 1,
      hasMorePages: false,
      isDarkMode: false,
      user: { imagen_url: null, name: "Usuario", username: "usuario", id: null },
      user_viewer: { imagen_url: null, name: "Usuario", username: "usuario", id: null },
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
      isAuthenticated: false,
      // icons
      ellipsisVerticalOutline,
      grid,
      folderOutline,
      musicalNoteOutline,
      logOutOutline,
      personCircle,
      documentOutline,
      notifications,
      // modals/menu
      showFollowersModal: false,
      showFollowingModal: false,
      showSettingsModal: false,
      isMenuOpen: false,
    };
  },

  async created() {
    this.isAuthenticated = AuthService.isAuthenticated();
    await this.loadCurrentUser();
    this.loadDarkModePreference();

    // Si user cargado con id, obtener datos del perfil
    if (this.user && (this.user.id || this.user.username)) {
      await this.getProfileData();
    }
  },

  watch: {
    // Observar cambios en el parámetro de ruta para recargar el perfil
    '$route.params.username': {
      async handler(newUsername, oldUsername) {
        if (newUsername !== oldUsername) {
          // Resetear estado
          this.posts = [];
          this.seguidores = [];
          this.siguiendo = [];
          this.error = null;
          // Recargar usuario y datos
          await this.loadCurrentUser();
          if (this.user && (this.user.id || this.user.username)) {
            await this.getProfileData();
          }
        }
      }
    }
  },

  methods: {
    // carga el usuario actual y decide si mostrar perfil propio o ajeno según ruta
    async loadCurrentUser() {
      try {
        const localUser = AuthService.getUser();
        if (localUser) {
          this.user_viewer = localUser;
        }

        // validar token y obtener user actualizado si es posible
        try {
          const apiUser = await AuthService.fetchProfile();
          if (apiUser) {
            this.user_viewer = apiUser;
          }
        } catch (apiError) {
          console.warn("No se pudo validar el token con la API:", apiError);
          if (apiError.response?.status === 401) {
            await AuthService.logout();
            this.$router.replace("/login");
            return;
          } else if (!localUser) {
            this.$router.replace("/login");
            return;
          }
        }

        // determinar parámetro de ruta
        const routeParam = (this.$route.params.username || "me").toString().trim();
        const paramLower = routeParam.toLowerCase();

        // si es 'me' o coincide con el viewer => perfil propio
        if (paramLower === "me" || (this.user_viewer.username && paramLower === this.user_viewer.username.toLowerCase())) {
          this.isMe = true;
          this.user = this.user_viewer;
          await this.loadUniversidades();
          await this.getCarrera();
        } else {
          // perfil ajeno: fetch by username
          this.isMe = false;
          try {
            const response = await AuthService.fetchForeignProfile(routeParam);
            // fetchForeignProfile devuelve res.data que puede tener estructura variable
            // Normalizar la estructura: puede venir como { data: {...} } o directamente el objeto
            this.user = response.data || response;

            // Cargar universidad y carrera también para perfiles ajenos
            await this.loadUniversidades();
            await this.getCarrera();
          } catch (err) {
            console.error("[PERFIL] Error al obtener perfil foráneo:", err);
            if (err.response?.status === 401) {
              await AuthService.logout();
              this.$router.replace("/login");
              return;
            }
            this.error = "No se pudo cargar el perfil solicitado.";
          }
        }
      } catch (error) {
        console.error("[PERFIL] Error cargando usuario:", error);
        if (!AuthService.isAuthenticated()) {
          this.$router.replace("/login");
        }
      }
    },

    async loadUniversidades() {
      try {
        const response = await UniversidadService.getUniversidades();
        this.universidades = response.data || [];
        // Buscar la universidad del usuario actual
        if (this.user.universidad_id) {
          this.universidad = this.universidades.find((u) => u.id === this.user.universidad_id) || null;
        } else if (this.user.universidad?.id) {
          this.universidad = this.universidades.find((u) => u.id === this.user.universidad.id) || null;
        }
      } catch (error) {
        console.error("Error al cargar universidades:", error);
      }
    },

    async getCarrera() {
      try {
        const response = await UniversidadService.getAllCarreras();
        this.carreras = response.data || [];
        // Buscar la carrera del usuario actual
        if (this.user.carrera_id) {
          this.carrera = this.carreras.find((c) => c.id === this.user.carrera_id) || null;
        } else if (this.user.carrera?.id) {
          this.carrera = this.carreras.find((c) => c.id === this.user.carrera.id) || null;
        }
      } catch (error) {
        console.error("Error al cargar carreras:", error);
      }
    },

    loadDarkModePreference() {
      const savedMode = localStorage.getItem("darkMode");
      if (savedMode !== null) this.isDarkMode = savedMode === "true";
      else this.isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
      this.applyDarkMode();
    },

    applyDarkMode() {
      document.documentElement.classList.toggle("ion-palette-dark", this.isDarkMode);
      if (this.isDarkMode) {
        document.documentElement.style.setProperty("--ion-background-color", "#121212");
        document.documentElement.style.setProperty("--ion-card-background", "#1E1E1E");
      } else {
        document.documentElement.style.setProperty("--ion-background-color", "#F3F4F6");
        document.documentElement.style.setProperty("--ion-card-background", "#FFFFFF");
      }
    },

    // posts / paginación
    async fetchPosts(page = 1) {
      if (page === 1) this.loading = true;
      this.error = null;
      try {
        // usar ID o username según lo que tenga user
        const userId = this.user.id || this.user.username;
        const postsResponse = await AuthService.getUserPosts(userId, page);

        // normalizar estructura
        let postsData = [];
        if (Array.isArray(postsResponse)) postsData = postsResponse;
        else if (postsResponse?.data) {
          postsData = Array.isArray(postsResponse.data) ? postsResponse.data : postsResponse.data.data || [];
        } else if (postsResponse?.data?.data) postsData = postsResponse.data.data;

        // paginación posible
        if (postsResponse?.data?.current_page || postsResponse?.current_page) {
          const pag = postsResponse.data || postsResponse;
          this.currentPage = pag.current_page || 1;
          this.lastPage = pag.last_page || 1;
          this.hasMorePages = this.currentPage < this.lastPage;
        } else {
          this.currentPage = page;
          this.lastPage = 1;
          this.hasMorePages = false;
        }

        if (page === 1) this.posts = postsData;
        else this.posts = [...this.posts, ...postsData];
      } catch (err) {
        console.error("[PERFIL] Error al obtener posts:", err);
        this.error = err.message || "Error al cargar posts";
        if (page === 1) this.posts = [];
      } finally {
        if (page === 1) this.loading = false;
      }
    },

    async loadMorePosts(event) {
      if (this.hasMorePages) {
        await this.fetchPosts(this.currentPage + 1);
      }
      event.target.complete();
    },

    // Cargar seguidores/seguidos y posts
    async getProfileData() {
      try {
        this.loading = true;
        const userId = this.user.id || this.user.username;

        const [followersResponse, followingResponse] = await Promise.all([
          AuthService.getFollowers(userId),
          AuthService.getFollowing(userId),
        ]);

        // Normalizar arrays de seguidores
        // Laravel devuelve paginación: { success: true, data: { data: [...], current_page: 1, ... } }
        if (followersResponse?.success && followersResponse?.data) {
          // Si tiene success y data (respuesta paginada de Laravel)
          if (Array.isArray(followersResponse.data.data)) {
            this.seguidores = followersResponse.data.data;
          } else if (Array.isArray(followersResponse.data)) {
            this.seguidores = followersResponse.data;
          } else {
            this.seguidores = [];
          }
        } else if (followersResponse?.data) {
          // Si solo tiene data
          if (Array.isArray(followersResponse.data.data)) {
            this.seguidores = followersResponse.data.data;
          } else if (Array.isArray(followersResponse.data)) {
            this.seguidores = followersResponse.data;
          } else {
            this.seguidores = [];
          }
        } else if (followersResponse?.followers) {
          this.seguidores = followersResponse.followers;
        } else if (Array.isArray(followersResponse)) {
          this.seguidores = followersResponse;
        } else {
          this.seguidores = [];
        }

        // Normalizar arrays de seguidos (misma lógica)
        if (followingResponse?.success && followingResponse?.data) {
          // Si tiene success y data (respuesta paginada de Laravel)
          if (Array.isArray(followingResponse.data.data)) {
            this.siguiendo = followingResponse.data.data;
          } else if (Array.isArray(followingResponse.data)) {
            this.siguiendo = followingResponse.data;
          } else {
            this.siguiendo = [];
          }
        } else if (followingResponse?.data) {
          // Si solo tiene data
          if (Array.isArray(followingResponse.data.data)) {
            this.siguiendo = followingResponse.data.data;
          } else if (Array.isArray(followingResponse.data)) {
            this.siguiendo = followingResponse.data;
          } else {
            this.siguiendo = [];
          }
        } else if (followingResponse?.following) {
          this.siguiendo = followingResponse.following;
        } else if (Array.isArray(followingResponse)) {
          this.siguiendo = followingResponse;
        } else {
          this.siguiendo = [];
        }

        // cargar posts
        await this.fetchPosts(1);
      } catch (error) {
        console.error("[PERFIL] Error al cargar datos del perfil:", error);
        this.error = "Error al cargar los datos del perfil";
        this.seguidores = [];
        this.siguiendo = [];
        this.posts = [];
      } finally {
        this.loading = false;
      }
    },

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

    async openSettings() {
      try {
        const [unisResp, carrResp] = await Promise.all([
          UniversidadService.getUniversidades(),
          UniversidadService.getAllCarreras(),
        ]);
        this.universidades = unisResp.data || [];
        this.carreras = carrResp.data || [];
        this.formData = {
          ...this.user,
          universidad_id: this.user.universidad_id ? Number(this.user.universidad_id) : (this.user.universidad?.id ? Number(this.user.universidad.id) : null),
          carrera_id: this.user.carrera_id ? Number(this.user.carrera_id) : (this.user.carrera?.id ? Number(this.user.carrera.id) : null),
        };
        this.showSettingsModal = true;
      } catch (error) {
        console.error("Error al cargar universidades o carreras:", error);
      }
    },
    closeSettings() {
      this.showSettingsModal = false;
    },

    async updateProfile() {
      try {
        const updatedUser = await AuthService.updateProfile(this.formData);

        // Actualizar el usuario local
        if (updatedUser) {
          const rememberMe = localStorage.getItem('remember_me') === 'true';
          AuthService.setUser(updatedUser.data || updatedUser, rememberMe);
        }

        // Recargar datos del perfil
        await this.loadCurrentUser();

        // Recargar universidad y carrera con los nuevos datos
        if (this.isMe) {
          await this.loadUniversidades();
          await this.getCarrera();
        }

        this.closeSettings();
      } catch (error) {
        console.error("Error al actualizar perfil:", error);
        this.error = "Error al actualizar el perfil. Por favor intenta de nuevo.";
      }
    },

    openMenu() {
      this.isMenuOpen = true;
    },
    closeMenu() {
      this.isMenuOpen = false;
    },

    async handleLogout() {
      try {
        this.closeMenu();
        await AuthService.logout();
        await new Promise((resolve) => setTimeout(resolve, 100));
        window.location.href = "/welcome";
      } catch (error) {
        console.error("Error al cerrar sesión:", error);
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
        window.location.href = "/welcome";
      }
    },

    goToPostDetail(postId) {
      if (!postId) return;
      this.$router.push(`/post/${postId}`);
    },

    goToUserProfile(user) {
      this.closeFollowers();
      this.closeFollowing();

      const identifier = user.username || user.id;
      if (!identifier) return;

      // Obtener el username actual de la ruta
      const currentRouteUsername = this.$route.params.username || 'me';

      // Comparar con el usuario actual
      const isSameAsViewer = this.user_viewer.username &&
        (identifier === this.user_viewer.username || identifier === this.user_viewer.id);
      const isSameAsCurrentProfile = identifier === currentRouteUsername ||
        (this.user.username && identifier === this.user.username) ||
        (this.user.id && identifier === this.user.id);

      // Si es el mismo perfil que estamos viendo, no navegar
      if (isSameAsCurrentProfile) return;

      // Si es el perfil del viewer, ir a 'me'
      if (isSameAsViewer) {
        this.$router.push(`/tabs/perfil/me`);
      } else {
        // Navegar al perfil del otro usuario
        this.$router.push(`/tabs/perfil/${identifier}`);
      }
    },

    getFileName(filePath) {
      if (!filePath) return "";
      const parts = filePath.split("/");
      return parts[parts.length - 1];
    },
  },

  computed: {
    postsImagenTexto() {
      return this.posts.filter((post) => {
        const tipo = (post.tipo_contenido || "").toString().toLowerCase();
        return !tipo || tipo === "texto" || tipo === "imagen";
      });
    },
    postsMusicaPlaylist() {
      return this.posts.filter((post) => (post.tipo_contenido || "").toString().toLowerCase() === "musica");
    },
    postsFolders() {
      return this.posts.filter((post) => {
        const tipo = (post.tipo_contenido || "").toString().toLowerCase();
        return tipo === "archivo" || (post.archivo && tipo !== "musica");
      });
    },
  },
};
</script>

<style scoped>
/* Header */
ion-header ion-toolbar {
  --background: white;
  --border-width: 0;
}

.header-grid {
  padding: 0;
  margin: 0;
}

.header-grid ion-row {
  padding: 8px 16px;
}

.header-logo {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.username-purple {
  color: #7b2ff7;
  font-size: 14px;
  font-weight: 600;
}

/* Content background */
ion-content {
  --background: var(--ion-background-color);
}

/* Profile Section */
.profile-section {
  background: var(--ion-card-background);
  padding: 24px 16px 16px 16px;
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
  color: #9ca3af;
}

.menu-button-inline {
  position: absolute;
  right: 16px;
  top: 0;
}

#open-menu-button {
  --padding-start: 8px;
  --padding-end: 8px;
  margin: 0;
}

.profile-name {
  margin-top: 0;
  margin-bottom: 4px;
  font-size: 20px;
  font-weight: 600;
  color: #000000;
}

.profile-description {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.settings-form {
  padding: 25px 25px;
}

.settings-modal-content .modal-title {
  position: relative;
  top: 16px;
  left: 30px;
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
  color: #000000;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
}

.clickable {
  cursor: pointer;
}

/* Divider */
.divider {
  height: 1px;
  background-color: #e5e7eb;
  margin: 16px 0;
}

/* Tabs */
ion-segment {
  --background: white;
  margin-bottom: 8px;
}

ion-segment-button {
  text-transform: none;
  font-size: 14px;
  font-weight: 500;
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
  font-size: 12px;
}

/* Tabs Content */
.tabs-content {
  padding: 8px 0;
}

.post-card {
  background-color: #F3F4F6;
  border-radius: 12px;
  height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px;
  transition: background-color 0.2s;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.post-card:active {
  background-color: #e5e7eb;
}

.post-card ion-icon {
  font-size: 40px;
  color: #6b7280;
  margin-bottom: 8px;
}

.post-thumbnail {
  width: 100%;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 4px;
}

.post-title {
  margin: 0;
  font-size: 11px;
  text-align: center;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.post-subtitle {
  margin: 2px 0 0 0;
  font-size: 9px;
  text-align: center;
  color: #6B7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.empty-message {
  text-align: center;
  padding: 40px 20px;
  color: #6b7280;
  font-style: normal;
}

/* Loading */
.loading-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

/* Modal styles */
ion-modal ion-avatar img {
  object-fit: cover;
}

/* Responsive */
@media (min-width: 600px) {
  .profile-section {
    max-width: 600px;
    margin: 0 auto;
  }
}
</style>