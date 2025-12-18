<template>
    <ion-page>
        <ion-header>
            <ion-toolbar>
                <ion-title>Mensajes</ion-title>
            </ion-toolbar>
        </ion-header>
        <ion-content>
            <ion-list>
                <ion-item v-for="contact in contacts" :key="contact.id" button @click="openChat(contact)" detail>
                    <ion-avatar slot="start">
                        <img :src="contact.avatar" />
                    </ion-avatar>
                    <ion-label>
                        <h2>{{ contact.name }}</h2>
                        <p>{{ contact.last_message || 'Sin mensajes' }}</p>
                    </ion-label>
                    <ion-badge slot="end" v-if="contact.unread_count > 0" color="primary">
                        {{ contact.unread_count }}
                    </ion-badge>
                </ion-item>
            </ion-list>
        </ion-content>
    </ion-page>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import chatService from '@/services/chatService';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonAvatar, IonLabel, IonBadge } from '@ionic/vue';

const contacts = ref([]);
const router = useRouter();

const loadContacts = async () => {
    try {
        const response = await chatService.getContacts();
        contacts.value = response.data;
    } catch (error) {
        console.error("Error cargando contactos", error);
    }
};

const openChat = (contact) => {
    // Navegar a la vista de chat individual
    router.push(`/chat/${contact.id}`);
};

onMounted(() => {
    loadContacts();
});
</script>