<template><article class="task-tile study-card" :class="'task-'+task.status">
  <button class="task-info" :disabled="!task.id" :aria-label="'Ver tarea: '+task.title" @click="$emit('click')">
    <span class="task-kicker"><span class="status-chip" :class="'status-'+task.status"><i/>{{ taskStatus[task.status] }}</span><span class="priority-label" :class="'priority-'+task.priority"><i/>{{ taskPriority[task.priority] }}</span></span>
    <h3>{{ task.title }}</h3><p v-if="task.description">{{ task.description }}</p>
    <span class="task-meta"><span class="task-date"><ion-icon :icon="calendarOutline"/>{{ studyDate(task.due_date) }}</span><span class="task-pomos"><ion-icon :icon="task.status==='completed' ? checkmarkCircleOutline : timerOutline"/>{{ task.completed_pomodoros || 0 }} / {{ task.estimated_pomodoros || '—' }} Pomos{{ task.status==='completed' ? ' hechos' : '' }}</span></span>
  </button>
  <div class="task-track" role="progressbar" aria-label="Pomodoros completados" :aria-valuenow="task.completed_pomodoros || 0" :aria-valuemax="task.estimated_pomodoros || undefined" :aria-valuemin="0"><span :style="{width:percent+'%'}"/></div>
  <div v-if="!['completed','cancelled'].includes(task.status)" class="task-card-bottom"><span>{{ remainingLabel }}</span><button v-if="task.status==='in_progress'" class="study-button task-study-button" :disabled="!task.id" @click="$emit('study',task)">Estudiar <ion-icon :icon="arrowForwardOutline"/></button><button v-else class="study-icon-button task-play" :disabled="!task.id" :aria-label="'Estudiar '+task.title" @click="$emit('study',task)"><ion-icon :icon="playOutline"/></button></div>
  <p v-if="!task.id" class="offline-task-note">Guardada. Podrás estudiarla cuando vuelva la conexión.</p>
</article></template>
<script setup>
import { computed } from 'vue'
import { IonIcon } from '@ionic/vue'
import { calendarOutline,timerOutline,checkmarkCircleOutline,arrowForwardOutline,playOutline } from 'ionicons/icons'
import { studyDate,taskStatus,taskPriority } from '@/utils/studyPresentation'
import { study } from '@/utils/useStudy'
const props=defineProps({task:{type:Object,required:true}})
defineEmits(['click','study'])
const percent=computed(()=>props.task.estimated_pomodoros ? Math.min(100,(props.task.completed_pomodoros || 0)/props.task.estimated_pomodoros*100) : 0)
const remainingLabel=computed(()=>{const count=Math.max(0,(props.task.estimated_pomodoros || 0)-(props.task.completed_pomodoros || 0));return props.task.status==='in_progress' ? `${count*study.preferences.focus_minutes} min estimados restantes` : props.task.estimated_pomodoros ? `${count} bloques de ${study.preferences.focus_minutes} min` : 'A tu propio ritmo'})
</script>
