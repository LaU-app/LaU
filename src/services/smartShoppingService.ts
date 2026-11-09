import { api } from './api'
import { toCheckoutError } from './paypalCheckoutService'

// "Compra inteligente con Jev": Jev (TypeSafe AI) evalúa productos reales de comercios
// verificados y devuelve decisiones con probabilidades; el backend decide y el estudiante confirma.

export type SmartOutcome =
    | 'recommendation' | 'confirm_choice' | 'over_budget' | 'no_match' | 'needs_clarification' | 'not_a_purchase'

export interface SmartRecommendation {
    product: { id: number; name: string; description: string; price: string; currency: string; stock: number; image_url: string | null; category: string | null }
    store: { name: string; slug: string; logo_url: string | null; is_verified: boolean; accepts_paypal: boolean }
    match_probability: number
    fit: { score: number; label: string }
    academic: { score: number; label: string }
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
}

export default smartShoppingService
