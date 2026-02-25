<template>
  <Teleport to="body">
    <Transition name="banner">
      <div 
        v-if="isOpen" 
        class="fixed inset-0 z-[999] flex items-end md:items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4"
        @click.self="handleBackdropClick"
      >
        <div 
          class="banner-card relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl ring-1 ring-gray-900/5 touch-none"
          :style="cardStyle"
          @touchstart="startDrag"
          @touchmove="onDrag"
          @touchend="endDrag"
        >
          <div class="flex justify-center pt-3 pb-1 md:hidden p-2">
            <div class="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          </div>

          <div class="flex justify-center pt-4 pb-2">
            <div :class="`
              ${banner?.type === 'feature' ? 'h-48 w-48' : iconSizeClass + ' rounded-full shadow-sm'} 
              ${themeClasses} 
              flex items-center justify-center text-3xl transition-all duration-300
            `">
              
              <template v-if="banner">
                <img v-if="banner.type === 'feature' && banner.image_url" :src="banner.image_url" alt="Feature" class="w-full h-full object-contain drop-shadow-md" />
                <i v-else-if="banner.type === 'update'" class="fas fa-sync-alt"></i>
                <i v-else-if="banner.type === 'info'" class="fas fa-info-circle"></i>
              </template>

              <template v-else>
                <slot name="icon">🎓</slot>
              </template>

            </div>
          </div>

          <div class="px-6 pb-6 text-center">
            <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
              {{ displayTitle }}
            </h3>
            <div class="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-6 whitespace-pre-line">
              {{ displayMessage }}
            </div>
            
            <div class="space-y-3"> 
              <button 
                v-if="showConfirmBtn" 
                @click="$emit('confirm', banner)" 
                class="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition"
              >
                {{ displayConfirmText }}
              </button>

              <button 
                v-if="showCancelBtn" 
                @click="$emit('cancel', banner)" 
                class="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-xl transition"
              >
                {{ displayCancelText }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
export default {
  name: 'CustomBanner',
  props: {
    isOpen: { type: Boolean, required: true },
    
    // Prop para cuando viene de Laravel
    banner: { type: Object, default: null }, 
    
    // Props para cuando es local/estático (Login)
    title: { type: String, default: '' },
    message: { type: String, default: '' },
    confirmText: { type: String, default: 'Aceptar' },
    cancelText: { type: String, default: 'Cancelar' },
    showConfirm: { type: Boolean, default: true },
    showCancelBtn: { type: Boolean, default: true },
    iconColor: { type: String, default: 'purple' },
    iconSizeClass: { type: String, default: 'h-16 w-16' },
  },
  emits: ['confirm', 'cancel'],
  data() {
    return {
      startY: 0,
      dragOffset: 0,
      isDragging: false
    }
  },
  computed: {
    // ---- ÁRBITROS DE CONTENIDO ----
    // ¿Hay objeto banner de BD? Usa sus datos. ¿No hay? Usa las props estáticas.
    
    displayTitle() { return this.banner ? this.banner.title : this.title; },
    displayMessage() { return this.banner ? this.banner.content : this.message; },
    
    displayConfirmText() { return this.banner ? this.banner.action_text : this.confirmText; },
    showConfirmBtn() {
      if (this.banner) return !!(this.banner.action_text && this.banner.action_url);
      return this.showConfirm;
    },
    
    displayCancelText() { return this.banner ? 'Enterado' : this.cancelText; },
    showCancelBtn() {
        if (this.banner) {
            // Lógica si viene de Laravel (DB)
            return this.banner.type !== 'info'; 
        }
        // Lógica si es estático (usando las props del componente)
        return this.$props.showCancelBtn; 
    },

    // ---- ÁRBITRO DE COLOR ----
    themeClasses() {
      if (this.banner) {
        if (this.banner.type === 'feature') return 'text-purple-600 dark:text-purple-400';
        if (this.banner.type === 'update') return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
        if (this.banner.type === 'info') return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
      }
      // Si es estático, usa la prop iconColor (ej. "purple")
      return `text-${this.iconColor}-600 dark:text-${this.iconColor}-400`;
    },

    // ---- ESTILOS DE ARRASTRE ----
    cardStyle() {
      if (this.isDragging || this.dragOffset > 0) {
        return {
          transform: `translateY(${this.dragOffset}px)`,
          transition: this.isDragging ? 'none' : 'transform 0.3s ease-out'
        }
      }
      return {};
    }
  },
  methods: {
    startDrag(e) {
      this.startY = e.touches[0].clientY;
      this.isDragging = true;
    },
    onDrag(e) {
      if (!this.isDragging) return;
      const distance = e.touches[0].clientY - this.startY;
      if (distance > 0) this.dragOffset = distance;
    },
    endDrag() {
      this.isDragging = false;
      if (this.dragOffset > 100) {
        this.$emit('cancel', this.banner);
      } else {
        this.dragOffset = 0;
      }
    },
    handleBackdropClick() {
      this.$emit('cancel', this.banner);
    }
  }
}
</script>

<style scoped>
/* Transiciones */
.banner-enter-active, .banner-leave-active { 
  transition: opacity 0.3s ease; 
}
.banner-enter-from, .banner-leave-to { 
  opacity: 0; 
}
.banner-card {
  margin-bottom: env(safe-area-inset-bottom);
}
.banner-enter-active .banner-card { 
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); 
}
.banner-leave-active .banner-card { 
  transition: transform 0.3s ease-in; 
}
.banner-enter-from .banner-card, .banner-leave-to .banner-card { 
  transform: translateY(100vh); 
}
</style>