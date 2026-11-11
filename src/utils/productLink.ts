// Enlaces de productos del Marketplace dentro de mensajes del chat.
// El mensaje viaja como texto plano (Chatify); la app reconoce el enlace y lo muestra como tarjeta.

const PUBLIC_ORIGIN = 'https://lauapp.es'
const PRODUCT_LINK = /(?:https?:\/\/[^\s/]+)?\/tabs\/marketplace\/product\/(\d+)(?:[?#][^\s]*)?/

/** Origen para compartir: el sitio público, salvo en desarrollo web (127.0.0.1) donde se usa el local. */
function shareOrigin(): string {
  if (typeof window === 'undefined') return PUBLIC_ORIGIN
  const { protocol, hostname, origin } = window.location
  // En la app nativa (Capacitor) el origen es http://localhost o capacitor://: no sirve a quien lo recibe.
  if (!/^https?:$/.test(protocol) || hostname === 'localhost') return PUBLIC_ORIGIN
  return origin
}

export function productUrl(productId: number): string {
  return `${shareOrigin()}/tabs/marketplace/product/${productId}`
}

/** Producto citado en un mensaje y el texto restante sin el enlace. */
export function extractProductLink(text: string | null | undefined): { id: number; rest: string } | null {
  if (!text) return null
  const match = text.match(PRODUCT_LINK)
  if (!match) return null
  return { id: Number(match[1]), rest: text.replace(match[0], '').replace(/\n{2,}/g, '\n').trim() }
}
