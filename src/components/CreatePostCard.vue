<template>
  <ion-card class="create-post-card">
    <ion-card-content>
      <!-- Input de búsqueda con avatar e ícono de chat -->
      <div class="create-post-input">
        <ion-avatar class="create-post-avatar">
          <img v-if="user.imagen_url" :src="user.imagen_url" alt="Usuario" />
        </ion-avatar>
        <ion-input
          class="create-post-search"
          placeholder="¿Qué estás estudiando?"
          fill="outline"
          clearInput
        ></ion-input>
        <ion-icon :icon="chatbubbleOutline" class="chat-icon" />
      </div>

      <!-- Botones de acción con íconos en fondo circular y color sólido -->
      <ion-grid class="post-actions-grid">
        <ion-row>
          <ion-col size="4">
            <ion-button fill="clear" class="action-btn" @click="$router.push('/new-post') ">
              <div class="icon-bg bg-green-500 text-white">
                <ion-icon :icon="documentAttachOutline" />
              </div>
              <ion-label>ARCHIVO</ion-label>
            </ion-button>
          </ion-col>

          <ion-col size="4">
            <ion-button fill="clear" class="action-btn" @click="$router.push('/new-post') ">
              <div class="icon-bg bg-blue-500 text-white">
                <ion-icon :icon="cameraOutline" />
              </div>
              <ion-label>FOTO/VIDEO</ion-label>
            </ion-button>
          </ion-col>

          <ion-col size="4">
            <ion-button fill="clear" class="action-btn" @click="$router.push('/new-post') ">
              <div class="icon-bg bg-purple-500 text-white">
                <ion-icon :icon="musicalNotesOutline" />
              </div>
              <ion-label>PLAYLIST</ion-label>
            </ion-button>
          </ion-col>
        </ion-row>
      </ion-grid>
    </ion-card-content>
  </ion-card>
</template>

<script>
import {
  IonAvatar,
  IonButton,
  IonCard,
  IonCardContent,
  IonCol,
  IonGrid,
  IonIcon,
  IonInput,
  IonLabel,
  IonRow
} from '@ionic/vue'
import {
  documentAttachOutline,
  cameraOutline,
  musicalNotesOutline,
  chatbubbleOutline
} from 'ionicons/icons'

export default {
  name: 'CreatePostCard',
  components: {
    IonCard,
    IonCardContent,
    IonAvatar,
    IonButton,
    IonGrid,
    IonRow,
    IonCol,
    IonLabel,
    IonIcon,
    IonInput
  },
  setup() {
    return {
      documentAttachOutline,
      cameraOutline,
      musicalNotesOutline,
      chatbubbleOutline
    }
  },
  props: {
    user: {
      type: Object,
      required: true
    }
  }
}
</script>

<style scoped>
.create-post-input {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
}

.create-post-search {
  flex: 1;
  --padding-start: 12px;
  --padding-end: 12px;
  border-radius: 12px;
  background: #f5f5f5;
}

.chat-icon {
  font-size: 20px;
  color: #999;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 14px;
}

.icon-bg {
  width: 40px;
  height: 40px;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
  font-size: 22px;
}
</style>