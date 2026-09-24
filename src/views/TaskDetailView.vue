<template><ion-page class="study-ui task-detail-page"><ion-content><main class="study-shell study-body task-detail">
  <div class="detail-toolbar"><div class="detail-toolbar-start"><button class="study-icon-button" aria-label="Volver a mis tareas" @click="router.push('/tasks')"><ion-icon :icon="arrowBackOutline"/></button><span class="eyebrow">TU TAREA</span></div><div><button class="study-icon-button" aria-label="Editar tarea" :disabled="!task || saving" @click="edit"><ion-icon :icon="createOutline"/></button><button class="study-icon-button" aria-label="Eliminar tarea" :disabled="!task || saving" @click="remove"><ion-icon :icon="trashOutline"/></button></div></div>
  <p v-if="loading && !task" class="study-empty" role="status">Cargando tu tarea…</p><p v-if="error" class="study-error" role="alert">{{ error }}<button class="study-link" @click="load">Reintentar</button></p>
  <template v-if="task">
    <section class="detail-hero study-card"><div class="task-kicker"><span class="neutral-chip"><i :class="'dot-'+(task.status==='completed' ? 'green' : 'blue')"/>{{ taskStatus[task.status] }}</span><span class="neutral-chip"><i class="dot-orange"/>Prioridad {{ taskPriority[task.priority] }}</span></div><p v-if="user.universidad?.nombre" class="detail-university"><ion-icon :icon="schoolOutline"/>{{ user.universidad.nombre }}</p><h1>{{ task.title }}</h1><div class="detail-deadline"><ion-icon :icon="alarmOutline"/><span>{{ task.due_date ? 'Vence '+studyDate(task.due_date) : 'Sin fecha de entrega' }}</span></div><div v-if="task.description" class="detail-description"><p>{{ task.description }}</p></div></section>
    <section class="task-detail-progress study-card"><div class="progress-card-heading"><span class="study-symbol"><ion-icon :icon="timerOutline"/></span><div><h2>Progreso de Pomodoros</h2><p>Sesiones de {{ study.preferences.focus_minutes }} min de enfoque</p></div><span class="neutral-chip">{{ percent }}% listo</span></div><div class="detail-progress-label"><b>{{ task.completed_pomodoros || 0 }} de {{ task.estimated_pomodoros || 'sin meta' }} sesiones completadas</b><span v-if="task.estimated_pomodoros">Meta: {{ task.estimated_pomodoros }} Pomodoros</span></div><TaskProgress :completed="task.completed_pomodoros || 0" :estimated="task.estimated_pomodoros" :active="currentlyStudying"/><div class="detail-progress-label"><span><i class="dot-blue"/>{{ task.completed_pomodoros || 0 }} Pomodoros completos</span><span v-if="task.estimated_pomodoros">{{ Math.max(0,task.estimated_pomodoros-(task.completed_pomodoros || 0)) }} restantes</span></div></section>
    <section v-if="task.pomodoro_sessions?.length" class="task-recent study-card"><h2>Últimos enfoques</h2><ol class="study-history"><li v-for="session in task.pomodoro_sessions.slice(0,5)" :key="session.id"><span class="study-symbol tone-blue"><ion-icon :icon="timerOutline"/></span><div><b>{{ session.status==='completed' ? 'Pomodoro completo' : session.status==='running' ? 'En curso' : session.status==='cancelled' ? 'Cancelado' : 'Enfoque guardado' }}</b><span>{{ studyDate(session.started_at) }}</span></div><strong>{{ formatStudyTime(session.duration_seconds) }}</strong></li></ol></section>
    <div class="detail-actions"><button v-if="!['completed','cancelled'].includes(task.status)" class="study-button" @click="router.push({path:'/study',query:{task:String(task.id),tab:'focus'}})"><ion-icon :icon="playOutline"/>Estudiar esta tarea <ion-icon :icon="arrowForwardOutline"/></button><button v-if="!['completed','cancelled'].includes(task.status)" class="study-button secondary-button complete-task" :disabled="saving" @click="complete"><ion-icon :icon="checkmarkCircleOutline"/>Marcar como completada</button><p v-else class="task-complete-message"><ion-icon :icon="checkmarkCircleOutline"/>{{ task.status==='completed' ? '¡Una meta más cumplida!' : 'Esta tarea está cerrada.' }}</p></div><StudyCelebration :value="celebration" text="¡Tarea completada! Un paso más."/>
  </template>
</main></ion-content></ion-page></template>
<script setup>
import { ref,computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { IonPage, IonContent, IonIcon, modalController, alertController } from '@ionic/vue'
import { createOutline, trashOutline,schoolOutline,alarmOutline,timerOutline,playOutline,arrowForwardOutline,checkmarkCircleOutline,arrowBackOutline } from 'ionicons/icons'
import tasksService from '@/services/tasksService'
import { useStudyScreen } from '@/utils/useStudyScreen'
import { studyDate,taskStatus,taskPriority,readStudyUser } from '@/utils/studyPresentation'
import { formatStudyTime } from '@/utils/studyTimer'
import { study } from '@/utils/useStudy'
import TaskProgress from '@/components/tasks/TaskProgress.vue'
import StudyCelebration from '@/components/study/StudyCelebration.vue'
import CreateTaskModal from '@/components/CreateTaskModal.vue'
import '@/theme/study.css'
const route = useRoute(), router = useRouter()
const task = ref(null), loading = ref(true), saving = ref(false), error = ref(''), celebration = ref(0)
const user=readStudyUser(),percent=computed(()=>task.value?.estimated_pomodoros ? Math.min(100,Math.round((task.value.completed_pomodoros || 0)/task.value.estimated_pomodoros*100)) : 0)
const currentlyStudying=computed(()=>!!task.value && study.timer.taskId===task.value.id && study.focusActive.value)
let request = 0
async function load() {
  const taskId = route.params.id, id = ++request
  if (!taskId) return
  try { const data = (await tasksService.getTaskById(taskId)).data; if(id === request && route.params.id === taskId) {task.value = data; error.value = ''} }
  catch { if(id === request) error.value = 'No pudimos abrir esta tarea. Inténtalo de nuevo.' } finally { if(id === request) loading.value = false }
}
async function edit() {
  const modal = await modalController.create({component:CreateTaskModal,componentProps:{task:task.value}})
  await modal.present(); const {data} = await modal.onDidDismiss(); if(data?.created) await load()
}
async function complete() {
  if(saving.value) return
  saving.value = true
  try { await tasksService.completeTask(task.value.id); await load(); celebration.value++; study.revision.value++ }
  catch { error.value = 'No pudimos completar la tarea. Inténtalo de nuevo.' } finally { saving.value = false }
}
async function remove() {
  const alert = await alertController.create({header:'¿Eliminar esta tarea?',message:'Tu tiempo de estudio se conserva.',buttons:[{text:'Conservar',role:'cancel'},{text:'Eliminar',role:'destructive',handler:async()=>{saving.value = true;try{await tasksService.deleteTask(task.value.id);study.revision.value++;await router.replace('/tasks')}catch{error.value='No pudimos eliminar la tarea.'}finally{saving.value=false}}}]})
  await alert.present()
}
useStudyScreen(load, ['tasks','stats'])
</script>
