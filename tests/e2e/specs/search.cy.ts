/// <reference types="cypress" />
// Búsqueda de publicaciones desde el feed, con la API simulada (no necesita backend).
// Con `--env shots=true` guarda capturas de cada estado para revisar el diseño.

const host = 'api.lauapp.es'
const me = { id: 7, name: 'Mateo Canales', username: 'mateo', imagen_url: null }

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3600 * 1000).toISOString()
const author = (id: number, name: string, username: string, universidad_id: number, carrera_id: number) =>
  ({ id, name, username, imagen_url: null, universidad_id, carrera_id })

const ana = author(21, 'Ana López', 'analopez', 1, 10)
const carlos = author(22, 'Carlos Pérez', 'cperez', 2, 20)
const sofia = author(23, 'Sofía Martínez', 'sofi.mtz', 1, 11)

const textPost = (id: number, user: ReturnType<typeof author>, texto: string, hours: number, extra = {}) =>
  ({ id, tipo: 'texto', texto, user, user_id: user.id, created_at: hoursAgo(hours), likes: [], likes_count: 0, comentarios: [], ...extra })

const posts = [
  textPost(101, ana, 'Comparto mi guía de Cálculo Diferencial para el parcial del lunes 📚', 2, { likes_count: 4 }),
  textPost(102, carlos, '¿Alguien tiene los apuntes de Física II? Se los agradecería mucho', 5, { likes_count: 1 }),
  // Con imagen: en PostCard solo las publicaciones con medio muestran el botón de like
  textPost(103, sofia, 'Tutoría gratis de cálculo integral este viernes en la biblioteca', 26, {
    tipo: 'imagen', imagen_url: `https://${host}/uploads/e2e-tutoria.svg`, likes: [{ user_id: 7 }], likes_count: 9,
  }),
  textPost(104, carlos, 'Se viene la feria de empleo, ¡preparen sus CV!', 50),
]

const paginated = (data: unknown[]) =>
  ({ success: true, data: { data, current_page: 1, last_page: 1, total: data.length, per_page: 20 } })

function stubApi() {
  // Lo que no se simula abajo responde vacío (Cypress usa el último intercept que coincide)
  cy.intercept({ hostname: host }, { success: true, data: [] })
  cy.intercept({ hostname: host, pathname: '/api/auth/user' }, { success: true, data: me })
  cy.intercept({ hostname: host, pathname: '/api/notifications/count' }, { success: true, count: 0 })
  cy.intercept({ hostname: host, pathname: '/api/banners/active' }, { success: true, data: null })
  cy.intercept({ hostname: host, pathname: '/api/polls' }, paginated([]))
  cy.intercept({ method: 'GET', hostname: host, pathname: '/api/posts' }, paginated(posts)).as('feed')
  // El backend aún no tiene /posts/search: cae en /posts/{post} y responde 404
  cy.intercept({ method: 'GET', hostname: host, pathname: '/api/posts/search' }, { statusCode: 404, body: { message: 'Not found' } }).as('searchEndpoint')
  cy.intercept({ method: 'POST', hostname: host, pathname: '/api/posts/filter' }, (req) => {
    const { universidad, carrera } = req.body
    req.reply(paginated(posts.filter((p) =>
      (!universidad || p.user.universidad_id === universidad) && (!carrera || p.user.carrera_id === carrera))))
  }).as('filter')
  cy.intercept({ hostname: host, pathname: '/api/universidades' }, {
    success: true,
    data: [{ id: 1, nombre: 'Universidad Centroamericana José Simeón Cañas' }, { id: 2, nombre: 'Universidad de El Salvador' }],
  })
  cy.intercept({ hostname: host, pathname: '/api/universidades/1/carreras' }, {
    success: true,
    data: [{ id: 10, nombre: 'Ingeniería Informática' }, { id: 11, nombre: 'Arquitectura' }],
  })
  cy.intercept({ hostname: host, pathname: '/uploads/e2e-tutoria.svg' }, {
    headers: { 'content-type': 'image/svg+xml' },
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><defs><linearGradient id="g" x2="1" y2="1">'
      + '<stop offset="0" stop-color="#8a2be2"/><stop offset="1" stop-color="#3b82f6"/></linearGradient></defs>'
      + '<rect width="800" height="500" fill="url(#g)"/><text x="400" y="270" font-family="sans-serif" font-size="56" '
      + 'fill="#fff" text-anchor="middle">Tutoría de cálculo</text></svg>',
  })
  cy.intercept({ method: 'POST', hostname: host, pathname: '/api/posts/103/like' },
    { success: true, data: { user_has_liked: false, likes_count: 8 } }).as('like')
}

function visitHome(dark = false) {
  stubApi()
  cy.visit('/tabs/tab1', {
    onBeforeLoad(win) {
      win.localStorage.setItem('auth_token', 'e2e-token')
      win.localStorage.setItem('user', JSON.stringify(me))
      win.localStorage.setItem('darkMode', String(dark))
      win.localStorage.setItem('has_seen_glass_banner', 'true')
      win.localStorage.setItem('has_asked_notifications', 'true')
    },
  })
  cy.wait('@feed')
  cy.contains('Comparto mi guía').should('be.visible')
}

function openSearch() {
  cy.get('.search-header-btn').filter(':visible').click()
  cy.get('.search-modal ion-searchbar').should('be.visible')
}

function shot(name: string) {
  if (!Cypress.env('shots')) return
  cy.wait(450, { log: false })
  cy.screenshot(name, { capture: 'viewport' })
}

const searchInput = () => cy.get('.search-modal ion-searchbar input')
const resultCards = () => cy.get('.search-modal .results-list .post-wrapper')
const resultsCount = () => cy.get('.search-modal .results-count')
// Ionic pasa el aria-label al elemento interno, así que se ubican por posición
const universidadSelect = () => cy.get('.search-modal .filter-select').eq(0)
const carreraSelect = () => cy.get('.search-modal .filter-select').eq(1)

describe('Búsqueda de publicaciones', () => {
  beforeEach(() => cy.viewport(390, 844))

  it('el feed ya no muestra la barra de filtro y el header trae el buscador', () => {
    visitHome()
    cy.get('.filters, .apply-filters-btn').should('not.exist')
    cy.contains('Filtrar').should('not.exist')
    cy.get('.search-header-btn').filter(':visible').should('have.length', 1)
    shot('search-01-feed')
  })

  it('busca sin tildes, por autor, guarda recientes y cierra al abrir un post', () => {
    visitHome()
    openSearch()
    cy.contains('.search-modal', 'Encuentra lo que buscas')
    shot('search-02-idle')

    searchInput().type('calculo')
    cy.wait('@searchEndpoint')
    resultsCount().should('have.text', '2 resultados')
    resultCards().should('have.length', 2)
    cy.get('.search-modal .results-list').should('contain', 'Cálculo Diferencial').and('contain', 'cálculo integral')
    cy.get('.search-modal .results-scope').should('contain', 'recientes')
    shot('search-03-results')

    // Por @usuario; ya sabe que /posts/search no existe y no lo vuelve a pedir
    searchInput().clear().type('cperez{enter}')
    resultsCount().should('have.text', '2 resultados')
    cy.get('@searchEndpoint.all').should('have.length', 1)

    // Lo confirmado con Enter queda en recientes
    searchInput().clear()
    cy.get('.search-modal .recent-text').first().should('have.text', 'cperez')
    shot('search-04-recent')

    searchInput().type('química orgánica')
    cy.contains('.search-modal .message-title', 'Sin resultados')
    cy.get('.search-modal').should('contain', '“química orgánica”')
    shot('search-05-empty')

    // El like desde la búsqueda usa el valor del servidor
    searchInput().clear().type('tutoria')
    resultCards().should('have.length', 1)
    resultCards().first().find('.action-btn-custom').first().click()
    cy.wait('@like')
    resultCards().first().find('.action-count').first().should('have.text', '8')

    shot('search-06-like')

    // Abrir el post (tocando el texto; la imagen abre el visor) cierra el buscador
    resultCards().first().find('.post-caption-bubble').click()
    cy.location('pathname').should('eq', '/tabs/post/103')
    cy.get('.search-modal').should('not.be.visible')
  })

  it('filtra por universidad y carrera dentro del buscador', () => {
    visitHome()
    openSearch()

    carreraSelect().should('have.prop', 'disabled', true)
    universidadSelect().click()
    cy.get('ion-action-sheet').contains('button', 'Universidad Centroamericana').click()
    cy.wait('@filter').its('request.body').should('deep.equal', { universidad: 1, carrera: null })
    resultsCount().should('have.text', '2 resultados')

    carreraSelect().should('have.prop', 'disabled', false).click()
    cy.get('ion-action-sheet').contains('button', 'Arquitectura').click()
    cy.wait('@filter').its('request.body').should('deep.equal', { universidad: 1, carrera: 11 })
    resultsCount().should('have.text', '1 resultado')
    shot('search-07-filters')

    // Texto + filtros
    searchInput().type('parcial')
    cy.contains('.search-modal', 'con estos filtros')
    shot('search-08-empty-filtered')

    cy.contains('.search-modal ion-button', 'Quitar filtros').click()
    resultsCount().should('have.text', '1 resultado')
    cy.get('.search-modal .results-list').should('contain', 'Cálculo Diferencial')
    cy.get('.search-modal .filter-clear').should('not.exist')
  })

  it('con el endpoint del backend busca en todo el historial y carga más al hacer scroll', () => {
    visitHome()
    // Sustituye el 404: ahora el backend sí tiene /posts/search (25 resultados, 20 por página)
    const matches = Array.from({ length: 25 }, (_, i) =>
      textPost(500 + i, i % 2 ? ana : sofia, `Repaso de álgebra lineal, parte ${i + 1}`, 24 * (i + 3)))
    cy.intercept({ method: 'GET', hostname: host, pathname: '/api/posts/search' }, (req) => {
      const page = Number(req.query.page || 1)
      const data = matches.slice((page - 1) * 20, page * 20)
      req.reply({ success: true, data: { data, current_page: page, last_page: 2, total: matches.length, per_page: 20 } })
    }).as('serverSearch')

    openSearch()
    searchInput().type('algebra')
    cy.wait('@serverSearch').its('request.query').should('include', { q: 'algebra', page: '1' })
    resultsCount().should('have.text', '25 resultados')
    cy.get('.search-modal .results-scope').should('not.exist')
    resultCards().should('have.length', 20)
    shot('search-11-server-results')

    cy.get('.search-modal ion-content').then((el) => (el[0] as any).scrollToBottom(0))
    cy.wait('@serverSearch').its('request.query.page').should('eq', '2')
    resultCards().should('have.length', 25)
    cy.get('.search-modal ion-infinite-scroll').should('not.exist')
  })

  it('respeta el modo oscuro', () => {
    visitHome(true)
    cy.get('html').should('have.class', 'ion-palette-dark')
    openSearch()
    cy.get('.search-modal .search-header').should('have.css', 'background-color', 'rgb(30, 30, 30)')
    shot('search-09-dark-idle')

    searchInput().type('calculo')
    resultsCount().should('have.text', '2 resultados')
    shot('search-10-dark-results')
  })
})
