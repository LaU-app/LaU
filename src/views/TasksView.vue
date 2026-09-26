<template>
  <ion-page class="study-ui tasks-page" :class="{'study-focus-active':study.focusActive.value}"><ion-content>
    <main class="study-shell">
      <div class="study-body">
        <div class="tasks-welcome"><span class="eyebrow"><i/>{{ route.query.choose ? 'ELIGE TU PRÓXIMO ENFOQUE' : 'TU PLAN...' }}</span><div class="tasks-welcome-row"><DynamicTaskHeading/><button class="study-button compact-button" aria-label="Crear una tarea" @click="openCreate"><ion-icon :icon="addOutline"/>Crear tarea</button></div></div>
        <div v-if="stats" class="task-stats" aria-label="Resumen de tareas">
          <div><b><i class="dot-green"/>{{ stats.completed }}</b><span>Completadas</span></div><div><b><i class="dot-purple"/>{{ stats.in_progress }}</b><span>En curso</span></div><div><b><i/>{{ stats.pending }}</b><span>Pendientes</span></div><div><b><i class="dot-orange"/>{{ stats.pomodoros_today }}</b><span>Pomos hoy</span></div>
        </div>
        <div class="task-list-heading"><div><h2>Tus tareas</h2><span v-if="stats" class="total-chip">{{ stats.total }} total</span></div><label><span class="sr-only">Filtrar tareas</span><select v-model="filter" @change="load()"><option value="">Todas</option><option value="pending">Pendientes</option><option value="in_progress">En curso</option><option value="completed">Completadas</option><option value="cancelled">Canceladas</option></select></label></div>
        <p v-if="error" class="study-error" role="alert">{{ error }} <button class="study-link" @click="load()">Reintentar</button></p>
        <p v-if="loading && !tasks.length" class="study-empty" role="status">Cargando tus tareas…</p>
        <div v-else-if="!tasks.length && !error" class="study-empty tasks-empty"><span class="study-symbol tone-blue"><ion-icon :icon="bookOutline"/></span><h2>{{ filter ? 'Todo despejado por aquí' : 'Dale espacio a tu próxima meta' }}</h2><p>{{ filter ? 'No tienes tareas con este estado.' : 'Crea una tarea y empieza con un Pomodoro.' }}</p><button class="study-link" @click="filter ? clearFilter() : openCreate()">{{ filter ? 'Ver todas las tareas' : 'Crear mi primera tarea' }}</button></div>
        <div class="task-list"><TaskCard v-for="task in tasks" :key="task.id || task.uuid_cliente" :task="task" @click="router.push('/tasks/' + task.id)" @study="studyTask(task)"/></div>
        <button v-if="page < lastPage" class="study-link load-more" :disabled="loading" @click="load(true)">Ver más tareas</button>
      </div>
    </main>
  </ion-content><StudyBottomNav active="tasks"/></ion-page>
</template>
<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonPage, IonContent, IonIcon, modalController } from '@ionic/vue'
import { addOutline, bookOutline } from 'ionicons/icons'
import tasksService from '@/services/tasksService'
import { study } from '@/utils/useStudy'
import { useStudyScreen } from '@/utils/useStudyScreen'
import StudyBottomNav from '@/components/study/StudyBottomNav.vue'
import DynamicTaskHeading from '@/components/tasks/DynamicTaskHeading.vue'
import TaskCard from '@/components/TaskCard.vue'
import CreateTaskModal from '@/components/CreateTaskModal.vue'
import '@/theme/study.css'
const router = useRouter(), route = useRoute()
const tasks = ref([]), stats = ref(null), filter = ref(''), loading = ref(true), error = ref(''), page = ref(1), lastPage = ref(1)
let request = 0
async function load(append = false) {
  const id = ++request; loading.value = true; error.value = ''
  try {
    const [list, summary] = await Promise.all([tasksService.getTasks({status: filter.value || null, page: append ? page.value + 1 : 1}), tasksService.getTasksStats()])
    if (id !== request) return
    tasks.value = append ? [...tasks.value,...list.data.data] : list.data.data
    stats.value = summary.data; page.value = list.data.current_page; lastPage.value = list.data.last_page
  } catch { if(id === request) error.value = 'No pudimos cargar tus tareas. Inténtalo de nuevo.' }
  finally { if(id === request) loading.value = false }
}
const clearFilter = () => { filter.value = ''; void load() }
const studyTask = task => router.push({path:'/study',query:{task:String(task.id),tab:'focus'}})
async function openCreate() {
  const modal = await modalController.create({component:CreateTaskModal})
  await modal.present()
  const {data} = await modal.onDidDismiss()
  if (data?.created) { await load(); if(data.offline && data.task) tasks.value.unshift(data.task) }
}
useStudyScreen(load, ['tasks','stats','timer'])
</script>
