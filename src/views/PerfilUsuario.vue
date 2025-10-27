<template>
  <v-container class="pa-0" fluid>

<!-- el header del perfil  -->
<v-app-bar color="white" flat>
<v-row align="center" class="px-4" justify="space-between" style="width: 100%;">
<v-img src="/logo.png" max-width="40" />
<div class="text-subtitle-2 font-weight-medium purple--text">@mateocanales</div>
<v-btn icon>
<v-icon>mdi-bell-outline</v-icon>
</v-btn>
</v-row>
</v-app-bar>

<!--perfil de usuario boton para seguir enviar mensaje ademas de la foto de perfil -->
<v-container class="text-center mt-4">
<v-avatar size="80">
<v-img src="../assets/42d7d92b651bd58bd9e59313fd96de77.jpg" alt="FotoPerfil" />
</v-avatar>
<h3 class="mt-2 mb-1">Mateo</h3>
<p class="text-caption grey--text">
ITCA FEPADE, Desarrollo de software
</p>

<div class="d-flex justify-center gap-2 mt-2">
<v-btn color="primary" rounded>Seguir</v-btn>
<!-- al descomentar la linea siguiente se añade el boton de enviar mensaje se comento por recomendacion de Mateo  -->
<!-- <v-btn color="blue-lighten-4" rounded>Enviar Mensaje</v-btn> --> 
</div>

<!-- aqui van los contadores de los seguidores publicaciones y seguidos -->
<v-row class="mt-4 text-center" justify="center">
<v-col cols="4">
<div class="text-subtitle-1 font-weight-medium">30</div>
<div class="text-caption grey--text">Publicaciones</div>
</v-col>
<v-col cols="4">
<div class="text-subtitle-1 font-weight-medium">20</div>
<div class="text-caption grey--text">Seguidores</div>
</v-col>
<v-col cols="4">
<div class="text-subtitle-1 font-weight-medium">60</div>
<div class="text-caption grey--text">Seguidos</div>
</v-col>
</v-row>
<v-divider class="my-3"></v-divider>

<!-- Tabs -->
<v-tabs v-model="tab" centered grow color="purple" class="mb-2">
<v-tab value="posts">
<v-icon start>mdi-grid</v-icon>
Posts
</v-tab>
 <v-tab value="folders">
<v-icon start>mdi-folder-outline</v-icon>
Folders
</v-tab>
<v-tab value="playlist">
<v-icon start>mdi-music</v-icon>
Playlist
</v-tab>
</v-tabs>

<!-- Contenido de cada tab -->
<v-tabs-window v-model="tab">
<v-tabs-window-item value="posts">
<v-row>
<v-col cols="6" v-for="i in 4" :key="i">
<v-sheet class="d-flex align-center justify-center grey-lighten-4 rounded-lg" height="120">
<v-icon size="40" color="grey-darken-2">
{{ postIcons[i - 1] }}
</v-icon>
</v-sheet>
</v-col>
</v-row>
</v-tabs-window-item>

<v-tabs-window-item value="folders">
<v-container class="text-center grey--text">Sin carpetas todavía</v-container>
</v-tabs-window-item>

<v-tabs-window-item value="playlist">
<v-container class="text-center grey--text">No hay playlists creadas</v-container>
</v-tabs-window-item>
</v-tabs-window>
</v-container>

<!-- Barra de navegación inferior -->
<v-bottom-navigation color="purple" grow>
<v-btn>
<v-icon color="purple lighten-1">mdi-home-outline</v-icon>
</v-btn>
<v-btn>
<v-icon color="purple lighten-1">mdi-account-outline</v-icon>
</v-btn>
<v-btn>
<v-icon large color="purple lighten-1">mdi-plus-circle</v-icon>
</v-btn>
<v-btn>
<v-icon color="purple lighten-1">mdi-school-outline</v-icon>
</v-btn>
<v-btn>
<!-- esto es para que el boton sea el avatar de el usuario -->
<v-avatar size="30">
<v-img src= "../assets/42d7d92b651bd58bd9e59313fd96de77.jpg" />
</v-avatar>
</v-btn>
</v-bottom-navigation>
</v-container>
</template>

<script setup>

import { ref } from 'vue'

defineOptions({
  name: 'perfilusuario'
})

const tab = ref('posts')
const postIcons = ['mdi-file-outline', 'mdi-image-outline', 'mdi-music-note-outline', 'mdi-file-outline']
</script>

<style scoped>
.purple--text {
  color: #7b2ff7;
}
.gap-2 {
  gap: 8px;
}
</style>