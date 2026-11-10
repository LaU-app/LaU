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
  await import('@/components/marketplace/SmartSearchResults.vue')
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

describe('búsqueda inteligente', () => {
  const rec = {
    product: {
      id: 7, name: 'Calculadora científica 417 funciones', description: 'Pantalla de dos líneas. Ideal para Cálculo I y Física.',
      price: '18.50', currency: 'USD', stock: 2, image_url: null, category: 'Electrónica', condition: 'nuevo', delivery_point: 'Entrega en tu campus',
    },
    store: { name: 'Papelería Campus Central', slug: 'papeleria-campus-central', logo_url: null, is_verified: true, accepts_paypal: true },
    match_probability: 0.98,
    highlight: 'Ideal para Cálculo I y Física.',
    reasons: ['Es la que mejor coincide entre 2 productos de comercios verificados.', 'Entra en tu presupuesto de $20.00 y te sobran $1.50.', 'Quedan solo 2 unidades.'],
    within_budget: true, recommended: true,
  }
  const plan = {
    decision_id: 42, outcome: 'recommendation', model: 'jev-1.14.0',
    budget: { amount: '20.00', source: 'message', unclear_amounts: [] },
    interpretation: { purchase_intent: 0.96, item_named: 0.93, category: null },
    recommendations: [rec],
    message: { title: 'Encontré lo que buscás', body: ['Calculadora científica 417 funciones es la mejor opción entre comercios verificados.'], clarification: null },
  }

  async function mountResults(props: Record<string, unknown>) {
    const Results = (await import('@/components/marketplace/SmartSearchResults.vue')).default
    return mount(Results, { props, attachTo: document.body })
  }

  it('muestra el porqué de la recomendación con datos reales del producto', async () => {
    const wrapper = await mountResults({ status: 'done', plan })
    const text = wrapper.text()

    expect(text).toContain('Búsqueda inteligente')
    expect(text).toContain('Mejor opción')
    expect(text).toContain('Por qué te lo recomiendo')
    expect(text).toContain('«Ideal para Cálculo I y Física.»')
    expect(text).toContain('Entra en tu presupuesto de $20.00 y te sobran $1.50.')
    expect(text).toContain('2 disponibles')
    expect(text).toContain('Nuevo')
    expect(text).toContain('Entrega en tu campus')
    expect(text).toContain('Muy alta coincidencia con tu búsqueda')
    expect(wrapper.find('.match-ring').attributes('aria-label')).toBe('98 % de coincidencia')
    // Sin chips genéricos ni nombre del modelo.
    expect(text).not.toContain('Cubre todo lo que pediste')
    expect(text).not.toMatch(/jev|typesafe/i)

    await wrapper.find('.pay').trigger('click')
    expect(wrapper.emitted('buy')?.[0]).toEqual([7, 42])
    wrapper.unmount()
  })

  it('muestra un estado de búsqueda mientras piensa', async () => {
    const wrapper = await mountResults({ status: 'thinking', plan: null })
    expect(wrapper.text()).toContain('Entendiendo lo que necesitás')
    expect(wrapper.find('.ai-skeleton').exists()).toBe(true)
    expect(wrapper.find('.ai-card').exists()).toBe(false)
    wrapper.unmount()
  })

  it('carga reseñas y videos al abrirlas', async () => {
    api.get.mockResolvedValueOnce(ok({
      status: 'found', search_url: 'https://www.youtube.com/results?search_query=x', message: '',
      videos: [{ id: 'abc', title: 'Reseña calculadora científica', channel: 'Canal', thumbnail: null, url: 'https://www.youtube.com/watch?v=abc' }],
    }))
    const wrapper = await mountResults({ status: 'done', plan })

    await wrapper.find('.videos-toggle').trigger('click')
    await flushPromises()

    expect(api.get).toHaveBeenCalledWith('/marketplace/products/7/videos', expect.any(Object))
    expect(wrapper.find('a.video').attributes('href')).toBe('https://www.youtube.com/watch?v=abc')
    expect(wrapper.text()).toContain('Reseña calculadora científica')
    wrapper.unmount()
  })

  it('aclara cuando no hay videos ni reseñas', async () => {
    api.get.mockResolvedValueOnce(ok({ status: 'none', videos: [], search_url: 'https://www.youtube.com/results?search_query=x', message: 'No encontramos videos ni reseñas de este producto.' }))
    const wrapper = await mountResults({ status: 'done', plan })

    await wrapper.find('.videos-toggle').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('No encontramos videos ni reseñas de este producto.')
    expect(wrapper.find('a.video').exists()).toBe(false)
    wrapper.unmount()
  })

  it('el servicio solo envía la consulta del buscador', async () => {
    api.post.mockResolvedValueOnce(ok(plan))
    const { smartShoppingService } = await import('@/services/smartShoppingService')
    await smartShoppingService.plan('calculadora para Cálculo, máximo $20')
    expect(api.post).toHaveBeenCalledWith('/marketplace/smart-shopping', { query: 'calculadora para Cálculo, máximo $20', max_budget: null }, expect.any(Object))
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
