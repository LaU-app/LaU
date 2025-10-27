<template>
  <ion-page>
    <ion-content>
      <AppHeader
        :isDarkMode="isDarkMode"
        :user="user"
        @toggleDarkMode="toggleDarkMode"
      />
      <ion-toolbar>
        <ion-title style="font-weight: bold; font-size: 20px">
          Miembros de laÚ
        </ion-title>
        <ion-icon
          @click="goBack"
          style="font-size: 30px"
          :icon="arrowBackOutline"
        ></ion-icon>
      </ion-toolbar>
      <ion-searchbar
        v-model="searchText"
        placeholder="Buscar por Nombre, Universidad..."
        :debounce="200"
        @ionInput="filterUsers($event)"
      ></ion-searchbar>
      <ion-grid class="filters">
        <ion-row>
          <ion-col>
            <ion-select
              :toggle-icon="chevronDownOutline"
              aria-label="ASC/DESC"
              placeholder="Ordenar Por"
              v-model="filters.order"
            >
              <ion-select-option value="ASC">Ascendiente</ion-select-option>
              <ion-select-option value="DESC">Descendiente</ion-select-option>
              <ion-select-option value="ABC">Alfabético</ion-select-option>
              <ion-select-option value="CBA"
                >Alfabético Inverso</ion-select-option
              >
            </ion-select>
          </ion-col>
          <ion-col
            ><ion-select
              :toggle-icon="chevronDownOutline"
              aria-label="Universidad"
              v-model="filters.universidad"
              placeholder="Universidad"
            >
              <ion-select-option value="itca-fepade"
                >ITCA-Fepade</ion-select-option
              >
              <ion-select-option value="ues"
                >Universidad de El Salvador (UES)</ion-select-option
              >
              <ion-select-option value="upes"
                >Universidad Pedagógica de El Salvador (UPES)</ion-select-option
              >
              <ion-select-option value="uca"
                >Universidad Centroamericana José Simeón Cañas
                (UCA)</ion-select-option
              >
              <ion-select-option value="ucd"
                >Universidad Cristiana de El Salvador (UCES)</ion-select-option
              >
              <ion-select-option value="unab"
                >Universidad Nacional Alberto Masferrer
                (UNAB)</ion-select-option
              >
              <ion-select-option value="ufg"
                >Universidad Francisco Gavidia (UFG)</ion-select-option
              >
              <ion-select-option value="umg"
                >Universidad Modular Abierta (UMA)</ion-select-option
              >
              <ion-select-option value="upes"
                >Universidad Politécnica de El Salvador
                (UPES)</ion-select-option
              >
            </ion-select></ion-col
          >
          <ion-col
            ><ion-select
              :toggle-icon="chevronDownOutline"
              aria-label="Carrera"
              placeholder="Carrera"
              v-model="filters.carrera"
            >
              >
              <ion-select-option value="ingenieria_sistemas"
                >Ingeniería en Sistemas</ion-select-option
              >
              <ion-select-option value="administracion_empresas"
                >Administración de Empresas</ion-select-option
              >
              <ion-select-option value="medicina">Medicina</ion-select-option>
              <ion-select-option value="derecho">Derecho</ion-select-option>
              <ion-select-option value="arquitectura"
                >Arquitectura</ion-select-option
              >
              <ion-select-option value="contabilidad"
                >Contabilidad</ion-select-option
              >
              <ion-select-option value="ingenieria_civil"
                >Ingeniería Civil</ion-select-option
              >
              <ion-select-option value="ingenieria_electronica"
                >Ingeniería Electrónica</ion-select-option
              >
              <ion-select-option value="psicologia"
                >Psicología</ion-select-option
              >
              <ion-select-option value="enfermeria"
                >Enfermería</ion-select-option
              >
              <ion-select-option value="comunicacion"
                >Comunicación</ion-select-option
              >
              <ion-select-option value="mercadeo">Mercadeo</ion-select-option>
              <ion-select-option value="ingenieria_industrial"
                >Ingeniería Industrial</ion-select-option
              >
              <ion-select-option value="sociologia"
                >Sociología</ion-select-option
              >
              <ion-select-option value="educacion">Educación</ion-select-option>
            </ion-select></ion-col
          >
        </ion-row>
      </ion-grid>
      <ion-list>
        <ion-item v-for="(u, index) in filteredUsers" :key="index">
          <ion-avatar slot="start">
            <img :src="u.imagen_url" alt="avatar" @error="handleImageError" />
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
          <ion-button id="btnAction" slot="end">Añadir</ion-button>
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
  IonContent,
  IonList,
  IonItem,
  IonAvatar,
  IonLabel,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonNav,
  IonSearchbar,
} from "@ionic/vue";
import AppHeader from "@/components/AppHeader.vue";
import api from "@/services/api";
import { arrowBackOutline, chevronDownOutline } from "ionicons/icons";
import router from "../router";

export default {
  name: "UsersView",
  components: {
    IonPage,
    IonContent,
    IonList,
    IonItem,
    IonAvatar,
    IonLabel,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    AppHeader,
    IonNav,
    IonSearchbar,
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
      arrowBackOutline,
      chevronDownOutline,
    };
  },
  created() {
    this.loadDarkModePreference();
    this.getUsers();
    console.log(this.filters);
  },

  methods: {
    async getUsers() {
      try {
        const response = await api.getUsers();
        // soporta varias formas de respuesta comunes
        let usersData = [];
        if (response && response.data) {
          usersData =
            response.data.data?.data ||
            response.data.data ||
            response.data ||
            [];
        }
        if (!Array.isArray(usersData)) usersData = [];
        this.users = usersData;
        this.filteredUsers = this.users;
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    },
    goBack() {
      router.push("/"); // siempre usar la ruta con / si es path absoluto
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
}
ion-list ion-item {
  --ion-item-background: var(--ion-card-background);
  --min-height: 100px;
  margin: 10px;
  border-radius: 8px;
}
.filters ion-row {
  font-weight: bolder;
}
.filters ion-row ion-select {
  border-radius: 8px;
  letter-spacing: -0.3px;
  width: fit-content;
  padding: 5px;
  min-height: 20px;
  background-color: #ffffff;
}
#btnAction {
  --padding-top: 10px;
  --padding-bottom: 10px;
  --padding-end: 10px;
  --padding-start: 10px;
  width: 100px;
}
</style>
