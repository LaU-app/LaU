<template>
    <transition name="slide-down">
        <div
            v-if="visible"
            class="floating-player-wrapper"
            :class="{
                'on-study-screen': onStudyScreen || onTasksScreen
            }"
        >
            <div
                class="floating-pill"
                ref="pillRef"
                :class="{ 'is-glass': isGlassMode }"
                @click="goToFocus"
            >
                <LiquidGlassBox
                    v-if="isGlassMode"
                    class="pill-glass-bg"
                    :height="60"
                    :depth="5"
                    :radius="30"
                    :strength="100"
                    :chromaticAberration="3"
                    :blur="1.8"
                    :width="calculatedPillWidth"
                />

                <div
                    class="progress-bg"
                    :style="{
                        width: progressPercent + '%'
                    }"
                ></div>

                <div class="pill-content">
                    <span class="mini-symbol">
                        <ion-icon
                            :icon="
                                timer.status === 'paused'
                                    ? pauseOutline
                                    : timerOutline
                            "
                        />
                    </span>

                    <div class="mini-info">
                        <span class="mini-title">
                            {{
                                timer.taskId
                                    ? timer.activity
                                    : 'Estudio libre'
                            }}
                        </span>

                        <span class="mini-artist">
                            {{ clock }} restantes{{
                                timer.status === 'paused'
                                    ? ' · en pausa'
                                    : ''
                            }}
                        </span>
                    </div>

                    <button
                        class="mini-control-btn"
                        :disabled="study.busy.value"
                        :aria-label="
                            timer.status === 'running'
                                ? 'Pausar sesión'
                                : 'Continuar sesión'
                        "
                        @click.stop="togglePause"
                    >
                        <ion-icon
                            :icon="
                                timer.status === 'running'
                                    ? pauseOutline
                                    : playOutline
                            "
                        />
                    </button>
                </div>
            </div>
        </div>
    </transition>
</template>

<script setup>
import {
    computed,
    ref,
    onMounted,
    onUnmounted
} from 'vue'

import { IonIcon } from '@ionic/vue'
import { useRoute, useRouter } from 'vue-router'

import {
    timerOutline,
    pauseOutline,
    playOutline
} from 'ionicons/icons'

import { study } from '@/utils/useStudy'

import LiquidGlassBox from '@/components/LiquidGlassBox.vue'
import { useGlassMode } from '@/utils/useGlassMode'

const { isGlassMode } = useGlassMode()

const route = useRoute()
const router = useRouter()

const {
    timer,
    remaining
} = study

const windowWidth = ref(window.innerWidth)

const updateWidth = () => {
    windowWidth.value = window.innerWidth
}

onMounted(() => {
    window.addEventListener(
        'resize',
        updateWidth
    )
})

onUnmounted(() => {
    window.removeEventListener(
        'resize',
        updateWidth
    )
})

const calculatedPillWidth = computed(() =>
    Math.min(
        windowWidth.value - 32,
        400
    )
)

// Ocultarlo cuando ya se ve el temporizador
// completo en la pantalla de Enfoque.
const onFocusScreen = computed(
    () =>
        route.path === '/study' &&
        (
            !route.query.tab ||
            route.query.tab === 'focus'
        )
)

const onStudyScreen = computed(
    () => route.path === '/study'
)

// El desplazamiento por defecto libera el AppHeader
// del feed; /tasks no tiene header propio,
// así que la píldora sube como en /study.
const onTasksScreen = computed(
    () => route.path === '/tasks'
)

const visible = computed(
    () =>
        study.focusActive.value &&
        !onFocusScreen.value
)

const clock = computed(() => {
    const minutes = String(
        Math.floor(
            remaining.value / 60
        )
    ).padStart(2, '0')

    const seconds = String(
        remaining.value % 60
    ).padStart(2, '0')

    return `${minutes}:${seconds}`
})

const progressPercent = computed(() => {
    if (!timer.duration) {
        return 0
    }

    return Math.min(
        100,
        Math.max(
            0,
            (
                1 -
                remaining.value /
                    timer.duration
            ) * 100
        )
    )
})

function goToFocus() {
    router.push({
        path: '/study',
        query: {
            tab: 'focus'
        }
    })
}

function togglePause() {
    if (
        timer.status === 'running'
    ) {
        void study.pause()
    } else if (
        timer.status === 'paused'
    ) {
        void study.resume()
    } else if (
        timer.status === 'recovery'
    ) {
        void study.recover()
    }
}
</script>

<style scoped>
.floating-player-wrapper {
    position: fixed;

    top: calc(
        env(safe-area-inset-top) + 60px
    );

    left: 0;

    width: 100%;

    z-index: 999;

    display: flex;
    justify-content: center;

    padding: 0 16px;

    pointer-events: none;
}

.floating-player-wrapper.on-study-screen {
    top: calc(
        env(safe-area-inset-top) + 12px
    );
}

.floating-pill {
    position: relative;

    width: 100%;
    max-width: 400px;

    background:
        var(--ion-color-light);

    border-radius: 30px;

    overflow: hidden;

    box-shadow:
        0 8px 20px
        rgba(0, 0, 0, 0.4);

    pointer-events: auto;

    cursor: pointer;

    border:
        1px solid
        rgba(
            255,
            255,
            255,
            0.1
        );

    transition:
        background 0.3s ease,
        border 0.3s ease,
        box-shadow 0.3s ease;
}

.floating-pill.is-glass {
    background: transparent;
    border: none;
    box-shadow: none;
}

.pill-glass-bg {
    position: absolute;

    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

    z-index: -1;

    pointer-events: none;

    border-radius: 30px;
}

.progress-bg {
    position: absolute;

    top: 0;
    left: 0;

    height: 100%;

    background:
        rgba(
            var(--ion-color-primary-rgb),
            0.35
        );

    transition:
        width 0.5s linear;

    z-index: 0;
}

.pill-content {
    position: relative;

    z-index: 1;

    display: flex;
    align-items: center;

    padding:
        6px
        14px
        6px
        6px;

    gap: 10px;
}

.mini-symbol {
    width: 36px;
    height: 36px;

    flex-shrink: 0;

    display: grid;
    place-items: center;

    border-radius: 50%;

    background:
        rgba(
            var(--ion-color-primary-rgb),
            0.14
        );

    color:
        var(--ion-color-primary);

    font-size: 18px;
}

.mini-info {
    flex: 1;

    display: flex;
    flex-direction: column;

    min-width: 0;
}

.mini-title {
    font-size: 13px;
    font-weight: 700;

    color:
        var(--ion-text-color);

    white-space: nowrap;

    overflow: hidden;

    text-overflow: ellipsis;
}

.mini-artist {
    font-size: 11px;

    color:
        var(--ion-text-color);

    opacity: 0.7;

    white-space: nowrap;

    overflow: hidden;

    text-overflow: ellipsis;
}

.mini-control-btn {
    width: 32px;
    height: 32px;

    flex-shrink: 0;

    display: grid;
    place-items: center;

    border-radius: 50%;

    border: 0;

    padding: 0;

    background:
        rgba(
            var(--ion-color-primary-rgb),
            0.14
        );

    color:
        var(--ion-color-primary);

    font-size: 18px;
}

.mini-control-btn:disabled {
    opacity: 0.5;
}

.slide-down-enter-active,
.slide-down-leave-active {
    transition:
        all
        0.3s
        cubic-bezier(
            0.25,
            0.8,
            0.25,
            1
        );
}

.slide-down-enter-from,
.slide-down-leave-to {
    opacity: 0;

    transform:
        translateY(-20px)
        scale(0.95);
}

@media (
    prefers-reduced-motion: reduce
) {
    .slide-down-enter-active,
    .slide-down-leave-active {
        transition:
            opacity
            0.15s linear;
    }

    .slide-down-enter-from,
    .slide-down-leave-to {
        transform: none;
    }
}
</style>