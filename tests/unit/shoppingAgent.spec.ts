import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

const api = { get: vi.fn(), post: vi.fn(), delete: vi.fn() }
vi.mock('@/services/api', () => ({ api }))
vi.mock('@ionic/vue', () => ({ IonIcon: { template: '<i/>' } }))

const ok = (data: unknown) => ({ status: 200, data: { success: true, data } })
const product = {
  product: {
    id: 7, name: 'Calculadora científica 417 funciones', description: 'Ideal para Cálculo I y II.', price: '18.50', currency: 'USD',
    stock: 5, image_url: null, category: 'Electrónica', condition: 'nuevo', delivery_point: 'Biblioteca central',
  },
  store: { name: 'Papelería Campus Central', slug: 'papeleria-campus-central', logo_url: null, is_verified: true, accepts_paypal: true },
  match_probability: 0.96, highlight: 'Ideal para Cálculo I y II.', reasons: [], within_budget: null, recommended: true,
}

beforeAll(async () => {
  await import('@/components/marketplace/AgentCards.vue')
}, 60000)

beforeEach(() => vi.resetAllMocks())

describe('tarjetas del agente de compras', () => {
  it('muestra productos reales con coincidencia y la frase del detalle', async () => {
    const { default: AgentCards } = await import('@/components/marketplace/AgentCards.vue')
    const wrapper = mount(AgentCards, { props: { cards: [{ type: 'products', decision_id: 3, items: [product] }] } })

    expect(wrapper.text()).toContain('Calculadora científica 417 funciones')
    expect(wrapper.text()).toContain('$18.50')
    expect(wrapper.text()).toContain('96%')
    expect(wrapper.text()).toContain('«Ideal para Cálculo I y II.»')

    await wrapper.find('button.mini.pay').trigger('click')
    expect(wrapper.emitted('buy')?.[0]).toEqual([7, 3, 1])
  })

  it('la compra preparada muestra el total y la confirma el estudiante', async () => {
    const { default: AgentCards } = await import('@/components/marketplace/AgentCards.vue')
    const wrapper = mount(AgentCards, { props: { cards: [{ type: 'purchase', decision_id: null, quantity: 2, total: '37.00', ...product }] } })

    expect(wrapper.text()).toContain('Compra lista para confirmar')
    expect(wrapper.text()).toContain('2 × $18.50')
    expect(wrapper.text()).toContain('$37.00')

    await wrapper.find('button.study-button.pay').trigger('click')
    expect(wrapper.emitted('buy')?.[0]).toEqual([7, null, 2])
  })

  it('aclara cuando no hay reseñas', async () => {
    const { default: AgentCards } = await import('@/components/marketplace/AgentCards.vue')
    const wrapper = mount(AgentCards, { props: { cards: [{
      type: 'videos', product: { id: 7, name: 'Calculadora' }, status: 'none', videos: [],
      search_url: 'https://www.youtube.com/results?search_query=calculadora', message: 'No encontramos videos ni reseñas de este producto.',
    }] } })

    expect(wrapper.text()).toContain('No encontramos videos ni reseñas de este producto.')
    expect(wrapper.find('a').attributes('href')).toContain('youtube.com')
  })
})

describe('servicio del agente', () => {
  it('abre un chat desde una búsqueda y envía mensajes con tiempo de espera amplio', async () => {
    const { agentService } = await import('@/services/agentService')
    api.post.mockResolvedValue(ok({ id: 12, title: 'calculadora', last_message_at: null, messages: [] }))

    await agentService.start({ decision_id: 5 })
    expect(api.post).toHaveBeenCalledWith('/marketplace/agent/conversations', { decision_id: 5 }, { timeout: 300000 })

    await agentService.send(12, '¿Tiene reseñas?')
    expect(api.post).toHaveBeenLastCalledWith('/marketplace/agent/conversations/12/messages', { message: '¿Tiene reseñas?' }, { timeout: 300000 })
  })

  it('traduce el chat no disponible a un error legible', async () => {
    const { agentService } = await import('@/services/agentService')
    api.post.mockRejectedValue({ response: { status: 503, data: { success: false, code: 'agent_unavailable', message: 'El chat no está disponible en este momento.' } } })

    await expect(agentService.send(1, 'hola')).rejects.toMatchObject({ code: 'agent_unavailable', message: 'El chat no está disponible en este momento.' })
  })
})
