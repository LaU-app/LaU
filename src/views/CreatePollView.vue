<template>
  <ion-page>
    <ion-header>
      <ion-toolbar class="pt-safe-top">
        <ion-buttons slot="start">
          <ion-button @click="goBack">
            <ion-icon slot="icon-only" :icon="closeOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Nueva encuesta</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <PollForm />
    </ion-content>
  </ion-page>
</template>

<script setup>
import { useRouter } from "vue-router";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
} from "@ionic/vue";
import { closeOutline } from "ionicons/icons";
import PollForm from "@/components/PollForm.vue";

const router = useRouter();

const goBack = () => {
  router.back();
};
</script>
