<template><ion-page class="study-ui task-form-page"><ion-content><main class="study-shell study-body">
  <div class="form-heading"><button class="study-icon-button" aria-label="Cerrar formulario" @click="close"><ion-icon :icon="arrowBackOutline"/></button><div><span class="eyebrow">PLANIFICADOR LAU</span><h1>{{ editMode ? 'Editar tarea' : 'Nueva tarea' }}</h1></div><span class="study-icon-button"><ion-icon :icon="createOutline"/></span></div>
  <form class="task-form" @submit.prevent="save">
    <label class="task-field study-card"><span>TÍTULO DE LA TAREA <em>*</em></span><input v-model="form.title" required maxlength="255" placeholder="Ej. Resumen de Historia de El Salvador…" :disabled="saving"/></label>
    <label class="task-field study-card"><span>DESCRIPCIÓN O NOTAS <small>Opcional</small></span><textarea v-model="form.description" rows="3" maxlength="10000" placeholder="Detalles clave, links o notas del entregable…" :disabled="saving"/></label>
    <div class="task-field study-card"><span>FECHA Y HORA DE ENTREGA</span><div class="date-fields"><button class="date-button" type="button" :disabled="saving" @click="dateOpen=true"><span><ion-icon :icon="calendarOutline"/>FECHA LÍMITE</span><b>{{ form.due_date ? studyDate(form.due_date,false) : 'Elegir fecha' }}</b><small>{{ form.due_date ? calendarValue(form.due_date).slice(0,4) : 'Opcional' }}</small></button><button class="date-button" type="button" :disabled="saving" @click="dateOpen=true"><span><ion-icon :icon="timeOutline"/>HORA</span><b>{{ timeParts.time }}</b><small>{{ timeParts.period }}</small></button></div><button v-if="form.due_date" type="button" class="study-link clear-date" @click="form.due_date=null">Quitar fecha</button></div>
    <ion-modal class="task-date-modal study-ui" :is-open="dateOpen" @didDismiss="dateOpen=false"><ion-content><ion-datetime :value="calendarValue(form.due_date || new Date().toISOString())" presentation="date-time" locale="es-SV" hour-cycle="h12" :first-day-of-week="1" size="cover" :show-default-buttons="true" done-text="Confirmar" cancel-text="Cancelar" @ionChange="chooseDate" @ionCancel="dateOpen=false"><span slot="time-label">Hora</span></ion-datetime></ion-content></ion-modal>
    <fieldset class="task-field study-card"><legend class="sr-only">Nivel de prioridad</legend><span>NIVEL DE PRIORIDAD</span><div class="priority-picker"><label v-for="p in priorities" :key="p.id" :class="['priority-'+p.id,{selected:form.priority===p.id}]"><input v-model="form.priority" type="radio" name="priority" :value="p.id" :disabled="saving"/><i/><span>{{ p.label }}</span></label></div></fieldset>
    <div class="task-field study-card estimate-field"><div class="estimate-heading"><div><span class="eyebrow">ESTIMACIÓN DE ENFOQUE</span><small>Sesiones sugeridas de {{ study.preferences.focus_minutes }} min</small></div><span class="study-symbol"><ion-icon :icon="timerOutline"/></span></div><div class="block-stepper"><button type="button" :disabled="saving || form.estimated_pomodoros<=1" aria-label="Quitar un Pomodoro" @click="form.estimated_pomodoros--">−</button><div><div><output>{{ form.estimated_pomodoros }}</output><span>POMOS</span></div><small>~ {{ formatStudyTime(form.estimated_pomodoros*study.preferences.focus_minutes*60) }}</small></div><button type="button" :disabled="saving || form.estimated_pomodoros>=100" aria-label="Añadir un Pomodoro" @click="form.estimated_pomodoros++">+</button></div><span class="goal-dots" aria-hidden="true"><i v-for="n in Math.min(form.estimated_pomodoros+1,6)" :key="n" :class="{filled:n<=form.estimated_pomodoros}"/></span></div>
    <div class="form-tip study-card"><span class="study-symbol tone-blue"><ion-icon :icon="bulbOutline"/></span><div><b>Tip de estudio LaU</b><p>Dividir tu tarea en bloques pequeños evita la procrastinación en semanas de parciales.</p></div></div>
    <p v-if="error" class="study-error" role="alert">{{ error }}</p><button class="study-button task-save" type="submit" :disabled="saving || !form.title.trim()">{{ saving ? 'Guardando…' : editMode ? 'Guardar cambios' : 'Crear tarea' }}<ion-icon :icon="checkmarkOutline"/></button><button class="study-link form-cancel" type="button" :disabled="saving" @click="close">Cancelar</button>
  </form>
</main></ion-content><StudyBottomNav active="tasks" in-modal/></ion-page></template>
<script setup>
import { computed,reactive,ref } from 'vue'
import { IonPage,IonContent,IonIcon,IonModal,IonDatetime,modalController } from '@ionic/vue'
import { calendarOutline,timeOutline,arrowBackOutline,createOutline,timerOutline,bulbOutline,checkmarkOutline } from 'ionicons/icons'
import StudyBottomNav from './study/StudyBottomNav.vue'
import tasksService from '@/services/tasksService'
import { studyDate,calendarValue,studyTimeParts } from '@/utils/studyPresentation'
import { formatStudyTime } from '@/utils/studyTimer'
import { study } from '@/utils/useStudy'
import '@/theme/study.css'
const props=defineProps({task:{type:Object,default:null}})
const editMode=!!props.task,saving=ref(false),error=ref(''),dateOpen=ref(false)
const priorities=[{id:'low',label:'Baja'},{id:'medium',label:'Media'},{id:'high',label:'Alta'}]
const form=reactive({title:props.task?.title || '',description:props.task?.description || '',priority:props.task?.priority || 'medium',due_date:props.task?.due_date || null,estimated_pomodoros:props.task?.estimated_pomodoros || 1})
const timeParts=computed(()=>studyTimeParts(form.due_date))
const close=()=>{if(!saving.value)void modalController.dismiss()}
function chooseDate(event){const value=event.detail.value;if(typeof value==='string'){form.due_date=value.slice(0,16)+':00-06:00';dateOpen.value=false}}
async function save(){if(saving.value || !form.title.trim())return;saving.value=true;error.value='';try{const payload={...form,title:form.title.trim(),description:form.description.trim() || null,due_date:form.due_date ? new Date(form.due_date).toISOString() : null};const result=editMode ? await tasksService.updateTask(props.task.id,payload) : await tasksService.createTask(payload);study.revision.value++;await modalController.dismiss({created:true,offline:result.offline,task:result.data})}catch{error.value='No pudimos guardar la tarea. Revisa los campos y vuelve a intentar.'}finally{saving.value=false}}
</script>
