<template>
  <div class="post-stats">
    <ion-button
      fill="clear"
      size="small"
      :color="post.user_has_liked ? 'danger' : ''"
      class="action-button"
      @click.stop="handleLike"
      :disabled="isLiking"
    >
      <ion-icon
        :icon="post.user_has_liked ? heart : heartOutline"
        class="post-action-icon"
      ></ion-icon>
      <ion-label>{{ post.likes_count || 0 }}</ion-label>
    </ion-button>
    <ion-button
      fill="clear"
      size="small"
      class="action-button"
      @click.stop="handleComment"
    >
      <ion-icon :icon="chatbubbleOutline" class="post-action-icon"></ion-icon>
      <ion-label>{{
        post.comentarios?.length || post.comentarios_count || 0
      }}</ion-label>
    </ion-button>
    <ion-button
      fill="clear"
      size="small"
      class="action-button"
      @click.stop="handleShare"
    >
      <ion-icon :icon="shareOutline" class="post-action-icon"></ion-icon>
    </ion-button>
  </div>
</template>

<script>
import { IonButton, IonLabel, IonIcon } from "@ionic/vue";
import {
  heart,
  heartOutline,
  shareOutline,
  chatbubbleOutline,
} from "ionicons/icons";
import { ref } from "vue";
import { Share } from "@capacitor/share";

export default {
  name: "PostActions",
  components: {
    IonButton,
    IonLabel,
    IonIcon,
  },
  props: {
    post: {
      type: Object,
      required: true,
    },
  },
  emits: ["like", "comment", "share"],
  setup(props, { emit }) {
    const isLiking = ref(false);
    const isSharing = ref(false); // <-- agregado

    const handleLike = async () => {
      if (isLiking.value) return;

      isLiking.value = true;
      try {
        emit("like", props.post.id);
      } finally {
        // Pequeño delay para evitar clicks múltiples
        setTimeout(() => {
          isLiking.value = false;
        }, 500);
      }
    };

    const handleComment = () => {
      emit("comment", props.post.id);
    };

    const handleShare = async () => {
      if (isSharing.value) return;
      isSharing.value = true;

      try {
        const postUrl = `${window.location.origin}/tabs/post/${props.post.id}`;

        // Intentar usar Capacitor Share
        await Share.share({
          title: props.post.titulo || "Publicación",
          text: props.post.texto || "Mira esta publicación",
          url: postUrl,
          dialogTitle: "Compartir publicación",
        });

        emit("share", props.post.id);
      } catch (error) {
        console.error("Capacitor Share error:", error);

        // Fallback Web
        if (navigator.share) {
          await navigator.share({
            title: props.post.titulo,
            text: props.post.texto,
            url: postUrl,
          });
        } else {
          await navigator.clipboard.writeText(postUrl);
          console.log("URL copiada al portapapeles");
        }
      } finally {
        setTimeout(() => (isSharing.value = false), 500);
      }
    };

    return {
      heart,
      heartOutline,
      shareOutline,
      chatbubbleOutline,
      isLiking,
      isSharing,
      handleLike,
      handleComment,
      handleShare,
    };
  },
};
</script>

<style scoped>
@import "../theme/colors.css";
@import "../theme/home.css";
</style>
