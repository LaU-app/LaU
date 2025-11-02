<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>

      <!-- Tabs solo para usuarios autenticados -->
      <ion-tab-bar v-if="isAuthenticated" slot="bottom">
        <!-- Home -->
        <ion-tab-button tab="tab1" href="/tabs/home">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"
            class="icon icon-tabler icons-tabler-filled icon-tabler-home">
            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
            <path
              d="M12.707 2.293l9 9c.63 .63 .184 1.707 -.707 1.707h-1v6a3 3 0 0 1 -3 3h-1v-7a3 3 0 0 0 -2.824 -2.995l-.176 -.005h-2a3 3 0 0 0 -3 3v7h-1a3 3 0 0 1 -3 -3v-6h-1c-.89 0 -1.337 -1.077 -.707 -1.707l9 -9a1 1 0 0 1 1.414 0m.293 11.707a1 1 0 0 1 1 1v7h-4v-7a1 1 0 0 1 .883 -.993l.117 -.007z" />
          </svg>
          <ion-label>Home</ion-label>
        </ion-tab-button>

        <!-- Tab 2 -->
        <ion-tab-button tab="tab2" href="/tabs/tab2">
          <ion-icon aria-hidden="true" :icon="ellipse" />
          <ion-label>Tab 2</ion-label>
        </ion-tab-button>

        <!-- Agregar Post (+) --> 
        <ion-tab-button @click="$router.push('/new-post')">
          <ion-icon aria-hidden="true" :icon="addCircle" size="large" />
          <ion-label>Agregar Post</ion-label>
        </ion-tab-button>

        <!-- Usuarios -->
        <ion-tab-button @click="openUsers">
          <ion-icon aria-hidden="true" :icon="peopleSharp" />
          <ion-label>Usuarios</ion-label>
        </ion-tab-button>

        <!-- Perfil -->
        <ion-tab-button tab="perfil" href="/tabs/perfil">
          <ion-icon aria-hidden="true" :icon="person" />
          <ion-label>Perfil</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup>
import { IonTabBar, IonTabButton, IonTabs, IonLabel, IonIcon, IonPage, IonRouterOutlet } from '@ionic/vue';
import { ellipse, peopleSharp, person, addCircle  } from 'ionicons/icons';
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { AuthService } from '@/services/auth';

const router = useRouter();

// Estado reactivo de autenticación
const isAuthenticated = ref(AuthService.isAuthenticated());

// Actualizar cuando el componente se monta
onMounted(() => {
  isAuthenticated.value = AuthService.isAuthenticated();
});

// Escuchar cambios de ruta para actualizar el estado
router.afterEach(() => {
  isAuthenticated.value = AuthService.isAuthenticated();
});

// Función para abrir la vista de usuarios como modal
const openUsers = () => {
  router.push('/users');
};
</script>

<style scoped>
ion-tab-button svg {
  width: 24px;
  height: 24px;
  color: var(--ion-color-medium);
}

ion-tab-button.tab-selected svg {
  color: var(--ion-color-primary);
}

/* Opcional: hacer que el + sea más visible */
ion-tab-button[tab="add"] ion-icon {
  font-size: 28px;
  color: var(--ion-color-primary);
}
</style>
