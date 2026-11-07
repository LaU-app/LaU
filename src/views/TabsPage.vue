<template>
  <ion-page>
    <ion-tabs :class="{ 'layout-with-tabs': isAuthenticated }">
      <ion-router-outlet></ion-router-outlet>

      <!-- Degradado bajo el menú flotante -->
      <div v-if="isAuthenticated" class="nav-fade" :class="{ 'is-hidden': navHidden }" aria-hidden="true"></div>

      <!--
        Menú inferior. Todo su estado (módulo, opción activa y visibilidad) se deriva
        de la ruta actual; los botones solo navegan.
      -->
      <ion-tab-bar v-if="isAuthenticated" slot="bottom" class="lau-nav"
        :class="['module-' + activeModule, { 'is-glass': isGlassMode, 'is-hidden': navHidden }]">
        <nav ref="stageRef" class="nav-stage" aria-label="Navegación principal" :inert="navHidden ? '' : undefined">

          <!-- Burbuja de Inicio: solo en Estudio y Marketplace; un toque vuelve al feed -->
          <button type="button" class="nav-side nav-home" :class="{ 'is-shown': activeModule !== 'social' }"
            :tabindex="activeModule !== 'social' ? undefined : -1" aria-label="Ir a Inicio" @click="select(HOME_ITEM)">
            <span class="nav-surface">
              <LiquidGlassBox v-if="isGlassMode && glassReady" :height="navHeight" :width="navHeight" :depth="7" :radius="33"
                :strength="100" :chromaticAberration="3" :blur="1.8" />
            </span>
            <span class="nav-side-content">
              <ion-icon :icon="homeOutline" class="nav-icon" aria-hidden="true" />
            </span>
          </button>

          <!-- Píldora con las cuatro opciones del módulo actual -->
          <div class="nav-pill">
            <span class="nav-surface">
              <LiquidGlassBox v-if="isGlassMode && glassReady" :height="navHeight" :width="pillWidth" :depth="7" :radius="35"
                :strength="100" :chromaticAberration="3" :blur="1.8" />
            </span>

            <div class="nav-track-area">
              <span class="nav-indicator-slot" :class="{ 'is-visible': activeIndex >= 0 }"
                :style="{ '--index': indicatorIndex }" aria-hidden="true">
                <span class="nav-indicator"></span>
              </span>

              <div v-for="moduleId in MODULE_IDS" :key="moduleId" class="nav-track"
                :class="{ 'is-current': moduleId === activeModule }"
                :aria-hidden="moduleId === activeModule ? undefined : 'true'">
                <button v-for="item in MODULES[moduleId]" :key="item.id" type="button" class="nav-item"
                  :class="{ 'is-active': moduleId === activeModule && item.id === activeItem }"
                  :aria-label="item.label"
                  :aria-current="moduleId === activeModule && item.id === activeItem ? 'page' : undefined"
                  :tabindex="moduleId === activeModule ? undefined : -1" @click="select(item)">
                  <span class="nav-icon-wrap">
                    <ion-avatar v-if="item.id === 'profile'" class="nav-avatar">
                      <img v-if="user?.imagen_url" :src="getFullImageUrl(user.imagen_url)" alt="" loading="lazy" />
                      <ion-icon v-else :icon="personCircle" aria-hidden="true"></ion-icon>
                    </ion-avatar>
                    <ion-icon v-else :icon="item.icon" class="nav-icon" aria-hidden="true" />
                    <ion-badge v-if="badgeFor(item.id) > 0" color="danger" class="nav-badge">
                      {{ badgeFor(item.id) > 99 ? '99+' : badgeFor(item.id) }}
                    </ion-badge>
                  </span>
                </button>
              </div>
            </div>
          </div>

          <!-- Botón (+) para crear publicación: solo en el módulo social -->
          <button type="button" class="nav-side nav-create"
            :class="{ 'is-shown': activeModule === 'social', 'is-active': activeItem === CREATE_ITEM.id }"
            :tabindex="activeModule === 'social' ? undefined : -1" :aria-label="CREATE_ITEM.label"
            :aria-current="activeItem === CREATE_ITEM.id ? 'page' : undefined" @click="select(CREATE_ITEM)">
            <span class="nav-surface">
              <LiquidGlassBox v-if="isGlassMode && glassReady" :height="navHeight" :width="navHeight" :depth="7" :radius="33"
                :strength="100" :chromaticAberration="3" :blur="1.8" />
            </span>
            <span class="nav-create-indicator" aria-hidden="true"></span>
            <span class="nav-side-content">
              <ion-icon :icon="addOutline" class="nav-icon nav-icon-create" aria-hidden="true" />
            </span>
          </button>
        </nav>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import { IonTabs, IonPage, IonRouterOutlet, IonTabBar, IonIcon, IonBadge, IonAvatar, useIonRouter } from '@ionic/vue';
import {
  homeOutline, peopleSharp, chatbubbleOutline, personCircle, addOutline,
  timerOutline, checkmarkCircleOutline, statsChart, podiumOutline,
  storefrontOutline, cartOutline, receiptOutline, statsChartOutline
} from 'ionicons/icons';

import LiquidGlassBox from '@/components/LiquidGlassBox.vue';
import { useGlassMode } from '@/utils/useGlassMode';
import { AuthService } from '@/services/auth';
import chatService from '@/services/chatService';
import { getFullImageUrl } from '@/utils/imageUtils';
import { cart } from '@/utils/useCart';

const route = useRoute();
const ionRouter = useIonRouter();
const { isGlassMode } = useGlassMode();

const isAuthenticated = ref(AuthService.isAuthenticated());
const user = ref(AuthService.getUser());
const unreadChatCount = ref(0);

// ==========================================
// OPCIONES DEL MENÚ (path = pantalla raíz de cada botón)
// ==========================================
const MODULES = {
  social: [
    { id: 'home', label: 'Inicio', icon: homeOutline, path: '/tabs/tab1' },
    { id: 'users', label: 'Miembros de LaU', icon: peopleSharp, path: '/tabs/users' },
    { id: 'chat', label: 'Mensajes', icon: chatbubbleOutline, path: '/tabs/chat' },
    { id: 'profile', label: 'Mi perfil', path: '/tabs/perfil/me' },
  ],
  study: [
    { id: 'focus', label: 'Enfoque', icon: timerOutline, path: '/tabs/study', query: { tab: 'focus' } },
    { id: 'tasks', label: 'Tareas', icon: checkmarkCircleOutline, path: '/tabs/tasks' },
    { id: 'progress', label: 'Progreso', icon: statsChart, path: '/tabs/study', query: { tab: 'progress' } },
    { id: 'ranking', label: 'Ranking', icon: podiumOutline, path: '/tabs/study', query: { tab: 'ranking' } },
  ],
  market: [
    { id: 'store', label: 'Explorar Marketplace', icon: storefrontOutline, path: '/tabs/marketplace' },
    { id: 'cart', label: 'Carrito', icon: cartOutline, path: '/tabs/marketplace/cart' },
    { id: 'orders', label: 'Apartados', icon: receiptOutline, path: '/tabs/marketplace/orders' },
    { id: 'dashboard', label: 'Mi tienda', icon: statsChartOutline, path: '/tabs/marketplace/dashboard' },
  ],
};
const MODULE_IDS = Object.keys(MODULES);
const HOME_ITEM = MODULES.social[0];
const CREATE_ITEM = { id: 'create', label: 'Crear publicación', path: '/tabs/create-post/foto' };

// ==========================================
// ESTADO DERIVADO DE LA RUTA (única fuente de verdad)
// ==========================================
const isTabsPath = (path) => path === '/tabs' || path.startsWith('/tabs/');

// vue-router ya entrega el parámetro decodificado (sin lanzar errores con un "%" suelto)
const isOwnProfile = () => {
  const param = route.params.username;
  if (!param || param === 'me') return true;
  const username = user.value?.username;
  return typeof param === 'string' && !!username && param.toLowerCase() === String(username).toLowerCase();
};

const resolveTabsRoute = (path) => {
  if (path === '/tabs/study') {
    const tab = String(route.query.tab ?? '');
    return { module: 'study', item: tab === 'progress' || tab === 'ranking' ? tab : 'focus' };
  }
  if (path === '/tabs/tasks' || path.startsWith('/tabs/tasks/')) return { module: 'study', item: 'tasks' };

  if (path === '/tabs/marketplace' || path.startsWith('/tabs/marketplace/')) {
    const section = path.split('/')[3];
    if (section === 'cart' || section === 'orders') return { module: 'market', item: section };
    if (section === 'dashboard' || section === 'store') return { module: 'market', item: 'dashboard' };
    return { module: 'market', item: 'store' };
  }

  if (path === '/tabs' || path === '/tabs/tab1') return { module: 'social', item: 'home' };
  if (path === '/tabs/users') return { module: 'social', item: 'users' };
  if (path === '/tabs/chat') return { module: 'social', item: 'chat' };
  if (path.startsWith('/tabs/create-post')) return { module: 'social', item: CREATE_ITEM.id };
  if ((path === '/tabs/perfil' || path.startsWith('/tabs/perfil/')) && isOwnProfile()) return { module: 'social', item: 'profile' };
  return { module: 'social', item: null };
};

const navState = computed((previous) => {
  const path = route.path.replace(/\/+$/, '');
  // Fuera de /tabs (chat, ajustes…) TabsPage sigue debajo de la página que entra:
  // se conserva el último estado para que el menú no cambie durante la transición.
  if (!isTabsPath(path)) return previous ?? { module: 'social', item: null, hidden: false };
  // El detalle de un post se ve a pantalla completa
  return { ...resolveTabsRoute(path), hidden: route.name === 'PostDetail' };
});

const activeModule = computed(() => navState.value.module);
const activeItem = computed(() => navState.value.item);
const activeIndex = computed(() => MODULES[activeModule.value].findIndex((item) => item.id === activeItem.value));
const navHidden = computed(() => navState.value.hidden);

// Solo visual: cuando ninguna opción está activa el indicador se desvanece en su
// última posición en vez de deslizarse hacia la primera.
const indicatorIndex = ref(Math.max(activeIndex.value, 0));
watch(activeIndex, (index) => { if (index >= 0) indicatorIndex.value = index; });

const badgeFor = (id) => {
  if (id === 'chat') return unreadChatCount.value;
  if (id === 'cart') return cart.count.value;
  return 0;
};

// ==========================================
// NAVEGACIÓN: un toque = una navegación
// ==========================================
const select = (item) => {
  if (activeItem.value === item.id) {
    const queryMatches = !item.query || Object.entries(item.query).every(([key, value]) => String(route.query[key] ?? '') === value);
    const atRoot = item.id === 'profile' || item.id === CREATE_ITEM.id ||
      (route.path.replace(/\/+$/, '') === item.path && queryMatches);
    if (atRoot) {
      // Volver a tocar Inicio estando en Inicio: subir y refrescar el feed (lo maneja HomeView)
      if (item.id === HOME_ITEM.id) window.dispatchEvent(new CustomEvent('home-tab-clicked'));
      return;
    }
  }
  // Igual que ion-tab-button: cambio de pestaña sin animación de "push" y con las vistas en caché
  ionRouter.navigate(item.query ? { path: item.path, query: item.query } : item.path, 'none', 'push');
};

// ==========================================
// MEDIDAS REALES (para el filtro del cristal)
// ==========================================
const stageRef = ref(null);
const stageSize = ref({ width: 0, height: 0 });
let resizeObserver = null;

const navHeight = computed(() => stageSize.value.height || 65);
const pillWidth = computed(() => Math.max(0, stageSize.value.width - navHeight.value - 12));
const glassReady = computed(() => stageSize.value.width > 0);

watch(stageRef, (el, oldEl) => {
  if (!resizeObserver) return;
  if (oldEl) resizeObserver.unobserve(oldEl);
  if (el) resizeObserver.observe(el);
});

// ==========================================
// SESIÓN, AVATAR Y CONTADOR DE MENSAJES
// ==========================================
let pollTimer = null;

const loadUnreadChatCount = async () => {
  if (!AuthService.isAuthenticated()) return;
  try {
    const response = await chatService.getUnreadCount();
    if (response?.success) unreadChatCount.value = Number(response.count) || 0;
  } catch {
    // chatService ya registra el error; el contador conserva su último valor
  }
};

const syncSession = () => {
  const authenticated = AuthService.isAuthenticated();
  if (authenticated !== isAuthenticated.value) isAuthenticated.value = authenticated;
  const nextUser = authenticated ? AuthService.getUser() : null;
  if (nextUser?.imagen_url !== user.value?.imagen_url || nextUser?.username !== user.value?.username) {
    user.value = nextUser;
  }
};

watch(isAuthenticated, (authenticated) => {
  if (authenticated) {
    loadUnreadChatCount();
    if (!pollTimer) pollTimer = setInterval(loadUnreadChatCount, 30000);
  } else {
    clearInterval(pollTimer);
    pollTimer = null;
    unreadChatCount.value = 0;
  }
}, { immediate: true });

// Login/logout también se detectan al navegar; al salir de una conversación
// se actualiza el contador de no leídos.
watch(() => route.path, (_path, from) => {
  syncSession();
  if (from?.startsWith('/chat/')) loadUnreadChatCount();
});

const handlePushNotification = (event) => {
  const data = event.detail?.data || {};
  if (data.type === 'message' || data.type === 'chat') loadUnreadChatCount();
};

onMounted(() => {
  window.addEventListener('pushNotificationReceived', handlePushNotification);
  // AuthService.setUser lo emite al cambiar de cuenta o de foto de perfil
  window.addEventListener('study-account-changed', syncSession);
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      // Ionic oculta el tab bar con display:none cuando el teclado está abierto
      if (width > 0 && height > 0) stageSize.value = { width: Math.round(width), height: Math.round(height) };
    });
    if (stageRef.value) resizeObserver.observe(stageRef.value);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('pushNotificationReceived', handlePushNotification);
  window.removeEventListener('study-account-changed', syncSession);
  resizeObserver?.disconnect();
  resizeObserver = null;
  clearInterval(pollTimer);
  pollTimer = null;
});
</script>

<style scoped>
/* ==================================================
   1. DEGRADADO BAJO EL MENÚ
   ================================================== */
.nav-fade {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: calc(80px + env(safe-area-inset-bottom));
  background: linear-gradient(to top, var(--ion-background-color) 0%, rgba(var(--ion-background-color-rgb), 0.3) 50%, transparent 100%);
  pointer-events: none;
  z-index: 900;
  transition: opacity 0.3s ease;
}

.nav-fade.is-hidden {
  opacity: 0;
}

/* ==================================================
   2. CONTENEDOR (ion-tab-bar sin estilos propios de Ionic)
   ================================================== */
ion-tab-bar.lau-nav {
  /* Anula el fondo, el borde superior y los paddings de safe-area de Ionic */
  --background: transparent;
  --border: 0;
  --ion-safe-area-left: 0px;
  --ion-safe-area-right: 0px;
  --ion-safe-area-bottom: 0px;

  /* Medidas compartidas con el resto de la app (src/theme/variables.css) */
  --nav-h: var(--lau-nav-height);
  --nav-gap: 12px;
  --nav-ease: cubic-bezier(0.32, 0.72, 0, 1);
  --nav-dur: 380ms;
  --nav-accent: #8a2be2;
  --nav-surface-bg: #ffffff;
  --nav-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  --nav-icon: var(--ion-color-medium, #8e8e93);
  --nav-icon-strong: var(--ion-color-dark, #1c1c1e);

  position: absolute;
  left: 15px;
  right: 15px;
  bottom: var(--lau-nav-offset);
  margin: 0 auto;
  max-width: 700px;
  height: var(--nav-h);
  display: block;
  padding: 0 !important;
  border: 0;
  box-shadow: none;
  background: transparent;
  contain: none !important;
  overflow: visible;
  z-index: 910;
  transform: translate3d(0, 0, 0);
  transition: transform 320ms var(--nav-ease), opacity 220ms ease, visibility 0s linear 0s;
}

.ion-palette-dark ion-tab-bar.lau-nav {
  --nav-surface-bg: #1c1c1e;
  --nav-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);
  --nav-icon: #9ca3af;
  --nav-icon-strong: #ffffff;
}

ion-tab-bar.lau-nav.is-glass {
  --nav-icon: #3a3a3a;
  --nav-icon-strong: #1c1c1e;
}

.ion-palette-dark ion-tab-bar.lau-nav.is-glass {
  --nav-icon: #9ca3af;
  --nav-icon-strong: #ffffff;
}

/* Detalle de post: el menú baja y se desvanece */
ion-tab-bar.lau-nav.is-hidden {
  transform: translate3d(0, calc(100% + 24px + env(safe-area-inset-bottom)), 0);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: transform 320ms var(--nav-ease), opacity 200ms ease, visibility 0s linear 320ms;
}

.nav-stage {
  position: relative;
  width: 100%;
  height: 100%;
}

/* ==================================================
   3. SUPERFICIES (sólida o cristal; una sola capa, sin bordes)
   ================================================== */
.nav-surface {
  position: absolute;
  inset: 0;
  z-index: 0;
  border-radius: inherit;
  overflow: hidden;
  pointer-events: none;
  background: var(--nav-surface-bg);
  box-shadow: var(--nav-shadow);
}

ion-tab-bar.lau-nav.is-glass .nav-surface {
  background: transparent;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.08), 0 0 14px rgba(0, 0, 0, 0.06);
}

.ion-palette-dark ion-tab-bar.lau-nav.is-glass .nav-surface {
  box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.1), 0 0 16px rgba(120, 160, 255, 0.12);
}

/* Destello del borde: solo existe en modo cristal */
ion-tab-bar.lau-nav.is-glass .nav-surface::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 2.4px;
  pointer-events: none;
  z-index: 1;
  background: conic-gradient(from -45deg, rgba(0, 0, 0, 0.35) 0deg, rgba(0, 0, 0, 0.03) 60deg, rgba(0, 0, 0, 0.03) 150deg, rgba(0, 0, 0, 0.22) 180deg, rgba(0, 0, 0, 0.03) 210deg, rgba(0, 0, 0, 0.03) 300deg, rgba(0, 0, 0, 0.35) 360deg);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;
}

.ion-palette-dark ion-tab-bar.lau-nav.is-glass .nav-surface::after {
  background: conic-gradient(from -45deg, rgba(255, 255, 255, 0.5) 0deg, rgba(255, 255, 255, 0.02) 60deg, rgba(255, 255, 255, 0.02) 150deg, rgba(180, 200, 255, 0.4) 180deg, rgba(255, 255, 255, 0.02) 210deg, rgba(255, 255, 255, 0.02) 300deg, rgba(255, 255, 255, 0.5) 360deg);
}

/* ==================================================
   4. PÍLDORA: se desplaza para dejar sitio a la burbuja de Inicio
   ================================================== */
.nav-pill {
  position: absolute;
  top: 0;
  left: 0;
  width: calc(100% - var(--nav-h) - var(--nav-gap));
  height: 100%;
  border-radius: 999px;
  transform: translate3d(0, 0, 0);
  transition: transform var(--nav-dur) var(--nav-ease);
}

ion-tab-bar.lau-nav.module-study .nav-pill,
ion-tab-bar.lau-nav.module-market .nav-pill {
  transform: translate3d(calc(var(--nav-h) + var(--nav-gap)), 0, 0);
}

.nav-track-area {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 5px;
  right: 5px;
  z-index: 1;
}

/* Las opciones de cada módulo se superponen y se intercambian con un fundido */
.nav-track {
  position: absolute;
  inset: 0;
  display: flex;
  opacity: 1;
  /* inherit: si el menú entero se oculta (detalle de post), sus botones también */
  visibility: inherit;
  transition: opacity 220ms ease 80ms, visibility 0s linear 0s;
}

.nav-track:not(.is-current) {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 140ms ease, visibility 0s linear 140ms;
}

/* Indicador único: viaja directo a la opción activa, sea o no adyacente */
.nav-indicator-slot {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 25%;
  pointer-events: none;
  transform: translate3d(calc(var(--index, 0) * 100%), 0, 0);
  transition: transform var(--nav-dur) var(--nav-ease);
}

.nav-indicator {
  position: absolute;
  top: 6.5px;
  bottom: 6.5px;
  left: 2.5px;
  right: 2.5px;
  border-radius: 26px;
  background: var(--nav-accent);
  box-shadow: 0 4px 12px rgba(138, 43, 226, 0.3);
  opacity: 0;
  transform: scale(0.9);
  transition: opacity 200ms ease, transform 260ms var(--nav-ease);
}

.nav-indicator-slot.is-visible .nav-indicator {
  opacity: 1;
  transform: scale(1);
}

/* ==================================================
   5. BOTONES
   ================================================== */
.nav-item,
.nav-side {
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  -webkit-user-select: none;
  user-select: none;
}

.nav-item {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--nav-icon);
  transition: color 220ms ease;
}

.nav-item.is-active {
  color: #ffffff;
}

.nav-item:focus-visible,
.nav-side:focus-visible {
  outline: 2px solid var(--nav-accent);
  outline-offset: -4px;
}

.nav-item:focus-visible {
  border-radius: 26px;
}

/* La respuesta al toque escala solo el ícono: el área táctil nunca se mueve */
.nav-icon-wrap,
.nav-side-content {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 160ms ease;
}

.nav-item:active .nav-icon-wrap,
.nav-side:active .nav-side-content {
  transform: scale(0.9);
}

.nav-icon {
  display: block;
  font-size: 28px;
}

.nav-avatar {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.nav-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.nav-avatar ion-icon {
  font-size: 30px;
}

.nav-badge {
  position: absolute;
  top: -6px;
  right: -12px;
  min-width: 18px;
  height: 18px;
  padding: 2px 4px;
  font-size: 10px;
  font-weight: bold;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Círculos laterales: burbuja de Inicio (izquierda) y crear publicación (derecha) */
.nav-side {
  position: absolute;
  top: 0;
  z-index: 2;
  width: var(--nav-h);
  height: var(--nav-h);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--nav-icon-strong);
  opacity: 1;
  visibility: inherit;
  transform: scale(1);
  transition: opacity 220ms ease 100ms, transform var(--nav-dur) var(--nav-ease), visibility 0s linear 0s;
}

.nav-home {
  left: 0;
}

.nav-create {
  right: 0;
}

.nav-side:not(.is-shown) {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: scale(0.8);
  transition: opacity 160ms ease, transform var(--nav-dur) var(--nav-ease), visibility 0s linear var(--nav-dur);
}

.nav-side-content {
  z-index: 2;
}

.nav-icon-create {
  font-size: 36px;
}

.nav-create-indicator {
  position: absolute;
  inset: 6.5px;
  z-index: 1;
  border-radius: 50%;
  background: var(--nav-accent);
  box-shadow: 0 4px 12px rgba(138, 43, 226, 0.3);
  opacity: 0;
  transform: scale(0.85);
  transition: opacity 200ms ease, transform 260ms var(--nav-ease);
}

.nav-create.is-active {
  color: #ffffff;
}

.nav-create.is-active .nav-create-indicator {
  opacity: 1;
  transform: scale(1);
}

/* ==================================================
   6. MOVIMIENTO REDUCIDO
   ================================================== */
@media (prefers-reduced-motion: reduce) {
  ion-tab-bar.lau-nav,
  .nav-fade,
  .nav-pill,
  .nav-track,
  .nav-indicator-slot,
  .nav-indicator,
  .nav-side,
  .nav-create-indicator,
  .nav-icon-wrap,
  .nav-side-content {
    transition-duration: 1ms !important;
    transition-delay: 0s !important;
  }
}
</style>
