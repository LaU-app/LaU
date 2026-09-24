<template><ion-page class="study-page study-ui" :class="['study-destination-'+selected, { 'study-focus-active': study.focusActive.value }]"><ion-content><StudyHub/></ion-content><StudyBottomNav :active="selected"/></ion-page></template>
<script setup lang="ts">
import { IonPage, IonContent } from '@ionic/vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { study } from '@/utils/useStudy'
import StudyHub from '@/components/study/StudyHub.vue'
import StudyBottomNav from '@/components/study/StudyBottomNav.vue'
const route=useRoute()
const selected=computed(()=>['focus','progress','ranking'].includes(String(route.query.tab)) ? String(route.query.tab) : 'focus')
</script>
