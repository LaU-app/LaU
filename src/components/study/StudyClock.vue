<template>
  <strong class="clock-digits" aria-hidden="true"><span v-for="(digit,index) in value" :key="index" class="clock-digit" :class="{'clock-colon':digit === ':'}"><Transition name="clock-tick"><span :key="digit">{{ digit }}</span></Transition></span></strong>
</template>
<script setup lang="ts">
defineProps<{value:string}>()
</script>
