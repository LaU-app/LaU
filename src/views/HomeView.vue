<template>
    <ion-page>
        <AppHeader :isDarkMode="isDarkMode" :user="user" :isAuthenticated="isAuthenticated"
            @toggleDarkMode="toggleDarkMode" />

        <FloatingAudioPlayer v-show="!loading && !isRefreshing && !isProgrammaticRefreshing" />

        <ion-content ref="contentRef" :scroll-events="true" @ionScroll="trackScroll">
            <!-- Pull to Refresh -->
            <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
                <ion-refresher-content pulling-icon="chevron-down-circle-outline" pulling-text="Desliza para actualizar"
                    refreshing-spinner="crescent" refreshing-text="Actualizando...">
                </ion-refresher-content>
            </ion-refresher>

            <div class="container">
                <div class="programmatic-refresher" :class="{ 'is-active': isProgrammaticRefreshing }">
                    <ion-spinner name="crescent" color="primary"></ion-spinner>
                </div>

                <div v-if="loading && !isRefreshing" class="loading-container">
                    <ion-spinner name="crescent"></ion-spinner>
                    <ion-text>
                        <p>Cargando posts...</p>
                    </ion-text>
                </div>

                <ion-card v-if="error && !loading" color="danger">
                    <ion-card-content>
                        <p>{{ error }}</p>
                    </ion-card-content>
                </ion-card>

                <div v-if="!loading" class="feed-container">
                    <!-- Card para crear post (solo para autenticados) -->
                    <CreatePostCard v-if="isAuthenticated" :user="user" @post-created="handlePostCreated" />

                    <!-- Encuestas activas (De la rama de Cizar) -->
                    <div v-if="polls.length > 0" class="polls-list">
                        <PollCard v-for="poll in polls" :key="poll.id" :poll="poll"
                            @vote="handlePollVote" @delete="handlePollDelete" />
                    </div>

                    <!-- Filtro de posts (De Master) -->
                    <FilterPosts @filter="handleFilterPosts" />

                    <!-- Lista de posts -->
                    <div class="posts-list">
                        <PostCard v-for="post in posts" :key="post.id" :post="post"
                            v-memo="[post.id, post.likes_count, post.user_has_liked, post.comments_count]"
                            @like="handleLike" @comment="handleComment" @share="handleShare"
                            @imageError="handleImageError" />
                    </div>

                    <ion-card v-if="!loading && !error && posts.length === 0">
                        <ion-card-content class="text-center">
                            <ion-text>
                                <p>No hay posts disponibles</p>
                            </ion-text>
                        </ion-card-content>
                    </ion-card>
                </div>

                <ion-infinite-scroll v-if="!loading && hasMorePages" @ionInfinite="loadMorePosts" threshold="100px">
                    <ion-infinite-scroll-content loading-spinner="bubbles" loading-text="Cargando más posts...">
                    </ion-infinite-scroll-content>
                </ion-infinite-scroll>
            </div>
        </ion-content>

        <CustomBanner :isOpen="showLoginPrompt" title="¡Únete a LaU! 🎓"
            message="Inicia sesión para seguir viendo el feed y aprovechar al máximo todas las funciones de LaU: conecta con estudiantes, comparte material y descubre eventos."
            confirmText="Iniciar Sesión" cancelText="Más tarde" iconColor="purple" @confirm="goToLogin"
            @cancel="closeLoginPrompt">
            <template #icon>
                <img src="/LaU.png" alt="Logo LaU" class="w-10 h-10 object-contain drop-shadow-sm" />
            </template>
        </CustomBanner>

        <CustomBanner :isOpen="showNotificationsPrompt" title="Activar notificaciones 🔔"
            message="Recibe una notificación de inmediato cuando las personas te envíen mensajes, interactúen con tus publicaciones y más."
            confirmText="Activar ahora" :showCancelBtn="false" iconColor="purple"
            iconSizeClass="w-[14rem] h-[10rem] md:w-[16rem] md:h-[13rem]" @confirm="activateNotifications"
            @cancel="closeNotificationsPrompt">
            <template #icon>
                <div class="flex items-center justify-center w-full h-full">
                    <img src="https://res.cloudinary.com/dtmemrt1j/image/upload/v1771856181/Claro_wjfr9i.png"
                        alt="Notificaciones SivarSocial Claro"
                        class="block dark:hidden w-full h-full object-contain drop-shadow-md" />

                    <img src="https://res.cloudinary.com/dtmemrt1j/image/upload/v1771856178/oscuro_ulh7j6.png"
                        alt="Notificaciones SivarSocial Oscuro"
                        class="hidden dark:block w-full h-full object-contain drop-shadow-md" />
                </div>
            </template>
        </CustomBanner>

        <CustomBanner 
            :isOpen="showGlassFeatureBanner" 
            title="¡Nuevo Efecto Cristal! ✨"
            message="Hemos rediseñado LaU con un nuevo estilo flotante y cristalino. ¿Quieres probarlo? Puedes encenderlo o apagarlo cuando quieras desde Ajustes."
            confirmText="¡Probar ahora!" 
            cancelText="Quizás después" 
            iconColor="primary" 
            @confirm="activateGlassMode"
            @cancel="dismissGlassBanner">
            <template #icon>
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #4d8dff;">
                    <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275l5.813 1.912l-5.813 1.912a2 2 0 0 0 -1.275 1.275l-1.912 5.813l-1.912 -5.813a2 2 0 0 0 -1.275 -1.275l-5.813 -1.912l5.813 -1.912a2 2 0 0 0 1.275 -1.275l1.912 -5.813z"></path>
                    <path d="M5 5l-1.5 4.5l-4.5 1.5l4.5 1.5l1.5 4.5l1.5 -4.5l4.5 -1.5l-4.5 -1.5z"></path>
                </svg>
            </template>
        </CustomBanner>

        <CustomBanner :isOpen="showServerBanner" :banner="serverBannerData" @confirm="handleServerBannerAction"
            @cancel="handleServerBannerDismiss" />
    </ion-page>
</template>

<script setup>
// ==========================================
// IMPORTS LIMPIOS Y UNIFICADOS
// ==========================================
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { 
    IonPage, IonContent, IonCard, IonCardContent, 
    IonSpinner, IonText, IonInfiniteScroll, 
    IonInfiniteScrollContent, IonRefresher, IonRefresherContent,
    onIonViewWillEnter, onIonViewWillLeave, alertController, toastController 
} from '@ionic/vue';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

// Componentes
import AppHeader from '@/components/AppHeader.vue';
import CreatePostCard from '@/components/CreatePostCard.vue';
import FilterPosts from '@/components/FilterPosts.vue';
import PostCard from '@/components/PostCard.vue';
import PollCard from '@/components/PollCard.vue';
import CustomBanner from '@/components/CustomBanner.vue';
import FloatingAudioPlayer from '@/components/FloatingAudioPlayer.vue';

// Servicios y Composables
import apiService from '@/services/api';
import postsService from '@/services/postsService';
import pollsService from '@/services/pollsService';
import bannerService from '@/services/bannerService';
import { AuthService } from '@/services/auth';
import { pushNotificationsService } from '@/services/pushNotificationsService';
import { useDarkMode } from '@/utils/useDarkMode';
import { useGlassMode } from '@/utils/useGlassMode';

// ==========================================
// 1. ESTADO GLOBAL (Variables Reactivas)
// ==========================================
const route = useRoute();
const router = useRouter();
const contentRef = ref(null);

const { isDarkMode, toggleDarkMode } = useDarkMode();
const { isGlassMode } = useGlassMode();

// Estado del Feed
const posts = ref([]);
const polls = ref([]); // Agregado de la rama de Cizar
const loading = ref(false);
const error = ref(null);
const currentPage = ref(1);
const lastPage = ref(1);
const hasMorePages = ref(false);
const totalPosts = ref(0);
const feedType = ref('public');
const isRefreshing = ref(false);
const isProgrammaticRefreshing = ref(false);
const currentScrollTop = ref(0);

// Estado de Usuario
const user = ref({ imagen_url: null, name: 'Invitado', username: 'invitado' });
const isAuthenticated = ref(false);

// Estado de Banners y Alertas
const showLoginPrompt = ref(false);
const showNotificationsPrompt = ref(false);
const showGlassFeatureBanner = ref(false);
const showServerBanner = ref(false);
const serverBannerData = ref(null);
const noMoreBanners = ref(false);
let alertTimer = null;

// ==========================================
// 2. LÓGICA DE USUARIO Y AUTENTICACIÓN
// ==========================================
const loadCurrentUser = async () => {
    try {
        const localUser = AuthService.getUser();
        if (localUser) user.value = localUser;

        try {
            const apiUser = await AuthService.fetchProfile();
            if (apiUser) user.value = apiUser;
        } catch (apiError) {
            console.warn('No se pudo validar el token con la API:', apiError);
            if (apiError.response?.status === 401) {
                AuthService.logout();
                router.replace('/login');
            } else if (!localUser) {
                router.replace('/login');
            }
        }
    } catch (err) {
        console.error('Error cargando usuario:', err);
        if (!AuthService.isAuthenticated()) router.replace('/login');
    }
};

const showLoginAlert = () => {
    if (!isAuthenticated.value && route.path === '/tabs/tab1') {
        showLoginPrompt.value = true;
    }
};

const goToLogin = () => {
    showLoginPrompt.value = false;
    router.push('/login');
};

const closeLoginPrompt = () => {
    showLoginPrompt.value = false;
};

// ==========================================
// 3. LÓGICA DEL FEED Y ENCUESTAS (Integrado)
// ==========================================
const fetchPosts = async (page = 1) => {
    loading.value = page === 1 && !isProgrammaticRefreshing.value;
    error.value = null;

    const result = await postsService.fetchPosts(page);

    if (result.success) {
        if (page === 1) {
            posts.value = result.data;
        } else {
            posts.value = [...posts.value, ...result.data];
        }
        currentPage.value = result.pagination.currentPage;
        lastPage.value = result.pagination.lastPage;
        hasMorePages.value = result.pagination.hasMorePages;
        totalPosts.value = result.pagination.total || 0;
        feedType.value = result.feedType || 'public';
    } else {
        error.value = result.error;
        feedType.value = result.feedType || 'error';
        if (page === 1) posts.value = [];
        if (result.error.includes('Sesión expirada')) router.replace('/login');
    }
    loading.value = false;
};

const fetchPolls = async () => {
    const result = await pollsService.getPolls(1);
    if (result.success) {
        polls.value = result.data;
    }
};

const loadMorePosts = async (event) => {
    if (currentPage.value < lastPage.value) {
        await fetchPosts(currentPage.value + 1);
    }
    event.target.complete();
};

const handleRefresh = async (event) => {
    isRefreshing.value = true;
    currentPage.value = 1;
    // Ejecutamos ambas peticiones en paralelo para mayor velocidad
    await Promise.all([fetchPosts(1), fetchPolls()]);
    isRefreshing.value = false;
    event.target.complete();
};

const handlePostCreated = (newPost) => {
    fetchPosts(1);
};

const handleFilterPosts = (filterData) => {
    // Aquí implementas la lógica de tu filtro
    console.log("Filtro aplicado:", filterData);
};

// ==========================================
// 4. INTERACCIONES (Likes, Comentarios, Compartir, Votos)
// ==========================================
const handleLike = async (postId) => {
    const postIndex = posts.value.findIndex(p => p.id === postId);
    if (postIndex === -1) return;

    const previousLikedState = posts.value[postIndex].user_has_liked;
    const previousLikesCount = posts.value[postIndex].likes_count || 0;

    posts.value[postIndex].user_has_liked = !previousLikedState;
    posts.value[postIndex].likes_count = posts.value[postIndex].user_has_liked
        ? previousLikesCount + 1
        : Math.max(0, previousLikesCount - 1);

    const result = await postsService.likePost(postId);

    if (result.success && result.data) {
        posts.value[postIndex].user_has_liked = result.data.user_has_liked !== undefined 
            ? result.data.user_has_liked : !previousLikedState;
        posts.value[postIndex].likes_count = result.data.likes_count !== undefined 
            ? result.data.likes_count : posts.value[postIndex].likes_count;
    } else {
        posts.value[postIndex].user_has_liked = previousLikedState;
        posts.value[postIndex].likes_count = previousLikesCount;
    }
};

const handleComment = (postId) => router.push(`/tabs/post/${postId}`);

const handleShare = async (postId) => {
    const result = await postsService.sharePost(postId);
    if (result.success) console.log('Post compartido');
};

const handleImageError = (event) => {
    console.warn('Error al cargar imagen:', event.target?.src);
};

// Votación de encuestas
const handlePollVote = async ({ pollId, optionId }) => {
    const pollIndex = polls.value.findIndex(p => p.id === pollId);
    if (pollIndex === -1) return;

    const result = await pollsService.voteOnPoll(pollId, optionId);

    if (result.success && result.data) {
        polls.value[pollIndex].options = result.data.options;
        polls.value[pollIndex].user_has_voted = true;
    } else {
        const toast = await toastController.create({
            message: result.error || 'Error al votar',
            duration: 3000,
            color: 'danger',
            position: 'top'
        });
        await toast.present();
    }
};

// Eliminación de encuestas
const handlePollDelete = async (pollId) => {
    const result = await pollsService.deletePoll(pollId);

    if (result.success) {
        polls.value = polls.value.filter(p => p.id !== pollId);
        const toast = await toastController.create({
            message: result.message || 'Encuesta eliminada',
            duration: 2000,
            color: 'success',
            position: 'top'
        });
        await toast.present();
    } else {
        const toast = await toastController.create({
            message: result.error || 'Error al eliminar la encuesta',
            duration: 3000,
            color: 'danger',
            position: 'top'
        });
        await toast.present();
    }
};

// ==========================================
// 5. SCROLL Y GESTOS MÁGICOS
// ==========================================
const trackScroll = (event) => {
    currentScrollTop.value = event.detail.scrollTop;
};

const onHomeTabDoubleClicked = async () => {
    if (route.path !== '/tabs/tab1') return;

    if (currentScrollTop.value > 10) {
        if (contentRef.value) contentRef.value.$el.scrollToTop(500);
        setTimeout(async () => {
            isProgrammaticRefreshing.value = true;
            currentPage.value = 1;
            await fetchPosts(1);
            isProgrammaticRefreshing.value = false;
        }, 500);
    } else {
        isProgrammaticRefreshing.value = true;
        currentPage.value = 1;
        await fetchPosts(1);
        isProgrammaticRefreshing.value = false;
    }
};

// ==========================================
// 6. LÓGICA DE BANNERS Y NOTIFICACIONES
// ==========================================
const checkServerBanner = async () => {
    if (noMoreBanners.value) return;

    const result = await bannerService.getActiveBanner();
    const bannerReal = result?.data ? result.data : result;

    if (bannerReal && bannerReal.id) {
        serverBannerData.value = bannerReal;
        setTimeout(() => { showServerBanner.value = true; }, 500);
    } else {
        noMoreBanners.value = true;
    }
};

const handleServerBannerAction = async (banner) => {
    showServerBanner.value = false;
    await bannerService.markAsViewed(banner.id);
    if (banner.action_url) {
        if (banner.action_url.startsWith('http')) window.open(banner.action_url, '_blank');
        else router.push(banner.action_url);
    }
};

const handleServerBannerDismiss = async (banner) => {
    showServerBanner.value = false;
    await bannerService.markAsViewed(banner.id);
};

const activateNotifications = async () => {
    showNotificationsPrompt.value = false;
    localStorage.setItem('has_asked_notifications', 'true');

    if (pushNotificationsService.isAvailable()) {
        try {
            await pushNotificationsService.initialize(true);
            localStorage.setItem('notifications_granted', 'true');
        } catch (error) {
            console.error("Error al activar:", error);
        }
    }
};

const closeNotificationsPrompt = () => {
    showNotificationsPrompt.value = false;
    localStorage.setItem('has_asked_notifications', 'true');
};

const dismissGlassBanner = () => {
    showGlassFeatureBanner.value = false;
    localStorage.setItem('has_seen_glass_banner', 'true');
};

const activateGlassMode = () => {
    isGlassMode.value = true;
    dismissGlassBanner();
};

// ==========================================
// 7. ACTUALIZACIONES OTA
// ==========================================
const checkForUpdates = async () => {
    if (!Capacitor.isNativePlatform()) return;
    try {
        const appInfo = await CapacitorApp.getInfo();
        const response = await apiService.checkAppUpdate(appInfo.version);
        const data = response.data;
        const lastAttemptedVersion = localStorage.getItem('last_ota_version');

        if (data.update_available && lastAttemptedVersion !== data.version) {
            const newVersion = await CapacitorUpdater.download({ url: data.zip_url, version: data.version });
            localStorage.setItem('pending_update_id', newVersion.id);
            localStorage.setItem('last_ota_version', data.version);
        }
    } catch (error) {
        console.error('Error al buscar actualizaciones:', error);
    }
};

// ==========================================
// 8. CICLO DE VIDA (Lifecycle Hooks)
// ==========================================
onMounted(async () => {
    isAuthenticated.value = AuthService.isAuthenticated();

    if (isAuthenticated.value) {
        await loadCurrentUser();
        await checkServerBanner();
        
        const hasSeenGlassBanner = localStorage.getItem('has_seen_glass_banner');
        if (!hasSeenGlassBanner) setTimeout(() => { showGlassFeatureBanner.value = true; }, 1000);

        const hasAsked = localStorage.getItem('has_asked_notifications');
        if (!hasAsked) setTimeout(() => { showNotificationsPrompt.value = true; }, 3000);
    }

    fetchPosts();
    fetchPolls(); // Inicializar encuestas al cargar
    checkForUpdates();
    
    window.addEventListener('home-tab-clicked', onHomeTabDoubleClicked);
});

onBeforeUnmount(() => {
    if (alertTimer) clearTimeout(alertTimer);
    window.removeEventListener('home-tab-clicked', onHomeTabDoubleClicked);
});

onIonViewWillEnter(() => {
    isAuthenticated.value = AuthService.isAuthenticated();
    const state = window.history.state;

    if (isAuthenticated.value && user.value.username === 'invitado') {
        loadCurrentUser();
        fetchPosts();
        fetchPolls();
    } else if (isAuthenticated.value && state?.postCreated) {
        fetchPosts(1);
        window.history.replaceState({ ...state, postCreated: false }, '');
    } else if (state?.postDeleted) {
        fetchPosts(1);
        window.history.replaceState({ ...state, postDeleted: false }, '');
    } else if (state?.pollCreated) { // Lógica de encuestas incorporada a la vista
        fetchPolls();
        window.history.replaceState({ ...state, pollCreated: false }, '');
    }

    if (!isAuthenticated.value && !alertTimer) {
        alertTimer = setTimeout(() => { showLoginAlert(); }, 8000);
    }
});

onIonViewWillLeave(() => {
    if (alertTimer) {
        clearTimeout(alertTimer);
        alertTimer = null;
    }
});
</script>

<style scoped>
@import '../theme/colors.css';
@import '../theme/home.css';

.posts-list {
    display: flex;
    flex-direction: column;
    gap: 0;
}

.polls-list {
    display: flex;
    flex-direction: column;
    gap: 0;
    padding: 0 16px;
    margin-bottom: 8px;
}

/* Estilos personalizados para el alert */
:global(.custom-alert) {
    --backdrop-opacity: 0.6;
}

:global(.custom-alert .alert-wrapper) {
    border-radius: 16px;
    padding: 0;
    background: #FFFFFF;
}

:global(.custom-alert .alert-head) {
    padding: 20px 20px 12px 20px;
}

:global(.custom-alert .alert-title) {
    font-size: 1.25rem;
    font-weight: 700;
    color: #1F2937;
}

:global(.custom-alert .alert-message) {
    color: #4B5563;
    line-height: 1.6;
    padding: 0 20px 20px 20px;
    font-size: 0.95rem;
}

:global(.custom-alert .alert-button-group) {
    padding: 0;
    border-top: 1px solid #E5E7EB;
}

:global(.alert-button-cancel) {
    color: #6B7280 !important;
    font-weight: 500 !important;
}

:global(.alert-button-confirm) {
    color: #8A2BE2 !important;
    font-weight: 700 !important;
}

/* Dark mode para el alert */
:global(.ion-palette-dark .custom-alert .alert-wrapper) {
    background: #1E1E1E;
}

:global(.ion-palette-dark .custom-alert .alert-title) {
    color: #E5E7EB;
}

:global(.ion-palette-dark .custom-alert .alert-message) {
    color: #9CA3AF;
}

:global(.ion-palette-dark .custom-alert .alert-button-group) {
    border-top-color: #374151;
}

.container {
    width: 100% !important;
    max-width: 100% !important;
}

/* --- Refresher Programático --- */
.programmatic-refresher {
    height: 0;
    opacity: 0;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    /* Animación idéntica a la nativa de iOS/Android */
    transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1); 
}

.programmatic-refresher.is-active {
    height: 60px;
    opacity: 1;
    margin-top: 10px;
    margin-bottom: 10px;
}
</style>