<template>
  <div 
    ref="boxRef"
    class="glass-box"
    :style="containerStyle"
    @mousedown="isClicked = true"
    @mouseup="isClicked = false"
    @touchstart="isClicked = true"
    @touchend="isClicked = false"
  >
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { getDisplacementFilter } from '../utils/liquidGlass';

const props = withDefaults(defineProps<{
  height?: number;
  width?: number; // Opcional, si no se pasa usa el ancho de ventana
  depth?: number;
  radius?: number;
  strength?: number;
  chromaticAberration?: number;
  blur?: number;
}>(), {
  height: 80, // Altura por defecto para el tab bar
  depth: 5,   // Grosor del borde
  radius: 20, // Redondeo
  strength: 10,
  chromaticAberration: 0.5,
  blur: 2
});

const isClicked = ref(false);
const boxRef = ref<HTMLElement | null>(null);
const elementWidth = ref(props.width || window.innerWidth);

// Actualizar ancho si cambia el tamaño de la ventana
const updateDimensions = () => {
  if (!props.width) {
    elementWidth.value = window.innerWidth;
  }
};

onMounted(() => {
  // Esperamos un tick para asegurar que el DOM se renderizó
  setTimeout(() => {
    updateDimensions();
  }, 50);
  window.addEventListener('resize', updateDimensions);
});
onUnmounted(() => window.removeEventListener('resize', updateDimensions));

const computedStyle = computed(() => {
  // Lógica del React original para cambiar profundidad al clickear
  const currentDepth = props.depth / (isClicked.value ? 0.6 : 1);
  const isMobile = window.innerWidth < 768;
  
  // Generar el filtro SVG
  const filterUrl = getDisplacementFilter({
    height: props.height,
    width: elementWidth.value,
    radius: props.radius,
    depth: currentDepth,
    strength: props.strength,
    chromaticAberration: isMobile ? 0 : props.chromaticAberration, 
  });

  return {
    height: props.height > 0 ? `${props.height}px` : 'auto',
    width: '100%', // Forzamos 100% para que llene el contenedor padre
    borderRadius: `${props.radius}px`,
    border: 'none',

    // 2. EL TRUCO: Sombras internas SÓLIDAS (Blur = 0)
    // - inset: Pone la línea por dentro (para que no aumente el tamaño del div)
    // - 1px 1px: Mueve la sombra 1px a la derecha y 1px abajo (Crea borde Arriba e Izquierda)
    // - -1px -1px: Mueve la sombra 1px izquierda y 1px arriba (Crea borde Abajo y Derecha)
    // - 0: El blur en 0 hace que sea una línea dura, no borrosa.
    boxShadow: `
      rgb(0 0 0 / 18%) 1px 4px 20px 0px, rgb(0 0 0 / 40%) -2px -1px 1px 0px
    `,
    // Aquí está la magia del backdrop-filter
    backdropFilter: `blur(${props.blur / 2}px) url('${filterUrl}') blur(${props.blur}px) brightness(1.1) saturate(1.5)`,
    WebkitBackdropFilter: `blur(${props.blur / 2}px) url('${filterUrl}') blur(${props.blur}px) brightness(1.1) saturate(1.5)`,
    transform: 'translate3d(0,0,0)',
  };
});

const containerStyle = computed(() => computedStyle.value);
</script>

<style scoped>
.glass-box {
  /* 1. EL SECRETO: Bajamos el blanco de 0.4 a 0.15 para que sea casi transparente */
  background: #ffffff08;
  box-shadow: inset 0 0 4px 0px rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
  overflow: hidden;

  will-change: backdrop-filter, transform;
  transform: translateZ(0);
  contain: paint;
}

/* 2. COMPATIBILIDAD CON IONIC: Le enseñamos a leer el modo oscuro de tu app */
:global(.ion-palette-dark) .glass-box,
:global(.dark) .glass-box {
  /* En modo oscuro, usamos un gris/negro translúcido en lugar de blanco */
  background: rgba(20, 20, 25, 0.4); 
  box-shadow: inset 0 0 4px 0px rgba(255, 255, 255, 0.05);
}
</style>