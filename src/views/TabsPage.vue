<template>
  <ion-page>
    <ion-tabs :class="{ 'layout-with-tabs': isAuthenticated }">
      <ion-router-outlet></ion-router-outlet>

      <!-- MÁSCARA DE DEGRADADO ORIGINAL -->
      <div v-if="isAuthenticated" class="tabs-gradient-mask" :class="{ 'hide-tabs-animated': isHidden }"></div>

      <!-- CONTENEDOR TIPO ION-TAB-BAR -->
      <ion-tab-bar v-if="isAuthenticated" slot="bottom" class="global-nav-container"
        :class="{ 'is-glass': isGlassMode, 'hide-tabs-animated': isHidden }">

        <!-- ========================================== -->
        <!-- MÓDULO 1: SIVARSOCIAL                      -->
        <!-- ========================================== -->
        <div class="nav-module social-module" :class="getClasses('social')"
          :style="anchorBubble === 'social' ? { flex: '0 0 ' + tabBarHeight + 'px', marginRight: '12px' } : {}">

          <div class="bubble-mode">
            <div class="glass-bg-circle bubble-bg" :class="{ 'solid-bg': !isGlassMode }">
              <LiquidGlassBox v-if="isGlassMode" :height="tabBarHeight" :depth="7" :radius="33" :strength="100"
                :chromaticAberration="3" :blur="1.8" :width="tabBarHeight" />
            </div>
            <ion-icon :icon="homeOutline" class="bubble-icon" @click="expandMenu('social')" />
          </div>

          <div class="expanded-mode">
            <!-- ✨ FONDOS: Pill y Circle ✨ -->
            <div class="glass-bg-pill" :class="{ 'solid-bg': !isGlassMode }" :style="{ width: socialPillWidth + 'px' }">
              <LiquidGlassBox v-if="isGlassMode" :height="tabBarHeight" :depth="7" :radius="35" :strength="100"
                :chromaticAberration="3" :blur="1.8" :width="socialPillWidth" />
            </div>
            <div class="glass-bg-circle" :class="{ 'solid-bg': !isGlassMode }" :style="{ width: tabBarHeight + 'px' }">
              <LiquidGlassBox v-if="isGlassMode" :height="tabBarHeight" :depth="7" :radius="33" :strength="100"
                :chromaticAberration="3" :blur="1.8" :width="tabBarHeight" />
            </div>

            <!-- 🚨 SOLUCIÓN: Forzar matemáticamente el ancho idéntico a la píldora de fondo 🚨 -->
            <div class="pill-buttons-container" :style="{ width: socialPillWidth + 'px' }">
              <button class="pill-btn pill-left"
                :class="{ 'tab-selected': currentRouteModule === 'social' && route.path === '/tabs/tab1' }"
                @click="navigate('/tabs/tab1')">
                <div class="nav-content"><ion-icon :icon="homeOutline" /></div>
              </button>
              <button class="pill-btn pill-mid"
                :class="{ 'tab-selected': currentRouteModule === 'social' && route.path.includes('/users') }"
                @click="navigate('/users')">
                <div class="nav-content"><ion-icon :icon="peopleSharp" /></div>
              </button>
              <button class="pill-btn pill-mid"
                :class="{ 'tab-selected': currentRouteModule === 'social' && route.path === '/tabs/chat' }"
                @click="navigate('/tabs/chat')">
                <div class="nav-content notification-button-wrapper">
                  <ion-icon :icon="chatbubbleOutline" />
                  <ion-badge v-if="unreadChatCount > 0" color="danger" class="notification-badge">{{ unreadChatCount >
                    99 ? '99+' : unreadChatCount }}</ion-badge>
                </div>
              </button>
              <button class="pill-btn pill-right"
                :class="{ 'tab-selected': currentRouteModule === 'social' && route.path.includes('/tabs/perfil') }"
                @click="navigate('/tabs/perfil/me')">
                <div class="nav-content">
                  <ion-avatar class="header-avatar">
                    <img v-if="user?.imagen_url" :src="getFullImageUrl(user.imagen_url)" loading="lazy" />
                    <ion-icon v-else :icon="personCircle"></ion-icon>
                  </ion-avatar>
                </div>
              </button>
            </div>

            <!-- 🚨 SOLUCIÓN: Botón (+) con matemáticas exactas 🚨 -->
            <button class="circle-btn" :style="{ width: tabBarHeight + 'px', height: tabBarHeight + 'px' }"
              @click="navigate('/tabs/create-post/foto')">
              <ion-icon :icon="addOutline" style="font-size: 36px;"></ion-icon>
            </button>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- MÓDULO 2: ESTUDIO / TAREAS                 -->
        <!-- ========================================== -->
        <div class="nav-module" :class="getClasses('study')">
          <div class="bubble-mode">
            <div class="glass-bg-circle bubble-bg" :class="{ 'solid-bg': !isGlassMode }">
              <LiquidGlassBox v-if="isGlassMode" :height="tabBarHeight" :depth="7" :radius="33" :strength="100"
                :chromaticAberration="3" :blur="1.8" :width="tabBarHeight" />
            </div>
            <ion-icon :icon="bookOutline" class="bubble-icon" @click="expandMenu('study')" />
          </div>

          <div class="expanded-mode">
            <div class="glass-bg-pill full-pill" :class="{ 'solid-bg': !isGlassMode }"
              :style="{ width: fullPillWidth + 'px' }">
              <LiquidGlassBox v-if="isGlassMode" :height="tabBarHeight" :depth="7" :radius="35" :strength="100"
                :chromaticAberration="3" :blur="1.8" :width="fullPillWidth" />
            </div>

            <div class="pill-buttons-container full-width-container">
              <button class="pill-btn pill-left"
                :class="{ 'tab-selected': currentRouteModule === 'study' && route.path === '/tabs/study' && route.query.tab !== 'progress' && route.query.tab !== 'ranking' }"
                @click="navigate('/tabs/study?tab=focus')">
                <div class="nav-content"><ion-icon :icon="timerOutline" /></div>
              </button>
              <button class="pill-btn pill-mid"
                :class="{ 'tab-selected': currentRouteModule === 'study' && route.path.includes('/tabs/tasks') }"
                @click="navigate('/tabs/tasks')">
                <div class="nav-content"><ion-icon :icon="checkmarkCircleOutline" /></div>
              </button>
              <button class="pill-btn pill-mid"
                :class="{ 'tab-selected': currentRouteModule === 'study' && route.query.tab === 'progress' }"
                @click="navigate('/tabs/study?tab=progress')">
                <div class="nav-content"><ion-icon :icon="statsChart" /></div>
              </button>
              <button class="pill-btn pill-right"
                :class="{ 'tab-selected': currentRouteModule === 'study' && route.query.tab === 'ranking' }"
                @click="navigate('/tabs/study?tab=ranking')">
                <div class="nav-content"><ion-icon :icon="podiumOutline" /></div>
              </button>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- MÓDULO 3: MARKETPLACE                      -->
        <!-- ========================================== -->
        <div class="nav-module" :class="getClasses('market')">
          <div class="bubble-mode">
            <div class="glass-bg-circle bubble-bg" :class="{ 'solid-bg': !isGlassMode }">
              <LiquidGlassBox v-if="isGlassMode" :height="tabBarHeight" :depth="7" :radius="33" :strength="100"
                :chromaticAberration="3" :blur="1.8" :width="tabBarHeight" />
            </div>
            <ion-icon :icon="storefrontOutline" class="bubble-icon" @click="expandMenu('market')" />
          </div>

          <div class="expanded-mode">
            <div class="glass-bg-pill full-pill" :class="{ 'solid-bg': !isGlassMode }"
              :style="{ width: fullPillWidth + 'px' }">
              <LiquidGlassBox v-if="isGlassMode" :height="tabBarHeight" :depth="7" :radius="35" :strength="100"
                :chromaticAberration="3" :blur="1.8" :width="fullPillWidth" />
            </div>

            <div class="pill-buttons-container full-width-container">
              <button class="pill-btn pill-left"
                :class="{ 'tab-selected': currentRouteModule === 'market' && route.path === '/tabs/marketplace' }"
                @click="navigate('/tabs/marketplace')">
                <div class="nav-content"><ion-icon :icon="storefrontOutline" /></div>
              </button>
              <button class="pill-btn pill-mid"
                :class="{ 'tab-selected': currentRouteModule === 'market' && route.path === '/tabs/marketplace/cart' }"
                @click="navigate('/tabs/marketplace/cart')">
                <div class="nav-content notification-button-wrapper">
                  <ion-icon :icon="cartOutline" />
                  <ion-badge v-if="cart.count.value > 0" color="danger" class="notification-badge">{{ cart.count.value >
                    99 ? '99+' : cart.count.value }}</ion-badge>
                </div>
              </button>
              <button class="pill-btn pill-mid"
                :class="{ 'tab-selected': currentRouteModule === 'market' && route.path === '/tabs/marketplace/orders' }"
                @click="navigate('/tabs/marketplace/orders')">
                <div class="nav-content"><ion-icon :icon="receiptOutline" /></div>
              </button>
              <button class="pill-btn pill-right"
                :class="{ 'tab-selected': currentRouteModule === 'market' && (route.path.includes('/dashboard') || route.path.includes('/store')) }"
                @click="navigate('/tabs/marketplace/dashboard')">
                <div class="nav-content"><ion-icon :icon="statsChartOutline" /></div>
              </button>
            </div>
          </div>
        </div>

      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { IonTabs, IonPage, IonRouterOutlet, IonTabBar, IonIcon, IonBadge, IonAvatar } from '@ionic/vue';
import {
  homeOutline, peopleSharp, chatbubbleOutline, personCircle, addOutline,
  bookOutline, timerOutline, checkmarkCircleOutline, statsChart, podiumOutline,
  storefrontOutline, cartOutline, receiptOutline, statsChartOutline
} from 'ionicons/icons';

import LiquidGlassBox from '@/components/LiquidGlassBox.vue';
import { useGlassMode } from '@/utils/useGlassMode';
import { AuthService } from '@/services/auth';
import chatService from '@/services/chatService';
import { getFullImageUrl } from '@/utils/imageUtils';
import { cart } from '@/utils/useCart';

const router = useRouter();
const route = useRoute();
const { isGlassMode } = useGlassMode();

const isAuthenticated = ref(AuthService.isAuthenticated());
const user = ref(AuthService.getUser());
const unreadChatCount = ref(0);
const windowWidth = ref(window.innerWidth);

// LÓGICA ESTRICTA DE BURBUJAS
const currentRouteModule = ref('social');
const expandedMenu = ref('social');
const anchorBubble = ref(null);
const isHidden = ref(false);

watch(() => route.path, (newPath) => {
  let nextModule = 'social';
  if (newPath.includes('/study') || newPath.includes('/tasks')) nextModule = 'study';
  else if (newPath.includes('/marketplace')) nextModule = 'market';
  isHidden.value = newPath.includes('/post/');

  currentRouteModule.value = nextModule;

  if (nextModule === 'social') {
    expandedMenu.value = 'social';
    anchorBubble.value = null;
  } else {
    expandedMenu.value = nextModule;
    anchorBubble.value = 'social';
  }
}, { immediate: true });

const expandMenu = (moduleName) => {
  if (anchorBubble.value === moduleName) {
    anchorBubble.value = expandedMenu.value;
    expandedMenu.value = moduleName;
  }
};

const getClasses = (moduleName) => {
  const isExpanded = expandedMenu.value === moduleName;
  const isBubble = (moduleName === 'social') ? !isExpanded : (!isExpanded && currentRouteModule.value === moduleName);

  return {
    'is-expanded': isExpanded,
    'is-bubble': isBubble,
    'is-hidden': !isExpanded && !isBubble
  };
};

const navigate = (path) => {
  let targetModule = 'social';
  if (path.includes('/study') || path.includes('/tasks')) targetModule = 'study';
  else if (path.includes('/marketplace')) targetModule = 'market';

  if (targetModule !== expandedMenu.value) {
    if (targetModule === 'social') {
      anchorBubble.value = null;
    } else {
      anchorBubble.value = 'social';
    }
    expandedMenu.value = targetModule;
  }
  router.push(path);
};

// ==========================================
// MATEMÁTICAS EXACTAS PARA DIMENSIONES
// ==========================================
const tabBarHeight = computed(() => windowWidth.value >= 768 ? 74 : (windowWidth.value >= 430 ? 68 : 65));
const containerWidth = computed(() => Math.min(windowWidth.value - 30, 700));

const expandedMenuWidth = computed(() => anchorBubble.value ? containerWidth.value - tabBarHeight.value - 12 : containerWidth.value);
const socialPillWidth = computed(() => expandedMenuWidth.value - tabBarHeight.value - 12);
const fullPillWidth = computed(() => expandedMenuWidth.value);

const updateWidth = () => windowWidth.value = window.innerWidth;
const loadUnreadChatCount = async () => {
  if (AuthService.isAuthenticated()) {
    const response = await chatService.getUnreadCount();
    if (response.success) unreadChatCount.value = response.count;
  }
};

onMounted(() => {
  window.addEventListener('resize', updateWidth);
  loadUnreadChatCount();
});
onUnmounted(() => window.removeEventListener('resize', updateWidth));
</script>

<style scoped>
/* ==================================================
   1. DEGRADADO
   ================================================== */
.tabs-gradient-mask {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: calc(10px + 40px + 30px + env(safe-area-inset-bottom));
  background: linear-gradient(to top, var(--ion-background-color) 0%, rgba(var(--ion-background-color-rgb), 0.3) 50%, transparent 100%);
  pointer-events: none;
  z-index: 900;
  transition: opacity 0.4s ease;
}

.tabs-gradient-mask.hide-tabs-animated {
  opacity: 0;
  pointer-events: none;
}

/* ==================================================
   2. CONTENEDOR FLOTANTE TIPO ION-TAB-BAR
   ================================================== */
ion-tab-bar.global-nav-container {
  --background: transparent;
  --border: none;
  position: absolute;
  bottom: max(10px, env(safe-area-inset-bottom));
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 30px);
  max-width: 700px;
  height: clamp(65px, 8vw, 76px);
  display: flex;
  flex-direction: row;
  gap: 12px;
  z-index: 910;
  pointer-events: auto;
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.08));
  contain: none !important;
  overflow: visible;
  padding-bottom: 0 !important;
  --ion-safe-area-bottom: 0px;
  box-shadow: none;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
}

ion-tab-bar.global-nav-container.is-glass {
  filter: none !important;
}

/* ANIMACIÓN OCULTAR/MOSTRAR TABS (al entrar a un post) */
ion-tab-bar.global-nav-container.hide-tabs-animated {
  transform: translate(-50%, 150%);
  opacity: 0;
  pointer-events: none;
}

.tabs-gradient-mask.hide-tabs-animated {
  opacity: 0;
  pointer-events: none;
}

/* ==================================================
   3. COMPORTAMIENTO FÍSICO DE LOS MÓDULOS
   ================================================== */
.nav-module {
  position: relative;
  height: 100%;
  background: var(--ion-card-background, #ffffff);
  border-radius: 35px;
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.nav-module.social-module.is-expanded {
  background: transparent !important;
}

.solid-bg {
  background: var(--ion-card-background, #ffffff) !important;
  box-shadow: none !important;
}

.ion-palette-dark .solid-bg {
  background: #1c1c1e !important;
}

.nav-module.is-expanded {
  flex: 1 1 100%;
  width: 100%;
  opacity: 1;
  overflow: visible;
}

.nav-module.is-bubble {
  flex: 0 0 clamp(65px, 8vw, 76px);
  width: clamp(65px, 8vw, 76px);
  border-radius: 50%;
  opacity: 1;
  cursor: pointer;
}

.nav-module.is-bubble:active {
  transform: scale(0.92);
}

.nav-module.is-hidden {
  flex: 0 0 0;
  width: 0;
  opacity: 0;
  margin: 0;
  padding: 0;
  pointer-events: none;
  border: none;
  overflow: hidden;
  display: none !important;
}

/* ANIMACIONES INTERNAS (Opacidad) */
.expanded-mode,
.bubble-mode {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  transition: opacity 0.3s ease, transform 0.4s ease;
}

.is-bubble .expanded-mode {
  opacity: 0;
  pointer-events: none;
  transform: scale(0.8);
  visibility: hidden;
}

.is-bubble .bubble-mode {
  opacity: 1;
  pointer-events: auto;
  transform: scale(1);
  visibility: visible;
}

.is-expanded .expanded-mode {
  opacity: 1;
  pointer-events: auto;
  transform: scale(1);
  visibility: visible;
}

.is-expanded .bubble-mode {
  opacity: 0;
  pointer-events: none;
  transform: scale(0.5);
  visibility: hidden;
}

/* ==================================================
   4. CRISTAL LÍQUIDO Y ESTILOS DE REFRACCIÓN
   ================================================== */
ion-tab-bar.global-nav-container.is-glass .nav-module {
  background: transparent !important;
  box-shadow: none !important;
}

.glass-bg-pill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  border-radius: 35px;
  overflow: hidden;
  z-index: 0;
  pointer-events: none;
}

.glass-bg-circle {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  z-index: 0;
  pointer-events: none;
}

.bubble-mode .glass-bg-circle {
  width: 100%;
  left: 0;
  right: auto;
}

/* Destellos */
.glass-bg-pill::after,
.glass-bg-circle::after {
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
  mask-composite: exclude;
}

.glass-bg-pill:not(.solid-bg),
.glass-bg-circle:not(.solid-bg) {
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.08), 0 0 14px rgba(0, 0, 0, 0.06);
}

.ion-palette-dark .glass-bg-pill:not(.solid-bg)::after,
.ion-palette-dark .glass-bg-circle:not(.solid-bg)::after {
  background: conic-gradient(from -45deg, rgba(255, 255, 255, 0.5) 0deg, rgba(255, 255, 255, 0.02) 60deg, rgba(255, 255, 255, 0.02) 150deg, rgba(180, 200, 255, 0.4) 180deg, rgba(255, 255, 255, 0.02) 210deg, rgba(255, 255, 255, 0.02) 300deg, rgba(255, 255, 255, 0.5) 360deg);
}

.ion-palette-dark .glass-bg-pill:not(.solid-bg),
.ion-palette-dark .glass-bg-circle:not(.solid-bg) {
  box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.1), 0 0 16px rgba(120, 160, 255, 0.12);
}

/* ==================================================
   5. BOTONES E INTERFAZ
   ================================================== */
.bubble-icon {
  font-size: 28px;
  color: var(--ion-color-dark, #1c1c1e);
  z-index: 10;
  cursor: pointer;
}

.ion-palette-dark .bubble-icon {
  color: #ffffff;
}

ion-tab-bar.global-nav-container.is-glass .bubble-icon {
  color: #1c1c1e !important;
}

.ion-palette-dark ion-tab-bar.global-nav-container.is-glass .bubble-icon {
  color: #ffffff !important;
}

/* 🚨 SOLUCIÓN: Limpiamos el width conflictivo en CSS y dejamos que actúe el estilo inline */
.pill-buttons-container {
  display: flex;
  height: 100%;
  position: absolute;
  left: 0;
}

.full-width-container {
  width: 100% !important;
}

.pill-btn {
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  position: relative;
  z-index: 10;
  color: var(--ion-color-medium, #8e8e93);
  transition: all 0.3s ease;
}

.pill-left {
  border-radius: 35px 0 0 35px;
  padding-left: 5px;
}

.pill-mid {
  border-radius: 0;
}

.pill-right {
  border-radius: 0 35px 35px 0;
  padding-right: 5px;
}

ion-tab-bar.global-nav-container.is-glass .pill-btn {
  color: #3a3a3a !important;
}

.ion-palette-dark ion-tab-bar.global-nav-container.is-glass .pill-btn {
  color: #9ca3af !important;
}

.ion-palette-dark .pill-btn {
  color: #9ca3af;
}

.nav-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: calc(100% - 5px);
  height: calc(clamp(65px, 8vw, 76px) - 13px);
  border-radius: 26px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.nav-content ion-icon {
  font-size: 28px;
  display: block;
}

.tab-selected .nav-content {
  background-color: #8A2BE2 !important;
  color: #ffffff !important;
  box-shadow: 0 2px 10px rgba(138, 43, 226, 0.3);
}

/* 🚨 SOLUCIÓN: Botón (+) transparente por completo, revelando el sólido de fondo */
.circle-btn {
  position: absolute;
  right: 0;
  top: 0;
  border-radius: 50%;
  background: transparent !important;
  box-shadow: none !important;
  color: var(--ion-color-dark, #1c1c1e);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  z-index: 10;
  cursor: pointer;
}

.ion-palette-dark .circle-btn {
  color: #ffffff !important;
}

.header-avatar {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.header-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.notification-button-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.notification-badge {
  position: absolute;
  top: -4px;
  right: 0px;
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
</style>