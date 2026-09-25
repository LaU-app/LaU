<template>
  <main ref="shell" class="study-shell">
    <div class="study-body">
      <p v-if="error" class="study-error" role="alert">{{ error }} <button class="study-link" :disabled="busy" @click="study.retry()">Reintentar</button></p>
      <p v-else-if="timer.pending && !busy" class="study-notice" role="status">Tu tiempo está a salvo. Lo guardaremos cuando vuelva la conexión.</p>
      <p v-else-if="notice && timer.status !== 'recovery'" class="study-notice" role="status">{{ notice }}<button aria-label="Cerrar aviso" @click="notice = ''">×</button></p>
      <StudySettings v-if="settings && ready" @close="settings = false"/>
      <p v-if="!ready" class="study-empty" role="status">Preparando tu espacio…</p>
      <Transition v-else name="study-view" mode="out-in">
        <StudyFocus v-if="selected === 'focus'" :key="'focus-' + accountId" @settings="settings = !settings"/>
        <StudyProgress v-else-if="selected === 'progress'" :key="'progress-' + accountId"/>
        <StudyRanking v-else :key="'ranking-' + accountId"/>
      </Transition>
    </div>
  </main>
</template>
<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { onIonViewWillEnter } from '@ionic/vue'
import { study } from '@/utils/useStudy'
import { useStudyScreen } from '@/utils/useStudyScreen'
import tasksService from '@/services/tasksService'
import StudyFocus from './StudyFocus.vue'
import StudyProgress from './StudyProgress.vue'
import StudyRanking from './StudyRanking.vue'
import StudySettings from './StudySettings.vue'
import '@/theme/study.css'
const route = useRoute(), router = useRouter()
const { timer, ready, busy, error, notice, accountId } = study
const selected = ref(['focus','progress','ranking'].includes(String(route.query.tab)) ? String(route.query.tab) : 'focus')
const settings = ref(false)
const shell = ref<HTMLElement | null>(null)
watch(selected, tab => { notice.value = ''; void shell.value?.closest('ion-content')?.scrollToTop(0); void router.replace({ path: '/study', query: { ...route.query, tab } }) })
watch(() => route.query.tab, tab => { if (route.path === '/study' && ['focus','progress','ranking'].includes(String(tab))) selected.value = String(tab) })
async function selectRouteTask() {
  if (route.path !== '/study') return
  const taskQuery = route.query.task, freeQuery = route.query.free
  await study.initialize()
  const id = Number(taskQuery)
  if (id > 0) {
    try { const result = await tasksService.getTaskById(id); if (route.path === '/study' && route.query.task === taskQuery) await study.selectTask(id, result.data.title) }
    catch { notice.value = 'No pudimos abrir esa tarea. Puedes elegir otra en Mis tareas.' }
  } else if (freeQuery === '1') await study.selectTask(null, '')
}
onMounted(selectRouteTask)
onIonViewWillEnter(selectRouteTask)
watch(() => [route.query.task, route.query.free], () => { if (route.path === '/study') void selectRouteTask() })
useStudyScreen(() => study.refreshRemote(['timer', 'preferences']), ['timer','tasks','stats','ranking','preferences'], false)
</script>
