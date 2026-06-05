<template>
    <ion-page>
        <AppHeader :isDarkMode="isDarkMode" :user="user" :isAuthenticated="isAuthenticated"
            @toggleDarkMode="toggleDarkMode" />

        <FloatingAudioPlayer />

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

<script>
import { IonPage, IonContent, IonCard, IonCardContent, IonSpinner, IonText, IonInfiniteScroll, IonInfiniteScrollContent, IonRefresher, IonRefresherContent, alertController } from '@ionic/vue';
import AppHeader from '@/components/AppHeader.vue';
import CreatePostCard from '@/components/CreatePostCard.vue';
import FilterPosts from '@/components/FilterPosts.vue';
import PostCard from '@/components/PostCard.vue';
import postsService from '@/services/postsService';
import { AuthService } from '@/services/auth';
import { useDarkMode } from '@/utils/useDarkMode';
import CustomBanner from '@/components/CustomBanner.vue';
import bannerService from '@/services/bannerService';
import { ref, onMounted } from 'vue';
import { pushNotificationsService } from '@/services/pushNotificationsService';
import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import apiService from '@/services/api';
import FloatingAudioPlayer from '@/components/FloatingAudioPlayer.vue';
import { App as CapacitorApp } from '@capacitor/app';

import { useGlassMode } from '@/utils/useGlassMode';

export default {
    name: 'HomeView',
    components: { IonPage, IonContent, IonCard, IonCardContent, IonSpinner, IonText, IonInfiniteScroll, IonInfiniteScrollContent, IonRefresher, IonRefresherContent, AppHeader, CreatePostCard, PostCard, CustomBanner, FilterPosts, FloatingAudioPlayer },
    data() {
        return {
            posts: [],
            loading: false,
            error: null,
            currentPage: 1,
            lastPage: 1,
            hasMorePages: false,
            user: { imagen_url: null, name: 'Usuario', username: 'usuario' },
            feedType: 'public', // 'public', 'personalized', o 'error'
            totalPosts: 0,
            alertTimer: null,
            isAuthenticated: false,
            isRefreshing: false,
            showLoginPrompt: false,
            showServerBanner: false,
            serverBannerData: null,
            noMoreBanners: false,
            postFilters: {}, // Filtros activos
            currentScrollTop: 0,
            isProgrammaticRefreshing: false,
        }
    },
    setup() {
        const { isGlassMode } = useGlassMode();
        const showGlassFeatureBanner = ref(false);

        onMounted(() => {
            if (AuthService.isAuthenticated()) {
                const hasSeenGlassBanner = localStorage.getItem('has_seen_glass_banner');
                if (!hasSeenGlassBanner) {
                    setTimeout(() => {
                        showGlassFeatureBanner.value = true;
                    }, 1000); 
                }
            }
        });

        const dismissGlassBanner = () => {
            showGlassFeatureBanner.value = false;
            localStorage.setItem('has_seen_glass_banner', 'true');
        };

        const activateGlassMode = () => {
            isGlassMode.value = true; 
            dismissGlassBanner();
        };

        const checkForUpdates = async () => {
            if (!Capacitor.isNativePlatform()) return;

            try {
                const appInfo = await CapacitorApp.getInfo();
                const currentNativeVersion = appInfo.version; 

                const response = await apiService.checkAppUpdate(currentNativeVersion);
                const data = response.data; 

                const lastAttemptedVersion = localStorage.getItem('last_ota_version');

                if (data.update_available && lastAttemptedVersion !== data.version) {
                console.log('Descargando OTA en segundo plano...');
                
                const newVersion = await CapacitorUpdater.download({
                    url: data.zip_url,
                    version: data.version
                });
                
                localStorage.setItem('pending_update_id', newVersion.id);
                localStorage.setItem('last_ota_version', data.version);
                }
            } catch (error) {
                console.error('Error al buscar actualizaciones:', error);
            }
        };

        const { isDarkMode, toggleDarkMode } = useDarkMode()
        const showNotificationsPrompt = ref(false);

        onMounted(() => {
            checkForUpdates();
            if (!AuthService.isAuthenticated()) {
                console.log("Usuario invitado. No se mostrará el banner de notificaciones.");
                return;
            }

            const hasAsked = localStorage.getItem('has_asked_notifications');

            if (!hasAsked) {
                setTimeout(() => {
                    showNotificationsPrompt.value = true;
                }, 3000);
            }
        });

        const activateNotifications = async () => {
            showNotificationsPrompt.value = false;
            localStorage.setItem('has_asked_notifications', 'true');

            if (pushNotificationsService.isAvailable()) {
                try {
                    await pushNotificationsService.initialize(true);
                    console.log("Notificaciones activadas exitosamente");
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

        return {
            isDarkMode, toggleDarkMode, showNotificationsPrompt, activateNotifications,
            closeNotificationsPrompt,
            isGlassMode,
            showGlassFeatureBanner,
            dismissGlassBanner,
            activateGlassMode
        }
    },
    mounted() {
        window.addEventListener('home-tab-clicked', this.onHomeTabDoubleClicked);
    },
    beforeUnmount() {
        if (this.alertTimer) {
            clearTimeout(this.alertTimer)
            this.alertTimer = null
        }
        window.removeEventListener('home-tab-clicked', this.onHomeTabDoubleClicked);
    },
    async created() {
        this.isAuthenticated = AuthService.isAuthenticated()

        if (this.isAuthenticated) {
            await this.loadCurrentUser();
            await this.checkServerBanner();
        } else {
            this.user = { imagen_url: null, name: 'Invitado', username: 'invitado' }
        }

        this.fetchPosts()
    },
    ionViewWillEnter() {
        this.isAuthenticated = AuthService.isAuthenticated()

        const postCreated = window.history.state?.postCreated
        const postDeleted = window.history.state?.postDeleted

        if (this.isAuthenticated && this.user.username === 'invitado') {
            this.loadCurrentUser()
            this.fetchPosts()
        } else if (this.isAuthenticated && postCreated) {
            this.fetchPosts(1)
            window.history.replaceState({ ...window.history.state, postCreated: false }, '')
        } else if (postDeleted) {
            this.fetchPosts(1)
            window.history.replaceState({ ...window.history.state, postDeleted: false }, '')
        }

        if (!this.isAuthenticated && !this.alertTimer) {
            this.alertTimer = setTimeout(() => {
                this.showLoginAlert()
            }, 8000) 
        }

    },
    ionViewWillLeave() {
        if (this.alertTimer) {
            clearTimeout(this.alertTimer)
            this.alertTimer = null
        }
    },
    methods: {
        async loadCurrentUser() {
            try {
                const localUser = AuthService.getUser()
                if (localUser) {
                    this.user = localUser
                }

                try {
                    const apiUser = await AuthService.fetchProfile()
                    if (apiUser) {
                        this.user = apiUser
                    }
                } catch (apiError) {
                    console.warn('No se pudo validar el token con la API:', apiError)

                    if (apiError.response?.status === 401) {
                        AuthService.logout()
                        this.$router.replace('/login')
                    }
                    else if (!localUser) {
                        this.$router.replace('/login')
                    }
                }
            } catch (error) {
                console.error('Error cargando usuario:', error)
                if (!AuthService.isAuthenticated()) {
                    this.$router.replace('/login')
                }
            }
        },
        handleImageError(event) {
            console.warn('Error al cargar imagen:', event.target?.src)
        },
        async fetchPosts(page = 1, filters = null) {
            this.loading = page === 1 && !this.isProgrammaticRefreshing;
            this.error = null

            const params = { page };
            const activeFilters = filters || this.postFilters;
            if (activeFilters && (activeFilters.universidad_id || activeFilters.carrera_id)) {
                if (activeFilters.universidad_id) params.universidad_id = activeFilters.universidad_id;
                if (activeFilters.carrera_id) params.carrera_id = activeFilters.carrera_id;
            }

            const result = await postsService.fetchPosts(params.page, params);

            if (result.success) {
                if (page === 1) {
                    this.posts = result.data
                } else {
                    this.posts = [...this.posts, ...result.data]
                }
                this.currentPage = result.pagination.currentPage
                this.lastPage = result.pagination.lastPage
                this.hasMorePages = result.pagination.hasMorePages
                this.totalPosts = result.pagination.total || 0
                this.feedType = result.feedType || 'public'

            } else {
                this.error = result.error
                this.feedType = result.feedType || 'error'

                if (page === 1) this.posts = []

                if (result.error.includes('Sesión expirada')) {
                    this.$router.replace('/login')
                }
            }
            this.loading = false
        },

        handleFilterPosts(filters) {
            this.postFilters = filters || {};
            this.fetchPosts(1, this.postFilters);
        },
        async handleLike(postId) {
            const postIndex = this.posts.findIndex(p => p.id === postId)
            if (postIndex === -1) return

            const previousLikedState = this.posts[postIndex].user_has_liked
            const previousLikesCount = this.posts[postIndex].likes_count || 0

            this.posts[postIndex].user_has_liked = !previousLikedState
            this.posts[postIndex].likes_count = this.posts[postIndex].user_has_liked
                ? previousLikesCount + 1
                : Math.max(0, previousLikesCount - 1)

            const result = await postsService.likePost(postId)

            if (result.success && result.data) {
                this.posts[postIndex].user_has_liked = result.data.user_has_liked !== undefined
                    ? result.data.user_has_liked
                    : !previousLikedState
                this.posts[postIndex].likes_count = result.data.likes_count !== undefined
                    ? result.data.likes_count
                    : this.posts[postIndex].likes_count
            } else {
                console.error('[HomeView] Like falló, revirtiendo:', result.error)
                this.posts[postIndex].user_has_liked = previousLikedState
                this.posts[postIndex].likes_count = previousLikesCount
            }
        },
        async handleComment(postId) {
            this.$router.push(`/tabs/post/${postId}`)
        },
        async handleShare(postId) {
            const result = await postsService.sharePost(postId)
            if (result.success) console.log('Post compartido')
        },
        async loadMorePosts(event) {
            if (this.currentPage < this.lastPage) {
                await this.fetchPosts(this.currentPage + 1)
            }
            event.target.complete()
        },
        async handleRefresh(event) {
            this.isRefreshing = true
            this.currentPage = 1
            await this.fetchPosts(1)
            this.isRefreshing = false
            event.target.complete()
        },
        handlePostCreated(newPost) {
            console.log('Nuevo post creado:', newPost)
            this.fetchPosts(1)
        },
        async showLoginAlert() {
            const currentRoute = this.$route.path;
            if (!this.isAuthenticated && currentRoute === '/tabs/tab1') {
                this.showLoginPrompt = true;
            }
        },
        goToLogin() {
            this.showLoginPrompt = false;
            this.$router.push('/login');
        },

        closeLoginPrompt() {
            this.showLoginPrompt = false;
        },

        async checkServerBanner() {
            if (this.noMoreBanners) {
                return;
            }

            const result = await bannerService.getActiveBanner();
            const bannerReal = result?.data ? result.data : result;

            if (bannerReal && bannerReal.id) {
                this.serverBannerData = bannerReal;

                setTimeout(() => {
                    this.showServerBanner = true;
                }, 500);
            } else {
                this.noMoreBanners = true;
                console.log("Todos los banners han sido vistos. No se preguntará más en esta sesión.");
            }
        },

        async handleServerBannerAction(banner) {
            this.showServerBanner = false;

            await bannerService.markAsViewed(banner.id);

            if (banner.action_url) {
                if (banner.action_url.startsWith('http')) {
                    window.open(banner.action_url, '_blank');
                } else {
                    this.$router.push(banner.action_url);
                }
            }
        },

        async handleServerBannerDismiss(banner) {
            this.showServerBanner = false;

            await bannerService.markAsViewed(banner.id);
        },

        trackScroll(event) {
            this.currentScrollTop = event.detail.scrollTop;
        },

        async onHomeTabDoubleClicked() {
            if (this.$route.path !== '/tabs/tab1') return;

            if (this.currentScrollTop > 10) {
                this.$refs.contentRef.$el.scrollToTop(500);
                
                setTimeout(async () => {
                    this.isProgrammaticRefreshing = true;
                    this.currentPage = 1;
                    await this.fetchPosts(1);
                    this.isProgrammaticRefreshing = false; 
                }, 500);
                
            } else {
                this.isProgrammaticRefreshing = true;
                this.currentPage = 1;
                await this.fetchPosts(1);
                this.isProgrammaticRefreshing = false;
            }
        },
    }
}
</script>

<style scoped>
@import '../theme/colors.css';
@import '../theme/home.css';

.posts-list {
    display: flex;
    flex-direction: column;
    gap: 0;
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
