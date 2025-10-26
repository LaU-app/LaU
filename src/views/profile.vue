<template lang="">
  <ion-page>
    <AppHeader
      :isDarkMode="isDarkMode"
      :user="user"
      @toggleDarkMode="toggleDarkMode"
    />
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
                      <img
                        :src="
                          user.imagen_url ||
                          'https://www.gravatar.com/avatar/?d=mp&f=y'
                        "
                        alt="Profile Picture"
                      />
                    </ion-avatar>
                  </ion-col>
                  <ion-col size="7">
                    <div class="username-container">
                      <ion-card-title>{{ user.name }}</ion-card-title>
                      <ion-card-subtitle class="ion-text-capitalize"
                        >@{{ user.username }}</ion-card-subtitle
                      >
                      <ion-card-subtitle
                        style="font-style: italic"
                        class="ion-text-capitalize"
                        >universidad de usuario</ion-card-subtitle
                      >
                    </div>
                  </ion-col>
                  <ion-col size="1">
                    <ion-icon :icon="ellipsisVerticalOutline"></ion-icon>
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
                      <ion-label
                        ><ion-icon :icon="folderOutline"></ion-icon
                      ></ion-label>
                    </ion-segment-button>
                    <ion-segment-button value="3">
                      <ion-label
                        ><ion-icon :icon="musicalNoteOutline"></ion-icon
                      ></ion-label>
                    </ion-segment-button>
                  </ion-segment>
                </ion-row>
              </ion-grid>
            </ion-card-content>
          </ion-card>
        </div>
        <ion-infinite-scroll
          v-if="!loading && hasMorePages"
          @ionInfinite="loadMorePosts"
          threshold="100px"
        >
          <ion-infinite-scroll-content
            loading-spinner="bubbles"
            loading-text="Cargando m�s posts..."
          >
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
              <ion-col
                v-for="(archivo, index) in archivos"
                :key="index"
                size="4"
              >
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
              <ion-col
                v-for="(cancion, index) in canciones"
                :key="index"
                size="4"
              >
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
} from "@ionic/vue";
import AppHeader from "@/components/AppHeader.vue";
import {
  ellipsisVerticalOutline,
  grid,
  folderOutline,
  musicalNoteOutline,
} from "ionicons/icons";

import api from "@/services/api";
import postsService from "@/services/postsService";
export default {
  components: {
    IonPage,
    IonContent,
    IonCard,
    IonIcon,
    IonCardContent,
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
      email: "mateo.canales24@itca.edu.sv",
      password: "itca123",
      ellipsisVerticalOutline,
      grid,
      folderOutline,
      musicalNoteOutline,
      // modals
      showFollowersModal: false,
      showFollowingModal: false,
    };
  },
  name: "profile",
  async created() {
    await this.autoLogin();
    await this.loadCurrentUser();
    this.loadDarkModePreference();
  },
  methods: {
    async loadCurrentUser() {
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) this.user = JSON.parse(userStr);
      } catch (error) {
        // Error silencioso
      }
    },
    async autoLogin() {
      try {
        const response = await api.login(this.email, this.password);
        if (response.data.success && response.data.data) {
          const { token, user } = response.data.data;
          localStorage.setItem("auth_token", token);
          localStorage.setItem("user", JSON.stringify(user));
          this.user = user;
        }
      } catch (error) {
        // Error silencioso
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
  },
};
</script>
<style scoped>
ion-avatar {
  width: 100px;
  height: 100px;
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
.button-row {
  text-align: center;
}
ion-segment-button ion-label {
  display: flex;
  align-items: center;
  justify-content: center; /* opcional */
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
  border-bottom: 2px solid #137fec !important; /* línea azul solo en el activo */
}
ion-segment-button.segment-button-checked ion-icon {
  color: #137fec !important; /* línea azul solo en el activo */
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
/* .tab-content ion-card {
  width: 85vw;
  margin: 0 20px;
} */
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
