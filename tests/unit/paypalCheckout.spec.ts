import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const api = { get: vi.fn(), post: vi.fn() }
vi.mock('@/services/api', () => ({ api }))

// SDK de PayPal simulado: guarda las opciones de Buttons para disparar sus callbacks.
let buttonOptions: Record<string, any> = {}
const loadPayPalSdk = vi.fn()
vi.mock('@/utils/paypalSdk', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/paypalSdk')>()),
  loadPayPalSdk,
}))

const passthrough = { template: '<div><slot/></div>' }
vi.mock('@ionic/vue', () => ({
  IonPage: passthrough, IonContent: passthrough, IonModal: passthrough,
  IonIcon: { template: '<i/>' }, IonSpinner: { template: '<i/>' },
}))
vi.mock('@/components/AppHeader.vue', () => ({ default: { template: '<header/>' } }))
vi.mock('@/utils/useDarkMode', () => ({ useDarkMode: () => ({ isDarkMode: false, toggleDarkMode: vi.fn() }) }))
vi.mock('vue-router', () => ({ useRouter: () => ({ back: vi.fn(), push: vi.fn() }) }))

const ok = (data: unknown, status = 200) => ({ status, data: { success: true, data } })
const quote = {
  product: { id: 7, name: 'Calculadora científica 417 funciones', image_url: null },
  store: { name: 'Papelería Campus Central', slug: 'papeleria-campus-central', logo_url: null, is_verified: true },
  unit_price: '18.50', quantity: 1, total: '18.50', currency: 'USD', merchant_id: 'FAKEMERCHANT9',
}
const capture = {
  order_id: '5O190127TN364715T', capture_id: '3C679366HH908993F', status: 'COMPLETED', amount: '18.50',
  currency: 'USD', store: 'Papelería Campus Central', order_code: 'LAU-ABC123', lau_order_id: 1,
}

// La primera transformación de los componentes (Ionic + ionicons) puede tardar varios segundos.
beforeAll(async () => {
  await import('@/components/marketplace/PayPalCheckoutSheet.vue')
  await import('@/components/marketplace/ShoppingAgent.vue')
  await import('@/components/marketplace/ProductLinkPreview.vue')
}, 60000)

beforeEach(() => {
  vi.resetAllMocks()
  buttonOptions = {}
  vi.stubEnv('VITE_PAYPAL_CLIENT_ID', 'public-client-id')
  loadPayPalSdk.mockImplementation(async () => ({
    Buttons: (options: Record<string, any>) => {
      buttonOptions = options
      return { isEligible: () => true, render: vi.fn(async () => undefined), close: vi.fn(async () => undefined) }
    },
  }))
})

describe('paypalCheckoutService', () => {
  it('solo envía producto, cantidad e intento: nunca precio ni comercio', async () => {
    const { paypalCheckoutService } = await import('@/services/paypalCheckoutService')
    api.post.mockResolvedValue(ok({ order_id: 'ORDER12345', status: 'CREATED', total: '18.50', currency: 'USD' }, 201))

    await paypalCheckoutService.createOrder(7, 1, 'attempt-uuid', 42)

    expect(api.post).toHaveBeenCalledWith('/marketplace/paypal/orders',
      { product_id: 7, quantity: 1, checkout_attempt_id: 'attempt-uuid', assistant_decision_id: 42 }, expect.any(Object))
  })

  it('no trata como pagada una captura pendiente (202 con success:false)', async () => {
    const { paypalCheckoutService } = await import('@/services/paypalCheckoutService')
    api.post.mockResolvedValue({ status: 202, data: { success: false, code: 'capture_pending', message: 'Pendiente' } })

    await expect(paypalCheckoutService.capture('ORDER12345')).rejects.toMatchObject({ code: 'capture_pending' })
  })

  it('traduce errores del backend y de red a códigos estables', async () => {
    const { paypalCheckoutService } = await import('@/services/paypalCheckoutService')
    api.post.mockRejectedValueOnce({ response: { status: 409, data: { success: false, code: 'already_captured', message: 'Ya pagado' } } })
    await expect(paypalCheckoutService.capture('ORDER12345')).rejects.toMatchObject({ code: 'already_captured', message: 'Ya pagado' })

    api.post.mockRejectedValueOnce(new Error('Network Error'))
    await expect(paypalCheckoutService.capture('ORDER12345')).rejects.toMatchObject({ code: 'network' })
  })

  it('oculta parcialmente los IDs', async () => {
    const { maskId } = await import('@/services/paypalCheckoutService')
    expect(maskId('5O190127TN364715T')).toBe('5O19••••715T')
  })
})

describe('PayPal SDK', () => {
  it('usa el Client ID público y el Merchant ID que confirmó el backend', async () => {
    const { buildSdkUrl } = await import('@/utils/paypalSdk')
    const url = new URL(buildSdkUrl({ clientId: 'public-id', merchantId: 'FAKEMERCHANT9', currency: 'USD' }))

    expect(url.origin).toBe('https://www.paypal.com')
    expect(url.searchParams.get('client-id')).toBe('public-id')
    expect(url.searchParams.get('merchant-id')).toBe('FAKEMERCHANT9')
    expect(url.searchParams.get('intent')).toBe('capture')
  })
})

describe('hoja de pago', () => {
  async function mountSheet() {
    api.post.mockResolvedValueOnce(ok(quote))
    const Sheet = (await import('@/components/marketplace/PayPalCheckoutSheet.vue')).default
    const wrapper = mount(Sheet, { props: { productId: 7, decisionId: 42 }, attachTo: document.body })
    await flushPromises()
    return wrapper
  }

  it('muestra comercio, producto, precio, moneda y total antes de pagar', async () => {
    const wrapper = await mountSheet()

    expect(wrapper.text()).toContain('Papelería Campus Central')
    expect(wrapper.text()).toContain('Verificado por LaU')
    expect(wrapper.text()).toContain('Calculadora científica 417 funciones')
    expect(wrapper.text()).toContain('$18.50')
    expect(wrapper.text()).toContain('USD')
    expect(wrapper.text()).not.toMatch(/sandbox|prueba/i)
    wrapper.unmount()
  })

  it('no carga PayPal hasta que el estudiante confirma explícitamente', async () => {
    const wrapper = await mountSheet()
    expect(loadPayPalSdk).not.toHaveBeenCalled()

    await wrapper.find('input[type="checkbox"]').setValue(true)
    await flushPromises()

    expect(loadPayPalSdk).toHaveBeenCalledWith({ clientId: 'public-client-id', merchantId: 'FAKEMERCHANT9', currency: 'USD' })
    wrapper.unmount()
  })

  it('recorre preparando → aprobación → procesando → completado con IDs ocultos', async () => {
    const wrapper = await mountSheet()
    await wrapper.find('input[type="checkbox"]').setValue(true)
    await flushPromises()

    let resolveCapture: (value: unknown) => void = () => undefined
    api.post
      .mockResolvedValueOnce(ok({ order_id: '5O190127TN364715T', status: 'CREATED', total: '18.50', currency: 'USD' }, 201))
      .mockReturnValueOnce(new Promise(resolve => { resolveCapture = resolve }))

    expect(await buttonOptions.createOrder()).toBe('5O190127TN364715T')
    await flushPromises()
    expect(wrapper.text()).toContain('Esperando aprobación')

    const approved = buttonOptions.onApprove({ orderID: '5O190127TN364715T' }, { restart: vi.fn() })
    await flushPromises()
    expect(wrapper.text()).toContain('Procesando')

    resolveCapture(ok(capture))
    await approved
    await flushPromises()
    expect(wrapper.text()).toContain('PayPal confirmó tu pago')
    expect(wrapper.text()).toContain('LAU-ABC123')
    expect(wrapper.text()).toContain('3C67••••993F')
    expect(wrapper.text()).not.toContain('3C679366HH908993F')
    expect(wrapper.emitted('paid')).toHaveLength(1)
    wrapper.unmount()
  })

  it('aborta si el total que devuelve el backend no es el confirmado', async () => {
    const wrapper = await mountSheet()
    await wrapper.find('input[type="checkbox"]').setValue(true)
    await flushPromises()
    api.post
      .mockResolvedValueOnce(ok({ order_id: '5O190127TN364715T', status: 'CREATED', total: '19.00', currency: 'USD' }, 201))
      .mockResolvedValueOnce(ok({ ...quote, unit_price: '19.00', total: '19.00' }))

    await expect(buttonOptions.createOrder()).rejects.toMatchObject({ code: 'amount_changed' })
    await flushPromises()
    expect(wrapper.text()).toContain('El precio cambió')
    wrapper.unmount()
  })

  it('no muestra éxito si la captura falla y muestra cancelación', async () => {
    const wrapper = await mountSheet()
    await wrapper.find('input[type="checkbox"]').setValue(true)
    await flushPromises()
    api.post.mockRejectedValueOnce({ response: { status: 409, data: { success: false, code: 'not_approved', message: 'El pago todavía no fue aprobado en PayPal.' } } })

    await buttonOptions.onApprove({ orderID: '5O190127TN364715T' }, { restart: vi.fn() })
    await flushPromises()
    expect(wrapper.text()).toContain('El pago todavía no fue aprobado en PayPal.')
    expect(wrapper.text()).not.toContain('PayPal confirmó tu pago')

    buttonOptions.onCancel()
    await flushPromises()
    expect(wrapper.text()).toContain('Pago cancelado')
    wrapper.unmount()
  })
})

describe('asistente de compras', () => {
  const recommendation = {
    product: { id: 7, name: 'Calculadora científica 417 funciones', description: 'Ideal para Cálculo', price: '18.50', currency: 'USD', stock: 8, image_url: null, category: 'Electrónica' },
    store: { name: 'Papelería Campus Central', slug: 'papeleria-campus-central', logo_url: null, is_verified: true, accepts_paypal: true },
    match_probability: 0.95, fit: { score: 2.8, label: '' }, academic: { score: 1.9, label: '' }, within_budget: true, recommended: true,
  }
  const plan = (overrides: Record<string, unknown> = {}) => ({
    decision_id: 42, outcome: 'recommendation', model: 'jev-1.14.0',
    budget: { amount: '25.00', source: 'field', unclear_amounts: [] },
    interpretation: { purchase_intent: 0.96, item_named: 0.93, category: null },
    recommendations: [recommendation],
    message: { title: 'Encontré lo que buscás', body: ['Calculadora científica 417 funciones es la mejor opción entre comercios verificados.'], clarification: null },
    ...overrides,
  })

  async function mountAgent() {
    const Agent = (await import('@/components/marketplace/ShoppingAgent.vue')).default
    return mount(Agent, { attachTo: document.body })
  }

  it('envía la consulta con el presupuesto de la sesión y muestra la coincidencia con sentido', async () => {
    api.post.mockResolvedValueOnce(ok(plan()))
    const wrapper = await mountAgent()

    expect(wrapper.text()).toContain('Contanos qué necesitás')
    await wrapper.find('.budget-toggle').trigger('click')
    await wrapper.find('input[type="number"]').setValue('25')
    await wrapper.find('textarea').setValue('Necesito una calculadora para Cálculo')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(api.post).toHaveBeenCalledWith('/marketplace/smart-shopping', { query: 'Necesito una calculadora para Cálculo', max_budget: 25 }, expect.any(Object))
    const text = wrapper.text()
    expect(text).toContain('Encontré lo que buscás')
    expect(text).toContain('Mejor opción')
    expect(text).toContain('Muy alta coincidencia con lo que pediste')
    expect(text).toContain('Cubre todo lo que pediste')
    expect(text).toContain('Ideal para tu materia')
    expect(text).toContain('Dentro de tu presupuesto de $25.00')
    expect(wrapper.find('.match-ring').attributes('aria-label')).toBe('95 % de coincidencia')
    // No se expone qué modelo de IA se usa.
    expect(text).not.toMatch(/jev|typesafe/i)
    wrapper.unmount()
  })

  it('muestra cuánto excede el presupuesto', async () => {
    api.post.mockResolvedValueOnce(ok(plan({
      outcome: 'over_budget',
      budget: { amount: '15.00', source: 'message', unclear_amounts: [] },
      recommendations: [{ ...recommendation, within_budget: false, recommended: false, match_probability: 0.8 }],
      message: { title: 'Lo encontré, pero se pasa de tu presupuesto', body: ['La opción más económica cuesta $18.50.'], clarification: null },
    })))
    const wrapper = await mountAgent()

    await wrapper.find('textarea').setValue('Calculadora para Cálculo, máximo $15')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('$3.50 más que tu presupuesto')
    expect(wrapper.text()).toContain('Alta coincidencia con lo que pediste')
    wrapper.unmount()
  })

  it('cuando pide más detalles, la respuesta completa la consulta anterior', async () => {
    api.post
      .mockResolvedValueOnce(ok(plan({ outcome: 'needs_clarification', recommendations: [], message: { title: 'Contame un poco más', body: ['¿Qué producto necesitás?'], clarification: null } })))
      .mockResolvedValueOnce(ok(plan()))
    const wrapper = await mountAgent()

    await wrapper.find('textarea').setValue('quiero comprar algo')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    await wrapper.find('textarea').setValue('una calculadora científica')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(api.post).toHaveBeenLastCalledWith('/marketplace/smart-shopping', { query: 'quiero comprar algo. una calculadora científica', max_budget: null }, expect.any(Object))
    wrapper.unmount()
  })

  it('si el asistente no está disponible muestra el error y ninguna recomendación', async () => {
    api.post.mockRejectedValueOnce({ response: { status: 503, data: { success: false, code: 'assistant_unavailable', message: 'El asistente no está disponible en este momento.' } } })
    const wrapper = await mountAgent()

    await wrapper.find('textarea').setValue('Necesito una calculadora')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('El asistente no está disponible en este momento.')
    expect(wrapper.find('.agent-card').exists()).toBe(false)
    wrapper.unmount()
  })
})

describe('producto citado en el chat', () => {
  it('genera el enlace público y lo reconoce dentro de un mensaje', async () => {
    const { productUrl, extractProductLink } = await import('@/utils/productLink')
    const url = productUrl(7)
    expect(url).toMatch(/\/tabs\/marketplace\/product\/7$/)

    expect(extractProductLink(`Hola, me interesa este producto.\n${url}`)).toEqual({ id: 7, rest: 'Hola, me interesa este producto.' })
    expect(extractProductLink('https://lauapp.es/tabs/marketplace/product/12')).toEqual({ id: 12, rest: '' })
    expect(extractProductLink('Hola, ¿cómo estás?')).toBeNull()
  })

  it('muestra la tarjeta del producto con precio y comercio verificado', async () => {
    api.get.mockResolvedValueOnce(ok({
      id: 7, name: 'Calculadora científica 417 funciones', price: '18.50', images: [],
      store: { id: 1, name: 'Papelería Campus Central', slug: 'p', logo: null, is_verified: true, accepts_paypal: true },
    }))
    const Preview = (await import('@/components/marketplace/ProductLinkPreview.vue')).default
    const wrapper = mount(Preview, { props: { productId: 7, variant: 'composer', removable: true } })
    await flushPromises()

    expect(api.get).toHaveBeenCalledWith('/marketplace/products/7')
    expect(wrapper.text()).toContain('Calculadora científica 417 funciones')
    expect(wrapper.text()).toContain('$18.50')
    expect(wrapper.text()).toContain('Papelería Campus Central')
    await wrapper.find('.preview-remove').trigger('click')
    expect(wrapper.emitted('remove')).toHaveLength(1)
    wrapper.unmount()
  })
})
