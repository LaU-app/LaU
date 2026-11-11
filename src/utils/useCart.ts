import { computed, reactive, ref } from 'vue'
import localforage from 'localforage'
import marketplaceService from '@/services/marketplaceService'
import type { CartIssue, CartItem, Product } from '@/types/marketplace'

// Mismo molde que useStudy.ts: estado a nivel de módulo (singleton por import)
// + localforage con claves por cuenta.
const storage = localforage.createInstance({ name: 'LaU', storeName: 'marketplace_v1' })

const items = reactive<CartItem[]>([])
const issues = reactive<CartIssue[]>([])
const ready = ref(false)
const busy = ref(false)

let owner: number | null = null
let chain: Promise<unknown> = Promise.resolve()

function userId(): number | null {
    if (!(localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token'))) return null
    try {
        return JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || 'null')?.id ?? null
    } catch {
        return null
    }
}

/** Serializa las escrituras para que dos toques rápidos no se pisen. */
function serial<T>(action: () => Promise<T>): Promise<T | undefined> {
    const work = chain.then(async () => {
        try {
            return await action()
        } catch {
            return undefined
        }
    })
    chain = work
    return work
}

async function persist(): Promise<void> {
    if (!owner || userId() !== owner) return
    await storage.setItem(`user:${owner}`, JSON.parse(JSON.stringify(items)))
}

function replace(next: CartItem[]): void {
    items.splice(0, items.length, ...next)
}

async function load(): Promise<void> {
    const id = userId()
    if (id === owner && ready.value) return

    owner = id
    ready.value = false
    replace([])
    issues.splice(0, issues.length)

    if (!id) {
        ready.value = true
        return
    }

    const saved = await storage.getItem<CartItem[]>(`user:${id}`)
    if (id !== userId()) return
    if (Array.isArray(saved)) replace(saved)
    ready.value = true
}

function snapshot(product: Product): CartItem {
    return {
        product_id: product.id,
        quantity: 1,
        name: product.name,
        price: Number(product.price),
        image_url: product.images?.[0]?.url ?? null,
        stock: product.stock,
        seller_id: product.user_id,
        seller_name: product.user?.name || product.store?.name || 'Vendedor',
        delivery_point: product.delivery_point,
        ...storeSnapshot(product),
    }
}

/** Datos de la tienda que decide cómo se paga el grupo del carrito (PayPal o apartado). */
function storeSnapshot(product: Product): Pick<CartItem, 'store_id' | 'store_name' | 'store_logo_url' | 'accepts_paypal'> {
    return {
        store_id: product.store?.id ?? product.store_id ?? null,
        store_name: product.store?.name ?? null,
        store_logo_url: product.store?.logo_url ?? null,
        accepts_paypal: !!product.store?.accepts_paypal,
    }
}

export interface CartGroup {
    seller_id: number
    seller_name: string
    store_id: number | null
    store_logo_url: string | null
    accepts_paypal: boolean
    items: CartItem[]
    subtotal: number
}

export const cart = {
    items,
    issues,
    ready,
    busy,

    count: computed(() => items.reduce((total, item) => total + item.quantity, 0)),
    subtotal: computed(() => items.reduce((total, item) => total + item.price * item.quantity, 0)),
    isEmpty: computed(() => items.length === 0),

    /**
     * El carrito se muestra agrupado por vendedor. Los grupos de tiendas que cobran con PayPal
     * se pagan en línea (un pago por tienda); el resto se aparta y se paga al entregar.
     */
    bySeller: computed(() => {
        const groups = new Map<number, CartGroup>()
        for (const item of items) {
            const group = groups.get(item.seller_id)
                ?? {
                    seller_id: item.seller_id,
                    seller_name: item.store_name || item.seller_name,
                    store_id: item.store_id ?? null,
                    store_logo_url: item.store_logo_url ?? null,
                    accepts_paypal: !!item.accepts_paypal && !!item.store_id,
                    items: [],
                    subtotal: 0,
                }
            group.items.push(item)
            group.subtotal += item.price * item.quantity
            groups.set(item.seller_id, group)
        }
        return [...groups.values()]
    }),

    has: (productId: number) => items.some(item => item.product_id === productId),

    initialize: () => serial(load),

    /** Devuelve false si ya se alcanzó el stock disponible. */
    add(product: Product, quantity = 1): Promise<boolean | undefined> {
        return serial(async () => {
            await load()
            const existing = items.find(item => item.product_id === product.id)
            if (existing) {
                if (existing.quantity + quantity > product.stock) return false
                existing.quantity += quantity
                existing.stock = product.stock
                existing.price = Number(product.price)
            } else {
                if (quantity > product.stock) return false
                items.push({ ...snapshot(product), quantity })
            }
            await persist()
            return true
        })
    },

    setQuantity(productId: number, quantity: number): Promise<void | undefined> {
        return serial(async () => {
            const item = items.find(entry => entry.product_id === productId)
            if (!item) return
            // El stepper nunca puede pasar del stock conocido.
            item.quantity = Math.max(1, Math.min(quantity, item.stock))
            await persist()
        })
    },

    increment: (productId: number) => {
        const item = items.find(entry => entry.product_id === productId)
        return cart.setQuantity(productId, (item?.quantity ?? 1) + 1)
    },

    decrement(productId: number): Promise<void | undefined> {
        const item = items.find(entry => entry.product_id === productId)
        if (item && item.quantity <= 1) return cart.remove(productId)
        return cart.setQuantity(productId, (item?.quantity ?? 1) - 1)
    },

    remove(productId: number): Promise<void | undefined> {
        return serial(async () => {
            const index = items.findIndex(entry => entry.product_id === productId)
            if (index >= 0) items.splice(index, 1)
            const issue = issues.findIndex(entry => entry.product_id === productId)
            if (issue >= 0) issues.splice(issue, 1)
            await persist()
        })
    },

    clear(): Promise<void | undefined> {
        return serial(async () => {
            replace([])
            issues.splice(0, issues.length)
            await persist()
        })
    },

    /**
     * Revalida contra el servidor: precio, stock y disponibilidad. Los cambios se
     * avisan en el carrito en vez de reventar al confirmar.
     */
    revalidate(): Promise<CartIssue[] | undefined> {
        return serial(async () => {
            await load()
            if (!items.length) return []

            busy.value = true
            const found: CartIssue[] = []

            try {
                const results = await Promise.allSettled(items.map(item => marketplaceService.product(item.product_id)))

                results.forEach((result, index) => {
                    const item = items[index]
                    if (!item) return

                    if (result.status === 'rejected') {
                        found.push({ product_id: item.product_id, type: 'gone', message: `"${item.name}" ya no está disponible.` })
                        return
                    }

                    const product = result.value
                    const price = Number(product.price)

                    if (price !== item.price) {
                        found.push({
                            product_id: item.product_id,
                            type: 'price',
                            message: `"${item.name}" pasó de $${item.price.toFixed(2)} a $${price.toFixed(2)}.`,
                        })
                        item.price = price
                    }
                    item.stock = product.stock
                    if (item.quantity > product.stock) {
                        found.push({
                            product_id: item.product_id,
                            type: 'stock',
                            message: product.stock === 0
                                ? `"${item.name}" se quedó sin stock.`
                                : `De "${item.name}" solo quedan ${product.stock}.`,
                        })
                        item.quantity = Math.max(1, product.stock)
                    }
                    item.name = product.name
                    item.image_url = product.images?.[0]?.url ?? item.image_url
                    item.delivery_point = product.delivery_point
                    Object.assign(item, storeSnapshot(product))
                })

                issues.splice(0, issues.length, ...found)
                await persist()

                return found
            } finally {
                busy.value = false
            }
        })
    },
}

function onAccountChanged(): void {
    ready.value = false
    void cart.initialize()
}

export function startCartRuntime(): void {
    // AuthService.setUser/logout ya emiten este evento; es el mismo que usa useStudy.
    window.addEventListener('study-account-changed', onAccountChanged)
    void cart.initialize()
}

export function stopCartRuntime(): void {
    window.removeEventListener('study-account-changed', onAccountChanged)
}

export default cart
