import { onBeforeUnmount, onMounted, watch } from 'vue'
import { onIonViewDidEnter, onIonViewDidLeave } from '@ionic/vue'
import { subscribeStudyRealtime } from '@/services/studyRealtime'
import { study } from './useStudy'

// Ionic retains routed pages: release listeners while a screen is hidden.
export function useStudyScreen(refresh: () => unknown, areas = ['tasks', 'stats', 'ranking', 'timer', 'preferences'], observeRevision = true) {
  let visible = false
  let unsubscribe: (() => void) | undefined
  let debounce: ReturnType<typeof setTimeout> | undefined
  function queue() {
    if (!visible || document.visibilityState === 'hidden') return
    clearTimeout(debounce)
    debounce = setTimeout(() => { void refresh() }, 200)
  }
  function enter() {
    visible = true
    if (!unsubscribe) unsubscribe = subscribeStudyRealtime(update => {
      if (update.areas?.some(area => areas.includes(area))) queue()
    })
    queue()
  }
  function leave() { visible = false; unsubscribe?.(); unsubscribe = undefined; clearTimeout(debounce) }
  const foreground = () => { if (document.visibilityState === 'visible') queue() }
  onMounted(() => { enter(); document.addEventListener('visibilitychange', foreground); window.addEventListener('online', queue) })
  onIonViewDidEnter(enter)
  onIonViewDidLeave(leave)
  if (observeRevision) watch(study.revision, queue)
  onBeforeUnmount(() => { leave(); document.removeEventListener('visibilitychange', foreground); window.removeEventListener('online', queue) })
}
