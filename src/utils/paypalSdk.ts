// Carga el PayPal JavaScript SDK oficial una sola vez por configuración.
// Solo usa el Client ID público; el Secret nunca existe en el frontend.

export interface PayPalSdkOptions {
    clientId: string
    /** Merchant ID de la tienda que recibe el pago (lo resuelve el backend con PayPal). */
    merchantId: string
    currency: string
}

// Tipado mínimo de lo que usamos del SDK.
export interface PayPalButtonsActions { restart: () => Promise<void> }
export interface PayPalButtons {
    isEligible: () => boolean
    render: (container: HTMLElement) => Promise<void>
    close: () => Promise<void>
}
export interface PayPalNamespace {
    Buttons: (options: Record<string, unknown>) => PayPalButtons
}

const SCRIPT_MARK = 'data-lau-paypal-sdk'

let pending: Promise<PayPalNamespace> | null = null
let pendingUrl = ''

export function buildSdkUrl({ clientId, merchantId, currency }: PayPalSdkOptions): string {
    const params = new URLSearchParams({
        'client-id': clientId,
        'merchant-id': merchantId,
        currency,
        intent: 'capture',
        commit: 'true',
        components: 'buttons',
        // Pago con cuenta PayPal; Paga después y tarjeta como invitado no aplican a este flujo.
        'disable-funding': 'paylater,card',
    })
    return `https://www.paypal.com/sdk/js?${params.toString()}`
}

/** Client ID público de la app de PayPal (VITE_PAYPAL_CLIENT_ID). El Secret vive solo en el backend. */
export function paypalClientId(): string {
    return String(import.meta.env.VITE_PAYPAL_CLIENT_ID || import.meta.env.VITE_PAYPAL_SANDBOX_CLIENT_ID || '').trim()
}

export function loadPayPalSdk(options: PayPalSdkOptions): Promise<PayPalNamespace> {
    const url = buildSdkUrl(options)
    if (pending && pendingUrl === url) return pending

    // Otra configuración (p. ej. otra tienda): se descarta el SDK anterior.
    document.querySelectorAll(`script[${SCRIPT_MARK}]`).forEach(script => script.remove())
    delete (window as any).paypal

    pendingUrl = url
    pending = new Promise<PayPalNamespace>((resolve, reject) => {
        const script = document.createElement('script')
        script.src = url
        script.async = true
        script.setAttribute(SCRIPT_MARK, 'true')
        script.onload = () => {
            const paypal = (window as any).paypal as PayPalNamespace | undefined
            if (paypal?.Buttons) resolve(paypal)
            else fail()
        }
        script.onerror = fail
        document.head.appendChild(script)

        function fail() {
            pending = null
            pendingUrl = ''
            script.remove()
            reject(new Error('No se pudo cargar PayPal.'))
        }
    })
    return pending
}
