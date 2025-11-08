/**
 * Composable para manejar el modo oscuro de manera centralizada
 * Sincroniza el estado en toda la aplicación
 */
import { ref, watch, onMounted } from 'vue'

const isDarkMode = ref(false)
const isInitialized = ref(false)

export function useDarkMode() {
  const initDarkMode = () => {
    if (isInitialized.value) return

    // Cargar preferencia guardada
    const savedMode = localStorage.getItem('darkMode')
    if (savedMode !== null) {
      isDarkMode.value = savedMode === 'true'
    } else {
      // Usar preferencia del sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')
      isDarkMode.value = prefersDark.matches
    }

    applyDarkMode(isDarkMode.value)
    isInitialized.value = true

    // Watch para cambios
    watch(isDarkMode, (newValue) => {
      localStorage.setItem('darkMode', newValue.toString())
      applyDarkMode(newValue)
    })
  }

  const applyDarkMode = (dark) => {
    const root = document.documentElement

    if (dark) {
      root.classList.add('ion-palette-dark')
      // Aplicar colores oscuros
      root.style.setProperty('--ion-background-color', '#121212')
      root.style.setProperty('--ion-background-color-rgb', '18,18,18')
      root.style.setProperty('--ion-text-color', '#E5E7EB')
      root.style.setProperty('--ion-text-color-rgb', '229,231,235')
      root.style.setProperty('--ion-card-background', '#1E1E1E')
      root.style.setProperty('--ion-item-background', '#1E1E1E')
      root.style.setProperty('--ion-toolbar-background', '#1E1E1E')
      root.style.setProperty('--ion-tab-bar-background', '#1E1E1E')
      root.style.setProperty('--ion-border-color', '#282c34')
      root.style.setProperty('--ion-color-step-50', '#1E1E1E')
      root.style.setProperty('--ion-color-step-100', '#2A2A2A')
      root.style.setProperty('--ion-color-step-150', '#363636')
      root.style.setProperty('--ion-color-step-200', '#414141')
      root.style.setProperty('--ion-color-step-250', '#4D4D4D')
      root.style.setProperty('--ion-color-step-300', '#595959')
      root.style.setProperty('--ion-color-step-350', '#656565')
      root.style.setProperty('--ion-color-step-400', '#717171')
      root.style.setProperty('--ion-color-step-450', '#7D7D7D')
      root.style.setProperty('--ion-color-step-500', '#898989')
      root.style.setProperty('--ion-color-step-550', '#949494')
      root.style.setProperty('--ion-color-step-600', '#A0A0A0')
      root.style.setProperty('--ion-color-step-650', '#ACACAC')
      root.style.setProperty('--ion-color-step-700', '#B8B8B8')
      root.style.setProperty('--ion-color-step-750', '#C4C4C4')
      root.style.setProperty('--ion-color-step-800', '#D0D0D0')
      root.style.setProperty('--ion-color-step-850', '#DCDCDC')
      root.style.setProperty('--ion-color-step-900', '#E8E8E8')
      root.style.setProperty('--ion-color-step-950', '#F4F4F4')

      // Colores personalizados
      root.style.setProperty('--app-background', '#121212')
      root.style.setProperty('--app-card', '#1E1E1E')
      root.style.setProperty('--app-text', '#E5E7EB')
      root.style.setProperty('--app-text-secondary', '#9CA3AF')
      root.style.setProperty('--app-input-bg', '#1F2937')
      root.style.setProperty('--app-border', '#282c34')
      root.style.setProperty('--ion-text-color-secondary', '#9CA3AF')
      root.style.setProperty('--ion-background-hover', '#2A2A2A')
    } else {
      root.classList.remove('ion-palette-dark')
      // Aplicar colores claros
      root.style.setProperty('--ion-background-color', '#F3F4F6')
      root.style.setProperty('--ion-background-color-rgb', '243,244,246')
      root.style.setProperty('--ion-text-color', '#1F2937')
      root.style.setProperty('--ion-text-color-rgb', '31,41,55')
      root.style.setProperty('--ion-card-background', '#FFFFFF')
      root.style.setProperty('--ion-item-background', '#FFFFFF')
      root.style.setProperty('--ion-toolbar-background', '#FFFFFF')
      root.style.setProperty('--ion-tab-bar-background', '#FFFFFF')
      root.style.setProperty('--ion-border-color', '#E5E7EB')

      // Colores personalizados
      root.style.setProperty('--app-background', '#F3F4F6')
      root.style.setProperty('--app-card', '#FFFFFF')
      root.style.setProperty('--app-text', '#1F2937')
      root.style.setProperty('--app-text-secondary', '#6B7280')
      root.style.setProperty('--app-input-bg', '#F3F4F6')
      root.style.setProperty('--app-border', '#E5E7EB')
      root.style.setProperty('--ion-text-color-secondary', '#6B7280')
      root.style.setProperty('--ion-background-hover', '#F9FAFB')
    }
  }

  const toggleDarkMode = () => {
    isDarkMode.value = !isDarkMode.value
  }

  onMounted(() => {
    initDarkMode()
  })

  return {
    isDarkMode,
    toggleDarkMode,
    initDarkMode
  }
}
