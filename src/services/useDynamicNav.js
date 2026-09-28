import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

// Estados globales
const activeModule = ref('social'); // 'social', 'study', 'market'
const bubbleModule = ref(null);

export function useDynamicNav() {
  const route = useRoute();
  const router = useRouter();

  watch(() => route.path, (newPath) => {
    // 1. Identificar en qué módulo estamos según la URL
    let nextModule = 'social'; // Por defecto
    if (newPath.includes('/study') || newPath.includes('/tasks')) nextModule = 'study';
    if (newPath.includes('/marketplace')) nextModule = 'market';

    // 2. Aplicar la lógica de Burbuja vs Expandido
    if (nextModule !== activeModule.value) {
      
      // Si no había burbuja, el módulo del que salimos se convierte en burbuja (V1 -> V2)
      if (!bubbleModule.value) {
        bubbleModule.value = activeModule.value;
      } 
      // Si hacemos click directo en la burbuja (V2 -> V1)
      else if (nextModule === bubbleModule.value) {
        bubbleModule.value = activeModule.value; // Intercambian papeles
      }
      // Si vamos a una V3 (La burbuja original se mantiene, la V2 simplemente desaparece)
      // No hacemos nada con bubbleModule.value, se queda como estaba.

      activeModule.value = nextModule;
    }
  });

  // Función para cuando el usuario toque la burbuja
  const activateFromBubble = (moduleName) => {
    if (bubbleModule.value === moduleName) {
      // Rutas base a las que regresar al tocar la burbuja
      if (moduleName === 'social') router.push('/tabs/tab1');
      if (moduleName === 'study') router.push('/study');
      if (moduleName === 'market') router.push('/marketplace');
    }
  };

  return { activeModule, bubbleModule, activateFromBubble };
}