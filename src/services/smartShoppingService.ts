import { api } from './api'
import { toCheckoutError } from './paypalCheckoutService'

// Búsqueda inteligente del Marketplace. Un modelo de decisiones evalúa productos reales de
// comercios verificados y devuelve decisiones con probabilidades; el backend decide qué mostrar
// y el estudiante confirma cualquier compra.

export type SmartOutcome =
    | 'recommendation' | 'confirm_choice' | 'over_budget' | 'no_match' | 'needs_clarification' | 'not_a_purchase'

export interface SmartRecommendation {
    product: {
        id: number; name: string; description: string; price: string; currency: string; stock: number
        image_url: string | null; category: string | null; condition: string | null; delivery_point: string | null
        /** Campus donde se entrega (siglas o nombre). */
        campus?: string | null
    }
    store: { name: string; slug: string; logo_url: string | null; is_verified: boolean; accepts_paypal: boolean }
    match_probability: number
    /** Frase real de la descripción que el modelo eligió como la que mejor responde a la búsqueda. */
    highlight: string | null
    /** Razones calculadas por el backend (posición, presupuesto, existencias). */
    reasons: string[]
    within_budget: boolean | null
    recommended: boolean
}

export interface SmartPlan {
    decision_id: number
    outcome: SmartOutcome
    model: string
    budget: { amount: string | null; source: 'field' | 'message' | 'none'; unclear_amounts: string[] }
    interpretation: {
        purchase_intent: number
        item_named: number
        category: { slug: string; name: string | null; probability: number } | null
    }
    recommendations: SmartRecommendation[]
    message: { title: string; body: string[]; clarification: string | null }
}

export interface ProductVideos {
    /** found: hay videos · none: no hay · unavailable: sin servicio de videos · error: no se pudo revisar */
    status: 'found' | 'none' | 'unavailable' | 'error'
    videos: { id: string; title: string; channel: string; thumbnail: string | null; url: string }[]
    search_url: string
    message: string
}

export const smartShoppingService = {
    async plan(query: string, maxBudget?: number | null): Promise<SmartPlan> {
        try {
            const { data } = await api.post('/marketplace/smart-shopping', {
                query,
                max_budget: maxBudget || null,
            }, { timeout: 45000 })
            return data.data
        } catch (error) {
            throw toCheckoutError(error)
        }
    },

    async videos(productId: number): Promise<ProductVideos> {
        try {
            const { data } = await api.get(`/marketplace/products/${productId}/videos`, { timeout: 30000 })
            return data.data
        } catch (error) {
            throw toCheckoutError(error)
        }
    },
}

export default smartShoppingService
