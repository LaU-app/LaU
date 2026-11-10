// Panel del equipo de LaU dentro de la app: revisión de comercios verificados.
// La sesión del superusuario es independiente de la del estudiante: token propio (8 h) que el
// backend solo acepta en /api/lau-admin/*. Se guarda en sessionStorage (se borra al cerrar la pestaña).
import axios, { AxiosError } from 'axios'
import { API_URL } from './api'

const SESSION_KEY = 'lau_admin_session'

export interface AdminUser { id: number; name: string; email: string }

interface AdminSession { token: string; expires_at: string; admin: AdminUser }

export type VerificationStatus = 'submitted' | 'approved' | 'rejected' | 'suspended'

export interface MerchantSummary {
  id: number
  status: VerificationStatus
  status_label: string
  legal_name: string
  nit: string
  submitted_at: string | null
  store: {
    name: string
    slug: string
    logo_url: string | null
    paypal_status: 'not_connected' | 'pending' | 'enabled' | string
    owner: { name: string; username: string } | null
  } | null
}

export interface MerchantDetail extends MerchantSummary {
  business_type: string
  business_type_label: string
  nrc: string | null
  legal_representative: string
  contact_email: string
  contact_phone: string
  address: string
  website: string | null
  offer_description: string
  has_document: boolean
  document_name: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  review_notes: string | null
  store_detail: {
    description: string | null
    category: string | null
    owner_email: string | null
    paypal_connected: boolean
    paypal_checked_at: string | null
    accepts_paypal: boolean
    active_products: number
    paid_orders: number
    paid_total: string
  } | null
}

export interface MerchantList {
  items: MerchantSummary[]
  counts: Record<VerificationStatus, number>
  with_paypal: number
  page: number
  last_page: number
  total: number
}

export interface ActionResult { message: string; emailed?: boolean; data: MerchantDetail }

function readSession(): AdminSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as AdminSession
    if (!session.token || new Date(session.expires_at).getTime() <= Date.now()) {
      sessionStorage.removeItem(SESSION_KEY)
      return null
    }
    return session
  } catch {
    return null
  }
}

const http = axios.create({
  baseURL: `${API_URL}/lau-admin`,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
  timeout: 20000,
})

http.interceptors.request.use((config) => {
  const session = readSession()
  if (session) config.headers.Authorization = `Bearer ${session.token}`
  return config
})

// Sesión vencida o revocada: se limpia y la vista vuelve al inicio de sesión del equipo.
http.interceptors.response.use(undefined, (error: AxiosError) => {
  if (error.response?.status === 401) sessionStorage.removeItem(SESSION_KEY)
  return Promise.reject(error)
})

const unwrap = <T>(res: { data: { data?: T } & T }): T => (res.data?.data ?? res.data) as T

/** Mensaje legible de un error de la API (validación, permisos o red). */
export function adminErrorMessage(error: unknown, fallback = 'No se pudo completar la acción.'): string {
  const res = (error as AxiosError<{ message?: string; errors?: Record<string, string[]> }>)?.response
  const firstError = res?.data?.errors ? Object.values(res.data.errors)[0]?.[0] : null
  return firstError || res?.data?.message || fallback
}

export const AdminService = {
  isAuthenticated: (): boolean => readSession() !== null,
  admin: (): AdminUser | null => readSession()?.admin ?? null,

  async login(email: string, password: string): Promise<AdminUser> {
    const data = unwrap<AdminSession>(await http.post('/login', { email, password }))
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data))
    return data.admin
  },

  async logout(): Promise<void> {
    try { await http.post('/logout') } catch { /* la sesión local se cierra igual */ }
    sessionStorage.removeItem(SESSION_KEY)
  },

  async merchants(params: { estado?: VerificationStatus | ''; q?: string; page?: number } = {}): Promise<MerchantList> {
    const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined))
    return unwrap<MerchantList>(await http.get('/merchants', { params: clean }))
  },

  async merchant(id: number | string): Promise<MerchantDetail> {
    return unwrap<MerchantDetail>(await http.get(`/merchants/${id}`))
  },

  async approve(id: number, notes?: string): Promise<ActionResult> {
    return (await http.post(`/merchants/${id}/approve`, { notes: notes || null })).data
  },

  async reject(id: number, notes: string): Promise<ActionResult> {
    return (await http.post(`/merchants/${id}/reject`, { notes })).data
  },

  async suspend(id: number, notes: string): Promise<ActionResult> {
    return (await http.post(`/merchants/${id}/suspend`, { notes })).data
  },

  async refreshPayPal(id: number): Promise<ActionResult> {
    return (await http.post(`/merchants/${id}/paypal`)).data
  },

  /**
   * Abre el documento legal (privado) en una pestaña nueva, sin exponer el token en la URL.
   * La pestaña se abre antes de descargar (si no, Safari y los WebView la bloquean).
   */
  async openDocument(id: number): Promise<void> {
    const tab = window.open('', '_blank')
    try {
      const res = await http.get(`/merchants/${id}/document`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data as Blob)
      if (tab) {
        tab.opener = null
        tab.location.href = url
      } else {
        window.location.assign(url)
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (error) {
      tab?.close()
      // Con responseType blob el mensaje de error del backend llega como Blob: se convierte a JSON.
      const data = (error as AxiosError)?.response?.data
      if (data instanceof Blob) {
        try { (error as AxiosError).response!.data = JSON.parse(await data.text()) } catch { /* sin mensaje */ }
      }
      throw error
    }
  },
}

export default AdminService
