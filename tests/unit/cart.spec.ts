import { beforeEach, describe, expect, it, vi } from 'vitest'

const storage = new Map<string, unknown>()
const api = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }

vi.mock('@/services/api', () => ({ api }))
vi.mock('localforage', () => ({ default: { createInstance: () => ({
  getItem: async (key: string) => storage.get(key),
  setItem: async (key: string, value: unknown) => storage.set(key, JSON.parse(JSON.stringify(value))),
  keys: async () => [...storage.keys()],
  removeItem: async (key: string) => storage.delete(key),
}) } }))

let cart: typeof import('@/utils/useCart').cart

function account(id: number) {
  localStorage.setItem('auth_token', 'test-only')
  localStorage.setItem('user', JSON.stringify({ id }))
}

function product(overrides: Record<string, unknown> = {}) {
  return {
    id: 1, user_id: 9, name: 'Libro de Cálculo', price: '20.00', stock: 3,
    is_available: true, images: [{ url: 'http://x/a.webp' }], delivery_point: 'Biblioteca',
    user: { id: 9, name: 'Ana' }, ...overrides,
  } as any
}

beforeEach(async () => {
  vi.resetModules(); vi.resetAllMocks(); storage.clear()
  localStorage.clear(); sessionStorage.clear(); account(1)
  cart = (await import('@/utils/useCart')).cart
  await cart.initialize()
})

describe('carrito del Marketplace', () => {
  it('persiste entre recargas y queda aislado por cuenta', async () => {
    await cart.add(product())
    expect(cart.count.value).toBe(1)

    // Simula recargar la app: módulo nuevo, mismo almacenamiento.
    vi.resetModules()
    const recargado = (await import('@/utils/useCart')).cart
    await recargado.initialize()
    expect(recargado.count.value).toBe(1)
    expect(recargado.items[0].name).toBe('Libro de Cálculo')

    // Otra cuenta no ve el carrito ajeno.
    account(2)
    vi.resetModules()
    const otra = (await import('@/utils/useCart')).cart
    await otra.initialize()
    expect(otra.count.value).toBe(0)
  })

  it('nunca deja pasar del stock disponible', async () => {
    await cart.add(product({ stock: 2 }))
    await cart.increment(1)
    expect(cart.items[0].quantity).toBe(2)

    await cart.increment(1)
    expect(cart.items[0].quantity).toBe(2)

    // Sumar otra unidad cuando ya está completo se rechaza.
    expect(await cart.add(product({ stock: 2 }))).toBe(false)
  })

  it('al bajar de una unidad quita el artículo', async () => {
    await cart.add(product())
    await cart.decrement(1)
    expect(cart.isEmpty.value).toBe(true)
  })

  it('agrupa por vendedor para que se vean los apartados que saldrán', async () => {
    await cart.add(product({ id: 1, user_id: 9, user: { id: 9, name: 'Ana' } }))
    await cart.add(product({ id: 2, user_id: 9, name: 'Cuaderno', price: '5.00', user: { id: 9, name: 'Ana' } }))
    await cart.add(product({ id: 3, user_id: 7, name: 'Sudadera', price: '25.00', user: { id: 7, name: 'Beto' } }))

    const groups = cart.bySeller.value
    expect(groups).toHaveLength(2)
    expect(groups.find(g => g.seller_id === 9)!.items).toHaveLength(2)
    expect(groups.find(g => g.seller_id === 9)!.subtotal).toBe(25)
    expect(cart.subtotal.value).toBe(50)
  })

  it('las tiendas que cobran con PayPal se pagan en línea; el resto se aparta', async () => {
    const paypalStore = { id: 4, name: 'Librería Cuscatlán', slug: 'libreria', logo_url: 'http://x/l.svg', accepts_paypal: true }
    await cart.add(product({ id: 1, user_id: 9, store_id: 4, store: paypalStore }))
    await cart.add(product({ id: 2, user_id: 7, name: 'Sudadera', user: { id: 7, name: 'Beto' } }))

    const groups = cart.bySeller.value
    const store = groups.find(g => g.seller_id === 9)!
    expect(store.accepts_paypal).toBe(true)
    expect(store.seller_name).toBe('Librería Cuscatlán')
    expect(store.store_logo_url).toBe('http://x/l.svg')
    expect(groups.find(g => g.seller_id === 7)!.accepts_paypal).toBe(false)

    // Si la tienda deja de cobrar con PayPal, al revalidar su grupo vuelve a apartado.
    api.get
      .mockResolvedValueOnce({ data: { success: true, data: product({ id: 1, user_id: 9, store_id: 4, store: { ...paypalStore, accepts_paypal: false } }) } })
      .mockResolvedValueOnce({ data: { success: true, data: product({ id: 2, user_id: 7, name: 'Sudadera' }) } })
    await cart.revalidate()
    expect(cart.bySeller.value.find(g => g.seller_id === 9)!.accepts_paypal).toBe(false)
  })

  it('al revalidar avisa de cambios de precio y recorta la cantidad al stock real', async () => {
    await cart.add(product({ stock: 5 }))
    await cart.setQuantity(1, 4)

    api.get.mockResolvedValueOnce({
      data: { success: true, data: { ...product(), price: '15.00', stock: 2 } },
    })

    const issues = await cart.revalidate()

    expect(issues!.map(issue => issue.type).sort()).toEqual(['price', 'stock'])
    expect(cart.items[0].price).toBe(15)
    expect(cart.items[0].quantity).toBe(2)
  })

  it('marca como no disponible lo que ya no existe en el servidor', async () => {
    await cart.add(product())
    api.get.mockRejectedValueOnce({ response: { status: 404 } })

    const issues = await cart.revalidate()

    expect(issues).toHaveLength(1)
    expect(issues![0].type).toBe('gone')
  })
})
