import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'
const lifecycle = vi.hoisted(()=>({enter:undefined as any,leave:undefined as any}))
vi.mock('@ionic/vue',()=>({onIonViewDidEnter:(cb:any)=>{lifecycle.enter=cb},onIonViewDidLeave:(cb:any)=>{lifecycle.leave=cb}}))
vi.mock('@/utils/useStudy',()=>({study:{revision:ref(0)}}))
import { useStudyScreen } from '@/utils/useStudyScreen'
import { study } from '@/utils/useStudy'
describe('Existing study realtime → visible UI',()=>{
  afterEach(()=>{vi.useRealTimers();localStorage.clear()})
  it('coalesces private channel updates, updates local edits and releases retained Ionic pages',async()=>{
    vi.useFakeTimers()
    localStorage.setItem('user',JSON.stringify({id:42}))
    let deliver:any
    const leave=vi.fn(),listen=vi.fn((_event,callback)=>{deliver=callback})
    ;(window as any).Echo={private:vi.fn(()=>({listen})),leave}
    const refresh=vi.fn()
    const wrapper=mount(defineComponent({setup(){useStudyScreen(refresh,['tasks','stats']);return()=>null}}))
    await vi.advanceTimersByTimeAsync(200); expect(refresh).toHaveBeenCalledTimes(1)
    expect((window as any).Echo.private).toHaveBeenCalledWith('study.42')
    expect(listen).toHaveBeenCalledWith('.study.updated',expect.any(Function))
    deliver({areas:['ranking']}); await vi.advanceTimersByTimeAsync(250); expect(refresh).toHaveBeenCalledTimes(1)
    deliver({areas:['tasks']}); deliver({areas:['stats']}); await vi.advanceTimersByTimeAsync(200)
    expect(refresh).toHaveBeenCalledTimes(2)
    study.revision.value++; await wrapper.vm.$nextTick(); await vi.advanceTimersByTimeAsync(200)
    expect(refresh).toHaveBeenCalledTimes(3)
    lifecycle.leave(); deliver({areas:['tasks']}); await vi.advanceTimersByTimeAsync(200)
    expect(refresh).toHaveBeenCalledTimes(3); expect(leave).toHaveBeenCalledWith('study.42')
    lifecycle.enter(); await vi.advanceTimersByTimeAsync(200); expect(refresh).toHaveBeenCalledTimes(4)
    wrapper.unmount(); deliver({areas:['tasks']}); await vi.advanceTimersByTimeAsync(200)
    expect(refresh).toHaveBeenCalledTimes(4)
  })
})
