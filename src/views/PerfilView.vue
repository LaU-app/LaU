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
            <img
              v-if="user.imagen_url"
              :src="user.imagen_url"
              alt="Profile Picture"
            />
            <ion-icon
              v-else
              :icon="personCircle"
              class="profile-avatar-icon"
            ></ion-icon>
          </ion-avatar>
          <ion-button
            fill="clear"
            @click="openMenu"
            id="open-menu-button"
            class="menu-button-inline"
          >
            <ion-icon :icon="ellipsisVerticalOutline" color="medium"></ion-icon>
          </ion-button>
        </div>

        <!-- Nombre y descripción -->
        <h3 class="profile-name">{{ user.name }}</h3>
        <p class="profile-description">ITCA FEPADE, Desarrollo de software</p>

        <!-- Botón Seguir -->
        <div class="action-buttons">
          <ion-button color="primary">Seguir</ion-button>
          <!-- Descomentar para agregar botón de mensaje -->
          <!-- <ion-button color="light">Enviar Mensaje</ion-button> -->
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
          <!-- Posts Tab -->
          <div v-if="selectedTab === '1'">
            <ion-grid>
              <ion-row>
                <ion-col v-for="(pub, index) in posts" :key="index" size="4">
                  <div class="post-card">
                    <!-- Si no hay imagen -->
                    <div v-if="!pub.imagen_url" class="no-image">
                      <ion-icon
                        :icon="documentOutline"
                        size="large"
                        color="medium"
                      ></ion-icon>
                    </div>

                    <!-- Si sí hay imagen -->
                    <div v-else class="image-container">
                      <img :src="pub.imagen_url" alt="Publicación" />
                    </div>
                  </div>
                </ion-col>
              </ion-row>
            </ion-grid>

            <div v-if="posts.length === 0" class="empty-message">
              Aún no hay publicaciones
            </div>
          </div>

          <!-- Folders Tab -->
          <div v-else-if="selectedTab === '2'">
            <ion-grid>
              <ion-row>
                <ion-col
                  v-for="(archivo, index) in archivos"
                  :key="index"
                  size="6"
                >
                  <div class="post-card">
                    <ion-icon
                      :icon="folderOutline"
                      size="large"
                      color="medium"
                    ></ion-icon>
                    <p class="post-title">{{ archivo.nombre }}</p>
                  </div>
                </ion-col>
              </ion-row>
            </ion-grid>
            <div v-if="archivos.length === 0" class="empty-message">
              Sin carpetas todavía
            </div>
          </div>

          <!-- Playlist Tab -->
          <div v-else>
            <ion-grid>
              <ion-row>
                <ion-col
                  v-for="(cancion, index) in canciones"
                  :key="index"
                  size="6"
                >
                  <div class="post-card">
                    <ion-icon
                      :icon="musicalNoteOutline"
                      size="large"
                      color="medium"
                    ></ion-icon>
                    <p class="post-title">{{ cancion.titulo }}</p>
                  </div>
                </ion-col>
              </ion-row>
            </ion-grid>
            <div v-if="canciones.length === 0" class="empty-message">
              No hay playlists creadas
            </div>
          </div>
        </div>

        <!-- Infinite Scroll -->
        <ion-infinite-scroll
          v-if="!loading && hasMorePages"
          @ionInfinite="loadMorePosts"
          threshold="100px"
        >
          <ion-infinite-scroll-content
            loading-spinner="bubbles"
            loading-text="Cargando más posts..."
          >
          </ion-infinite-scroll-content>
        </ion-infinite-scroll>
      </div>

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
                <img
                  :src="
                    f.imagen_url || 'https://www.gravatar.com/avatar/?d=mp&f=y'
                  "
                />
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
                <img
                  :src="
                    f.imagen_url || 'https://www.gravatar.com/avatar/?d=mp&f=y'
                  "
                />
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
      <ion-popover
        :is-open="isMenuOpen"
        @didDismiss="closeMenu"
        trigger="open-menu-button"
      >
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
      documentOutline,
      notifications,
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
    this.getProfileData();
    this.loadDarkModePreference();
    this.fetchPosts();
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
    async getProfileData() {
      const response = await AuthService.getFollowers(this.user.id);
      const response2 = await AuthService.getFollowing(this.user.id);
      // Aquí sacas solo el arreglo de followers
      this.seguidores = response.data.followers;
      this.siguiendo = response2.data.following;
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
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Usar window.location para forzar una navegación completa
        // Esto asegura que todo el estado se limpie correctamente
        window.location.href = "/welcome";
      } catch (error) {
        console.error("Error al cerrar sesión:", error);
        // En caso de error, igualmente limpiar y redirigir
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
        window.location.href = "/welcome";
      }
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
  --background: #ffffff;
}

/* Profile Section */
.profile-section {
  background: #ffffff;
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
  background-color: #f3f4f6;
  border-radius: 12px;
  height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px;
  transition: background-color 0.2s;
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

.image-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
}

.no-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
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
