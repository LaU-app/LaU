import { beforeEach, describe, expect, it, vi } from 'vitest'

const { api, AuthService } = vi.hoisted(() => ({
  api: { get: vi.fn(), post: vi.fn() },
  AuthService: { getUser: vi.fn(), isAuthenticated: vi.fn(), logout: vi.fn() },
}))

vi.mock('@/services/api', () => ({ api }))
vi.mock('@/services/auth', () => ({ AuthService }))

type Service = typeof import('@/services/postsService')
let postsService: Service['default']
let normalizeSearchText: Service['normalizeSearchText']
let postMatchesQuery: Service['postMatchesQuery']

function post(id: number, overrides: Record<string, unknown> = {}) {
  return { id, texto: '', user: { id: 50 + id, name: 'Autor', username: 'autor' }, likes: [], ...overrides }
}

// Respuesta paginada tal como la devuelve Laravel en /posts y /posts/filter
function page(posts: unknown[], current = 1, last = 1) {
  return { data: { success: true, data: { data: posts, current_page: current, last_page: last, total: 0, per_page: 20 } } }
}

function httpError(status: number) {
  return Object.assign(new Error(`HTTP ${status}`), { response: { status, data: {} } })
}

// Simula GET /posts?page=N con `pages` páginas; /posts/search responde según `searchResponse`
function mockFeed(pages: unknown[][], searchResponse: () => Promise<unknown> = () => Promise.reject(httpError(404))) {
  api.get.mockImplementation((url: string, config?: { params?: { page?: number } }) => {
    if (url === '/posts/search') return searchResponse()
    const current = config?.params?.page ?? 1
    return Promise.resolve(page(pages[current - 1] ?? [], current, pages.length))
  })
}

const feedCalls = () => api.get.mock.calls.filter(([url]) => url === '/posts')
const searchCalls = () => api.get.mock.calls.filter(([url]) => url === '/posts/search')

beforeEach(async () => {
  vi.resetModules()
  vi.resetAllMocks()
  AuthService.getUser.mockReturnValue({ id: 7 })
  AuthService.isAuthenticated.mockReturnValue(true)
  const mod = await import('@/services/postsService')
  postsService = mod.default
  normalizeSearchText = mod.normalizeSearchText
  postMatchesQuery = mod.postMatchesQuery
})

describe('coincidencias de búsqueda', () => {
  it('ignora tildes y mayúsculas', () => {
    expect(normalizeSearchText('  Cálculo DIFERENCIAL ')).toBe('calculo diferencial')
    expect(postMatchesQuery(post(1, { texto: 'Guía de Cálculo' }), 'calculo')).toBe(true)
    expect(postMatchesQuery(post(1, { texto: 'Guia de calculo' }), 'CÁLCULO')).toBe(true)
  })

  it('exige todas las palabras, aunque estén en campos distintos', () => {
    const p = post(1, { titulo: 'Parcial resuelto', user: { name: 'Ana López', username: 'anita' } })
    expect(postMatchesQuery(p, 'parcial ana')).toBe(true)
    expect(postMatchesQuery(p, 'parcial pedro')).toBe(false)
  })

  it('busca en autor, @usuario, descripción y canción', () => {
    const p = post(1, {
      descripcion: 'apuntes de física',
      user: { name: 'Carlos Pérez', username: 'cperez' },
      itunes_track_name: 'Bohemian Rhapsody',
      itunes_artist_name: 'Queen',
    })
    for (const q of ['perez', 'cperez', 'fisica', 'bohemian', 'queen']) {
      expect(postMatchesQuery(p, q)).toBe(true)
    }
  })

  it('un término vacío no descarta nada', () => {
    expect(postMatchesQuery(post(1), '   ')).toBe(true)
  })
})

describe('postsService.searchPosts', () => {
  it('no hace peticiones si no hay término ni filtros', async () => {
    const result = await postsService.searchPosts('   ')
    expect(result.success).toBe(true)
    expect(result.data).toEqual([])
    expect(api.get).not.toHaveBeenCalled()
    expect(api.post).not.toHaveBeenCalled()
  })

  it('usa GET /posts/search cuando el backend lo tiene, con paginación y user_has_liked', async () => {
    mockFeed([], () => Promise.resolve({
      data: {
        success: true,
        data: { data: [post(1, { texto: 'cálculo', likes: [{ user_id: 7 }] })], current_page: 1, last_page: 3, total: 45 },
      },
    }))

    const result = await postsService.searchPosts(' cálculo ', { universidad_id: 3, carrera_id: null })

    expect(api.get).toHaveBeenCalledWith('/posts/search', { params: { q: 'cálculo', universidad: 3, carrera: undefined, page: 1 } })
    expect(result.success).toBe(true)
    expect(result.scope).toBe('all')
    expect(result.pagination).toEqual({ currentPage: 1, lastPage: 3, hasMorePages: true, total: 45 })
    expect(result.data[0]).toMatchObject({ id: 1, user_has_liked: true, likes_count: 1 })
    expect(feedCalls()).toHaveLength(0)
  })

  it('pide la página indicada al servidor', async () => {
    mockFeed([], () => Promise.resolve({ data: { success: true, data: page([post(21)], 2, 3).data.data } }))

    const result = await postsService.searchPosts('hola', {}, 2)

    expect(searchCalls()[0][1].params.page).toBe(2)
    expect(result.pagination).toMatchObject({ currentPage: 2, hasMorePages: true })
  })

  it('con solo filtros también usa /posts/search si existe', async () => {
    mockFeed([], () => Promise.resolve({ data: { success: true, data: page([post(1)]).data.data } }))

    await postsService.searchPosts('', { universidad_id: 4, carrera_id: 9 })

    expect(searchCalls()[0][1].params).toEqual({ q: undefined, universidad: 4, carrera: 9, page: 1 })
    expect(api.post).not.toHaveBeenCalled()
  })

  it('si falla a mitad del scroll devuelve error en lugar de cambiar a la búsqueda en cliente', async () => {
    mockFeed([[post(1, { texto: 'hola' })]], () => Promise.reject(httpError(500)))

    const result = await postsService.searchPosts('hola', {}, 2)

    expect(result.success).toBe(false)
    expect(feedCalls()).toHaveLength(0)
  })

  it('la búsqueda en cliente no tiene más páginas', async () => {
    mockFeed([[post(1, { texto: 'hola' }), post(2, { texto: 'hola otra vez' })]])

    const first = await postsService.searchPosts('hola')
    expect(first.pagination).toEqual({ currentPage: 1, lastPage: 1, hasMorePages: false, total: 2 })

    api.get.mockClear()
    const second = await postsService.searchPosts('hola', {}, 2)
    expect(second).toMatchObject({ success: true, data: [], pagination: { hasMorePages: false } })
    expect(api.get).not.toHaveBeenCalled()
  })

  it('si /posts/search no existe busca en cliente sobre máx. 5 páginas, sin duplicados', async () => {
    const pages = Array.from({ length: 8 }, (_, i) => [
      post(i * 2 + 1, { texto: `Resumen de cálculo ${i + 1}` }),
      post(i * 2 + 2, { texto: 'Otra cosa' }),
    ])
    // Un post nuevo corrió la paginación: el 1 aparece también en la página 2
    pages[1].push(pages[0][0])
    mockFeed(pages)

    const result = await postsService.searchPosts('calculo')

    expect(result.success).toBe(true)
    expect(result.scope).toBe('recent')
    expect(result.data.map((p: { id: number }) => p.id)).toEqual([1, 3, 5, 7, 9])
    expect(feedCalls().map(([, config]) => config.params.page)).toEqual([1, 2, 3, 4, 5])
  })

  it('recuerda que el endpoint no existe y reutiliza lo descargado', async () => {
    mockFeed([[post(1, { texto: 'álgebra lineal' }), post(2, { texto: 'química' })]])

    await postsService.searchPosts('algebra')
    const second = await postsService.searchPosts('quimica')

    expect(second.data.map((p: { id: number }) => p.id)).toEqual([2])
    expect(searchCalls()).toHaveLength(1)
    expect(feedCalls()).toHaveLength(1)
  })

  it('clearSearchCache obliga a pedir publicaciones nuevas', async () => {
    mockFeed([[post(1, { texto: 'hola' })]])

    await postsService.searchPosts('hola')
    postsService.clearSearchCache()
    await postsService.searchPosts('hola')

    expect(feedCalls()).toHaveLength(2)
  })

  it('sin /posts/search, con solo filtros usa POST /posts/filter y devuelve todo lo filtrado', async () => {
    mockFeed([])
    api.post.mockResolvedValue(page([post(1), post(2)]))

    const result = await postsService.searchPosts('', { universidad_id: 4, carrera_id: 9 })

    expect(api.post).toHaveBeenCalledWith('/posts/filter?page=1', { universidad: 4, carrera: 9 })
    expect(result.scope).toBe('recent')
    expect(result.data).toHaveLength(2)
  })

  it('si falla el feed devuelve el error y no lo deja en caché', async () => {
    api.get.mockImplementation((url: string) =>
      url === '/posts/search' ? Promise.reject(httpError(404)) : Promise.reject(httpError(500)),
    )

    const failed = await postsService.searchPosts('hola')
    expect(failed.success).toBe(false)
    expect(failed.error).toContain('500')

    mockFeed([[post(1, { texto: 'hola' })]])
    const retried = await postsService.searchPosts('hola')
    expect(retried.success).toBe(true)
    expect(retried.data).toHaveLength(1)
  })

  it('un error 500 de /posts/search cae a la búsqueda en cliente sin darlo por inexistente', async () => {
    mockFeed([[post(1, { texto: 'hola' })]], () => Promise.reject(httpError(500)))

    const first = await postsService.searchPosts('hola')
    await postsService.searchPosts('hola')

    expect(first.data).toHaveLength(1)
    expect(searchCalls()).toHaveLength(2)
  })
})
