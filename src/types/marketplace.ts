// Espejo del backend (snake_case), igual que src/types/study.ts.

export interface ProductCategory {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    sort_order: number;
    is_active: boolean;
}

export interface ProductImage {
    id: number;
    filename: string;
    position: number;
    url: string;
}

export interface MarketplaceUser {
    id: number;
    name: string;
    username: string;
    imagen?: string | null;
    imagen_url?: string | null;
}

export interface StoreSummary {
    id: number;
    name: string;
    slug: string;
    logo: string | null;
    logo_url?: string | null;
}

export interface Store extends StoreSummary {
    description: string | null;
    category_id: number | null;
    instagram: string | null;
    whatsapp: string | null;
    is_active: boolean;
    category?: ProductCategory | null;
    user?: MarketplaceUser;
}

export type ProductStatus = 'active' | 'paused';
export type ProductCondition = 'nuevo' | 'como_nuevo' | 'buen_estado' | 'aceptable';

export interface Product {
    id: number;
    user_id: number;
    store_id: number | null;
    category_id: number | null;
    universidad_id: number | null;
    name: string;
    description: string | null;
    price: string;
    stock: number;
    status: ProductStatus;
    condition: ProductCondition | null;
    delivery_point: string | null;
    is_available: boolean;
    created_at: string;
    updated_at: string;
    images: ProductImage[];
    category?: ProductCategory | null;
    user?: MarketplaceUser;
    store?: StoreSummary | null;
}

export type OrderStatus = 'pending' | 'delivered' | 'cancelled';

export interface OrderItem {
    id: number;
    product_id: number | null;
    product_name: string;
    unit_price: string;
    quantity: number;
    image_filename: string | null;
    image_url: string | null;
    subtotal: number;
}

export interface Order {
    id: number;
    code: string;
    uuid_cliente: string;
    buyer_id: number;
    seller_id: number;
    store_id: number | null;
    total: string;
    status: OrderStatus;
    meeting_point: string | null;
    meeting_at: string | null;
    note: string | null;
    cancel_reason: string | null;
    cancelled_by: number | null;
    delivered_at: string | null;
    cancelled_at: string | null;
    created_at: string;
    items: OrderItem[];
    buyer?: MarketplaceUser;
    seller?: MarketplaceUser;
    store?: StoreSummary | null;
}

export interface DashboardMetrics {
    delivered_this_month: number;
    delivered_previous_month: number;
    change_percent: number | null;
    pending_orders: number;
    published_products: number;
    delivered_total: number;
}

export interface StoreDashboard {
    store: Store | null;
    metrics: DashboardMetrics;
    recent_orders: Order[];
    low_stock: Product[];
}

/** Lo que el carrito guarda en el dispositivo: snapshot para poder pintar sin red. */
export interface CartItem {
    product_id: number;
    quantity: number;
    name: string;
    price: number;
    image_url: string | null;
    stock: number;
    seller_id: number;
    seller_name: string;
    delivery_point: string | null;
}

/** Diferencias detectadas al revalidar el carrito contra el servidor. */
export interface CartIssue {
    product_id: number;
    type: 'gone' | 'price' | 'stock';
    message: string;
}

export interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
}
