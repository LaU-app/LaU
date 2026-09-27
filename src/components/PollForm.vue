<template>
  <form @submit.prevent="handleSubmit" class="encuesta-form">
    <!-- Pregunta -->
    <ion-item class="mb-5">
      <ion-label position="stacked" class="mb-2">Pregunta de la encuesta</ion-label>
      <ion-input
        v-model="form.question"
        placeholder="¿Cuál es tu pregunta?"
        maxlength="255"
        required
      ></ion-input>
    </ion-item>

    <!-- Contador de caracteres -->
    <p class="text-xs text-gray-500 mb-6">{{ form.question.length }}/255</p>

    <!-- Opciones -->
    <div class="mb-8">
      <h2 class="text-lg font-semibold mb-3">Opciones</h2>
      <p class="text-sm text-gray-500 mb-4">Mínimo 2, máximo 5 opciones</p>

      <div
        v-for="(option, index) in form.options"
        :key="index"
        class="mb-4 relative"
      >
        <ion-item>
          <ion-label position="stacked" class="mb-2">Opción {{ index + 1 }}</ion-label>
          <ion-input
            v-model="form.options[index].text"
            :placeholder="`Opción ${index + 1}`"
            maxlength="100"
            required
          ></ion-input>
          <ion-button
            v-if="form.options.length > 2"
            slot="end"
            fill="clear"
            color="danger"
            size="small"
            @click="removeOption(index)"
          >
            <ion-icon :icon="close"></ion-icon>
          </ion-button>
        </ion-item>
        <p class="text-xs text-gray-500 ml-4">{{ form.options[index].text.length }}/100</p>
      </div>

      <ion-button
        v-if="form.options.length < 5"
        expand="block"
        fill="outline"
        @click="addOption"
        class="mt-3"
      >
        <ion-icon slot="start" :icon="add"></ion-icon>
        Agregar opción
      </ion-button>
    </div>

    <!-- Tiempo de expiración -->
    <div class="mb-8">
      <h2 class="text-lg font-semibold mb-3">Tiempo límite</h2>
      <ion-item class="mb-3">
        <ion-label>
          <div class="flex justify-between items-center w-full">
            <span>{{ form.expires_in_hours }} hora{{ form.expires_in_hours !== 1 ? 's' : '' }}</span>
            <span class="text-xs text-gray-500">Máximo 3 días (72 horas)</span>
          </div>
        </ion-label>
      </ion-item>
      <ion-range
        v-model="form.expires_in_hours"
        :min="1"
        :max="72"
        :step="1"
        pin
        color="primary"
      ></ion-range>
      <p class="text-xs text-gray-500 mt-2">
        La encuesta cerrará en {{ formatExpireTime(form.expires_in_hours) }}
      </p>
    </div>

    <!-- Visibilidad -->
    <div class="mb-8">
      <h2 class="text-lg font-semibold mb-3">Visibilidad</h2>
      <ion-item>
        <ion-label>Solo mis seguidores</ion-label>
        <ion-toggle
          v-model="form.visibility"
          :true-value="'followers'"
          :false-value="'public'"
        ></ion-toggle>
      </ion-item>
    </div>

    <!-- Botones de acción -->
    <div class="flex gap-3 sticky bottom-0 bg-white dark:bg-gray-900 pt-4 pb-4">
      <ion-button expand="block" fill="outline" @click="goBack">
        Cancelar
      </ion-button>
      <ion-button
        expand="block"
        type="submit"
        :disabled="isSubmitting || !isFormValid"
        :class="{ 'opacity-50': isSubmitting }"
      >
        <ion-spinner
          v-if="isSubmitting"
          name="crescent"
          slot="start"
        ></ion-spinner>
        {{ isSubmitting ? 'Creando...' : 'Publicar' }}
      </ion-button>
    </div>
  </form>

  <!-- Error message -->
  <ion-alert
    :is-open="showError"
    header="Error"
    :message="errorMessage"
    :buttons="['OK']"
    @didDismiss="showError = false"
  ></ion-alert>

  <!-- Success message -->
  <ion-toast
    :is-open="showSuccess"
    message="¡Encuesta creada exitosamente!"
    duration={2000}
    position="top"
    @didDismiss="showSuccess = false"
  ></ion-toast>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import {
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput,
  IonToggle,
  IonRange,
  IonAlert,
  IonToast,
  IonSpinner,
} from "@ionic/vue";
import { close, add } from "ionicons/icons";
import pollsService from "@/services/pollsService";

const router = useRouter();

const form = ref({
  question: "",
  options: [
    { text: "" },
    { text: "" },
  ],
  expires_in_hours: 24,
  visibility: "public",
});

const isSubmitting = ref(false);
const showError = ref(false);
const showSuccess = ref(false);
const errorMessage = ref("");

const isFormValid = computed(() => {
  if (!form.value.question.trim()) return false;
  if (form.value.options.length < 2) return false;
  if (form.value.options.length > 5) return false;
  return form.value.options.every((opt) => opt.text.trim().length > 0);
});

const goBack = () => {
  router.back();
};

const addOption = () => {
  if (form.value.options.length < 5) {
    form.value.options.push({ text: "" });
  }
};

const removeOption = (index) => {
  if (form.value.options.length > 2) {
    form.value.options.splice(index, 1);
  }
};

const formatExpireTime = (hours) => {
  if (hours < 24) {
    return `${hours} hora${hours !== 1 ? 's' : ''}`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  let result = `${days} día${days !== 1 ? 's' : ''}`;
  if (remainingHours > 0) {
    result += ` y ${remainingHours} hora${remainingHours !== 1 ? 's' : ''}`;
  }
  return result;
};

const handleSubmit = async () => {
  if (!isFormValid.value) return;

  isSubmitting.value = true;

  const response = await pollsService.createPoll(
    form.value.question,
    form.value.options,
    form.value.expires_in_hours,
    form.value.visibility
  );

  isSubmitting.value = false;

  if (response.success) {
    showSuccess.value = true;
    setTimeout(() => {
      router.push({
        path: "/tabs/tab1",
        state: { pollCreated: true },
      });
    }, 1500);
  } else {
    errorMessage.value = response.error || "Error al crear la encuesta";
    showError.value = true;
  }
};
</script>

<style scoped>
.encuesta-form {
  padding-top: 8px;
}

ion-item {
  --padding-top: 10px;
  --padding-bottom: 10px;
  --inner-padding-end: 8px;
}

.mb-2 {
  margin-bottom: 8px;
}

.mb-3 {
  margin-bottom: 12px;
}

.mb-4 {
  margin-bottom: 16px;
}

.mb-5 {
  margin-bottom: 20px;
}

.mb-6 {
  margin-bottom: 24px;
}

.mb-8 {
  margin-bottom: 32px;
}

.mt-2 {
  margin-top: 8px;
}

.mt-3 {
  margin-top: 12px;
}

.text-xs {
  font-size: 0.75rem;
}

.text-sm {
  font-size: 0.875rem;
}

.text-lg {
  font-size: 1.125rem;
}

.text-gray-500 {
  color: var(--ion-color-medium, #999);
}

.font-semibold {
  font-weight: 600;
}

.flex {
  display: flex;
}

.gap-3 {
  gap: 12px;
}

.justify-between {
  justify-content: space-between;
}

.items-center {
  align-items: center;
}

.w-full {
  width: 100%;
}

.ml-4 {
  margin-left: 16px;
}

.opacity-50 {
  opacity: 0.5;
}

.sticky {
  position: sticky;
}

.bottom-0 {
  bottom: 0;
}

.pt-4 {
  padding-top: 16px;
}

.pb-4 {
  padding-bottom: 16px;
}

.bg-white {
  background-color: white;
}

@media (prefers-color-scheme: dark) {
  .bg-white {
    background-color: var(--ion-background-color, #1e1e1e);
  }
}
</style>
