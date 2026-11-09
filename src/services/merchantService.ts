import { api } from './api'
import { toCheckoutError } from './paypalCheckoutService'
import type { MerchantStatus, Store } from '@/types/marketplace'

// Comercios verificados: solicitud legal, conexión con PayPal y directorio público.

/** Errores de validación del backend, uno por campo. */
export class FieldErrors extends Error {
    constructor(public readonly fields: Record<string, string>) {
        super(Object.values(fields)[0] || 'Revisá los datos del formulario.')
        this.name = 'FieldErrors'
    }
}

async function call<T>(request: () => Promise<{ data: { data: T } }>): Promise<T> {
    try {
        return (await request()).data.data
    } catch (error) {
        throw toCheckoutError(error)
    }
}

export const merchantService = {
    status(): Promise<MerchantStatus> {
        return call(() => api.get('/marketplace/my/verification'))
    },

    /** FormData con los datos legales y el documento (multipart). */
    async submit(form: FormData): Promise<MerchantStatus> {
        try {
            const { data } = await api.post('/marketplace/my/verification', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 60000,
            })
            return data.data
        } catch (error: any) {
            const errors = error?.response?.status === 422 ? error.response.data?.errors : null
            if (errors) throw new FieldErrors(Object.fromEntries(Object.entries(errors).map(([field, list]) => [field, String((list as string[])[0])])))
            throw toCheckoutError(error)
        }
    },

    /** Enlace de PayPal para conectar la cuenta del comercio (de un solo uso). */
    connectPayPal(): Promise<{ action_url: string }> {
        return call(() => api.post('/marketplace/my/paypal/connect', {}, { timeout: 30000 }))
    },

    /** Consulta a PayPal el estado actual del comercio. */
    refreshPayPal(): Promise<MerchantStatus> {
        return call(() => api.post('/marketplace/my/paypal/refresh', {}, { timeout: 30000 }))
    },

    verifiedStores(): Promise<(Store & { products_count: number })[]> {
        return call(() => api.get('/marketplace/verified-stores'))
    },
}

export default merchantService
