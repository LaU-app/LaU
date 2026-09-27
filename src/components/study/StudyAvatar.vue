<template><span class="study-avatar"><img v-if="src && !failed" :src="src" alt="" @error="failed=true"/><span v-else>{{ (name || 'LaU').slice(0,1).toUpperCase() }}</span></span></template>
<script setup lang="ts">
import { ref, watch } from 'vue'
const props=defineProps<{src?:string|null;name?:string}>()
const failed=ref(false)
watch(()=>props.src,()=>failed.value=false)
</script>
