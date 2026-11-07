import { createAnimation, modalController, type Animation } from '@ionic/vue'
import PublishProductModal from '@/components/marketplace/PublishProductModal.vue'
import type { Product } from '@/types/marketplace'
import '@/theme/marketplace.css'

/** Clase compartida: hoja inferior en teléfonos y diálogo centrado en pantallas grandes (marketplace.css). */
export const PRODUCT_FORM_CLASS = 'lau-sheet-modal'

const LARGE_SCREEN = '(min-width: 768px) and (min-height: 600px)'
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'
const matches = (query: string) => typeof window !== 'undefined' && window.matchMedia(query).matches

function sheetAnimation(baseEl: HTMLElement): Animation {
  const root = baseEl.shadowRoot as ShadowRoot
  const backdrop = createAnimation()
    .addElement(root.querySelector('ion-backdrop') as Element)
    .fromTo('opacity', '0.01', 'var(--backdrop-opacity)')
  // Ionic deja .modal-wrapper con opacity/transform iniciales (md: 0.01 y 40px; ios: 100%):
  // cada variante fija siempre ambos valores finales.
  const wrapper = createAnimation().addElement(root.querySelector('.modal-wrapper') as Element)

  // Movimiento reducido: solo un fundido corto
  if (matches(REDUCED_MOTION)) {
    wrapper.keyframes([{ offset: 0, opacity: '0.01', transform: 'none' }, { offset: 1, opacity: '1', transform: 'none' }])
    return createAnimation().addElement(baseEl).easing('linear').duration(150).addAnimation([backdrop, wrapper])
  }
  if (matches(LARGE_SCREEN)) {
    wrapper.keyframes([{ offset: 0, opacity: '0.01', transform: 'scale(0.96)' }, { offset: 1, opacity: '1', transform: 'scale(1)' }])
    return createAnimation().addElement(baseEl).easing('cubic-bezier(0.2, 0.8, 0.2, 1)').duration(240).addAnimation([backdrop, wrapper])
  }
  wrapper.keyframes([{ offset: 0, opacity: '1', transform: 'translateY(100%)' }, { offset: 1, opacity: '1', transform: 'translateY(0)' }])
  return createAnimation().addElement(baseEl).easing('cubic-bezier(0.32, 0.72, 0, 1)').duration(420).addAnimation([backdrop, wrapper])
}

/**
 * Abre el formulario de publicar/editar producto con la misma presentación
 * desde cualquier pantalla. Devuelve lo que el formulario entrega al cerrarse.
 */
export async function openProductForm(product?: Product | null) {
  const modal = await modalController.create({
    component: PublishProductModal,
    componentProps: product ? { product } : {},
    cssClass: PRODUCT_FORM_CLASS,
    enterAnimation: sheetAnimation,
    leaveAnimation: (baseEl: HTMLElement) => sheetAnimation(baseEl).direction('reverse'),
    htmlAttributes: { 'aria-labelledby': 'product-form-title' },
  })
  await modal.present()
  return modal.onDidDismiss<{ created?: boolean; updated?: boolean; product?: Product }>()
}
