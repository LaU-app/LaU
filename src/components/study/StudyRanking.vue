<template><section class="study-ranking">
  <div class="ranking-intro"><span class="eyebrow"><b>CRECEMOS JUNTOS</b><i class="dot-orange"/></span><h1>Ranking de estudio</h1><p class="study-muted">Un poco de inspiración para seguir a tu propio ritmo.</p></div>
  <div class="ranking-filters"><div class="period-selector" role="group" aria-label="Período"><button :aria-pressed="period==='week'" :class="{selected:period==='week'}" @click="period='week'">Semana</button><button :aria-pressed="period==='month'" :class="{selected:period==='month'}" @click="period='month'">Mes</button></div><label class="community-filter"><ion-icon :icon="businessOutline"/><span class="sr-only">Comunidad</span><select v-model="scope"><option value="global">Toda LaU</option><option v-if="scopes.includes('university')" value="university">Mi universidad</option><option v-if="scopes.includes('career')" value="career">Mi carrera</option></select></label></div>
  <p v-if="loading && !ranking" class="study-empty" role="status">Buscando a tu comunidad…</p><p v-if="error" class="study-error" role="alert">{{ error }} <button class="study-link" @click="load">Reintentar</button></p>
  <template v-if="ranking">
    <div class="my-ranking study-card"><div class="section-title"><span class="eyebrow">TU DESEMPEÑO</span><span v-if="ranking.me && ranking.me.position<=3" class="neutral-chip"><ion-icon :icon="sparklesOutline"/>Top 3</span></div><div v-if="ranking.me" class="my-ranking-score"><strong>#{{ ranking.me.position }}</strong><div><b>{{ formatStudyTime(ranking.me.seconds) }}</b><span>tiempo de enfoque</span></div></div><p v-else class="ranking-personal-note">{{ ranking.ranking_public ? 'Tu primer enfoque te dará un lugar aquí.' : 'Tu progreso es privado. Puedes explorar el ranking.' }}</p><div class="ranking-profile"><StudyAvatar :src="user.imagen_url" :name="user.name || user.username"/><div><b>@{{ user.username || user.name }} (Tú)</b><span>{{ [user.universidad?.nombre,user.carrera?.nombre].filter(Boolean).join(' · ') || 'Comunidad LaU' }}</span></div><ion-icon :icon="ranking.ranking_public ? checkmarkCircleOutline : lockClosedOutline"/></div><p v-if="gapToTop!==null" class="ranking-motivation"><ion-icon :icon="trophyOutline"/>A {{ gapToTop }} min de superar el tiempo del Top 3.</p></div>
    <div class="section-title podium-title"><h2><ion-icon :icon="ribbonOutline"/>Podio de Honor</h2><span v-if="updatedAt" class="study-muted">{{ updatedAt }}</span></div><div v-if="!ranking.entries.length" class="study-empty study-card"><h2>El primer paso cuenta</h2><p>Aún no hay participantes este período.</p></div><ol v-else class="ranking-list"><StudyRankingRow v-for="entry in ranking.entries.slice(0,3)" :key="entry.id" :entry="entry"/></ol>
    <section v-if="ranking.entries.length>3" class="ranking-community"><div class="section-title"><h2 class="eyebrow">COMPAÑEROS DESTACADOS</h2><button v-if="ranking.entries.length>6 && !showAll" class="study-link" @click="showAll=true">Ver más ({{ ranking.entries.length-6 }})</button></div><ol class="ranking-rest study-card"><StudyRankingRow v-for="entry in ranking.entries.slice(3,showAll ? undefined : 6)" :key="entry.id" :entry="entry"/></ol></section>
  </template>
  <details class="privacy-settings study-card"><summary><ion-icon :icon="lockClosedOutline"/>Privacidad del ranking <ion-icon :icon="chevronDownOutline"/></summary><p>Tú tienes el control. Puedes ocultarte del ranking sin perder tus métricas personales.</p><label>Ocultarme del ranking<input type="checkbox" :checked="!preferences.ranking_public" :disabled="busy || !ready" @change="togglePrivacy"/></label></details>
</section></template>
<script setup lang="ts">
import { onMounted,onBeforeUnmount,ref,watch,computed } from 'vue'
import { IonIcon } from '@ionic/vue'
import { trophyOutline,sparklesOutline,lockClosedOutline,businessOutline,checkmarkCircleOutline,ribbonOutline,chevronDownOutline } from 'ionicons/icons'
import { study } from '@/utils/useStudy'
import { studyService } from '@/services/studyService'
import { formatStudyTime } from '@/utils/studyTimer'
import type { StudyRanking } from '@/types/study'
import StudyRankingRow from './StudyRankingRow.vue'
import StudyAvatar from './StudyAvatar.vue'
import { readStudyUser,STUDY_TIMEZONE } from '@/utils/studyPresentation'
const { preferences, busy, ready } = study
const ranking = ref<StudyRanking | null>(null), period = ref('week'), scope = ref('global'), scopes = ref(['global'])
const loading = ref(true), error = ref('')
const user=readStudyUser(),showAll=ref(false),updatedAt=ref('')
const gapToTop=computed(()=>{const data=ranking.value;return data?.me && data.me.position>3 && data.entries[2] ? Math.max(1,Math.ceil((data.entries[2].seconds-data.me.seconds+1)/60)) : null})
let request = 0
async function load() {
  const id = ++request; loading.value = true; error.value = ''
  try { const data = await studyService.ranking(period.value, scope.value); if (id === request) { ranking.value = data; scopes.value = data.available_scopes;updatedAt.value='Actualizado '+new Date().toLocaleTimeString('es-SV',{timeZone:STUDY_TIMEZONE,hour:'numeric',minute:'2-digit',hourCycle:'h12'}) } }
  catch { if (id === request) error.value = 'No pudimos cargar el ranking. Inténtalo de nuevo.' }
  finally { if (id === request) loading.value = false }
}
async function togglePrivacy(event:Event) { await study.savePreferences({ranking_public: !preferences.ranking_public});(event.target as HTMLInputElement).checked=!preferences.ranking_public }
onMounted(load); watch([period,scope,study.revision],load); onBeforeUnmount(() => { request++ })
</script>
