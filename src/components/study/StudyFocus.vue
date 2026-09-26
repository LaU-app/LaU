<template>
  <section class="study-focus" :class="{'is-break':timer.phase!=='focus','is-running':timer.status==='running','is-live':study.focusActive.value}">
    <div class="focus-canvas study-card">
      <div v-if="contextLabel || !study.focusActive.value" class="focus-context"><span v-if="contextLabel" class="neutral-chip"><i class="status-dot"/>{{ contextLabel }}</span><button v-if="!study.focusActive.value" class="study-link settings-trigger" aria-label="Configurar el temporizador" @click="$emit('settings')"><ion-icon :icon="optionsOutline"/>{{ preferences.focus_minutes }} min</button></div>
      <h1>{{ timer.taskId ? timer.activity : 'Estudio libre' }}</h1>
      <router-link v-if="timer.status==='idle' && !timer.startUuid && !timer.pending" class="study-link choose-task" to="/tasks?choose=1">{{ timer.taskId ? 'Cambiar tarea' : 'Elegir una tarea' }}</router-link>
      <div v-if="task" class="focus-goal neutral-chip"><ion-icon :icon="hourglassOutline"/><span>Pomodoro <b>{{ task.completed_pomodoros || 0 }} de {{ task.estimated_pomodoros || 'sin meta' }}</b></span><span class="goal-dots" aria-hidden="true"><i v-for="n in Math.min(task.estimated_pomodoros || 1,8)" :key="n" :class="{filled:n<=task.completed_pomodoros}"/></span></div>
      <div v-if="timer.status==='recovery'" class="recovery-card"><h2>Tienes una sesión en curso</h2><p class="study-muted">Continúa a tu ritmo. Contaremos desde que vuelvas.</p><button class="study-button" :disabled="busy" @click="study.recover()">Continuar sesión</button><button class="study-link" :disabled="busy" @click="study.finish()">Finalizar sesión</button></div>
      <template v-else>
        <div class="focus-timer" role="timer" :aria-label="phaseLabel+': '+clock">
          <svg viewBox="0 0 240 240" aria-hidden="true"><circle class="timer-track" cx="120" cy="120" r="98"/><circle class="timer-progress" cx="120" cy="120" r="98" pathLength="100" :style="{strokeDashoffset:100*(1-remaining/timer.duration)}"/></svg>
          <div class="timer-face"><StudyClock :value="clock"/></div>
        </div>
        <div class="focus-controls">
          <button v-if="timer.status==='idle'" class="study-button" :disabled="busy || !ready || !!timer.pending" @click="study.start()"><ion-icon :icon="playOutline"/>{{ timer.startUuid ? 'Continuar sesión' : 'Comenzar enfoque' }}</button>
          <button v-else-if="timer.status==='running'" class="study-button" :disabled="busy" @click="study.pause()"><ion-icon :icon="pauseOutline"/>Pausar sesión</button>
          <button v-else-if="timer.status==='paused'" class="study-button" :disabled="busy" @click="study.resume()"><ion-icon :icon="playOutline"/>Continuar</button>
          <div v-if="timer.status!=='idle'" class="focus-secondary"><button class="study-link" :disabled="busy" @click="restart"><ion-icon :icon="refreshOutline"/>Reiniciar</button><button class="study-link" :disabled="busy" @click="finish"><ion-icon :icon="flagOutline"/>{{ timer.phase==='focus' ? 'Terminar antes' : 'Terminar descanso' }}</button></div>
        </div>
        <StudyCelebration :value="timer.completed"/>
      </template>
    </div>
    <div class="focus-motivation"><span class="study-symbol"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 12c-1.333 -1.854 -1.333 -4.146 0 -6"/><path d="M8 12c-1.333 -1.854 -1.333 -4.146 0 -6"/><path d="M16 18c1.333 -1.854 1.333 -4.146 0 -6"/><path d="M20 18c1.333 -1.854 1.333 -4.146 0 -6"/></svg></span><Transition name="word-rise" mode="out-in"><div :key="quote.quote"><p>“{{ quote.quote }}”</p><span class="study-muted">{{ quote.author }}</span></div></Transition></div>
  </section>
</template>
<script setup lang="ts">
import { computed,ref,watch,onMounted,onBeforeUnmount } from 'vue'
import { IonIcon,alertController } from '@ionic/vue'
import { playOutline,pauseOutline,refreshOutline,flagOutline,hourglassOutline,optionsOutline } from 'ionicons/icons'
import { study } from '@/utils/useStudy'
import tasksService from '@/services/tasksService'
import { pickStudyQuote, type StudyQuote } from '@/utils/studyQuotes'
import StudyClock from './StudyClock.vue'
import StudyCelebration from './StudyCelebration.vue'
defineEmits(['settings'])
const {timer,remaining,ready,busy,preferences}=study
const task=ref<any>(null)
const quote=ref<StudyQuote>(pickStudyQuote())
const clock=computed(()=>String(Math.floor(remaining.value/60)).padStart(2,'0')+':'+String(remaining.value%60).padStart(2,'0'))
const phaseLabel=computed(()=>timer.phase==='focus' ? 'Enfoque profundo' : timer.phase==='short_break' ? 'Descanso corto' : 'Descanso largo')
// El reloj se queda solo con el tiempo: el estado vive en el chip de contexto y el enfoque en curso no necesita etiqueta.
const contextLabel=computed(()=>timer.status==='paused' ? 'EN PAUSA' : timer.phase!=='focus' ? phaseLabel.value.toUpperCase() : timer.status==='idle' ? 'TU ENFOQUE' : '')
let request=0
async function loadTask(){const id=++request,taskId=timer.taskId;if(!taskId){task.value=null;return}try{const result=await tasksService.getTaskById(taskId);if(id===request && taskId===timer.taskId)task.value=result.data}catch{/* Retain clock while offline. */}}
onMounted(()=>{void loadTask()});watch([()=>timer.taskId,study.revision],()=>{void loadTask()});onBeforeUnmount(()=>request++)
// Una frase nueva solo cuando arranca un Pomodoro real (sesión nueva); se mantiene estable durante pausas y descansos.
watch(()=>timer.session?.uuid_cliente, (id,prev)=>{ if(id && id!==prev) quote.value=pickStudyQuote(quote.value.quote) })
async function finish(){if(timer.phase!=='focus'){await study.finish();return}const alert=await alertController.create({header:'¿Terminar el enfoque?',message:'Tu tiempo estudiado quedará guardado.',buttons:[{text:'Continuar',role:'cancel'},{text:'Finalizar',handler:()=>{void study.finish()}}]});await alert.present()}
async function restart(){const alert=await alertController.create({header:'¿Reiniciar esta sesión?',message:'El enfoque actual se cancelará sin sumar tiempo. El temporizador quedará listo para empezar de nuevo.',buttons:[{text:'Conservar',role:'cancel'},{text:'Reiniciar',handler:()=>{void study.finish(true)}}]});await alert.present()}
</script>
