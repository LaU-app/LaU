<template>
  <div class="poll-card">
    <!-- Header with user info -->
    <div class="poll-header">
      <div class="user-info">
        <img
          :src="poll.user?.imagen_url || '/img/usuario.svg'"
          :alt="poll.user?.name"
          class="user-avatar"
        />
        <div class="user-details">
          <p class="user-name">{{ poll.user?.name }}</p>
          <p class="poll-time">{{ timeRemaining }}</p>
        </div>
      </div>
      <div v-if="isOwner" class="poll-actions">
        <ion-button
          fill="clear"
          color="danger"
          size="small"
          @click="handleDelete"
        >
          <ion-icon slot="icon-only" :icon="trash"></ion-icon>
        </ion-button>
      </div>
    </div>

    <!-- Poll question -->
    <div class="poll-question">
      <h3>{{ poll.question }}</h3>
    </div>

    <!-- Poll options with vote bars -->
    <div class="poll-options">
      <div
        v-for="option in poll.options"
        :key="option.id"
        class="poll-option"
        :class="{ voted: userVotedOption === option.id }"
      >
        <button
          class="option-button"
          :disabled="poll.is_closed || poll.user_has_voted || !isAuthenticated"
          @click="handleVote(option.id)"
        >
          <div class="option-content">
            <div class="option-text">{{ option.text }}</div>
            <div class="option-stats">
              <span class="vote-count">{{ option.vote_count }}</span>
              <span class="vote-percentage">{{ option.percentage }}%</span>
            </div>
          </div>
          <div
            class="vote-bar"
            :style="{ width: option.percentage + '%' }"
          ></div>
        </button>
      </div>
    </div>

    <!-- Poll metadata -->
    <div class="poll-footer">
      <span class="total-votes">{{ totalVotes }} voto{{ totalVotes !== 1 ? 's' : '' }}</span>
      <span v-if="poll.is_closed" class="closed-badge">Cerrada</span>
      <span v-else-if="poll.user_has_voted" class="voted-badge">Ya votaste</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { IonButton, IonIcon } from "@ionic/vue";
import { trash } from "ionicons/icons";
import { AuthService } from "@/services/auth";

const props = defineProps({
  poll: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["vote", "delete"]);

const isAuthenticated = computed(() => AuthService.isAuthenticated());
const currentUser = computed(() => AuthService.getUser());
const isOwner = computed(() => currentUser.value?.id === props.poll.user_id);
const userVotedOption = computed(() => {
  if (!props.poll.user_has_voted) return null;
  return null;
});

const totalVotes = computed(() => {
  return props.poll.options?.reduce((sum, opt) => sum + opt.vote_count, 0) || 0;
});

const timeRemaining = computed(() => {
  return props.poll.time_remaining || "Tiempo desconocido";
});

const handleVote = async (optionId) => {
  if (props.poll.is_closed || props.poll.user_has_voted || !isAuthenticated.value) {
    return;
  }
  emit("vote", { pollId: props.poll.id, optionId });
};

const handleDelete = async () => {
  if (confirm("¿Estás seguro de que deseas eliminar esta encuesta?")) {
    emit("delete", props.poll.id);
  }
};
</script>

<style scoped>
.poll-card {
  background: var(--ion-background-color, #fff);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--ion-color-light-shade, #e0e0e0);
}

.poll-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-weight: 600;
  font-size: 14px;
  margin: 0;
  color: var(--ion-text-color, #000);
}

.poll-time {
  font-size: 12px;
  color: var(--ion-color-medium, #999);
  margin: 0;
}

.poll-actions {
  display: flex;
  gap: 8px;
}

.poll-question {
  margin-bottom: 16px;
}

.poll-question h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: var(--ion-text-color, #000);
}

.poll-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
}

.poll-option {
  position: relative;
}

.option-button {
  width: 100%;
  position: relative;
  background: transparent;
  border: 1px solid var(--ion-color-medium, #ccc);
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  text-align: left;
  overflow: hidden;
  transition: all 0.2s ease;
}

.option-button:hover:not(:disabled) {
  border-color: var(--ion-color-primary, #3880ff);
  background: var(--ion-color-primary-tint, rgba(56, 128, 255, 0.05));
}

.option-button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.poll-option.voted .option-button {
  border-color: var(--ion-color-success, #2dd36f);
  background: var(--ion-color-success-tint, rgba(45, 211, 111, 0.05));
}

.option-content {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.option-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--ion-text-color, #000);
}

.option-stats {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: var(--ion-color-medium, #999);
}

.vote-count {
  font-weight: 600;
}

.vote-percentage {
  min-width: 35px;
  text-align: right;
}

.vote-bar {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--ion-color-primary-tint, rgba(56, 128, 255, 0.15));
  z-index: 1;
  transition: width 0.3s ease;
}

.poll-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--ion-color-medium, #999);
}

.total-votes {
  font-weight: 500;
}

.closed-badge {
  background: var(--ion-color-danger, #eb445a);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
}

.voted-badge {
  background: var(--ion-color-success, #2dd36f);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .poll-card {
    background: var(--ion-background-color, #1e1e1e);
    border-color: var(--ion-color-dark-shade, #333);
  }
}
</style>
