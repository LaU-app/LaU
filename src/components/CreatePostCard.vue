<template>
    <ion-card class="create-post-card">
        <ion-card-content>
            <div class="create-post-input">
                <ion-avatar class="create-post-avatar">
                    <img v-if="user.imagen_url" :src="user.imagen_url" alt="Usuario" />
                </ion-avatar>
                <ion-label class="create-post-placeholder">Que novedades tienes {{ user.name }}?</ion-label>
            </div>
            <ion-grid class="post-actions-grid">
                <ion-row>
                    <ion-col size="4">
                        <ion-button fill="clear" size="small" class="action-btn"
                            @click="$router.push('/tabs/tab2/foto')">
                            <div class="action-btn-content">
                                <ion-icon :icon="imageOutline" slot="start" color="success"></ion-icon>
                                <ion-label>Imagen</ion-label>
                            </div>
                        </ion-button>
                    </ion-col>
                    <ion-col size="4">
                        <ion-button fill="clear" size="small" class="action-btn"
                            @click="$router.push('/tabs/tab2/musica')">
                            <div class="action-btn-content">
                                <ion-icon :icon="musicalNotesOutline" slot="start" color="warning"></ion-icon>
                                <ion-label>Musica</ion-label>
                            </div>
                        </ion-button>
                    </ion-col>
                    <ion-col size="4">
                        <ion-button fill="clear" size="small" class="action-btn"
                            @click="$router.push('/tabs/tab2/archivo')">
                            <div class="action-btn-content">
                                <ion-icon :icon="documentAttachOutline" slot="start" color="primary"></ion-icon>
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
import { IonAvatar, IonButton, IonCard, IonCardContent, IonCol, IonGrid, IonIcon, IonLabel, IonRow } from '@ionic/vue'
import { documentAttachOutline, imageOutline, musicalNotesOutline } from 'ionicons/icons'

export default {
    name: 'CreatePostCard',
    components: {
        IonCard,
        IonCardContent,
        IonAvatar,
        IonButton,
        IonGrid,
        IonRow,
        IonCol,
        IonLabel,
        IonIcon
    },
    setup() {
        return {
            documentAttachOutline,
            imageOutline,
            musicalNotesOutline
        }
    },
    props: {
        user: {
            type: Object,
            required: true
        }
    }
}
</script>

<style scoped>
@import '../theme/colors.css';
@import '../theme/home.css';
</style>
