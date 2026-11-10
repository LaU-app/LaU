import { api } from './api'
import { toCheckoutError } from './paypalCheckoutService'

// Campus (universidades con su ubicación y área de entrega), ferias y enlaces web de productos.
// En LaU Marketplace todo se entrega dentro de un campus: así no hay encuentros en otras zonas.

export interface Feria {
  id: number
  universidad_id: number
  titulo: string
  descripcion: string | null
  lugar: string | null
  inicia_en: string
  termina_en: string
  latitud: number | null
  longitud: number | null
  en_curso: boolean
  universidad?: { id: number; nombre: string; siglas: string | null } | null
}

export interface Campus {
  id: number
  nombre: string
  siglas: string | null
  color_primario: string | null
  latitud: number | null
  longitud: number | null
  radio_entrega_m: number
  direccion: string | null
  products_count?: number
  stores_count?: number
  ferias?: Feria[]
}

export interface CampusMap {
  campuses: Campus[]
  my_campus_id: number | null
}

export interface ProductWebLinks {
  /** found: hay enlaces · none: no hay · unavailable: sin servicio · no_image: el producto no tiene foto · error */
  status: 'found' | 'none' | 'unavailable' | 'no_image' | 'error'
  links: { title: string; url: string; domain: string }[]
  /** Lo que la foto parece ser, según Google Vision (por ejemplo "casio fx-991la"). */
  best_guess: string | null
  search_url: string
  message: string
}

/** Nombre corto de un campus para chips y etiquetas. */
export const campusLabel = (c: Pick<Campus, 'nombre' | 'siglas'> | null | undefined) => (c ? c.siglas || c.nombre : '')

export const campusService = {
  async map(): Promise<CampusMap> {
    try {
      const { data } = await api.get('/marketplace/campus-map', { timeout: 20000 })
      return data.data
    } catch (error) {
      throw toCheckoutError(error)
    }
  },

  async ferias(universidadId?: number | null): Promise<Feria[]> {
    try {
      const { data } = await api.get('/marketplace/ferias', { params: universidadId ? { universidad_id: universidadId } : {} })
      return data.data
    } catch (error) {
      throw toCheckoutError(error)
    }
  },

  async webLinks(productId: number): Promise<ProductWebLinks> {
    try {
      const { data } = await api.get(`/marketplace/products/${productId}/web-links`, { timeout: 30000 })
      return data.data
    } catch (error) {
      throw toCheckoutError(error)
    }
  },
}

export default campusService
