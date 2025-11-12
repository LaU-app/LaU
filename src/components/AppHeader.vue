<template>
  <ion-header class="ion-no-border">
    <ion-toolbar>
      <div class="logo-container">
        <img src="/LaU.png" alt="LaÚ" class="logo-img" />
      </div>
      <ion-buttons slot="end">
        <!-- Botón de login para usuarios NO autenticados -->
        <ion-button
          v-if="!isAuthenticated"
          @click="goToLogin"
          aria-label="Iniciar sesión"
        >
          <ion-icon :icon="logIn" class="header-icon"></ion-icon>
        </ion-button>

        <ion-button
          @click="$emit('toggleDarkMode')"
          :aria-label="isDarkMode ? 'Modo claro' : 'Modo oscuro'"
        >
          <ion-icon
            :icon="isDarkMode ? sunny : moon"
            class="header-icon"
          ></ion-icon>
        </ion-button>

        <!-- Avatar solo para usuarios autenticados -->
        <a
          v-if="isAuthenticated"
          href="/tabs/perfil/me"
          aria-label="Perfil de usuario"
        >
          <ion-avatar class="header-avatar">
            <img
              v-if="user?.imagen_url"
              :src="user.imagen_url"
              :alt="user.nombre || 'Usuario'"
            />
            <ion-icon
              v-else
              :icon="personCircle"
              class="header-icon"
            ></ion-icon>
          </ion-avatar>
        </a>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>
</template>

<script setup>
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonAvatar,
} from "@ionic/vue";
import { moon, sunny, personCircle, logIn } from "ionicons/icons";
import { useRouter } from "vue-router";

defineProps({
  isDarkMode: {
    type: Boolean,
    required: true,
  },
  user: {
    type: Object,
    default: () => ({}),
  },
  isAuthenticated: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["toggleDarkMode"]);

const router = useRouter();

const goToLogin = () => {
  router.push("/login");
};
</script>

<style scoped>
@import "../theme/colors.css";
@import "../theme/home.css";
</style>
