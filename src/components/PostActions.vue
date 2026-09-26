<template>
  <div class="actions-group">
    <!-- Botón Me Gusta -->
    <button
      class="action-btn-custom"
      @click.stop="handleLike"
      :disabled="isLiking"
    >
      <ion-icon
        :icon="post.user_has_liked ? heart : heartOutline"
        :class="{ 'liked-active': post.user_has_liked }"
      ></ion-icon>
      <span class="action-count">{{ getLikes() }}</span>
    </button>

    <!-- Botón Comentar -->
    <button class="action-btn-custom" @click.stop="handleComment">
      <ion-icon :icon="chatbubbleOutline"></ion-icon>
      <span class="action-count">{{ getComments() }}</span>
    </button>

    <!-- Botón Compartir -->
    <button
      class="action-btn-custom"
      @click.stop="handleShare"
      :disabled="isSharing"
    >
      <ion-icon :icon="shareOutline"></ion-icon>
    </button>
  </div>
</template>

<script>
import { IonIcon } from "@ionic/vue";
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
    const isSharing = ref(false);

    // Funciones seguras para evitar que se imprima "[]"
    const getLikes = () => {
      if (typeof props.post.likes_count === 'number') return props.post.likes_count;
      if (Array.isArray(props.post.likes)) return props.post.likes.length;
      if (typeof props.post.likes === 'number') return props.post.likes;
      return 0;
    };

    const getComments = () => {
      if (typeof props.post.comentarios_count === 'number') return props.post.comentarios_count;
      if (Array.isArray(props.post.comentarios)) return props.post.comentarios.length;
      if (typeof props.post.comentarios === 'number') return props.post.comentarios;
      return 0;
    };

    const handleLike = async () => {
      if (isLiking.value) return;

      isLiking.value = true;
      try {
        emit("like", props.post.id);
      } finally {
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
        const postUrl = `https://lauapp.es/tabs/post/${props.post.id}`;

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
      getLikes,
      getComments
    };
  },
};
</script>

<style scoped>
/* Agrupación flex para reemplazar el div que tenías */
.actions-group {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* El diseño exacto de los botones integrados */
.action-btn-custom {
  background: transparent;
  border: none;
  color: inherit; /* Magia: Hereda el color blanco o negro que le manda PostCard.vue */
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  margin: 0;
  cursor: pointer;
  line-height: 1;
}

.action-btn-custom ion-icon {
  font-size: 22px;
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* Animación del corazón */
@keyframes likePop {
  0% { transform: scale(1); }
  40% { transform: scale(1.35); }
  100% { transform: scale(1); }
}

.action-btn-custom .liked-active {
  color: #ff4757 !important;
  animation: likePop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

.action-count {
  font-weight: 600;
  font-size: 0.85rem;
  margin-top: 0;
  display: inline-block;
}
</style>