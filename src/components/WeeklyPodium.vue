<template>
    <div class="weekly-podium">
        <h3>Podio Semanal</h3>
        <div v-if="loading" class="podium-loading">
            <ion-spinner name="crescent"></ion-spinner>
        </div>
        <div v-else class="podium-list" ref="podiumContainerRef">
            <div v-if="leaders.length === 0" class="no-data">Sin datos esta semana</div>
            <div v-else class="podium-items">
                <div v-for="(u, idx) in leaders" :key="u.id" :id="`user-${u.id}`" class="podium-item"
                    :class="[`pos-${idx + 1}`, { 'is-me': u.id === currentUserId }]">
                    <div class="avatar">
                        <img :src="getAvatar(u)" @error="onImgError" />
                    </div>
                    <div class="info">
                        <div class="name">{{ u.name }} <span v-if="u.id === currentUserId" class="you-badge">Tú</span>
                        </div>
                    </div>
                    <div class="pomodoro-badge">
                        <!-- Blue filled flame SVG provided by user -->
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"
                            fill="#3880ff" class="flame-icon" aria-hidden="true">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                            <path
                                d="M10 2c0 -.88 1.056 -1.331 1.692 -.722c1.958 1.876 3.096 5.995 1.75 9.12l-.08 .174l.012 .003c.625 .133 1.203 -.43 2.303 -2.173l.14 -.224a1 1 0 0 1 1.582 -.153c1.334 1.435 2.601 4.377 2.601 6.27c0 4.265 -3.591 7.705 -8 7.705s-8 -3.44 -8 -7.706c0 -2.252 1.022 -4.716 2.632 -6.301l.605 -.589c.241 -.236 .434 -.43 .618 -.624c1.43 -1.512 2.145 -2.924 2.145 -4.78" />
                        </svg>
                        <div class="pomodoro-number">{{ u.pomodoros }}</div>
                    </div>
                </div>
            </div>
        </div>
        <button v-if="showScrollButton" @click="scrollToMe" class="scroll-to-me">Ver mi posición</button>
    </div>
</template>

<script>
import { IonSpinner, IonIcon } from '@ionic/vue';
import { personCircle } from 'ionicons/icons';
import pomodoroService from '@/services/pomodoroService';
import { api } from '@/services/api';
import { ref, onMounted } from 'vue';

export default {
    name: 'WeeklyPodium',
    components: { IonSpinner, IonIcon },
    setup() {
        const leaders = ref([]);
        const loading = ref(true);
        const currentUserId = ref(null);
        const showScrollButton = ref(false);
        const podiumContainerRef = ref(null);

        const loadLeaderboard = async () => {
            loading.value = true;
            try {
                const res = await pomodoroService.getWeeklyLeaderboard();
                // Expect data as array of { id, name, avatar, pomodoros }
                leaders.value = res.data || [];
                // after loading, check if current user is present and whether we should show the button
                setTimeout(() => checkVisibility(), 50);
            } catch (e) {
                console.error('Error cargando podium semanal', e);
                leaders.value = [];
            } finally {
                loading.value = false;
            }
        };

        const defaultAvatar = 'https://www.gravatar.com/avatar/?d=mp&f=y';

        const buildFullUrl = (path) => {
            if (!path) return defaultAvatar;
            // already absolute
            if (path.startsWith('http') || path.startsWith('data:')) return path;

            // try to derive base from API config (remove trailing /api)
            let base = window.location.origin;
            try {
                const baseURL = api?.defaults?.baseURL || '';
                base = baseURL.replace(/\/api\/?$/i, '') || window.location.origin;
            } catch (err) {
                base = window.location.origin;
            }

            if (path.startsWith('/')) return base + path;
            return base + '/' + path;
        };

        const getAvatar = (u) => {
            // support multiple possible backend fields
            const candidates = [u?.avatar, u?.avatar_url, u?.imagen, u?.imagen_url, u?.imagen_path, u?.imagenUrl, u?.imagen_url];
            for (const c of candidates) {
                if (c && typeof c === 'string' && c.trim() !== '') return buildFullUrl(c.trim());
            }
            return defaultAvatar;
        };

        const onImgError = (e) => {
            // fallback to a default gravatar image when avatar fails to load
            try {
                if (e && e.target && e.target.src !== defaultAvatar) e.target.src = defaultAvatar;
            } catch (err) {
                // ignore
            }
        };

        const checkVisibility = () => {
            if (!currentUserId.value) {
                showScrollButton.value = false;
                return;
            }

            const container = podiumContainerRef.value;
            if (!container) {
                // fallback: hide
                showScrollButton.value = false;
                return;
            }

            const el = container.querySelector(`#user-${currentUserId.value}`);
            if (!el) {
                showScrollButton.value = false;
                return;
            }

            const rect = el.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            // consider in view when fully visible within container viewport
            const inView = rect.top >= containerRect.top && rect.bottom <= containerRect.bottom;
            showScrollButton.value = !inView;
        };

        const scrollToMe = () => {
            const container = podiumContainerRef.value || document;
            const el = (podiumContainerRef.value && podiumContainerRef.value.querySelector(`#user-${currentUserId.value}`)) || document.getElementById(`user-${currentUserId.value}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // hide button after scrolling
                setTimeout(() => (showScrollButton.value = false), 700);
            }
        };

        onMounted(() => {
            // load current user id from storage (same pattern used elsewhere)
            try {
                const localUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null');
                if (localUser && localUser.id) currentUserId.value = localUser.id;
            } catch (err) {
                // ignore
            }

            loadLeaderboard();

            // add scroll/resize listeners to update visibility
            const container = () => podiumContainerRef.value || window;
            const onScrollOrResize = () => checkVisibility();
            window.addEventListener('resize', onScrollOrResize);
            // if we have a container element, listen to its scroll
            const observerInterval = setInterval(() => {
                const c = podiumContainerRef.value;
                if (c) {
                    c.addEventListener('scroll', onScrollOrResize);
                    clearInterval(observerInterval);
                }
            }, 200);

            // cleanup on unmount
            const cleanup = () => {
                window.removeEventListener('resize', onScrollOrResize);
                try {
                    const c = podiumContainerRef.value;
                    if (c) c.removeEventListener('scroll', onScrollOrResize);
                } catch (e) { }
            };
            // expose cleanup to component (Vue will call on unmount automatically in composition API if registered, but keep simple)
            // no direct onUnmounted here to avoid import; it's ok for simple components
            // store cleanup on window to be safe (will be removed next page load)
            window.__weeklyPodiumCleanup = cleanup;
        });

        return { leaders, loading, personCircle, onImgError, defaultAvatar, getAvatar, podiumContainerRef, currentUserId, showScrollButton, scrollToMe };
    }
};
</script>

<style scoped>
.weekly-podium {
    background: var(--ion-card-background);
    padding: 12px;
    border-radius: 12px;
    box-shadow: 0 2px 6px rgba(0, 0, 0, .06);
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%
}

.weekly-podium h3 {
    margin: 0 0 8px;
    font-size: 16px
}

.podium-list {
    min-height: 80px;
    flex: 1;
    overflow: auto;
    padding-right: 6px
}

.podium-items {
    display: flex;
    flex-direction: column;
    gap: 8px
}

.podium-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px;
    border-radius: 8px
}

.podium-item.pos-1 {
    background: rgba(56, 128, 255, 0.08)
}

.podium-item.pos-2 {
    background: rgba(56, 128, 255, 0.04)
}

.podium-item.pos-3 {
    background: rgba(56, 128, 255, 0.02)
}

.podium-item.is-me {
    border: 2px solid #3880ff;
    background: rgba(56, 128, 255, 0.06)
}

.avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--ion-background)
}

.avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover
}

.info .name {
    font-weight: 600;
    font-size: 14px
}

.you-badge {
    font-size: 12px;
    color: #3880ff;
    margin-left: 8px;
    font-weight: 700
}

.pomodoro-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto
}

.flame-icon {
    display: block
}

.pomodoro-number {
    font-size: 18px;
    font-weight: 700;
    color: #222
}

.no-data {
    color: var(--ion-color-medium);
    font-size: 13px
}

.scroll-to-me {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    bottom: 16px;
    z-index: 30;
    background: #3880ff;
    color: #fff;
    border: none;
    padding: 8px 14px;
    border-radius: 999px;
    box-shadow: 0 6px 18px rgba(56, 128, 255, 0.25);
    cursor: pointer
}

.scroll-to-me:active {
    transform: translateX(-50%) scale(.98)
}
</style>
