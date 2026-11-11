import { api } from './api'

// Pago con PayPal de productos de comercios verificados. El backend fija precio, total y
// comercio: el navegador solo indica qué producto y cuántas unidades.

export interface CheckoutQuote {
    product: { id: number; name: string; image_url: string | null }
    store: { name: string; slug: string; logo_url: string | null; is_verified: boolean }
    unit_price: string
    quantity: number
    total: string
    currency: string
    /** Merchant ID público del comercio: el SDK de PayPal lo necesita para mostrar el botón. */
    merchant_id: string
    /** Todos los productos del pago (uno, o el carrito de un comercio). */
    items?: CheckoutQuoteItem[]
}

export interface CheckoutQuoteItem {
    product_id: number
    name: string
    image_url: string | null
    unit_price: string
    quantity: number
    subtotal: string
}

/** Productos de un mismo comercio que se pagan juntos (carrito). */
export type CheckoutLine = { product_id: number; quantity: number }

export interface PayPalCapture {
    order_id: string
    capture_id: string
    status: 'COMPLETED'
    amount: string
    currency: string
    store: string
    order_code: string
    lau_order_id: number
}

/** Error del checkout con el código estable que devuelve el backend (not_approved, already_captured…). */
export class CheckoutError extends Error {
    constructor(public readonly code: string, message: string) {
        super(message)
        this.name = 'CheckoutError'
    }
}

// PayPal puede tardar varios segundos al capturar; el timeout general de la app es de 10 s.
const TIMEOUT = 30000

type Envelope<T> = { success: boolean; data?: T; code?: string; message?: string }

function unwrap<T>(response: { data: Envelope<T> }): T {
    const body = response.data
    // Un 202 con success:false (p. ej. captura pendiente) no es un pago completado.
    if (!body?.success || body.data === undefined) {
        throw new CheckoutError(body?.code || 'unexpected', body?.message || 'Respuesta inesperada del servidor.')
    }
    return body.data
}

export function toCheckoutError(error: any): CheckoutError {
    if (error instanceof CheckoutError) return error
    const data = error?.response?.data
    if (data?.code && data?.message) return new CheckoutError(String(data.code), String(data.message))
    if (data?.errors) {
        const first = Object.values(data.errors)[0]
        if (Array.isArray(first) && first.length) return new CheckoutError('validation', String(first[0]))
    }
    if (error?.response?.status === 401) return new CheckoutError('unauthenticated', 'Tu sesión expiró. Volvé a iniciar sesión.')
    if (error?.response?.status === 429) return new CheckoutError('rate_limited', 'Demasiados intentos. Esperá un minuto.')
    if (!error?.response) return new CheckoutError('network', 'No pudimos conectar con LaU. Revisá tu conexión e intentá de nuevo.')
    return new CheckoutError('unexpected', data?.message || 'Algo salió mal con el pago. Intentá de nuevo.')
}

async function call<T>(request: () => Promise<{ data: Envelope<T> }>): Promise<T> {
    try {
        return unwrap(await request())
    } catch (error) {
        throw toCheckoutError(error)
    }
}

export const paypalCheckoutService = {
    /** Resumen a confirmar: comercio, producto, precio unitario, cantidad y total. */
    quote(productId: number, quantity = 1): Promise<CheckoutQuote> {
        return call(() => api.post('/marketplace/paypal/quote', { product_id: productId, quantity }, { timeout: TIMEOUT }))
    },

    /** Crea la orden en PayPal. El mismo attemptId en un reintento devuelve la misma orden. */
    createOrder(productId: number, quantity: number, attemptId: string, decisionId?: number | null): Promise<{ order_id: string; status: string; total: string; currency: string }> {
        return call(() => api.post('/marketplace/paypal/orders', {
            product_id: productId,
            quantity,
            checkout_attempt_id: attemptId,
            assistant_decision_id: decisionId ?? null,
        }, { timeout: TIMEOUT }))
    },

    /** Resumen de varios productos de un mismo comercio (carrito): un solo pago. */
    quoteItems(items: CheckoutLine[]): Promise<CheckoutQuote> {
        return call(() => api.post('/marketplace/paypal/quote', { items }, { timeout: TIMEOUT }))
    },

    createOrderItems(items: CheckoutLine[], attemptId: string): Promise<{ order_id: string; status: string; total: string; currency: string }> {
        return call(() => api.post('/marketplace/paypal/orders', { items, checkout_attempt_id: attemptId }, { timeout: TIMEOUT }))
    },

    /** Solo resuelve si PayPal confirmó la captura como COMPLETED. */
    async capture(orderId: string): Promise<PayPalCapture> {
        const result = await call<PayPalCapture>(() => api.post(
            `/marketplace/paypal/orders/${encodeURIComponent(orderId)}/capture`, {}, { timeout: TIMEOUT },
        ))
        if (result.status !== 'COMPLETED' || !result.capture_id) {
            throw new CheckoutError('capture_pending', 'PayPal todavía no confirma el pago.')
        }
        return result
    },
}

/** Muestra solo el inicio y el final de un ID: 5O19••••715T. */
export function maskId(id: string): string {
    if (!id) return ''
    return id.length <= 8 ? `${id.slice(0, 2)}••••` : `${id.slice(0, 4)}••••${id.slice(-4)}`
}

export function newAttemptId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
    // Respaldo RFC 4122 v4 para navegadores sin randomUUID.
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
        const random = (Math.random() * 16) | 0
        return (char === 'x' ? random : (random & 0x3) | 0x8).toString(16)
    })
}

export default paypalCheckoutService
