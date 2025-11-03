<template>
    <ion-card class="create-post-card">
        <ion-card-content>
            <div class="create-post-input">
                <ion-avatar class="create-post-avatar">
                    <img v-if="user?.imagen_url" :src="user.imagen_url" alt="Usuario" />
                    <ion-icon v-else :icon="personCircle" size="large"></ion-icon>
                </ion-avatar>
                <ion-input placeholder="¿Qué estás estudiando?" class="post-input">
                    <svg slot="end" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                        stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-bubble">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path
                            d="M12.4 3a5.34 5.34 0 0 1 4.906 3.239a5.333 5.333 0 0 1 -1.195 10.6a4.26 4.26 0 0 1 -5.28 1.863l-3.831 2.298v-3.134a2.668 2.668 0 0 1 -1.795 -3.773a4.8 4.8 0 0 1 2.908 -8.933a5.33 5.33 0 0 1 4.287 -2.16" />
                    </svg>
                </ion-input>
            </div>
            <ion-grid class="post-actions-grid">
                <ion-row>
                    <ion-col size="4">
                        <ion-button fill="clear" size="small" class="action-btn" @click="goToCreatePost('foto')">
                            <div class="action-btn-content">
                                <ion-icon :icon="camera" color="primary" class="action-icon"></ion-icon>
                                <ion-label>Foto/Video</ion-label>
                            </div>
                        </ion-button>
                    </ion-col>
                    <ion-col size="4">
                        <ion-button fill="clear" size="small" class="action-btn" @click="goToCreatePost('musica')">
                            <div class="action-btn-content">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round"
                                    class="icon icon-tabler icons-tabler-outline icon-tabler-vinyl"
                                    style="color: var(--ion-color-tertiary)">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                    <path d="M16 3.937a9 9 0 1 0 5 8.063" />
                                    <path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                                    <path d="M20 4m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                                    <path d="M20 4l-3.5 10l-2.5 2" />
                                </svg>
                                <ion-label>Música</ion-label>
                            </div>
                        </ion-button>
                    </ion-col>
                    <ion-col size="4">
                        <ion-button fill="clear" size="small" class="action-btn" @click="goToCreatePost('archivo')">
                            <div class="action-btn-content">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                                    fill="currentColor"
                                    class="icon icon-tabler icons-tabler-filled icon-tabler-file-neutral"
                                    style="color: var(--ion-color-success)">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                    <path
                                        d="M12 2l.117 .007a1 1 0 0 1 .876 .876l.007 .117v4l.005 .15a2 2 0 0 0 1.838 1.844l.157 .006h4l.117 .007a1 1 0 0 1 .876 .876l.007 .117v9a3 3 0 0 1 -2.824 2.995l-.176 .005h-10a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-14a3 3 0 0 1 2.824 -2.995l.176 -.005zm2 14h-4a1 1 0 0 0 0 2h4a1 1 0 0 0 0 -2m-3.995 -4h-.01a1 1 0 0 0 0 2h.01a1 1 0 0 0 0 -2m4 0h-.01a1 1 0 0 0 0 2h.01a1 1 0 0 0 0 -2" />
                                    <path d="M19 7h-4l-.001 -4.001z" />
                                </svg>
                                <ion-label>Archivo</ion-label>
                            </div>
                        </ion-button>
                    </ion-col>
                </ion-row>
            </ion-grid>
        </ion-card-content>
    </ion-card>
</template>

<script>
import { IonCard, IonCardContent, IonAvatar, IonInput, IonGrid, IonRow, IonCol, IonButton, IonLabel, IonIcon } from '@ionic/vue'
import { personCircle, camera } from 'ionicons/icons'
import { useRouter } from 'vue-router'

export default {
    name: 'CreatePostCard',
    components: {
        IonCard,
        IonCardContent,
        IonAvatar,
        IonInput,
        IonGrid,
        IonRow,
        IonCol,
        IonButton,
        IonLabel,
        IonIcon
    },
    props: {
        user: {
            type: Object,
            required: true
        }
    },
    setup() {
        const router = useRouter()

        const goToCreatePost = (tipo) => {
            // Navegar con animación de Ionic
            router.push(`/tabs/tab2/${tipo}`)
        }

        return {
            personCircle,
            camera,
            goToCreatePost
        }
    }
}
</script>

<style scoped>
@import '../theme/colors.css';
@import '../theme/home.css';

.action-btn {
    width: 100%;
}
</style>
