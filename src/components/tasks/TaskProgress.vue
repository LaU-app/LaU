<template>
  <div class="task-progress">
    <div class="task-progress-caption"><span>Pomodoros</span><b>{{ completed }} / {{ estimated || 'sin meta' }}</b></div>
    <div v-if="estimated" class="task-segments" role="progressbar" aria-label="Pomodoros completados" :aria-valuenow="Math.min(completed, estimated)" :aria-valuemin="0" :aria-valuemax="estimated">
      <span v-for="n in estimated" :key="n" class="task-segment" :class="{ filled: n <= completed, current: active && n === completed + 1 }"/>
    </div>
  </div>
</template>
<script setup lang="ts">
withDefaults(defineProps<{ completed?: number; estimated?: number | null; active?: boolean }>(), { completed: 0, estimated: null, active: false })
</script>
