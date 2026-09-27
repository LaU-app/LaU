<template><li class="ranking-row" :class="'rank-'+entry.position"><span class="rank-position"><b>#{{ entry.position }}</b><ion-icon v-if="entry.position<=3" :icon="ribbonOutline"/></span><span class="rank-avatar-wrap"><StudyAvatar :src="entry.avatar" :name="entry.username"/><i v-if="entry.position===1" aria-hidden="true">👑</i></span><div class="rank-person"><b>@{{ entry.username }}</b><span v-if="entry.position===1" class="leader-label">Líder</span><span v-else class="study-muted">Comunidad LaU</span></div><div class="rank-time"><b>{{ formatStudyTime(entry.seconds) }}</b><span>enfoque</span></div></li></template>
<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { ribbonOutline } from 'ionicons/icons'
import StudyAvatar from './StudyAvatar.vue'
import { formatStudyTime } from '@/utils/studyTimer'
import type { StudyRanking } from '@/types/study'
defineProps<{entry:StudyRanking['entries'][number]}>()
</script>
