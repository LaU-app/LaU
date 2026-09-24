<template><div class="study-welcome" :class="{compact}"><div><b>Hola, {{ name }} <span aria-hidden="true">✨</span></b><span>{{ date }}<template v-if="!compact && user.universidad?.nombre"> • {{ user.universidad.nombre }}</template></span></div><StudyAvatar v-if="!compact" :name="name"/></div></template>
<script setup lang="ts">
import { computed } from 'vue'
import { STUDY_TIMEZONE, readStudyUser } from '@/utils/studyPresentation'
import { study } from '@/utils/useStudy'
import StudyAvatar from './StudyAvatar.vue'
defineProps<{compact?:boolean}>()
const user=computed(()=>{void study.accountId.value;return readStudyUser()})
const name=computed(()=>(user.value.name || user.value.username || 'estudiante').split(' ')[0])
const date=new Date().toLocaleDateString('es-SV',{timeZone:STUDY_TIMEZONE,weekday:'short',day:'numeric',month:'long'})
</script>
