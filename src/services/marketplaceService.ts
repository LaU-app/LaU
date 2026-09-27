import { api } from './api'
import type {
    Order, Paginated, Product, ProductCategory, Store, StoreDashboard,
} from '@/types/marketplace'

// El backend envuelve todo en {success, data}. Aquí se devuelve ya desenvuelto,
// que es lo que consumen las vistas.
type Envelope<T> = { success: boolean; data: T; message?: string }

const unwrap = <T>(response: { data: Envelope<T> }): T => response.data.data

export interface ProductFilters {
    search?: string
    category?: string
    store_id?: number
    seller_id?: number
    universidad_id?: number
    min_price?: number
    max_price?: number
    only_available?: boolean
    sort_by?: 'created_at' | 'price'
    sort_order?: 'asc' | 'desc'
    page?: number
}

export const marketplaceService = {
    // ---- Catálogo (público) ----
    async categories(): Promise<ProductCategory[]> {
        return unwrap(await api.get('/marketplace/categories'))
    },

    async products(filters: ProductFilters = {}): Promise<Paginated<Product>> {
        const params = Object.fromEntries(
            Object.entries(filters).filter(([, value]) => value !== undefined && value !== '' && value !== null)
        )
        return unwrap(await api.get('/marketplace/products', { params }))
    },

    async product(id: number): Promise<Product> {
        return unwrap(await api.get(`/marketplace/products/${id}`))
    },

    async store(slug: string): Promise<{ store: Store; products: Paginated<Product> }> {
        return unwrap(await api.get(`/marketplace/stores/${slug}`))
    },

    // ---- Publicar ----
    /** Sube una imagen ya optimizada a WebP y devuelve el filename que espera createProduct. */
    async uploadImage(blob: Blob): Promise<{ filename: string; url: string }> {
        const form = new FormData()
        form.append('file', blob, 'image.webp')
        return unwrap(await api.post('/marketplace/images', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }))
    },

    async uploadImages(blobs: Blob[]): Promise<string[]> {
        const uploaded = await Promise.all(blobs.map(blob => this.uploadImage(blob)))
        return uploaded.map(image => image.filename)
    },

    async createProduct(payload: Record<string, unknown>): Promise<Product> {
        return unwrap(await api.post('/marketplace/products', payload))
    },

    async updateProduct(id: number, payload: Record<string, unknown>): Promise<Product> {
        return unwrap(await api.put(`/marketplace/products/${id}`, payload))
    },

    async deleteProduct(id: number): Promise<void> {
        await api.delete(`/marketplace/products/${id}`)
    },

    async myProducts(page = 1, status?: 'active' | 'paused'): Promise<Paginated<Product>> {
        return unwrap(await api.get('/marketplace/my/products', { params: { page, status } }))
    },

    // ---- Apartados ----
    async createOrders(payload: {
        uuid_cliente: string
        items: { product_id: number; quantity: number }[]
        meeting_point?: string | null
        note?: string | null
    }): Promise<Order[]> {
        return unwrap(await api.post('/marketplace/orders', payload))
    },

    async purchases(page = 1, status?: string): Promise<Paginated<Order>> {
        return unwrap(await api.get('/marketplace/my/orders', { params: { page, status } }))
    },

    async sales(page = 1, status?: string): Promise<Paginated<Order>> {
        return unwrap(await api.get('/marketplace/my/sales', { params: { page, status } }))
    },

    async order(id: number): Promise<Order> {
        return unwrap(await api.get(`/marketplace/orders/${id}`))
    },

    async deliverOrder(id: number): Promise<Order> {
        return unwrap(await api.post(`/marketplace/orders/${id}/deliver`))
    },

    async cancelOrder(id: number, reason?: string): Promise<Order> {
        return unwrap(await api.post(`/marketplace/orders/${id}/cancel`, { reason }))
    },

    // ---- Tienda ----
    async myStore(): Promise<Store | null> {
        return unwrap(await api.get('/marketplace/my/store'))
    },

    async dashboard(): Promise<StoreDashboard> {
        return unwrap(await api.get('/marketplace/my/dashboard'))
    },

    async createStore(payload: FormData | Record<string, unknown>): Promise<Store> {
        const isForm = payload instanceof FormData
        return unwrap(await api.post('/marketplace/store', payload,
            isForm ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined))
    },

    async updateStore(payload: FormData | Record<string, unknown>): Promise<Store> {
        // Laravel no parsea multipart en PUT: se usa method spoofing, igual que
        // hace AuthService.updateProfile con /user/edit.
        if (payload instanceof FormData) {
            payload.append('_method', 'PUT')
            return unwrap(await api.post('/marketplace/store', payload, {
                headers: { 'Content-Type': 'multipart/form-data' },
            }))
        }
        return unwrap(await api.put('/marketplace/store', payload))
    },
}

/** Mensaje legible a partir de un error de axios, para toasts. */
export function marketplaceError(error: any, fallback = 'Algo salió mal. Intentá de nuevo.'): string {
    const data = error?.response?.data
    if (data?.errors) {
        const first = Object.values(data.errors)[0]
        if (Array.isArray(first) && first.length) return String(first[0])
    }
    return data?.message || fallback
}

export default marketplaceService
