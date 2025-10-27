<template>
    <ion-page>
        <AppHeader :isDarkMode="isDarkMode" :user="user" @toggleDarkMode="toggleDarkMode" />

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
                    <CreatePostCard :user="user" />

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
                    <ion-infinite-scroll-content loading-spinner="bubbles" loading-text="Cargando m�s posts...">
                    </ion-infinite-scroll-content>
                </ion-infinite-scroll>
            </div>
        </ion-content>
    </ion-page>
</template>

<script>
import { IonPage, IonContent, IonCard, IonCardContent, IonSpinner, IonText, IonInfiniteScroll, IonInfiniteScrollContent, IonAccordionGroup } from '@ionic/vue'
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
            user: { imagen_url: null, name: 'Usuario', username: 'usuario' }
        }
    },
    async created() {
        await this.loadCurrentUser()
        this.fetchPosts()
        this.loadDarkModePreference()
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
            } else {
                this.error = result.error
                if (page === 1) this.posts = []
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
        }
    }
}
</script>

<style scoped>
@import '../theme/colors.css';
@import '../theme/home.css';
</style>
