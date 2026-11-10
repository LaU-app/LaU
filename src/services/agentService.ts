import { api } from './api'
import { toCheckoutError } from './paypalCheckoutService'
import type { ProductVideos, SmartRecommendation } from './smartShoppingService'

// Agente de compras: chat con historial. El backend orquesta un modelo de lenguaje abierto con
// herramientas (catálogo de comercios verificados, reseñas, pedidos) y verifica cada respuesta
// contra los datos reales. El agente nunca paga: la compra la confirma el estudiante en PayPal.

export type AgentProduct = Omit<SmartRecommendation, 'match_probability'> & { match_probability: number | null }

export type AgentCard =
  | { type: 'products'; decision_id: number | null; items: AgentProduct[] }
  | ({ type: 'purchase'; decision_id: number | null; quantity: number; total: string } & AgentProduct)
  | ({ type: 'videos'; product: { id: number; name: string } } & ProductVideos)

export interface AgentStep { tool: string; label: string; ok: boolean }

export interface AgentMessage {
  id: number
  role: 'user' | 'assistant'
  content: string
  cards: AgentCard[]
  steps: AgentStep[]
  created_at: string | null
}

export interface AgentConversation {
  id: number
  title: string
  last_message_at: string | null
  messages: AgentMessage[]
}

export interface AgentConversationSummary {
  id: number
  title: string
  last_message_at: string | null
  messages_count: number
}

// Un modelo local puede tardar en pensar y usar herramientas (en la nube responde en segundos).
const TURN_TIMEOUT = 300000

export const agentService = {
  async list(): Promise<{ available: boolean; conversations: AgentConversationSummary[] }> {
    try {
      const { data } = await api.get('/marketplace/agent/conversations')
      return data.data
    } catch (error) {
      throw toCheckoutError(error)
    }
  },

  /** Nuevo chat: con un primer mensaje o a partir de una búsqueda inteligente (decision_id). */
  async start(payload: { message?: string; decision_id?: number }): Promise<AgentConversation> {
    try {
      const { data } = await api.post('/marketplace/agent/conversations', payload, { timeout: TURN_TIMEOUT })
      return data.data
    } catch (error) {
      throw toCheckoutError(error)
    }
  },

  async get(id: number): Promise<AgentConversation> {
    try {
      const { data } = await api.get(`/marketplace/agent/conversations/${id}`)
      return data.data
    } catch (error) {
      throw toCheckoutError(error)
    }
  },

  async send(id: number, message: string): Promise<AgentConversation> {
    try {
      const { data } = await api.post(`/marketplace/agent/conversations/${id}/messages`, { message }, { timeout: TURN_TIMEOUT })
      return data.data
    } catch (error) {
      throw toCheckoutError(error)
    }
  },

  async remove(id: number): Promise<void> {
    try {
      await api.delete(`/marketplace/agent/conversations/${id}`)
    } catch (error) {
      throw toCheckoutError(error)
    }
  },
}

export default agentService
