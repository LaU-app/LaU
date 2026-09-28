<template><ion-footer class="study-footer ion-no-border"><nav aria-label="Navegación de Estudio"><button v-for="item in items" :key="item.id" :class="{selected:active===item.id,'is-progress':item.id==='progress'}" :aria-current="active===item.id ? 'page' : undefined" @click="navigate(item)"><ion-icon :icon="item.icon"/><span>{{ item.label }}</span></button></nav></ion-footer></template>
<script setup lang="ts">
import { IonFooter, IonIcon, modalController, useIonRouter } from '@ionic/vue'
import { timerOutline, checkmarkCircleOutline, statsChart, podiumOutline } from 'ionicons/icons'
import { studyPageTransition } from '@/utils/studyTransition'
const props=defineProps<{active:string;inModal?:boolean}>()
const router=useIonRouter()
const items=[{id:'focus',label:'Enfoque',icon:timerOutline},{id:'tasks',label:'Tareas',icon:checkmarkCircleOutline},{id:'progress',label:'Progreso',icon:statsChart},{id:'ranking',label:'Ranking',icon:podiumOutline}]
async function navigate(item:typeof items[number]) { if(props.inModal) await modalController.dismiss(); router.push(item.id==='tasks' ? '/tasks' : {path:'/tabs/study',query:{tab:item.id}}, studyPageTransition) }
</script>
