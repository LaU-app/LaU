import { beforeAll, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { distanceMeters, isInsideCampus, nearestCampus, formatDistance } from '@/utils/campusGeo'

vi.mock('@/services/api', () => ({ api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }))
vi.mock('@ionic/vue', () => ({ IonIcon: { template: '<i/>' } }))

// Ciudad Universitaria (UES) y la UCA, con sus áreas de entrega.
const ues = { id: 1, latitud: 13.7186, longitud: -89.2030, radio_entrega_m: 800 }
const uca = { id: 2, latitud: 13.6797, longitud: -89.2360, radio_entrega_m: 600 }

describe('ubicación de campus', () => {
  it('calcula distancias reales entre puntos', () => {
    // UES ↔ UCA: unos 5.6 km en línea recta.
    const km = distanceMeters({ lat: ues.latitud, lng: ues.longitud }, { lat: uca.latitud, lng: uca.longitud }) / 1000
    expect(km).toBeGreaterThan(5)
    expect(km).toBeLessThan(6.5)
  })

  it('sabe si un punto está dentro del área de entrega', () => {
    expect(isInsideCampus(ues, { lat: 13.7190, lng: -89.2025 })).toBe(true)
    expect(isInsideCampus(ues, { lat: 13.6989, lng: -89.1914 })).toBe(false)
    expect(isInsideCampus({ id: 3, latitud: null, longitud: null, radio_entrega_m: 600 }, { lat: 13.7, lng: -89.2 })).toBe(false)
  })

  it('encuentra el campus más cercano y si estás dentro', () => {
    const inside = nearestCampus([ues, uca], { lat: 13.6800, lng: -89.2355 })
    expect(inside?.campus.id).toBe(2)
    expect(inside?.inside).toBe(true)

    const outside = nearestCampus([ues, uca], { lat: 13.6989, lng: -89.1914 })
    expect(outside?.campus.id).toBe(1)
    expect(outside?.inside).toBe(false)
    expect(formatDistance(outside!.meters)).toMatch(/km$/)
  })
})

beforeAll(async () => { await import('@/components/marketplace/AgentCards.vue') }, 60000)

describe('producto en la web (chat)', () => {
  it('muestra los enlaces que encontró por la foto, o aclara que no hay', async () => {
    const { default: AgentCards } = await import('@/components/marketplace/AgentCards.vue')
    const found = mount(AgentCards, { props: { cards: [{
      type: 'links', product: { id: 7, name: 'Calculadora' }, status: 'found', best_guess: 'casio fx-991la',
      links: [{ title: 'Calculadora Casio fx-991LA', url: 'https://tienda.example.com/casio', domain: 'tienda.example.com' }],
      search_url: 'https://www.google.com/search?q=Calculadora', message: '',
    }] } })
    expect(found.text()).toContain('Calculadora en la web')
    expect(found.text()).toContain('tienda.example.com')
    expect(found.find('a.web-link').attributes('href')).toBe('https://tienda.example.com/casio')

    const none = mount(AgentCards, { props: { cards: [{
      type: 'links', product: { id: 7, name: 'Calculadora' }, status: 'none', best_guess: null, links: [],
      search_url: 'https://www.google.com/search?q=Calculadora', message: 'No encontramos este producto en otros sitios.',
    }] } })
    expect(none.text()).toContain('No encontramos este producto en otros sitios.')
    expect(none.text()).toContain('Buscar en Google')
  })
})
