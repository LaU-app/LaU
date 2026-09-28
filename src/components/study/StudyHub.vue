<template>
  <main ref="shell" class="study-shell">
    <div class="study-body">
      <p v-if="error" class="study-error" role="alert">{{ error }} <button class="study-link" :disabled="busy" @click="study.retry()">Reintentar</button><button v-if="timer.pending" class="study-link" :disabled="busy" @click="confirmDiscard">Descartar bloque pendiente</button></p>
      <p v-else-if="timer.pending && !busy" class="study-notice" role="status">Hay un bloque pendiente de sincronizar. <button class="study-link" @click="study.retry()">Reintentar</button><button class="study-link" @click="confirmDiscard">Descartar bloque pendiente</button></p>
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
import { onIonViewWillEnter, alertController } from '@ionic/vue'
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
async function confirmDiscard() {
  const alert = await alertController.create({
    header: '¿Descartar el bloque pendiente?',
    message: 'Se intentará cerrar la sesión en el servidor. Si el tiempo aún no se guardó, no se podrá recuperar.',
    buttons: [
      { text: 'Conservar', role: 'cancel' },
      { text: 'Descartar', role: 'destructive', handler: () => { void study.discardPending() } },
    ],
  })
  await alert.present()
}
watch(selected, tab => { notice.value = ''; void shell.value?.closest('ion-content')?.scrollToTop(0); void router.replace({ path: '/tabs/study', query: { ...route.query, tab } }) })
watch(() => route.query.tab, tab => { if (route.path === '/tabs/study' && ['focus','progress','ranking'].includes(String(tab))) selected.value = String(tab) })
async function selectRouteTask() {
  if (route.path !== '/tabs/study') return
  const taskQuery = route.query.task, freeQuery = route.query.free
  await study.initialize()
  const id = Number(taskQuery)
  if (id > 0) {
    try { const result = await tasksService.getTaskById(id); if (route.path === '/tabs/study' && route.query.task === taskQuery) await study.selectTask(id, result.data.title) }
    catch { notice.value = 'No pudimos abrir esa tarea. Puedes elegir otra en Mis tareas.' }
  } else if (freeQuery === '1') await study.selectTask(null, '')
}
onMounted(selectRouteTask)
onIonViewWillEnter(selectRouteTask)
watch(() => [route.query.task, route.query.free], () => { if (route.path === '/tabs/study') void selectRouteTask() })
useStudyScreen(() => study.refreshRemote(['timer', 'preferences']), ['timer','tasks','stats','ranking','preferences'], false)
</script>
