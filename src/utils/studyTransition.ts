import { createAnimation, type AnimationBuilder } from '@ionic/vue'

/** Un solo fade + desplazamiento sutil para toda navegación entre Enfoque/Tareas/Progreso/Ranking. */
export const studyPageTransition: AnimationBuilder = (_baseEl, opts) => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const root = createAnimation().duration(reduced ? 0 : 200).easing('cubic-bezier(.4,0,.2,1)')
  const entering: HTMLElement | undefined = (opts as any)?.enteringEl
  const leaving: HTMLElement | undefined = (opts as any)?.leavingEl
  if (entering) {
    root.addAnimation(
      createAnimation().addElement(entering)
        .fromTo('opacity', '0', '1')
        .fromTo('transform', reduced ? 'none' : 'translateY(6px)', 'translateY(0)'),
    )
  }
  if (leaving) {
    root.addAnimation(createAnimation().addElement(leaving).fromTo('opacity', '1', '0'))
  }
  return root
}
