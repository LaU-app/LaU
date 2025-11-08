<template>
    <ion-card class="music-card">
        <ion-card-content class="music-content">
            <ion-thumbnail class="album-art">
                <img v-if="post.itunes_artwork_url" :src="post.itunes_artwork_url"
                    :alt="post.itunes_track_name || 'Album'" @error="$emit('imageError', $event)" />
                <div v-else class="placeholder-art">
                    <ion-icon :icon="musicalNotesOutline"></ion-icon>
                </div>
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
        </ion-card-content>
    </ion-card>
</template>

<script>
import { IonCard, IonCardContent, IonThumbnail, IonText, IonIcon } from '@ionic/vue'
import { musicalNotesOutline } from 'ionicons/icons'

export default {
    name: 'MusicPlayer',
    components: {
        IonCard,
        IonCardContent,
        IonThumbnail,
        IonText,
        IonIcon
    },
    props: {
        post: {
            type: Object,
            required: true
        }
    },
    setup() {
        return {
            musicalNotesOutline
        }
    },
    emits: ['imageError']
}
</script>

<style scoped>
.music-card {
    margin: 16px;
    border-radius: 16px;
    --background: var(--ion-card-background);
}

.music-content {
    display: flex;
    gap: 16px;
    padding: 16px;
}

.album-art {
    --size: 120px;
    width: var(--size);
    height: var(--size);
    min-width: var(--size);
    border-radius: 12px;
    overflow: hidden;
}

.album-art img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.placeholder-art {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.placeholder-art ion-icon {
    font-size: 48px;
    color: var(--ion-color-medium, #92949c);
}

.music-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8px;
    min-width: 0;
}

.song-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--ion-text-color, #000000);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.artist-name {
    margin: 0;
    font-size: 14px;
    color: var(--ion-color-medium, #92949c);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.audio-controls {
    margin-top: 8px;
}

.audio-player {
    width: 100%;
    height: 40px;
    border-radius: 20px;
    outline: none;
}

/* Responsive */
@media (max-width: 576px) {
    .album-art {
        --size: 80px;
    }

    .song-title {
        font-size: 16px;
    }

    .artist-name {
        font-size: 13px;
    }
}
</style>
