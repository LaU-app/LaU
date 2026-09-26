<template>
  <ion-page>
    <ion-tabs :class="{ 'layout-with-tabs': isAuthenticated }">
      <ion-router-outlet></ion-router-outlet>

      <div v-if="isAuthenticated" class="tabs-gradient-mask"></div>

      <!-- Tabs rediseño Split Island -->
      <ion-tab-bar v-if="isAuthenticated" ref="tabBarRef" slot="bottom" class="floating-tabs-redesign" :class="{ 'is-glass': isGlassMode }">

        <!-- ✨ MODO CRISTAL 1: LA PÍLDORA ✨ -->
        <div v-if="isGlassMode" class="glass-bg-pill">
          <LiquidGlassBox
            :height="tabBarHeight"
            :depth="7"
            :radius="35"
            :strength="100"
            :chromaticAberration="3"
            :blur="1.8"
            :width="pillWidth"
          />
        </div>

        <!-- ✨ MODO CRISTAL 2: EL CÍRCULO ✨ -->
        <div v-if="isGlassMode" class="glass-bg-circle">
          <LiquidGlassBox
              :height="tabBarHeight"
              :depth="7"
              :radius="33"
              :strength="100"
              :chromaticAberration="3"
              :blur="1.8"
              :width="tabBarHeight"
            />
        </div>

        <!-- 1. FEED -->
        <ion-tab-button tab="tab1" href="/tabs/tab1" @click="handleHomeClick" class="pill-left">
          <div class="nav-content">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M12.707 2.293l9 9c.63 .63 .184 1.707 -.707 1.707h-1v6a3 3 0 0 1 -3 3h-1v-7a3 3 0 0 0 -2.824 -2.995l-.176 -.005h-2a3 3 0 0 0 -3 3v7h-1a3 3 0 0 1 -3 -3v-6h-1c-.89 0 -1.337 -1.077 -.707 -1.707l9 -9a1 1 0 0 1 1.414 0m.293 11.707a1 1 0 0 1 1 1v7h-4v-7a1 1 0 0 1 .883 -.993l.117 -.007z" />
            </svg>
          </div>
        </ion-tab-button>

        <!-- 2. USERS -->
        <ion-tab-button @click="openUsers" class="pill-mid">
          <div class="nav-content">
            <ion-icon aria-hidden="true" :icon="peopleSharp" />
          </div>
        </ion-tab-button>

        <!-- 3. MESSAGES -->
        <ion-tab-button tab="chat" href="/tabs/chat" @click="goToChat" class="pill-mid">
          <div class="nav-content notification-button-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
            <ion-badge v-if="unreadChatCount > 0" color="danger" class="notification-badge">
              {{ unreadChatCount > 99 ? "99+" : unreadChatCount }}
            </ion-badge>
          </div>
        </ion-tab-button>

        <!-- 4. PROFILE -->
        <ion-tab-button tab="perfil" href="/tabs/perfil/me" class="pill-right">
          <div class="nav-content">
            <ion-avatar class="header-avatar">
              <img v-if="user?.imagen_url" :src="getFullImageUrl(user.imagen_url)" loading="lazy" />
              <ion-icon v-else :icon="personCircle"></ion-icon>
            </ion-avatar>
          </div>
        </ion-tab-button>

        <!-- 5. CREATE POST (El círculo aislado) -->
        <ion-tab-button tab="create-post" href="/tabs/create-post/foto" class="circle-btn" :style="{ maxWidth: tabBarHeight + 'px', minWidth: tabBarHeight + 'px', height: tabBarHeight + 'px' }">
          <ion-icon :icon="addOutline" style="font-size: 36px;"></ion-icon>
        </ion-tab-button>

      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup>
// ══════════════════════════════════════════════════
// 1. IMPORTS
// ══════════════════════════════════════════════════
import {
  IonTabBar, IonTabButton, IonTabs, IonIcon, IonPage,
  IonRouterOutlet, IonBadge, IonAvatar
} from "@ionic/vue";
import { peopleSharp, personCircle, addOutline } from "ionicons/icons";
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { AuthService } from "@/services/auth";
import chatService from "@/services/chatService";
import { getFullImageUrl } from '@/utils/imageUtils';
import LiquidGlassBox from '@/components/LiquidGlassBox.vue';
import { useGlassMode } from "@/utils/useGlassMode";

// ══════════════════════════════════════════════════
// 2. ROUTER / MODO CRISTAL
// ══════════════════════════════════════════════════
const router = useRouter();
const route = useRoute(); // ⚠️ no se usa en el script: se puede quitar
const { isGlassMode } = useGlassMode();

// ══════════════════════════════════════════════════
// 3. ESTADO
// ══════════════════════════════════════════════════
const isAuthenticated = ref(AuthService.isAuthenticated());
const user = ref(AuthService.getUser());
const unreadChatCount = ref(0);
const windowWidth = ref(window.innerWidth);
let pollInterval = null;

// ══════════════════════════════════════════════════
// 4. COMPUTED
// ══════════════════════════════════════════════════
// ✨ MATEMÁTICA PARA EL CRISTAL: (Ancho pantalla - márgenes - hueco - círculo)
const pillWidth = computed(() => windowWidth.value - (tabBarHeight.value + 42));

// ══════════════════════════════════════════════════
// 5. DATOS: CONTADOR DE MENSAJES
// ══════════════════════════════════════════════════
const loadUnreadChatCount = async () => {
  try {
    const response = await chatService.getUnreadCount();
    if (response.success) {
      unreadChatCount.value = response.count;
    }
  } catch (error) {
    console.error("Error al cargar chat:", error);
  }
};

const handlePushNotification = (event) => {
  const notification = event.detail;
  const data = notification.data || {};
  if (data.type === 'message' || data.type === 'chat') {
    loadUnreadChatCount();
  }
};

// ══════════════════════════════════════════════════
// 6. NAVEGACIÓN
// ══════════════════════════════════════════════════
const openUsers = () => router.push("/users");
const goToChat = () => router.push('/tabs/chat');
const handleHomeClick = () => window.dispatchEvent(new CustomEvent('home-tab-clicked'));
const updateWidth = () => windowWidth.value = window.innerWidth;

// ══════════════════════════════════════════════════
// 7. CICLO DE VIDA
// ══════════════════════════════════════════════════
onMounted(() => {
  window.addEventListener('resize', updateWidth);
  window.addEventListener('pushNotificationReceived', handlePushNotification);
  isAuthenticated.value = AuthService.isAuthenticated();

  if (isAuthenticated.value) {
    user.value = AuthService.getUser();
    loadUnreadChatCount();
    pollInterval = setInterval(() => {
      if (AuthService.isAuthenticated()) loadUnreadChatCount();
    }, 30000);
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', updateWidth);
  window.removeEventListener('pushNotificationReceived', handlePushNotification);
  if (pollInterval) clearInterval(pollInterval);
});

// ══════════════════════════════════════════════════
// 8. REACCIÓN A CAMBIOS DE SESIÓN EN EL ROUTER
// ══════════════════════════════════════════════════
router.afterEach(() => {
  const wasAuthenticated = isAuthenticated.value;
  isAuthenticated.value = AuthService.isAuthenticated();
  user.value = AuthService.getUser();

  if (!wasAuthenticated && isAuthenticated.value) loadUnreadChatCount();
  if (wasAuthenticated && !isAuthenticated.value) {
    unreadChatCount.value = 0;
    user.value = null;
  }
});

// ✨ ALTURA RESPONSIVE: crece un poco en pantallas grandes, pero con techo
const tabBarHeight = computed(() => {
    if (windowWidth.value >= 768) return 74;
    if (windowWidth.value >= 430) return 68;
    return 65;
});

</script>

<style scoped>
/* ==================================================
   MÁSCARA DE DEGRADADO (Fondo difuminado)
   ================================================== */
.tabs-gradient-mask {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: calc(10px + 40px + 30px + env(safe-area-inset-bottom));
  background: linear-gradient(
    to top,
    var(--ion-background-color) 0%,
    rgba(var(--ion-background-color-rgb), 0.3) 50%,
    transparent 100%
  );
  pointer-events: none;
  z-index: 900;
  transition: background 0.5s ease;
}

/* ==================================================
   REDISEÑO SPLIT ISLAND (Contenedor Principal)
   ================================================== */
ion-tab-bar.floating-tabs-redesign {
  --background: transparent;
  --border: none;
  position: absolute;
  bottom: max(10px , env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 30px);     /* mismo margen de 15px por lado que tenías */
  max-width: 700px;              /* 👈 techo: nunca crece más de 480px, sin importar el tamaño de pantalla */
  
  height: clamp(65px, 8vw, 76px);
  --ion-safe-area-bottom: 0px;
  padding-bottom: 0 !important;
  box-shadow: none;
  overflow: visible;
  display: flex; flex-direction: row; gap: 0;
  z-index: 910;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.08));
  transition: all 0.3s ease;
}

/* ==================================================
   COLORES NATIVOS DE IONIC
   ================================================== */
ion-tab-button {
  --background: var(--ion-card-background, #ffffff);

  /* Color base inactivo */
  --color: var(--ion-color-medium, #8e8e93);
  color: var(--ion-color-medium, #8e8e93);

  --color-selected: #ffffff;
  --ripple-color: transparent;
  --padding-start: 0px !important;
  --padding-end: 0px !important;
  --border-width: 0px !important;
  --inner-border-width: 0px !important;

  margin: 0; padding: 0;
  display: flex; align-items: center; justify-content: center;
  flex: 1;
  transition: all 0.3s ease;
  position: relative;
  z-index: 10;
}

ion-tab-button::part(native) {
  border: none !important;
  box-shadow: none !important;
  border-radius: inherit;
  padding: 0;
}

.pill-left { border-radius: 35px 0 0 35px; padding-left: 5px; }
.pill-mid { border-radius: 0; }
.pill-right { border-radius: 0 35px 35px 0; padding-right: 5px; }

.pill-left, .pill-mid { margin-right: -1px !important; }

/* ==================================================
   EL CÍRCULO FLOTANTE
   ================================================== */
.circle-btn {
  border-radius: 50%;
  margin-left: 12px;
  max-width: clamp(65px, 8vw, 76px); /* 👈 antes: 65px fijo */
  min-width: clamp(65px, 8vw, 76px);
  height: clamp(65px, 8vw, 76px);

  --background: var(--ion-card-background, #ffffff);
  --color: var(--ion-color-dark, #1c1c1e);
  color: var(--ion-color-dark, #1c1c1e);

  flex-shrink: 0;
}
.circle-btn::part(native) { border-radius: 50%; }

/* ==================================================
   DISEÑO INTERNO Y ESTADO ACTIVO (Pastilla Verde)
   ================================================== */
.nav-content {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  width: calc(100% - 5px); 
  height: calc(clamp(65px, 8vw, 76px) - 13px); /* 👈 antes: 52px fijo (65-13=52, mantiene proporción) */
  border-radius: 26px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

ion-tab-button.tab-selected .nav-content {
  background-color: #8A2BE2;
  color: #ffffff !important;
  box-shadow: 0 2px 10px rgba(16, 185, 129, 0.25);
}

/* ==================================================
   ICONOS, AVATARES Y BADGES
   ================================================== */
.custom-icon { width: 28px; height: 28px; color: currentColor; display: block; }
ion-icon { font-size: 28px; display: block; }

.header-avatar { width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; }
.header-avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }

.notification-button-wrapper { position: relative; display: inline-flex; align-items: center; justify-content: center; }
.notification-badge {
  position: absolute; top: -4px; right: 0px;
  min-width: 18px; height: 18px; padding: 2px 4px;
  font-size: 10px; font-weight: bold; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
}

/* ==================================================
   ✨ MODO CRISTAL (POSICIONES Y RECORTES) ✨
   ================================================== */
.glass-bg-pill {
  position: absolute; top: 0; left: 0; 
  height: clamp(65px, 8vw, 76px); /* 👈 antes: 65px fijo */
  width: calc(100% - 77px);
  border-radius: 35px; overflow: hidden;
  z-index: 0; pointer-events: none;
}

.glass-bg-circle {
  position: absolute; top: 0; right: 0; 
  height: clamp(65px, 8vw, 76px); /* 👈 antes: 65px fijo */
  width: clamp(65px, 8vw, 76px);  /* 👈 antes: 65px fijo */
  border-radius: 50%; overflow: hidden;
  z-index: 0; pointer-events: none;
}
/* ==================================================
   🎨 LÓGICA DE COLORES (Temas claro / oscuro / cristal)
   ================================================== */
/* Cuando el modo cristal está encendido, quitamos los colores base de Ionic */
ion-tab-bar.floating-tabs-redesign.is-glass ion-tab-button {
  --background: transparent !important;
  background: transparent !important;
}

/* Apaga la sombra general para que el cristal se vea natural */
ion-tab-bar.floating-tabs-redesign.is-glass {
  filter: none !important;
}

/* 1. TEMA CLARO: Iconos negros cuando el cristal está activo */
ion-tab-bar.floating-tabs-redesign.is-glass ion-tab-button {
  --color: #3a3a3a !important;
  color: #3a3a3a !important;
}
ion-tab-bar.floating-tabs-redesign.is-glass .circle-btn {
  --color: #1c1c1e !important;
  color: #1c1c1e !important;
}

/* 2. TEMA OSCURO: Iconos sobre el cristal en modo oscuro */
.ion-palette-dark ion-tab-bar.floating-tabs-redesign.is-glass ion-tab-button {
  --color: #9ca3af !important;
  color: #9ca3af !important; /* Gris claro para los inactivos sobre el cristal */
}
.ion-palette-dark ion-tab-bar.floating-tabs-redesign.is-glass .circle-btn {
  --color: #ffffff !important;
  color: #ffffff !important; /* Cruz completamente blanca */
}

/* 3. TEMA OSCURO (MODO NORMAL, SIN CRISTAL) */
.ion-palette-dark ion-tab-bar.floating-tabs-redesign ion-tab-button {
  --color: #9ca3af !important;
  color: #9ca3af !important;
}
.ion-palette-dark ion-tab-bar.floating-tabs-redesign .circle-btn {
  --color: #ffffff !important;
  color: #ffffff !important;
}

/* 4. BLINDAJE: El ícono seleccionado SIEMPRE es blanco */
.ion-palette-dark ion-tab-bar.floating-tabs-redesign ion-tab-button.tab-selected .nav-content,
ion-tab-bar.floating-tabs-redesign ion-tab-button.tab-selected .nav-content {
  color: #ffffff !important;
}

/* ==================================================
   ✨ BORDE DE DESTELLO (Edge Glint) PARA EL CRISTAL ✨
   ================================================== */
/* 🌞 TEMA CLARO (default) → destello NEGRO */
.glass-bg-pill::after,
.glass-bg-circle::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 2.4px;
  pointer-events: none;
  z-index: 1;

  background: conic-gradient(
    from -45deg,
    rgba(0, 0, 0, 0.35) 0deg,    /* pico fuerte: arriba-izquierda */
    rgba(0, 0, 0, 0.03) 60deg,
    rgba(0, 0, 0, 0.03) 150deg,
    rgba(0, 0, 0, 0.22) 180deg,  /* pico suave: abajo-derecha */
    rgba(0, 0, 0, 0.03) 210deg,
    rgba(0, 0, 0, 0.03) 300deg,
    rgba(0, 0, 0, 0.35) 360deg
  );

  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}

/* Glow del tema claro: sombra oscura sutil en vez de blanca */
.glass-bg-pill,
.glass-bg-circle {
  box-shadow:
    inset 0 0 10px rgba(0, 0, 0, 0.08),
    0 0 14px rgba(0, 0, 0, 0.06);
}

/* 🌙 TEMA OSCURO → destello BLANCO */
.ion-palette-dark .glass-bg-pill::after,
.ion-palette-dark .glass-bg-circle::after {
  background: conic-gradient(
    from -45deg,
    rgba(255, 255, 255, 0.5) 0deg,
    rgba(255, 255, 255, 0.02) 60deg,
    rgba(255, 255, 255, 0.02) 150deg,
    rgba(180, 200, 255, 0.4) 180deg,
    rgba(255, 255, 255, 0.02) 210deg,
    rgba(255, 255, 255, 0.02) 300deg,
    rgba(255, 255, 255, 0.5) 360deg
  );
}

.ion-palette-dark .glass-bg-pill,
.ion-palette-dark .glass-bg-circle {
  box-shadow:
    inset 0 0 10px rgba(255, 255, 255, 0.1),
    0 0 16px rgba(120, 160, 255, 0.12);
}

/* ==================================================
   ✨ ANIMACIÓN OCULTAR/MOSTRAR TABS (al entrar a un post) ✨
   ================================================== */
ion-tab-bar.floating-tabs-redesign.hide-tabs-animated {
  transform: translate(-50%, 150%); /* 👈 combina el centrado (-50%) + el descenso (150%) */
  opacity: 0;
  pointer-events: none;
}

.tabs-gradient-mask.hide-tabs-animated {
  opacity: 0;
  pointer-events: none;
}
</style>