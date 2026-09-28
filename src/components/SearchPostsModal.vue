<template>
  <ion-modal
    :is-open="isOpen"
    :initial-breakpoint="0.92"
    :breakpoints="[0, 0.92, 1]"
    class="search-modal"
    @willPresent="onWillPresent"
    @didPresent="onDidPresent"
    @didDismiss="close"
  >
    <ion-header class="ion-no-border search-header">
      <ion-toolbar class="search-toolbar">
        <ion-searchbar
          ref="searchbarRef"
          v-model="searchQuery"
          class="search-input"
          placeholder="Busca publicaciones o personas"
          show-cancel-button="always"
          cancel-button-text="Cerrar"
          show-clear-button="always"
          inputmode="search"
          enterkeyhint="search"
          @ionInput="scheduleSearch"
          @ionChange="commitQuery"
          @ionCancel="close"
          @keyup.enter="blurSearchInput"
        ></ion-searchbar>
      </ion-toolbar>

      <div class="filter-row" role="group" aria-label="Filtrar por universidad y carrera">
        <div class="filter-chip" :class="{ 'is-active': filters.universidad_id }">
          <ion-icon :icon="schoolOutline" class="filter-chip-icon" aria-hidden="true"></ion-icon>
          <ion-select
            class="filter-select"
            aria-label="Universidad"
            placeholder="Universidad"
            interface="action-sheet"
            :interface-options="{ header: 'Filtrar por universidad' }"
            :toggle-icon="chevronDownOutline"
            :value="filters.universidad_id"
            @ionChange="onUniversidadChange"
          >
            <ion-select-option v-for="uni in universidades" :key="uni.id" :value="uni.id">
              {{ uni.nombre }}
            </ion-select-option>
          </ion-select>
        </div>

        <div
          class="filter-chip"
          :class="{ 'is-active': filters.carrera_id, 'is-disabled': !filters.universidad_id }"
        >
          <ion-icon :icon="libraryOutline" class="filter-chip-icon" aria-hidden="true"></ion-icon>
          <ion-select
            class="filter-select"
            aria-label="Carrera"
            placeholder="Carrera"
            interface="action-sheet"
            :interface-options="{ header: 'Filtrar por carrera' }"
            :toggle-icon="chevronDownOutline"
            :disabled="!filters.universidad_id || loadingCarreras"
            :value="filters.carrera_id"
            @ionChange="onCarreraChange"
          >
            <ion-select-option v-for="carrera in carreras" :key="carrera.id" :value="carrera.id">
              {{ carrera.nombre }}
            </ion-select-option>
          </ion-select>
        </div>

        <button
          v-if="hasActiveFilters"
          type="button"
          class="filter-clear"
          aria-label="Quitar filtros"
          @click="clearFilters"
        >
          <ion-icon :icon="closeOutline" aria-hidden="true"></ion-icon>
        </button>
      </div>

      <ion-progress-bar
        v-if="isSearching"
        type="indeterminate"
        class="search-progress"
      ></ion-progress-bar>
    </ion-header>

    <ion-content class="search-content">
      <p class="sr-only" role="status" aria-live="polite">{{ statusMessage }}</p>

      <!-- Sin término ni filtros: recientes y ayuda -->
      <div v-if="view === 'idle'" class="idle-state">
        <section v-if="recentSearches.length > 0" class="recent-searches">
          <header class="section-header">
            <h3 class="section-title">Recientes</h3>
            <button type="button" class="text-button" @click="clearRecentSearches">Borrar todo</button>
          </header>
          <ul class="recent-list">
            <li v-for="(item, index) in recentSearches" :key="item" class="recent-item">
              <button type="button" class="recent-apply" @click="applyRecentSearch(item)">
                <ion-icon :icon="timeOutline" class="recent-icon" aria-hidden="true"></ion-icon>
                <span class="recent-text">{{ item }}</span>
              </button>
              <button
                type="button"
                class="recent-remove"
                :aria-label="`Quitar ${item} de recientes`"
                @click="removeRecentSearch(index)"
              >
                <ion-icon :icon="closeOutline" aria-hidden="true"></ion-icon>
              </button>
            </li>
          </ul>
        </section>

        <section class="search-hints">
          <div class="hints-hero">
            <div class="hints-hero-icon">
              <ion-icon :icon="searchOutline" aria-hidden="true"></ion-icon>
            </div>
            <h3 class="hints-title">Encuentra lo que buscas</h3>
            <p class="hints-description">Escribe arriba o usa los filtros para explorar publicaciones.</p>
          </div>
          <ul class="hint-list">
            <li v-for="hint in hints" :key="hint.title" class="hint-item">
              <span class="hint-icon" aria-hidden="true"><ion-icon :icon="hint.icon"></ion-icon></span>
              <span class="hint-body">
                <span class="hint-title">{{ hint.title }}</span>
                <span class="hint-example">{{ hint.example }}</span>
              </span>
            </li>
          </ul>
        </section>
      </div>

      <!-- Primera carga -->
      <div v-else-if="view === 'loading'" class="skeleton-list" aria-hidden="true">
        <div v-for="n in 3" :key="n" class="skeleton-card">
          <div class="skeleton-head">
            <span class="skeleton skeleton-avatar"></span>
            <span class="skeleton-lines">
              <span class="skeleton skeleton-line" style="width: 45%"></span>
              <span class="skeleton skeleton-line" style="width: 25%"></span>
            </span>
          </div>
          <span class="skeleton skeleton-line" style="width: 92%"></span>
          <span class="skeleton skeleton-line" style="width: 70%"></span>
        </div>
      </div>

      <!-- Error -->
      <div v-else-if="view === 'error'" class="message-state">
        <div class="message-icon">
          <ion-icon :icon="cloudOfflineOutline" aria-hidden="true"></ion-icon>
        </div>
        <h3 class="message-title">No pudimos buscar</h3>
        <p class="message-text">{{ searchError }}</p>
        <ion-button class="message-action" shape="round" @click="runSearch">Reintentar</ion-button>
      </div>

      <!-- Sin resultados -->
      <div v-else-if="view === 'empty'" class="message-state">
        <div class="message-icon">
          <ion-icon :icon="searchOutline" aria-hidden="true"></ion-icon>
        </div>
        <h3 class="message-title">Sin resultados</h3>
        <p v-if="trimmedQuery" class="message-text">
          No encontramos publicaciones con <strong>“{{ trimmedQuery }}”</strong><template v-if="hasActiveFilters"> con estos filtros</template>.
        </p>
        <p v-else class="message-text">Todavía no hay publicaciones de esta universidad o carrera.</p>
        <p v-if="resultsScope === 'recent'" class="message-hint">
          La búsqueda revisa las publicaciones más recientes. Prueba con otras palabras o con el nombre de la persona.
        </p>
        <ion-button
          v-if="hasActiveFilters"
          class="message-action"
          fill="outline"
          shape="round"
          @click="clearFilters"
        >
          Quitar filtros
        </ion-button>
      </div>

      <!-- Resultados -->
      <div v-else class="search-results">
        <div class="results-header">
          <span class="results-count">{{ resultsLabel }}</span>
          <span v-if="resultsScope === 'recent'" class="results-scope">en publicaciones recientes</span>
        </div>
        <div class="results-list">
          <PostCard
            v-for="post in searchResults"
            :key="post.id"
            :post="post"
            @like="handleLike"
            @comment="openPost"
            @share="$emit('share', $event)"
            @imageError="handleImageError"
          />
        </div>

        <ion-infinite-scroll
          v-if="pagination.hasMorePages && !loadMoreFailed"
          threshold="200px"
          @ionInfinite="loadMore"
        >
          <ion-infinite-scroll-content
            loading-spinner="crescent"
            loading-text="Cargando más resultados..."
          ></ion-infinite-scroll-content>
        </ion-infinite-scroll>

        <div v-if="loadMoreFailed" class="load-more-error">
          <span>No se pudieron cargar más resultados.</span>
          <button type="button" class="text-button" @click="retryLoadMore">Reintentar</button>
        </div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup>
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonSearchbar,
  IonContent,
  IonIcon,
  IonButton,
  IonSelect,
  IonSelectOption,
  IonProgressBar,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
} from "@ionic/vue";
import {
  atOutline,
  chevronDownOutline,
  closeOutline,
  cloudOfflineOutline,
  documentTextOutline,
  libraryOutline,
  schoolOutline,
  searchOutline,
  timeOutline,
} from "ionicons/icons";
import { computed, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import PostCard from "@/components/PostCard.vue";
import postsService from "@/services/postsService";
import { UniversidadService } from "@/services/universidad";
import { AuthService } from "@/services/auth";

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "share", "post-updated"]);

const DEBOUNCE_MS = 350;
const RECENT_MAX = 8;

const hints = [
  { icon: documentTextOutline, title: "Por contenido", example: "Ej.: parcial de cálculo" },
  { icon: atOutline, title: "Por persona", example: "Nombre o @usuario" },
  { icon: schoolOutline, title: "Por universidad y carrera", example: "Usa los filtros de arriba" },
];

const route = useRoute();
const router = useRouter();
const searchbarRef = ref(null);

const searchQuery = ref("");
const filters = reactive({ universidad_id: null, carrera_id: null });
const universidades = ref([]);
const carreras = ref([]);
const loadingCarreras = ref(false);

const searchResults = ref([]);
const resultsScope = ref(null);
const isSearching = ref(false);
const searchError = ref(null);
const recentSearches = ref([]);
const pagination = ref({ currentPage: 1, hasMorePages: false, total: 0 });
const loadMoreFailed = ref(false);

const trimmedQuery = computed(() => searchQuery.value.trim());
const hasActiveFilters = computed(() => Boolean(filters.universidad_id || filters.carrera_id));
const hasCriteria = computed(() => Boolean(trimmedQuery.value) || hasActiveFilters.value);

const view = computed(() => {
  if (!hasCriteria.value) return "idle";
  if (searchResults.value.length > 0) return "results";
  if (isSearching.value) return "loading";
  if (searchError.value) return "error";
  return "empty";
});

const resultsLabel = computed(() => {
  // El servidor informa el total aunque todavía no se hayan cargado todas las páginas
  const total = Math.max(pagination.value.total, searchResults.value.length);
  return `${total} ${total === 1 ? "resultado" : "resultados"}`;
});

const statusMessage = computed(() => {
  if (view.value === "loading") return "Buscando publicaciones";
  if (view.value === "results") return resultsLabel.value;
  if (view.value === "empty") return "Sin resultados";
  if (view.value === "error") return searchError.value;
  return "";
});

// ---------- Búsqueda ----------
let debounceTimer = null;
let searchSeq = 0;
let rememberPending = false;
let lastSearchedQuery = null;
// Criterios de la última búsqueda terminada: "cargar más" pide sus páginas
// aunque el usuario ya esté escribiendo otra cosa
let lastCriteria = null;

const setPagination = (value) => {
  pagination.value = {
    currentPage: value?.currentPage ?? 1,
    hasMorePages: Boolean(value?.hasMorePages),
    total: value?.total ?? 0,
  };
  loadMoreFailed.value = false;
};

const resetResults = () => {
  // Invalida cualquier respuesta que siga en camino
  searchSeq++;
  clearTimeout(debounceTimer);
  debounceTimer = null;
  isSearching.value = false;
  searchResults.value = [];
  searchError.value = null;
  resultsScope.value = null;
  lastSearchedQuery = null;
  lastCriteria = null;
  setPagination(null);
};

const scheduleSearch = () => {
  clearTimeout(debounceTimer);
  if (!hasCriteria.value) {
    resetResults();
    return;
  }
  // Se marca desde ya para no mostrar "Sin resultados" de la consulta anterior
  isSearching.value = true;
  debounceTimer = setTimeout(runSearch, DEBOUNCE_MS);
};

const runSearch = async () => {
  clearTimeout(debounceTimer);
  debounceTimer = null;
  if (!hasCriteria.value) {
    resetResults();
    return;
  }

  const seq = ++searchSeq;
  const criteria = { query: trimmedQuery.value, filters: { ...filters } };
  isSearching.value = true;
  searchError.value = null;

  const result = await postsService.searchPosts(criteria.query, criteria.filters);
  // Llegó tarde: ya se lanzó una búsqueda más nueva
  if (seq !== searchSeq) return;

  isSearching.value = false;
  lastSearchedQuery = criteria.query;
  lastCriteria = criteria;
  if (result.success) {
    searchResults.value = result.data;
    resultsScope.value = result.scope;
    setPagination(result.pagination);
  } else {
    searchResults.value = [];
    resultsScope.value = null;
    setPagination(null);
    searchError.value = result.error || "No se pudo completar la búsqueda.";
  }

  if (rememberPending) rememberQuery();
};

const loadMore = async (event) => {
  const seq = searchSeq;
  const criteria = lastCriteria;
  if (!criteria || !pagination.value.hasMorePages) {
    event?.target?.complete();
    return;
  }

  const result = await postsService.searchPosts(criteria.query, criteria.filters, pagination.value.currentPage + 1);

  // Si mientras tanto se lanzó otra búsqueda, estas páginas ya no aplican
  if (seq === searchSeq) {
    if (result.success) {
      // Un post nuevo puede correr la paginación y repetir uno ya mostrado
      const shown = new Set(searchResults.value.map((post) => post.id));
      searchResults.value = [...searchResults.value, ...result.data.filter((post) => !shown.has(post.id))];
      setPagination(result.pagination);
    } else {
      loadMoreFailed.value = true;
    }
  }
  event?.target?.complete();
};

const retryLoadMore = () => {
  loadMoreFailed.value = false;
  loadMore();
};

// ionChange solo se dispara al confirmar (Enter o al salir del campo)
const commitQuery = () => {
  rememberPending = true;
  if (debounceTimer) runSearch();
  else rememberQuery();
};

const blurSearchInput = async () => {
  const input = await searchbarRef.value?.$el?.getInputElement?.();
  input?.blur();
};

// ---------- Búsquedas recientes (por cuenta, en este dispositivo) ----------
const recentKey = () => `recent_searches_${AuthService.getUser()?.id || "guest"}`;

const loadRecentSearches = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(recentKey()) || "[]");
    recentSearches.value = Array.isArray(saved)
      ? saved.filter((item) => typeof item === "string").slice(0, RECENT_MAX)
      : [];
  } catch {
    recentSearches.value = [];
  }
};

const persistRecentSearches = () => {
  try {
    if (recentSearches.value.length > 0) {
      localStorage.setItem(recentKey(), JSON.stringify(recentSearches.value));
    } else {
      localStorage.removeItem(recentKey());
    }
  } catch {
    // Sin almacenamiento disponible solo se pierde el historial
  }
};

// Solo se guardan búsquedas confirmadas que dieron resultados
const rememberQuery = () => {
  if (isSearching.value) return;
  rememberPending = false;

  const query = trimmedQuery.value;
  if (!query || lastSearchedQuery !== query || searchResults.value.length === 0) return;

  recentSearches.value = [query, ...recentSearches.value.filter((item) => item !== query)].slice(0, RECENT_MAX);
  persistRecentSearches();
};

const applyRecentSearch = (query) => {
  searchQuery.value = query;
  rememberPending = true;
  runSearch();
};

const removeRecentSearch = (index) => {
  recentSearches.value.splice(index, 1);
  persistRecentSearches();
};

const clearRecentSearches = () => {
  recentSearches.value = [];
  persistRecentSearches();
};

// ---------- Filtros ----------
// La API a veces responde { data: [...] } y a veces el arreglo directo
const asList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const loadUniversidades = async () => {
  if (universidades.value.length > 0) return;
  try {
    universidades.value = asList(await UniversidadService.getUniversidades());
  } catch {
    universidades.value = [];
  }
};

const onUniversidadChange = async (event) => {
  const universidadId = event.detail.value ?? null;
  filters.universidad_id = universidadId;
  filters.carrera_id = null;
  carreras.value = [];
  runSearch();

  if (!universidadId) return;
  loadingCarreras.value = true;
  try {
    const list = asList(await UniversidadService.getCarreras(universidadId));
    // Si mientras tanto eligieron otra universidad, estas carreras ya no aplican
    if (filters.universidad_id === universidadId) carreras.value = list;
  } catch {
    carreras.value = [];
  } finally {
    loadingCarreras.value = false;
  }
};

const onCarreraChange = (event) => {
  filters.carrera_id = event.detail.value ?? null;
  runSearch();
};

const clearFilters = () => {
  filters.universidad_id = null;
  filters.carrera_id = null;
  carreras.value = [];
  runSearch();
};

// ---------- Interacciones con los resultados ----------
const handleLike = async (postId) => {
  const post = searchResults.value.find((item) => item.id === postId);
  if (!post) return;

  const previous = { user_has_liked: post.user_has_liked, likes_count: post.likes_count || 0 };
  post.user_has_liked = !previous.user_has_liked;
  post.likes_count = post.user_has_liked ? previous.likes_count + 1 : Math.max(0, previous.likes_count - 1);

  const result = await postsService.likePost(postId);

  if (result.success && result.data) {
    if (result.data.user_has_liked !== undefined) post.user_has_liked = result.data.user_has_liked;
    if (result.data.likes_count !== undefined) post.likes_count = result.data.likes_count;
    // El feed tiene su propia copia del post: se le avisa para que no quede desfasado
    emit("post-updated", { id: postId, user_has_liked: post.user_has_liked, likes_count: post.likes_count });
  } else {
    Object.assign(post, previous);
  }
};

const openPost = (postId) => {
  router.push(`/tabs/post/${postId}`);
};

const handleImageError = (event) => {
  console.warn("Error al cargar imagen:", event.target?.src);
};

// ---------- Ciclo de vida del modal ----------
const close = () => emit("close");

const onWillPresent = () => {
  loadRecentSearches();
  loadUniversidades();
  // Cada apertura parte de publicaciones frescas
  postsService.clearSearchCache();
  if (hasCriteria.value) runSearch();
};

const onDidPresent = () => {
  if (!searchQuery.value) searchbarRef.value?.$el?.setFocus?.();
};

// Al abrir un post (tocando la tarjeta o sus comentarios) el modal no debe quedar encima
watch(
  () => route.fullPath,
  () => {
    if (props.isOpen) close();
  },
);
</script>

<style scoped>
/* Tokens propios: el modal se monta fuera de la página y no hereda las variables del feed */
.search-modal {
  --search-bg: #f3f4f6;
  --search-surface: #ffffff;
  --search-text: #1f2937;
  --search-muted: #6b7280;
  --search-border: #e5e7eb;
  --search-input-bg: #f3f4f6;
  --search-accent: #8a2be2;
  --search-accent-soft: rgba(138, 43, 226, 0.1);
  --search-accent-border: rgba(138, 43, 226, 0.35);
  --search-skeleton: #e5e7eb;
  --backdrop-opacity: 0.4;
}

.ion-palette-dark .search-modal {
  --search-bg: #121212;
  --search-surface: #1e1e1e;
  --search-text: #e5e7eb;
  --search-muted: #9ca3af;
  --search-border: #374151;
  --search-input-bg: #2a2a2a;
  --search-accent: #b983ff;
  --search-accent-soft: rgba(138, 43, 226, 0.22);
  --search-accent-border: rgba(185, 131, 255, 0.45);
  --search-skeleton: #2d2d2d;
}

.search-modal::part(content) {
  border-radius: 20px 20px 0 0;
  background: var(--search-bg);
}

.search-modal::part(handle) {
  background: var(--search-border);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* ========== CABECERA ========== */
.search-header {
  background: var(--search-surface);
  border-bottom: 1px solid var(--search-border);
}

.search-toolbar {
  --background: var(--search-surface);
  --color: var(--search-text);
  --border-color: transparent;
  --padding-top: 10px;
  --padding-bottom: 0;
}

.search-input {
  --background: var(--search-input-bg);
  --color: var(--search-text);
  --placeholder-color: var(--search-muted);
  --placeholder-opacity: 1;
  --icon-color: var(--search-muted);
  --clear-button-color: var(--search-muted);
  --cancel-button-color: var(--search-accent);
  --border-radius: 12px;
  --box-shadow: none;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 16px 12px;
}

.filter-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 0 1 auto;
  min-width: 0;
  max-width: 50%;
  height: 34px;
  padding: 0 10px 0 12px;
  border-radius: 999px;
  border: 1px solid var(--search-border);
  background: var(--search-surface);
  color: var(--search-muted);
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.filter-chip.is-active {
  background: var(--search-accent-soft);
  border-color: var(--search-accent-border);
  color: var(--search-accent);
}

.filter-chip.is-disabled {
  opacity: 0.5;
}

.filter-chip-icon {
  flex-shrink: 0;
  font-size: 16px;
}

.filter-select {
  flex: 1;
  min-width: 0;
  min-height: 32px;
  --padding-start: 0;
  --padding-end: 0;
  --padding-top: 0;
  --padding-bottom: 0;
  --placeholder-color: currentColor;
  --placeholder-opacity: 1;
  /* Sin la línea de foco de Material: el chip ya marca el estado */
  --highlight-height: 0;
  --highlight-color-focused: transparent;
  --highlight-color-valid: transparent;
  --highlight-color-invalid: transparent;
  color: inherit;
  font-size: 13px;
  font-weight: 600;
}

.filter-select::part(icon) {
  width: 14px;
  height: 14px;
  margin-inline-start: 4px;
  color: currentColor;
  opacity: 0.8;
}

.filter-select.select-disabled {
  opacity: 1;
}

.filter-clear {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--search-input-bg);
  color: var(--search-muted);
  font-size: 18px;
  cursor: pointer;
}

.search-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  --background: transparent;
  --progress-background: var(--search-accent);
}

/* ========== CONTENIDO ========== */
.search-content {
  --background: var(--search-bg);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.section-title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  color: var(--search-muted);
}

.text-button {
  padding: 6px 4px;
  border: none;
  background: none;
  color: var(--search-accent);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

/* ========== ESTADO INICIAL ========== */
.idle-state {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 560px;
  margin: 0 auto;
  padding: 20px 16px 40px;
}

.recent-list {
  margin: 0;
  padding: 4px;
  list-style: none;
  border-radius: 16px;
  background: var(--search-surface);
}

.recent-item {
  display: flex;
  align-items: center;
}

.recent-item + .recent-item {
  border-top: 1px solid var(--search-border);
}

.recent-apply {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
  padding: 12px;
  border: none;
  background: none;
  color: var(--search-text);
  text-align: left;
  cursor: pointer;
}

.recent-icon {
  flex-shrink: 0;
  font-size: 18px;
  color: var(--search-muted);
}

.recent-text {
  overflow: hidden;
  font-size: 15px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Siempre visible: en el celular no existe el hover */
.recent-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: none;
  color: var(--search-muted);
  font-size: 18px;
  cursor: pointer;
}

.search-hints {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.hints-hero-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin: 0 auto 14px;
  border-radius: 50%;
  background: var(--search-accent-soft);
  color: var(--search-accent);
  font-size: 30px;
}

.hints-title {
  margin: 0 0 6px;
  font-size: 18px;
  font-weight: 700;
  color: var(--search-text);
}

.hints-description {
  max-width: 300px;
  margin: 0 auto 20px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--search-muted);
}

.hint-list {
  display: flex;
  flex-direction: column;
  width: 100%;
  margin: 0;
  padding: 4px 0;
  list-style: none;
  border-radius: 16px;
  background: var(--search-surface);
  text-align: left;
}

.hint-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
}

.hint-item + .hint-item {
  border-top: 1px solid var(--search-border);
}

.hint-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: var(--search-accent-soft);
  color: var(--search-accent);
  font-size: 20px;
}

.hint-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.hint-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--search-text);
}

.hint-example {
  font-size: 13px;
  color: var(--search-muted);
}

/* ========== CARGANDO ========== */
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

.skeleton-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  border-radius: 16px;
  background: var(--search-surface);
}

.skeleton-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.skeleton-lines {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.skeleton {
  display: block;
  background: var(--search-skeleton);
  animation: skeleton-pulse 1.2s ease-in-out infinite;
}

.skeleton-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.skeleton-line {
  height: 12px;
  border-radius: 6px;
}

@keyframes skeleton-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.45;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
  }
}

/* ========== MENSAJES (vacío / error) ========== */
.message-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 360px;
  margin: 0 auto;
  padding: 56px 24px 40px;
  text-align: center;
}

.message-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  border-radius: 50%;
  background: var(--search-surface);
  color: var(--search-muted);
  font-size: 30px;
}

.message-title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 700;
  color: var(--search-text);
}

.message-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: var(--search-muted);
  overflow-wrap: anywhere;
}

.message-text strong {
  font-weight: 600;
  color: var(--search-text);
}

.message-hint {
  margin: 12px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--search-muted);
}

.message-action {
  margin-top: 20px;
  --background: var(--search-accent);
  --border-color: var(--search-accent);
  --color: #ffffff;
  text-transform: none;
  font-weight: 600;
}

.message-action[fill="outline"] {
  --background: transparent;
  --color: var(--search-accent);
}

/* ========== RESULTADOS ========== */
/* Mismo ancho y márgenes que el feed (.feed-container) */
.search-results {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 12px 32px;
}

.results-header {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px;
  padding: 14px 4px 8px;
}

.results-count {
  font-size: 14px;
  font-weight: 700;
  color: var(--search-text);
}

.results-scope {
  font-size: 13px;
  color: var(--search-muted);
}

.results-list {
  display: flex;
  flex-direction: column;
}

.load-more-error {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 4px 8px;
  padding: 16px 8px 8px;
  font-size: 13px;
  color: var(--search-muted);
}
</style>
