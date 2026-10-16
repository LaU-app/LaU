<template>
  <!-- WRAPPER FIJO: Anclado a los bordes de la pantalla. Resuelve los espacios del degradado -->
  <div class="global-nav-wrapper" :class="{ 'hide-tabs-animated': isHidden }">
    
    <!-- MÁSCARA DE DEGRADADO (Ahora 100% de la pantalla) -->
    <div class="tabs-gradient-mask"></div>

    <!-- CONTENEDOR PRINCIPAL DE NAVEGACIÓN -->
    <div class="global-nav-container" :class="{ 'is-glass': isGlassMode }">

      <!-- ========================================== -->
      <!-- MÓDULO 1: SIVARSOCIAL                      -->
      <!-- ========================================== -->
      <div class="nav-module" :class="getClasses('social')">
        
        <!-- ESTADO BURBUJA -->
        <div v-show="anchorBubble === 'social'" class="bubble-mode" @click="expandBubble('social')">
          <div v-if="isGlassMode" class="glass-bg-circle bubble-bg">
            <LiquidGlassBox :height="tabBarHeight" :depth="7" :radius="33" :strength="100" :chromaticAberration="3" :blur="1.8" :width="tabBarHeight" />
          </div>
          <ion-icon :icon="homeOutline" class="bubble-icon" />
        </div>

        <!-- ESTADO EXPANDIDO -->
        <div v-show="expandedMenu === 'social'" class="expanded-mode">
          <!-- CRISTAL ORIGINAL -->
          <div v-if="isGlassMode" class="glass-bg-pill">
            <LiquidGlassBox :height="tabBarHeight" :depth="7" :radius="35" :strength="100" :chromaticAberration="3" :blur="1.8" :width="socialPillWidth" />
          </div>
          <div v-if="isGlassMode" class="glass-bg-circle">
            <LiquidGlassBox :height="tabBarHeight" :depth="7" :radius="33" :strength="100" :chromaticAberration="3" :blur="1.8" :width="tabBarHeight" />
          </div>

          <div class="pill-buttons-container">
            <button class="pill-btn pill-left" :class="{ 'tab-selected': activeRouteModule === 'social' && route.path === '/tabs/tab1' }" @click="navigate('/tabs/tab1')">
              <div class="nav-content"><ion-icon :icon="homeOutline" /></div>
            </button>
            <button class="pill-btn pill-mid" :class="{ 'tab-selected': activeRouteModule === 'social' && route.path === '/users' }" @click="navigate('/users')">
              <div class="nav-content"><ion-icon :icon="peopleSharp" /></div>
            </button>
            <button class="pill-btn pill-mid" :class="{ 'tab-selected': activeRouteModule === 'social' && route.path === '/tabs/chat' }" @click="navigate('/tabs/chat')">
              <div class="nav-content notification-button-wrapper">
                 <ion-icon :icon="chatbubbleOutline" />
                 <ion-badge v-if="unreadChatCount > 0" color="danger" class="notification-badge">{{ unreadChatCount > 99 ? '99+' : unreadChatCount }}</ion-badge>
              </div>
            </button>
            <button class="pill-btn pill-right" :class="{ 'tab-selected': activeRouteModule === 'social' && route.path.includes('/tabs/perfil') }" @click="navigate('/tabs/perfil/me')">
              <div class="nav-content">
                <ion-avatar class="header-avatar">
                  <img v-if="user?.imagen_url" :src="getFullImageUrl(user.imagen_url)" loading="lazy" />
                  <ion-icon v-else :icon="personCircle"></ion-icon>
                </ion-avatar>
              </div>
            </button>
          </div>

          <button class="circle-btn" @click="navigate('/tabs/create-post/foto')">
            <ion-icon :icon="addOutline"></ion-icon>
          </button>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- MÓDULO 2: ESTUDIO / TAREAS                 -->
      <!-- ========================================== -->
      <div class="nav-module" :class="getClasses('study')">
        
        <div v-show="anchorBubble === 'study'" class="bubble-mode" @click="expandBubble('study')">
          <div v-if="isGlassMode" class="glass-bg-circle bubble-bg">
            <LiquidGlassBox :height="tabBarHeight" :depth="7" :radius="33" :strength="100" :chromaticAberration="3" :blur="1.8" :width="tabBarHeight" />
          </div>
          <ion-icon :icon="bookOutline" class="bubble-icon" />
        </div>

        <div v-show="expandedMenu === 'study'" class="expanded-mode">
          <div v-if="isGlassMode" class="glass-bg-pill full-pill">
            <LiquidGlassBox :height="tabBarHeight" :depth="7" :radius="35" :strength="100" :chromaticAberration="3" :blur="1.8" :width="fullPillWidth" />
          </div>

          <div class="pill-buttons-container full-width-container">
            <button class="pill-btn pill-left" :class="{ 'tab-selected': activeRouteModule === 'study' && route.path === '/study' && route.query.tab !== 'progress' && route.query.tab !== 'ranking' }" @click="navigate('/study?tab=focus')">
              <div class="nav-content"><ion-icon :icon="timerOutline" /></div>
            </button>
            <button class="pill-btn pill-mid" :class="{ 'tab-selected': activeRouteModule === 'study' && route.path === '/tasks' }" @click="navigate('/tasks')">
              <div class="nav-content"><ion-icon :icon="checkmarkCircleOutline" /></div>
            </button>
            <button class="pill-btn pill-mid" :class="{ 'tab-selected': activeRouteModule === 'study' && route.query.tab === 'progress' }" @click="navigate('/study?tab=progress')">
              <div class="nav-content"><ion-icon :icon="statsChart" /></div>
            </button>
            <button class="pill-btn pill-right" :class="{ 'tab-selected': activeRouteModule === 'study' && route.query.tab === 'ranking' }" @click="navigate('/study?tab=ranking')">
              <div class="nav-content"><ion-icon :icon="podiumOutline" /></div>
            </button>
          </div>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- MÓDULO 3: MARKETPLACE                      -->
      <!-- ========================================== -->
      <div class="nav-module" :class="getClasses('market')">
        
        <div v-show="anchorBubble === 'market'" class="bubble-mode" @click="expandBubble('market')">
          <div v-if="isGlassMode" class="glass-bg-circle bubble-bg">
            <LiquidGlassBox :height="tabBarHeight" :depth="7" :radius="33" :strength="100" :chromaticAberration="3" :blur="1.8" :width="tabBarHeight" />
          </div>
          <ion-icon :icon="storefrontOutline" class="bubble-icon" />
        </div>

        <div v-show="expandedMenu === 'market'" class="expanded-mode">
          <div v-if="isGlassMode" class="glass-bg-pill full-pill">
            <LiquidGlassBox :height="tabBarHeight" :depth="7" :radius="35" :strength="100" :chromaticAberration="3" :blur="1.8" :width="fullPillWidth" />
          </div>

          <div class="pill-buttons-container full-width-container">
            <button class="pill-btn pill-left" :class="{ 'tab-selected': activeRouteModule === 'market' && route.path === '/marketplace' }" @click="navigate('/marketplace')">
              <div class="nav-content"><ion-icon :icon="storefrontOutline" /></div>
            </button>
            <button class="pill-btn pill-mid" :class="{ 'tab-selected': activeRouteModule === 'market' && route.path === '/marketplace/cart' }" @click="navigate('/marketplace/cart')">
              <div class="nav-content notification-button-wrapper">
                <ion-icon :icon="cartOutline" />
                <ion-badge v-if="cart.count.value > 0" color="danger" class="notification-badge">{{ cart.count.value > 99 ? '99+' : cart.count.value }}</ion-badge>
              </div>
            </button>
            <button class="pill-btn pill-mid" :class="{ 'tab-selected': activeRouteModule === 'market' && route.path === '/marketplace/orders' }" @click="navigate('/marketplace/orders')">
              <div class="nav-content"><ion-icon :icon="receiptOutline" /></div>
            </button>
            <button class="pill-btn pill-right" :class="{ 'tab-selected': activeRouteModule === 'market' && (route.path.includes('/marketplace/dashboard') || route.path.includes('/marketplace/store')) }" @click="navigate('/marketplace/dashboard')">
              <div class="nav-content"><ion-icon :icon="statsChartOutline" /></div>
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { IonIcon, IonBadge, IonAvatar } from '@ionic/vue';
import { 
  homeOutline, peopleSharp, chatbubbleOutline, personCircle, addOutline, 
  bookOutline, timerOutline, checkmarkCircleOutline, statsChart, podiumOutline,
  storefrontOutline, cartOutline, receiptOutline, statsChartOutline
} from 'ionicons/icons';

// Componentes y Utilidades
import LiquidGlassBox from '@/components/LiquidGlassBox.vue';
import { useGlassMode } from '@/utils/useGlassMode';
import { AuthService } from '@/services/auth';
import chatService from '@/services/chatService';
import { getFullImageUrl } from '@/utils/imageUtils';
import { cart } from '@/utils/useCart';

const router = useRouter();
const route = useRoute();
const { isGlassMode } = useGlassMode();

const user = ref(AuthService.getUser());
const unreadChatCount = ref(0);
const windowWidth = ref(window.innerWidth);
const isHidden = ref(false);

const activeRouteModule = ref('social'); 
const expandedMenu = ref('social');      
const anchorBubble = ref(null);          

// 1. Lógica estricta de anclaje (SivarSocial siempre es la burbuja)
watch(() => route.path, (newPath) => {
  let nextModule = 'social';
  if (newPath.includes('/study') || newPath.includes('/tasks')) nextModule = 'study';
  else if (newPath.includes('/marketplace')) nextModule = 'market';

  activeRouteModule.value = nextModule;

  if (nextModule === 'social') {
    expandedMenu.value = 'social';
    anchorBubble.value = null; 
  } else {
    expandedMenu.value = nextModule;
    anchorBubble.value = 'social'; // SivarSocial siempre se mantiene como burbuja
  }
}, { immediate: true });

// 2. Tocar burbuja: Solo intercambia
const expandBubble = (moduleName) => {
  if (anchorBubble.value === moduleName) {
    anchorBubble.value = expandedMenu.value;
    expandedMenu.value = moduleName;
  }
};

const getClasses = (moduleName) => {
  return {
    'is-expanded': expandedMenu.value === moduleName,
    'is-bubble': anchorBubble.value === moduleName,
    'is-hidden': expandedMenu.value !== moduleName && anchorBubble.value !== moduleName
  };
};

// ==========================================
// MATEMÁTICAS EXACTAS PARA EL CRISTAL SVG
// ==========================================
const navigate = (path) => router.push(path);

const tabBarHeight = computed(() => {
    if (windowWidth.value >= 768) return 74;
    if (windowWidth.value >= 430) return 68;
    return 65;
});

// El ancho total del contenedor respetando el max-width de 700px
const containerWidth = computed(() => Math.min(windowWidth.value - 30, 700));

// El cristal debe medir exactamente lo mismo que su contenedor interno para no desbordarse
const socialPillWidth = computed(() => containerWidth.value - 77);
const fullPillWidth = computed(() => containerWidth.value);

const updateWidth = () => windowWidth.value = window.innerWidth;

const loadUnreadChatCount = async () => {
  if(AuthService.isAuthenticated()){
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
   1. WRAPPER FIJO (Evita que el menú cambie su posición o se corte)
   ================================================== */
.global-nav-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100vw;
  height: calc(140px + env(safe-area-inset-bottom));
  z-index: 9999;
  pointer-events: none; /* Deja pasar los toques a la app excepto en los botones */
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.global-nav-wrapper.hide-tabs-animated {
  transform: translateY(100%);
  opacity: 0;
}

/* ==================================================
   2. MÁSCARA DE DEGRADADO (Cubre 100% de esquina a esquina)
   ================================================== */
.tabs-gradient-mask {
  position: absolute;
  bottom: 0; 
  left: 0; 
  right: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to top,
    var(--ion-background-color) 15%,
    rgba(var(--ion-background-color-rgb), 0.6) 60%,
    transparent 100%
  );
  z-index: 1;
}

ion-page {
  contain: none !important;
}

/* ==================================================
   3. CONTENEDOR PRINCIPAL
   ================================================== */
.global-nav-container {
  position: absolute;
  bottom: max(15px, env(safe-area-inset-bottom));
  left: 15px;
  right: 15px;
  margin: 0 auto;         /* 👈 centra sin transform */
  /* left: 50%; transform: translateX(-50%);  ← elimina estas dos líneas */
  width: calc(100% - 30px);
  max-width: 700px;
  height: clamp(65px, 8vw, 76px);
  display: flex;
  flex-direction: row;
  gap: 12px;
  z-index: 10;
  pointer-events: auto; /* Reactiva los toques solo en la barra */
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.08));
}

.global-nav-container.is-glass {
  filter: none !important;
}

/* ==================================================
   4. MÓDULOS Y ANIMACIÓN FÍSICA
   ================================================== */
.nav-module {
  position: relative;
  height: 100%;
  background: var(--ion-card-background, #ffffff);
  border-radius: 35px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.nav-module.is-expanded {
  flex: 1;
  opacity: 1;
  overflow: visible;
}

.nav-module.is-bubble {
  flex: 0 0 clamp(65px, 8vw, 76px);
  border-radius: 50%;
  opacity: 1;
  cursor: pointer;
}
.nav-module.is-bubble:active { transform: scale(0.92); }

.nav-module.is-hidden {
  flex: 0 0 0;
  opacity: 0;
  margin: 0;
  padding: 0;
  pointer-events: none;
  border: none;
  overflow: hidden;
}

/* ==================================================
   5. CRISTAL (Solución de Fondo Transparente)
   ================================================== */
.global-nav-container.is-glass .nav-module {
  background: transparent !important;
  box-shadow: none !important;
}

.glass-bg-pill {
  position: absolute; top: 0; left: 0; 
  height: 100%; width: calc(100% - 77px);
  border-radius: 35px; overflow: hidden; z-index: 0; pointer-events: none;
}
.glass-bg-pill.full-pill { width: 100%; }

.glass-bg-circle {
  position: absolute; top: 0; right: 0; 
  height: 100%; width: clamp(65px, 8vw, 76px);
  border-radius: 50%; overflow: hidden; z-index: 0; pointer-events: none;
}
.bubble-mode .glass-bg-circle { width: 100%; left: 0; right: auto; }

/* Destellos del borde */
.glass-bg-pill::after, .glass-bg-circle::after {
  content: ''; position: absolute; inset: 0; border-radius: inherit; padding: 2.4px; pointer-events: none; z-index: 1;
  background: conic-gradient(from -45deg, rgba(0, 0, 0, 0.35) 0deg, rgba(0, 0, 0, 0.03) 60deg, rgba(0, 0, 0, 0.03) 150deg, rgba(0, 0, 0, 0.22) 180deg, rgba(0, 0, 0, 0.03) 210deg, rgba(0, 0, 0, 0.03) 300deg, rgba(0, 0, 0, 0.35) 360deg);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude;
}
.glass-bg-pill, .glass-bg-circle { box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.08), 0 0 14px rgba(0, 0, 0, 0.06); }

.ion-palette-dark .glass-bg-pill::after, .ion-palette-dark .glass-bg-circle::after {
  background: conic-gradient(from -45deg, rgba(255, 255, 255, 0.5) 0deg, rgba(255, 255, 255, 0.02) 60deg, rgba(255, 255, 255, 0.02) 150deg, rgba(180, 200, 255, 0.4) 180deg, rgba(255, 255, 255, 0.02) 210deg, rgba(255, 255, 255, 0.02) 300deg, rgba(255, 255, 255, 0.5) 360deg);
}
.ion-palette-dark .glass-bg-pill, .ion-palette-dark .glass-bg-circle {
  box-shadow: inset 0 0 10px rgba(255, 255, 255, 0.1), 0 0 16px rgba(120, 160, 255, 0.12);
}

/* ==================================================
   6. BOTONES E INTERIORES
   ================================================== */
.expanded-mode {
  display: flex; width: 100%; height: 100%;
  animation: fadeContentIn 0.4s 0.2s both; 
}
.bubble-mode {
  position: relative; width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  animation: fadeContentIn 0.3s 0.1s both;
}

.bubble-icon { font-size: 28px; color: var(--ion-color-dark, #1c1c1e); z-index: 10; }
.ion-palette-dark .bubble-icon { color: #ffffff; }
.global-nav-container.is-glass .bubble-icon { color: #1c1c1e !important; }
.ion-palette-dark .global-nav-container.is-glass .bubble-icon { color: #ffffff !important; }

.pill-buttons-container { display: flex; width: calc(100% - 77px); height: 100%; }
.full-width-container { width: 100%; }

.pill-btn {
  background: transparent; border: none; padding: 0; margin: 0;
  display: flex; align-items: center; justify-content: center;
  flex: 1; position: relative; z-index: 10;
  color: var(--ion-color-medium, #8e8e93);
  transition: all 0.3s ease;
}

.pill-left { border-radius: 35px 0 0 35px; padding-left: 5px; }
.pill-mid { border-radius: 0; }
.pill-right { border-radius: 0 35px 35px 0; padding-right: 5px; }

/* Colores de botones en cristal u oscuro */
.global-nav-container.is-glass .pill-btn { color: #3a3a3a !important; }
.ion-palette-dark .global-nav-container.is-glass .pill-btn { color: #9ca3af !important; }
.ion-palette-dark .pill-btn { color: #9ca3af; }

.nav-content {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  width: calc(100% - 5px); 
  height: calc(clamp(65px, 8vw, 76px) - 13px);
  border-radius: 26px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.nav-content ion-icon { font-size: 28px; display: block; }

.tab-selected .nav-content {
  background-color: #8A2BE2 !important;
  color: #ffffff !important;
  box-shadow: 0 2px 10px rgba(138, 43, 226, 0.3); 
}

/* El círculo de Crear Post */
.circle-btn {
  border-radius: 50%; margin-left: 12px;
  max-width: clamp(65px, 8vw, 76px); min-width: clamp(65px, 8vw, 76px); height: clamp(65px, 8vw, 76px);
  background: var(--ion-card-background, #ffffff);
  color: var(--ion-color-dark, #1c1c1e);
  flex-shrink: 0; display: flex; align-items: center; justify-content: center;
  border: none;
}
.global-nav-container.is-glass .circle-btn { background: transparent !important; color: #1c1c1e !important; }
.ion-palette-dark .global-nav-container.is-glass .circle-btn { color: #ffffff !important; }
.ion-palette-dark .circle-btn { background: #1c1c1e; color: #ffffff; }

.header-avatar { width: 34px; height: 34px; display: inline-flex; align-items: center; justify-content: center; }
.header-avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
.notification-button-wrapper { position: relative; display: inline-flex; align-items: center; justify-content: center; }
.notification-badge { position: absolute; top: -4px; right: 0px; min-width: 18px; height: 18px; padding: 2px 4px; font-size: 10px; font-weight: bold; border-radius: 9px; display: flex; align-items: center; justify-content: center; }

@keyframes fadeContentIn {
  0% { opacity: 0; transform: scale(0.9); }
  100% { opacity: 1; transform: scale(1); }
}
</style>