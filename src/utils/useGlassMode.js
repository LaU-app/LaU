import { ref } from 'vue';

// Al declarar la variable aquí afuera, se vuelve un "estado global" compartido.
// Intentamos leer la memoria, si no hay nada, por defecto es 'false' (modo normal).
const isGlassMode = ref(localStorage.getItem('lau_glass_mode') === 'true');

export function useGlassMode() {
  const toggleGlassMode = () => {
    isGlassMode.value = !isGlassMode.value;
    localStorage.setItem('lau_glass_mode', isGlassMode.value.toString());
  };

  return {
    isGlassMode,
    toggleGlassMode
  };
}