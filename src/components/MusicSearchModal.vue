<template>
    <ion-modal :is-open="isOpen" @didDismiss="handleClose">
        <ion-header>
            <ion-toolbar>
                <ion-title>Buscar Música</ion-title>
                <ion-buttons slot="end">
                    <ion-button @click="handleClose">
                        <ion-icon :icon="close"></ion-icon>
                    </ion-button>
                </ion-buttons>
            </ion-toolbar>
            <ion-toolbar>
                <ion-searchbar v-model="searchQuery" placeholder="Buscar canciones, artistas..."
                    @ionInput="handleSearch" :debounce="500" animated></ion-searchbar>
            </ion-toolbar>
        </ion-header>

        <ion-content>
            <!-- Loading State -->
            <div v-if="loading" class="loading-container">
                <ion-spinner name="crescent"></ion-spinner>
                <p>Buscando música...</p>
            </div>

            <!-- Empty State -->
            <div v-else-if="!searchQuery" class="empty-state">
                <ion-icon :icon="musicalNotes" class="empty-icon"></ion-icon>
                <h3>Busca tu música favorita</h3>
                <p>Encuentra canciones, álbumes y artistas</p>

                <!-- Géneros Populares -->
                <div class="genre-chips">
                    <ion-chip v-for="genre in popularGenres" :key="genre" @click="searchByGenre(genre)">
                        <ion-label>{{ genre }}</ion-label>
                    </ion-chip>
                </div>
            </div>

            <!-- Results -->
            <div v-else-if="results.length > 0" class="results-container">
                <div v-for="track in results" :key="track.trackId" class="track-item" @click="selectTrack(track)">
                    <div class="track-artwork">
                        <img :src="track.artworkUrl100" :alt="track.trackName" />
                        <div class="play-overlay">
                            <ion-icon :icon="play"></ion-icon>
                        </div>
                    </div>
                    <div class="track-info">
                        <h4>{{ track.trackName }}</h4>
                        <p class="artist">{{ track.artistName }}</p>
                        <p class="album">{{ track.collectionName }}</p>
                        <div class="track-meta">
                            <ion-badge color="primary">{{ track.duration }}</ion-badge>
                            <ion-badge color="medium">{{ track.primaryGenreName }}</ion-badge>
                        </div>
                    </div>
                </div>
            </div>

            <!-- No Results -->
            <div v-else-if="searchQuery && !loading" class="empty-state">
                <ion-icon :icon="searchOutline" class="empty-icon"></ion-icon>
                <h3>No se encontraron resultados</h3>
                <p>Intenta con otros términos de búsqueda</p>
            </div>
        </ion-content>
    </ion-modal>
</template>

<script setup>
import { ref, watch } from 'vue'
import {
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonSearchbar,
    IonSpinner,
    IonChip,
    IonLabel,
    IonBadge
} from '@ionic/vue'
import {
    close,
    musicalNotes,
    play,
    searchOutline
} from 'ionicons/icons'
import musicService from '@/services/musicService'

const props = defineProps({
    isOpen: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['close', 'select'])

const searchQuery = ref('')
const results = ref([])
const loading = ref(false)

const popularGenres = [
    'Pop', 'Rock', 'Hip Hop', 'Reggaeton',
    'Electronic', 'Latin', 'Jazz', 'Country'
]

const handleSearch = async (event) => {
    const query = event.target.value
    if (!query || query.length < 2) {
        results.value = []
        return
    }

    loading.value = true
    try {
        const response = await musicService.searchTracks(query, 30)
        if (response.success) {
            results.value = response.data
        }
    } catch (error) {
        console.error('Error en búsqueda:', error)
    } finally {
        loading.value = false
    }
}

const searchByGenre = async (genre) => {
    searchQuery.value = genre
    loading.value = true
    try {
        const response = await musicService.searchByGenre(genre, 20)
        if (response.success) {
            results.value = response.data
        }
    } catch (error) {
        console.error('Error buscando por género:', error)
    } finally {
        loading.value = false
    }
}

const selectTrack = (track) => {
    emit('select', track)
    handleClose()
}

const handleClose = () => {
    searchQuery.value = ''
    results.value = []
    emit('close')
}

// Reset cuando se cierra
watch(() => props.isOpen, (newValue) => {
    if (!newValue) {
        searchQuery.value = ''
        results.value = []
    }
})
</script>

<style scoped>
.loading-container,
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 2rem;
    text-align: center;
}

.empty-icon {
    font-size: 4rem;
    color: var(--ion-color-medium);
    opacity: 0.5;
    margin-bottom: 1rem;
}

.empty-state h3 {
    margin: 0.5rem 0;
    color: var(--ion-color-dark);
}

.empty-state p {
    color: var(--ion-color-medium);
    margin: 0.5rem 0 1.5rem 0;
}

.genre-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
    max-width: 400px;
}

.results-container {
    padding: 1rem;
}

.track-item {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background: var(--ion-card-background);
    border-radius: 12px;
    margin-bottom: 0.75rem;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
}

.track-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.track-artwork {
    position: relative;
    width: 80px;
    height: 80px;
    flex-shrink: 0;
    border-radius: 8px;
    overflow: hidden;
}

.track-artwork img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.play-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s;
}

.track-item:hover .play-overlay {
    opacity: 1;
}

.play-overlay ion-icon {
    font-size: 2rem;
    color: white;
}

.track-info {
    flex: 1;
    min-width: 0;
}

.track-info h4 {
    margin: 0 0 0.25rem 0;
    font-size: 1rem;
    font-weight: 600;
    color: var(--ion-color-dark);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.track-info .artist {
    margin: 0 0 0.25rem 0;
    font-size: 0.9rem;
    color: var(--ion-color-medium);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.track-info .album {
    margin: 0 0 0.5rem 0;
    font-size: 0.85rem;
    color: var(--ion-color-step-600);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.track-meta {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.track-meta ion-badge {
    font-size: 0.75rem;
}
</style>
