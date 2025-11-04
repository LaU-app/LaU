<template>
    <ion-card class="create-post-card">
        <ion-card-content>
            <div class="create-post-input">
                <ion-avatar class="create-post-avatar">
                    <img v-if="user.imagen_url" :src="user.imagen_url" alt="Usuario" />
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
                        <ion-button fill="clear" size="small" class="action-btn"
                            @click="$router.push('/create-post/foto')">
                            <div class="action-btn-content">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                                    fill="currentColor" class="icon icon-tabler icons-tabler-filled icon-tabler-photo"
                                    style="color: var(--ion-color-primary)">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                    <path
                                        d="M8.813 11.612c.457 -.38 .918 -.38 1.386 .011l.108 .098l4.986 4.986l.094 .083a1 1 0 0 0 1.403 -1.403l-.083 -.094l-1.292 -1.293l.292 -.293l.106 -.095c.457 -.38 .918 -.38 1.386 .011l.108 .098l4.674 4.675a4 4 0 0 1 -3.775 3.599l-.206 .005h-12a4 4 0 0 1 -3.98 -3.603l6.687 -6.69l.106 -.095zm9.187 -9.612a4 4 0 0 1 3.995 3.8l.005 .2v9.585l-3.293 -3.292l-.15 -.137c-1.256 -1.095 -2.85 -1.097 -4.096 -.017l-.154 .14l-.307 .306l-2.293 -2.292l-.15 -.137c-1.256 -1.095 -2.85 -1.097 -4.096 -.017l-.154 .14l-5.307 5.306v-9.585a4 4 0 0 1 3.8 -3.995l.2 -.005h12zm-2.99 5l-.127 .007a1 1 0 0 0 0 1.986l.117 .007l.127 -.007a1 1 0 0 0 0 -1.986l-.117 -.007z" />
                                </svg>
                                <ion-label>Foto/Video</ion-label>
                            </div>
                        </ion-button>
                    </ion-col>
                    <ion-col size="4">
                        <ion-button fill="clear" size="small" class="action-btn"
                            @click="$router.push('/create-post/musica')">
                            <div class="action-btn-content">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                                    fill="currentColor"
                                    class="icon icon-tabler icons-tabler-filled icon-tabler-headphones"
                                    style="color: var(--ion-color-tertiary)">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                    <path
                                        d="M21 18a3 3 0 0 1 -2.824 2.995l-.176 .005h-1a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-3a3 3 0 0 1 2.824 -2.995l.176 -.005h1c.351 0 .688 .06 1 .171v-.171a7 7 0 0 0 -13.996 -.24l-.004 .24v.17c.25 -.088 .516 -.144 .791 -.163l.209 -.007h1a3 3 0 0 1 2.995 2.824l.005 .176v3a3 3 0 0 1 -2.824 2.995l-.176 .005h-1a3 3 0 0 1 -2.995 -2.824l-.005 -.176v-6a9 9 0 0 1 17.996 -.265l.004 .265v6z" />
                                </svg>
                                <ion-label>Playlist</ion-label>
                            </div>
                        </ion-button>
                    </ion-col>
                    <ion-col size="4">
                        <ion-button fill="clear" size="small" class="action-btn"
                            @click="$router.push('/create-post/archivo')">
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
import { personCircle } from 'ionicons/icons'

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
    data() {
        return {
            personCircle
        }
    }
}
</script>

<style scoped>
@import '../theme/colors.css';
@import '../theme/home.css';
</style>
