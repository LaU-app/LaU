<template>
    <ion-card class="music-card">
        <ion-card-content class="music-content">
            <ion-thumbnail class="album-art">
                <img v-if="post.itunes_artwork_url" :src="post.itunes_artwork_url"
                    :alt="post.itunes_track_name || 'Album'" @error="$emit('imageError', $event)" />
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                    class="icon icon-tabler icons-tabler-outline icon-tabler-vinyl">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M16 3.937a9 9 0 1 0 5 8.063" />
                    <path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                    <path d="M20 4m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
                    <path d="M20 4l-3.5 10l-2.5 2" />
                </svg>
            </ion-thumbnail>
            <div class="music-info">
                <ion-text>
                    <h3 class="song-title">{{ post.itunes_track_name || 'Canción' }}</h3>
                </ion-text>
                <ion-text>
                    <p class="artist-name">{{ post.itunes_artist_name || 'Artista' }}</p>
                </ion-text>
                <div v-if="post.itunes_preview_url" class="audio-controls">
                    <audio :src="post.itunes_preview_url" controls class="audio-player"></audio>
                </div>
            </div>
            <ion-button fill="clear" class="play-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                    class="icon icon-tabler icons-tabler-outline icon-tabler-activity-heartbeat">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                    <path d="M3 12h4.5l1.5 -6l4 12l2 -9l1.5 3h4.5" />
                </svg>
            </ion-button>
        </ion-card-content>
    </ion-card>
</template>

<script>
import { IonCard, IonCardContent, IonThumbnail, IonText, IonButton } from '@ionic/vue'

export default {
    name: 'MusicPlayer',
    components: {
        IonCard,
        IonCardContent,
        IonThumbnail,
        IonText,
        IonButton
    },
    props: {
        post: {
            type: Object,
            required: true
        }
    },
    emits: ['imageError']
}
</script>

<style scoped>
@import '../theme/colors.css';
@import '../theme/home.css';
</style>
