<template>
    <ion-page>
        <AppHeader :isDarkMode="isDarkMode" :user="user" :isAuthenticated="isAuthenticated"
            @toggleDarkMode="toggleDarkMode" />

        <ion-content>
            <div class="container">
                <div v-if="loading" class="loading-container">
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
                    <CreatePostCard v-if="isAuthenticated" :user="user" />

                    <ion-accordion-group>
                        <PostCard v-for="post in posts" :key="post.id" :post="post" @like="handleLike"
                            @comment="handleComment" @share="handleShare" @imageError="handleImageError" />
                    </ion-accordion-group>

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
    </ion-page>
</template>

<script>
import { IonPage, IonContent, IonCard, IonCardContent, IonSpinner, IonText, IonInfiniteScroll, IonInfiniteScrollContent, IonAccordionGroup, alertController } from '@ionic/vue'
import AppHeader from '@/components/AppHeader.vue'
import CreatePostCard from '@/components/CreatePostCard.vue'
import PostCard from '@/components/PostCard.vue'
import postsService from '@/services/postsService'
import { AuthService } from '@/services/auth'

export default {
    name: 'HomeView',
    components: { IonPage, IonContent, IonCard, IonCardContent, IonSpinner, IonText, IonInfiniteScroll, IonInfiniteScrollContent, IonAccordionGroup, AppHeader, CreatePostCard, PostCard },
    data() {
        return {
            posts: [],
            loading: false,
            error: null,
            currentPage: 1,
            lastPage: 1,
            hasMorePages: false,
            isDarkMode: false,
            user: { imagen_url: null, name: 'Usuario', username: 'usuario' },
            feedType: 'public', // 'public', 'personalized', o 'error'
            totalPosts: 0,
            alertTimer: null,
            isAuthenticated: false
        }
    },
    async created() {
        // Verificar autenticación y actualizar estado
        this.isAuthenticated = AuthService.isAuthenticated()

        // Cargar usuario solo si está autenticado
        if (this.isAuthenticated) {
            await this.loadCurrentUser()
        } else {
            // Usuario no autenticado, usar valores por defecto
            this.user = { imagen_url: null, name: 'Invitado', username: 'invitado' }
        }

        this.fetchPosts()
        this.loadDarkModePreference()
    },
    ionViewWillEnter() {
        // Actualizar estado de autenticación cada vez que se entra a la vista
        this.isAuthenticated = AuthService.isAuthenticated()

        // Si el usuario acaba de iniciar sesión, recargar datos
        if (this.isAuthenticated && this.user.username === 'invitado') {
            this.loadCurrentUser()
            this.fetchPosts()
        }

        // Programar el alert solo si NO está autenticado y no hay timer activo
        if (!this.isAuthenticated && !this.alertTimer) {
            this.alertTimer = setTimeout(() => {
                this.showLoginAlert()
            }, 15000) // 15 segundos
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
        loadDarkModePreference() {
            const savedMode = localStorage.getItem('darkMode')
            if (savedMode !== null) {
                this.isDarkMode = savedMode === 'true'
            } else {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')
                this.isDarkMode = prefersDark.matches
            }
            this.applyDarkMode()
        },
        toggleDarkMode() {
            this.isDarkMode = !this.isDarkMode
            localStorage.setItem('darkMode', this.isDarkMode.toString())
            this.applyDarkMode()
        },
        applyDarkMode() {
            document.documentElement.classList.toggle('ion-palette-dark', this.isDarkMode)
            if (this.isDarkMode) {
                document.documentElement.style.setProperty('--ion-background-color', '#121212')
                document.documentElement.style.setProperty('--ion-card-background', '#1E1E1E')
            } else {
                document.documentElement.style.setProperty('--ion-background-color', '#F3F4F6')
                document.documentElement.style.setProperty('--ion-card-background', '#FFFFFF')
            }
        },
        handleImageError(event) {
            console.warn('Error al cargar imagen:', event.target?.src)
        },
        async fetchPosts(page = 1) {
            this.loading = page === 1
            this.error = null

            const result = await postsService.fetchPosts(page)

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

                // Log para debugging
                console.log(`Feed cargado: ${this.feedType}`, {
                    posts: result.data.length,
                    total: this.totalPosts,
                    page: this.currentPage,
                    isAuthenticated: AuthService.isAuthenticated()
                })
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
        async handleLike(postId) {
            const result = await postsService.likePost(postId)
            if (result.success) {
                const postIndex = this.posts.findIndex(p => p.id === postId)
                if (postIndex !== -1) {
                    this.posts[postIndex].user_has_liked = !this.posts[postIndex].user_has_liked
                    this.posts[postIndex].likes_count = this.posts[postIndex].user_has_liked ? (this.posts[postIndex].likes_count || 0) + 1 : Math.max(0, (this.posts[postIndex].likes_count || 0) - 1)
                }
            }
        },
        async handleComment(postId) {
            console.log('Comment post:', postId)
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
        async doRefresh(event) {
            this.currentPage = 1
            await this.fetchPosts(1)
            event.target.complete()
        },
        async showLoginAlert() {
            // Solo mostrar si el usuario NO está autenticado Y está en la ruta del feed
            const currentRoute = this.$route.path
            if (!this.isAuthenticated && currentRoute === '/tabs/tab1') {
                const alert = await alertController.create({
                    header: '¡Únete a LaÚ! 🎓',
                    message: 'Inicia sesión para seguir viendo el feed y aprovechar al máximo todas las funciones de LaÚ: conecta con estudiantes, comparte material y descubre eventos.',
                    buttons: [
                        {
                            text: 'Más tarde',
                            role: 'cancel',
                            cssClass: 'alert-button-cancel'
                        },
                        {
                            text: 'Iniciar Sesión',
                            cssClass: 'alert-button-confirm',
                            handler: () => {
                                this.$router.push('/login')
                            }
                        }
                    ],
                    cssClass: 'custom-alert'
                })

                await alert.present()
            }
        }
    }
}
</script>

<style scoped>
@import '../theme/colors.css';
@import '../theme/home.css';

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
</style>
