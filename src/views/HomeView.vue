<template>
    <ion-page>
        <AppHeader :isDarkMode="isDarkMode" :user="user" :isAuthenticated="isAuthenticated"
            @toggleDarkMode="toggleDarkMode" />

        <ion-content>
            <!-- Pull to Refresh -->
            <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
                <ion-refresher-content pulling-icon="chevron-down-circle-outline" pulling-text="Desliza para actualizar"
                    refreshing-spinner="crescent" refreshing-text="Actualizando...">
                </ion-refresher-content>
            </ion-refresher>

            <div class="container">
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
import { App } from '@capacitor/app';

export default {
    name: 'HomeView',
    components: { IonPage, IonContent, IonCard, IonCardContent, IonSpinner, IonText, IonInfiniteScroll, IonInfiniteScrollContent, IonRefresher, IonRefresherContent, AppHeader, CreatePostCard, PostCard, CustomBanner, FilterPosts },
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
            postFilters: {} // Filtros activos
        }
    },
    setup() {
        // Función para buscar y descargar
        const checkForUpdates = async () => {
        if (!Capacitor.isNativePlatform()) return;

        try {
            const response = await apiService.checkAppUpdate();
            const data = response.data; 

            const lastAttemptedVersion = localStorage.getItem('last_ota_version');

            // Si hay actualización y no es la que ya intentamos descargar antes...
            if (data.update_available && lastAttemptedVersion !== data.version) {
            console.log('Descargando nueva versión en segundo plano...');
            
            // SOLO descargamos. El usuario no se entera de nada.
            await CapacitorUpdater.download({
                url: data.zip_url,
                version: data.version
            });

            console.log('¡Descarga lista! Se aplicará la próxima vez que se abra la app.');
            
            // Guardamos la versión para no volver a descargarla en este ciclo
            localStorage.setItem('last_ota_version', data.version);
            }
        } catch (error) {
            console.error('Error al buscar actualizaciones:', error);
        }
        };

        // Usar composable de modo oscuro
        const { isDarkMode, toggleDarkMode } = useDarkMode()
        const showNotificationsPrompt = ref(false);

        onMounted(() => {
            // 5. Ejecutamos al montar el componente
            checkForUpdates();
            // 2. EL CANDADO: Si NO está autenticado, detenemos todo aquí mismo.
            if (!AuthService.isAuthenticated()) {
                console.log("Usuario invitado. No se mostrará el banner de notificaciones.");
                return;
            }

            // Si pasa el candado, significa que SÍ hay sesión.
            // 3. Revisamos si ya le preguntamos antes
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
                    // AQUÍ LE PASAMOS TRUE PARA QUE LANCE LA ALERTA DE ANDROID
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
            closeNotificationsPrompt
        }
    },
    async created() {
        // Verificar autenticación y actualizar estado
        this.isAuthenticated = AuthService.isAuthenticated()

        // Cargar usuario solo si está autenticado
        if (this.isAuthenticated) {
            await this.loadCurrentUser();
            await this.checkServerBanner();
        } else {
            // Usuario no autenticado, usar valores por defecto
            this.user = { imagen_url: null, name: 'Invitado', username: 'invitado' }
        }

        this.fetchPosts()
    },
    ionViewWillEnter() {
        // Actualizar estado de autenticación cada vez que se entra a la vista
        this.isAuthenticated = AuthService.isAuthenticated()

        // Verificar si se viene de crear un post (state en router)
        const postCreated = window.history.state?.postCreated
        const postDeleted = window.history.state?.postDeleted

        // Si el usuario acaba de iniciar sesión, recargar datos
        if (this.isAuthenticated && this.user.username === 'invitado') {
            this.loadCurrentUser()
            this.fetchPosts()
        } else if (this.isAuthenticated && postCreated) {
            // Si viene de crear un post, refrescar el feed
            /* console.log('📝 Post creado - Actualizando feed...') */
            this.fetchPosts(1)
            // Limpiar el state para evitar recargas múltiples
            window.history.replaceState({ ...window.history.state, postCreated: false }, '')
        } else if (postDeleted) {
            // Si viene de eliminar un post, refrescar el feed
            /* console.log('🗑️ Post eliminado - Actualizando feed...') */
            this.fetchPosts(1)
            // Limpiar el state
            window.history.replaceState({ ...window.history.state, postDeleted: false }, '')
        }

        // Programar el alert solo si NO está autenticado y no hay timer activo
        if (!this.isAuthenticated && !this.alertTimer) {
            this.alertTimer = setTimeout(() => {
                this.showLoginAlert()
            }, 8000) // 8 segundos
        }

    },
    ionViewWillLeave() {
        // Cancelar el timer cuando el usuario salga de la vista (por ejemplo, al ir a login)
        if (this.alertTimer) {
            clearTimeout(this.alertTimer)
            this.alertTimer = null
        }
    },
    beforeUnmount() {
        // Limpiar el timer si el componente se desmonta antes
        if (this.alertTimer) {
            clearTimeout(this.alertTimer)
            this.alertTimer = null
        }
    },
    methods: {
        async loadCurrentUser() {
            try {
                // Primero intenta obtener el usuario del localStorage
                const localUser = AuthService.getUser()
                if (localUser) {
                    this.user = localUser
                }

                // Luego valida el token con la API y actualiza los datos (en background, sin bloquear)
                try {
                    const apiUser = await AuthService.fetchProfile()
                    if (apiUser) {
                        this.user = apiUser
                    }
                } catch (apiError) {
                    // Si falla la validación con la API
                    console.warn('No se pudo validar el token con la API:', apiError)

                    // Solo redirigimos al login si es un error 401 (token inválido)
                    if (apiError.response?.status === 401) {
                        AuthService.logout()
                        this.$router.replace('/login')
                    }
                    // Si es otro tipo de error (red, servidor caído, etc.) y tenemos usuario local, continuamos
                    else if (!localUser) {
                        // Solo redirigimos si no hay usuario local tampoco
                        this.$router.replace('/login')
                    }
                }
            } catch (error) {
                console.error('Error cargando usuario:', error)
                // Solo redirige si es un error crítico
                if (!AuthService.isAuthenticated()) {
                    this.$router.replace('/login')
                }
            }
        },
        handleImageError(event) {
            console.warn('Error al cargar imagen:', event.target?.src)
        },
        async fetchPosts(page = 1, filters = null) {
            this.loading = page === 1
            this.error = null

            // Unir filtros activos
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

                // Log detallado para debugging de likes
                /* console.log(`[HomeView] Feed cargado: ${this.feedType}`, {
                    posts: result.data.length,
                    total: this.totalPosts,
                    page: this.currentPage,
                    isAuthenticated: AuthService.isAuthenticated(),
                    // Mostrar estado de likes de los primeros 3 posts
                    likesStatus: result.data.slice(0, 3).map(p => ({
                        id: p.id,
                        user_has_liked: p.user_has_liked,
                        likes_count: p.likes_count
                    }))
                }) */
            } else {
                this.error = result.error
                this.feedType = result.feedType || 'error'

                if (page === 1) this.posts = []

                // Si es error 401, redirigir al login
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
            // Encontrar el post antes de hacer la petición
            const postIndex = this.posts.findIndex(p => p.id === postId)
            if (postIndex === -1) return

            // Guardar el estado anterior por si hay que revertir
            const previousLikedState = this.posts[postIndex].user_has_liked
            const previousLikesCount = this.posts[postIndex].likes_count || 0

            console.log('[HomeView] Like click - Estado antes:', {
                postId,
                user_has_liked: previousLikedState,
                likes_count: previousLikesCount
            })

            // Actualizar UI optimistamente
            this.posts[postIndex].user_has_liked = !previousLikedState
            this.posts[postIndex].likes_count = this.posts[postIndex].user_has_liked
                ? previousLikesCount + 1
                : Math.max(0, previousLikesCount - 1)

            console.log('[HomeView] Like click - Estado optimista:', {
                postId,
                user_has_liked: this.posts[postIndex].user_has_liked,
                likes_count: this.posts[postIndex].likes_count
            })

            // Hacer la petición al backend
            const result = await postsService.likePost(postId)

            if (result.success && result.data) {
                // Actualizar con los datos reales del backend
                this.posts[postIndex].user_has_liked = result.data.user_has_liked !== undefined
                    ? result.data.user_has_liked
                    : !previousLikedState
                this.posts[postIndex].likes_count = result.data.likes_count !== undefined
                    ? result.data.likes_count
                    : this.posts[postIndex].likes_count

                console.log('[HomeView] Like click - Estado final del backend:', {
                    postId,
                    user_has_liked: this.posts[postIndex].user_has_liked,
                    likes_count: this.posts[postIndex].likes_count
                })
            } else {
                console.error('[HomeView] Like falló, revirtiendo:', result.error)
                // Si falla, revertir al estado anterior
                this.posts[postIndex].user_has_liked = previousLikedState
                this.posts[postIndex].likes_count = previousLikesCount
            }
        },
        async handleComment(postId) {
            // Navegar a la vista de detalle donde se pueden ver y agregar comentarios
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
            // Marcar que estamos refrescando para no mostrar el loading duplicado
            this.isRefreshing = true
            // Recargar desde la primera página
            this.currentPage = 1
            await this.fetchPosts(1)
            this.isRefreshing = false
            event.target.complete()
        },
        handlePostCreated(newPost) {
            console.log('Nuevo post creado:', newPost)
            // Recargar los posts para mostrar el nuevo
            this.fetchPosts(1)
        },
        async showLoginAlert() {
            const currentRoute = this.$route.path;
            if (!this.isAuthenticated && currentRoute === '/tabs/tab1') {
                // En lugar de llamar a alertController, simplemente mostramos nuestro banner
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

        // 1. Buscar el banner
        async checkServerBanner() {
            // 2. Si la bandera dice que ya no hay banners, cancelamos la petición para no molestar al servidor
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
                // 3. Laravel respondió null. Eso significa que el usuario ya vio TODO.
                // Activamos la bandera para que no vuelva a preguntar en toda la sesión.
                this.noMoreBanners = true;
                console.log("Todos los banners han sido vistos. No se preguntará más en esta sesión.");
            }
        },

        // 2. Acción: Cuando le da al botón principal (Probar, Actualizar, etc.)
        async handleServerBannerAction(banner) {
            this.showServerBanner = false;

            // Registramos en Laravel que ya lo vio
            await bannerService.markAsViewed(banner.id);

            // Redirigimos a la URL de acción
            if (banner.action_url) {
                if (banner.action_url.startsWith('http')) {
                    // Abrir en el navegador (Ideal para enlaces externos)
                    window.open(banner.action_url, '_blank');
                } else {
                    // Navegación interna en Vue
                    this.$router.push(banner.action_url);
                }
            }
        },

        // 3. Acción: Cuando le da a "Enterado" o lo arrastra hacia abajo
        async handleServerBannerDismiss(banner) {
            this.showServerBanner = false;

            // Registramos en Laravel que ya lo vio para que no vuelva a salir
            await bannerService.markAsViewed(banner.id);
        }

        // async showLoginAlert() {
        //     // Solo mostrar si el usuario NO está autenticado Y está en la ruta del feed
        //     const currentRoute = this.$route.path
        //     if (!this.isAuthenticated && currentRoute === '/tabs/tab1') {
        //         const alert = await alertController.create({
        //             header: '¡Únete a LaU! 🎓',
        //             message: 'Inicia sesión para seguir viendo el feed y aprovechar al máximo todas las funciones de LaU: conecta con estudiantes, comparte material y descubre eventos.',
        //             buttons: [
        //                 {
        //                     text: 'Más tarde',
        //                     role: 'cancel',
        //                     cssClass: 'alert-button-cancel'
        //                 },
        //                 {
        //                     text: 'Iniciar Sesión',
        //                     cssClass: 'alert-button-confirm',
        //                     handler: () => {
        //                         this.$router.push('/login')
        //                     }
        //                 }
        //             ],
        //             cssClass: 'custom-alert'
        //         })

        //         await alert.present()
        //     }
        // }
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
</style>
