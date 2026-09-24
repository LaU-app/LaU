import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive, ref } from 'vue'
vi.mock('@ionic/vue', () => ({ IonIcon: { template: '<span />' }, alertController: { create: vi.fn() } }))
vi.mock('@/services/tasksService', () => ({ default: { getTaskById:vi.fn(async()=>({data:{completed_pomodoros:1,estimated_pomodoros:3}})),getTasksStats:vi.fn(async()=>({data:{pending:4}})) } }))
vi.mock('@/utils/useStudy', () => ({ study: {
  timer: reactive({ phase: 'focus', status: 'idle', duration: 1500, completed: 0, activity: '', taskId: null }),
  preferences: reactive({focus_minutes:25,cycles_before_long_break:4}),remaining:ref(1500),busy:ref(false),ready:ref(true),revision:ref(0),accountId:ref(1),
  start: vi.fn(), pause:vi.fn(), resume:vi.fn(), recover:vi.fn(), selectTask: vi.fn(), enableNotifications: vi.fn(),
} }))
import StudyFocus from '@/components/study/StudyFocus.vue'
import { study } from '@/utils/useStudy'
describe('Study focus decisions', () => {
  beforeEach(() => { Object.assign(study.timer, {phase:'focus',status:'idle',taskId:null,activity:''}); vi.clearAllMocks() })
  const render = () => mount(StudyFocus, { global:{stubs:{IonIcon:true,RouterLink:{template:'<a><slot/></a>'}}} })
  it('selects a task separately from starting and offers one primary action', async () => {
    study.timer.taskId = 42; study.timer.activity = 'Matemáticas'
    const wrapper = render()
    expect(wrapper.get('h1').text()).toBe('Matemáticas')
    expect(wrapper.get('[role="timer"]').attributes('aria-label')).toContain('25:00')
    expect(study.start).not.toHaveBeenCalled()
    expect(wrapper.findAll('.study-button')).toHaveLength(1)
    await wrapper.get('.study-button').trigger('click')
    expect(study.start).toHaveBeenCalledOnce()
    expect(study.enableNotifications).not.toHaveBeenCalled()
    wrapper.unmount()
  })
  it('keeps running and paused controls unambiguous', async () => {
    study.timer.status = 'running'; const wrapper = render()
    expect(wrapper.findAll('.focus-controls button').map(b=>b.text())).toEqual(['Pausar sesión','Reiniciar','Terminar antes'])
    await wrapper.get('.study-button').trigger('click'); expect(study.pause).toHaveBeenCalledOnce()
    study.timer.status = 'paused'; await wrapper.vm.$nextTick()
    expect(wrapper.findAll('.focus-controls button').map(b=>b.text())).toEqual(['Continuar','Reiniciar','Terminar antes'])
    await wrapper.get('.study-button').trigger('click'); expect(study.resume).toHaveBeenCalledOnce()
    wrapper.unmount()
  })
  it('offers recovery in human language and calls the continuation action', async () => {
    study.timer.status = 'recovery'; const wrapper = render()
    expect(wrapper.text()).toContain('Tienes una sesión en curso')
    expect(wrapper.text()).not.toMatch(/estado local|dispositivo|sincroniz|API/i)
    expect(wrapper.find('[role="timer"]').exists()).toBe(false)
    await wrapper.get('.study-button').trigger('click'); expect(study.recover).toHaveBeenCalledOnce()
    wrapper.unmount()
  })
})
