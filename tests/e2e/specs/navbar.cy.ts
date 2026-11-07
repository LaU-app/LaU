// Menú inferior (TabsPage): cada opción navega con un solo toque, la opción activa
// sale de la ruta y con el modo cristal apagado no hay borde. La API se simula.
const user = { id: 1, name: 'Mateo Prueba', username: 'mateo', email: 'mateo@lau.test', imagen_url: null }

const emptyPage = { success: true, data: { data: [], current_page: 1, last_page: 1, total: 0 }, count: 0 }

function stubApi() {
  cy.intercept('**/api/**', { statusCode: 200, body: emptyPage })
  cy.intercept('GET', '**/api/auth/user', { statusCode: 200, body: { success: true, data: user } })
  cy.intercept('GET', '**/api/chat/unread-count', { statusCode: 200, body: { success: true, count: 3 } })
  cy.intercept('GET', '**/api/banners/active', { statusCode: 200, body: { success: true, data: null } })
  cy.intercept('POST', '**/api/realtime/auth', { statusCode: 403, body: { message: 'e2e' } })
  // Estudio: mismas formas que devuelve la API real (src/types/study.ts)
  const weekly = Array.from({ length: 7 }, (_, i) => ({ date: `2026-10-${String(10 + i).padStart(2, '0')}`, seconds: 0 }))
  cy.intercept('GET', '**/api/pomodoro/stats', { statusCode: 200, body: { success: true, data: { timezone: 'America/El_Salvador', today_seconds: 0, week_seconds: 0, month_seconds: 0, sessions_completed: 0, pomodoros_completed: 0, current_streak: 0, best_streak: 0, daily_average_seconds: 0, streak_minimum_seconds: 1500, weekly } } }).as('stats')
  cy.intercept('GET', '**/api/pomodoro/leaderboard*', { statusCode: 200, body: { success: true, data: { entries: [], me: null, ranking_public: false, available_scopes: ['global'], timezone: 'America/El_Salvador' } } })
  cy.intercept('GET', '**/api/pomodoro/preferences', { statusCode: 200, body: { success: true, data: { focus_minutes: 25, short_break_minutes: 5, long_break_minutes: 15, cycles_before_long_break: 4, ranking_public: false } } })
  cy.intercept('GET', '**/api/pomodoro/active', { statusCode: 200, body: { success: true, data: null } })
  // /chat/contacts y /chat/favorites devuelven un arreglo directo (src/services/chatService.js)
  cy.intercept('GET', '**/api/chat/contacts', { statusCode: 200, body: [] })
  cy.intercept('GET', '**/api/chat/favorites', { statusCode: 200, body: [] })
}

// La app guarda caché de Estudio en IndexedDB (mismo origen que el spec): se limpia entre pruebas
function clearIndexedDb() {
  cy.wrap(null).then(async () => {
    const dbs = await indexedDB.databases()
    await Promise.all(dbs.map(db => new Promise(resolve => {
      const request = indexedDB.deleteDatabase(db.name as string)
      request.onsuccess = request.onerror = request.onblocked = () => resolve(null)
    })))
  })
}

// El stub de /realtime/auth responde 403 a propósito (sin credenciales de Pusher en pruebas)
const EXPECTED_TEST_ERRORS = [/^Pusher Auth Error/]
// Aviso previo y ajeno al menú: PerfilView.vue llama useRouter() a nivel de módulo (fuera de setup)
const EXPECTED_TEST_WARNINGS = [/inject\(\) can only be used inside setup\(\)/]

function open(path: string, { dark = false, glass = false } = {}) {
  stubApi()
  cy.visit(path, {
    onBeforeLoad(win) {
      win.localStorage.setItem('auth_token', 'e2e-token')
      win.localStorage.setItem('user', JSON.stringify(user))
      win.localStorage.setItem('darkMode', String(dark))
      win.localStorage.setItem('lau_glass_mode', String(glass))
      win.localStorage.setItem('has_seen_glass_banner', 'true')
      win.localStorage.setItem('has_asked_notifications', 'true')
      cy.spy(win.console, 'error').as('consoleError')
      cy.spy(win.console, 'warn').as('consoleWarn')
    },
  })
  cy.get('ion-tab-bar.lau-nav').should('be.visible')
}

const nav = () => cy.get('ion-tab-bar.lau-nav')
const button = (label: string) => cy.get(`ion-tab-bar.lau-nav button[aria-label="${label}"]`).filter(':visible')
// Un solo toque: un único click sobre el único botón visible con esa etiqueta
const tap = (label: string) => button(label).should('have.length', 1).click()
// Accesos del AppHeader (ion-button mueve su aria-label al botón interno, así que se buscan por clase)
const headerSelectors = { tasks: 'ion-button:has(svg.header-hourglass)', notifications: 'ion-button.chat-button-wrapper', market: 'ion-button.market-button-wrapper' }
const headerButton = (kind: keyof typeof headerSelectors) => cy.get(headerSelectors[kind]).filter(':visible').should('have.length', 1).click()
// Página visible del outlet de tabs. Cada pantalla se consulta con UN selector completo para que
// Cypress reintente todo (con transiciones instantáneas la página saliente es visible un instante).
const VISIBLE = 'ion-tabs ion-router-outlet > .ion-page:not(.ion-page-hidden):not(.ion-page-invisible)'

const screens: Record<string, () => Cypress.Chainable> = {
  home: () => cy.get(`${VISIBLE} .programmatic-refresher`),
  study: () => cy.get(`${VISIBLE} .study-shell`),
  tasks: () => cy.get(`${VISIBLE}.tasks-page`),
  users: () => cy.contains(`${VISIBLE} ion-title`, 'Miembros de LaU'),
  notifications: () => cy.contains(`${VISIBLE} ion-title`, 'Notificaciones'),
  chat: () => cy.contains(`${VISIBLE} ion-title`, 'Mensajes'),
  create: () => cy.get(`${VISIBLE} ion-segment.segmento-personalizado`),
  profile: () => cy.get(`${VISIBLE} .username-title`),
}

function expectScreen(path: string, screen: keyof typeof screens) {
  cy.location('pathname').should('eq', path)
  screens[screen]().should('exist')
  cy.get(VISIBLE).should('have.length', 1)
}

function expectActive(label: string | null) {
  if (label) button(label).should('have.attr', 'aria-current', 'page')
  cy.get('ion-tab-bar.lau-nav button[aria-current="page"]:visible').should('have.length', label ? 1 : 0)
}

function expectNoNavbarErrors() {
  cy.get('@consoleError').then(spy => {
    const calls = (spy as unknown as sinon.SinonSpy).getCalls().map(c => c.args.map(String).join(' '))
      .filter(message => !EXPECTED_TEST_ERRORS.some(pattern => pattern.test(message)))
    expect(calls, 'console.error').to.deep.equal([])
  })
  cy.get('@consoleWarn').then(spy => {
    const vueWarnings = (spy as unknown as sinon.SinonSpy).getCalls().map(c => c.args.map(String).join(' '))
      .filter(m => m.includes('[Vue warn]') && !EXPECTED_TEST_WARNINGS.some(pattern => pattern.test(m)))
    expect(vueWarnings, 'Vue warnings').to.deep.equal([])
  })
}

describe('Menú inferior', () => {
  beforeEach(() => {
    cy.viewport(390, 844)
    clearIndexedDb()
  })

  it('Pomodoro → Home con un solo toque, y Home → Pomodoro', () => {
    open('/tabs/study?tab=focus')
    expectScreen('/tabs/study', 'study')
    nav().should('have.class', 'module-study')
    expectActive('Enfoque')

    tap('Ir a Inicio')
    expectScreen('/tabs/tab1', 'home')
    nav().should('have.class', 'module-social')
    expectActive('Inicio')

    // Home → Pomodoro (el acceso al módulo está en el header) → Enfoque
    headerButton('tasks')
    expectScreen('/tabs/tasks', 'tasks')
    expectActive('Tareas')
    tap('Enfoque')
    expectScreen('/tabs/study', 'study')
    expectActive('Enfoque')

    // Ida y vuelta repetida: siempre un toque
    for (let i = 0; i < 4; i++) {
      tap('Ir a Inicio')
      expectScreen('/tabs/tab1', 'home')
      headerButton('tasks')
      expectScreen('/tabs/tasks', 'tasks')
      tap('Progreso')
      cy.location('search').should('eq', '?tab=progress')
      expectActive('Progreso')
    }
    expectNoNavbarErrors()
  })

  it('cada opción social navega con un toque y vuelve a Home con un toque', () => {
    open('/tabs/tab1')
    const cases: [string, string, keyof typeof screens][] = [
      ['Miembros de LaU', '/tabs/users', 'users'],
      ['Mensajes', '/tabs/chat', 'chat'],
      ['Mi perfil', '/tabs/perfil/me', 'profile'],
      ['Crear publicación', '/tabs/create-post/foto', 'create'],
    ]
    for (const [label, path, screen] of cases) {
      tap(label)
      expectScreen(path, screen)
      expectActive(label)
      tap('Inicio')
      expectScreen('/tabs/tab1', 'home')
      expectActive('Inicio')
    }
    // Saltos no adyacentes directos
    tap('Mi perfil'); expectScreen('/tabs/perfil/me', 'profile')
    tap('Miembros de LaU'); expectScreen('/tabs/users', 'users')
    tap('Inicio'); expectScreen('/tabs/tab1', 'home')
    expectNoNavbarErrors()
  })

  it('Notificaciones → Home con un toque (el menú es visible en Notificaciones)', () => {
    open('/tabs/tab1')
    headerButton('notifications')
    expectScreen('/tabs/notifications', 'notifications')
    nav().should('be.visible')
    expectActive(null)
    tap('Inicio')
    expectScreen('/tabs/tab1', 'home')
    expectNoNavbarErrors()
  })

  it('opciones de Estudio y Marketplace: un toque cada una y el indicador sigue a la ruta', () => {
    open('/tabs/study')
    const study: [string, string, string, number][] = [
      ['Ranking', '/tabs/study', '?tab=ranking', 3],
      ['Enfoque', '/tabs/study', '?tab=focus', 0],
      ['Progreso', '/tabs/study', '?tab=progress', 2],
      ['Tareas', '/tabs/tasks', '', 1],
    ]
    for (const [label, path, search, index] of study) {
      tap(label)
      cy.location('pathname').should('eq', path)
      cy.location('search').should('eq', search)
      expectActive(label)
      cy.get('.nav-indicator-slot').should('have.attr', 'style').and('include', `--index: ${index}`)
    }

    tap('Ir a Inicio')
    expectScreen('/tabs/tab1', 'home')
    headerButton('market')
    cy.location('pathname').should('eq', '/tabs/marketplace')
    nav().should('have.class', 'module-market')
    expectActive('Explorar Marketplace')
    for (const [label, path] of [['Mi tienda', '/tabs/marketplace/dashboard'], ['Carrito', '/tabs/marketplace/cart'], ['Apartados', '/tabs/marketplace/orders']]) {
      tap(label)
      cy.location('pathname').should('eq', path)
      expectActive(label)
    }
    tap('Ir a Inicio')
    expectScreen('/tabs/tab1', 'home')
  })

  it('toques rápidos seguidos terminan en la pantalla del último toque', () => {
    open('/tabs/tab1')
    tap('Miembros de LaU')
    tap('Mensajes')
    tap('Mi perfil')
    tap('Inicio')
    expectScreen('/tabs/tab1', 'home')
    expectActive('Inicio')
  })

  it('rutas antiguas redirigen a /tabs y el detalle de post oculta el menú', () => {
    open('/study?tab=progress')
    // Esperar la respuesta de Estudio antes del siguiente open(): si sigue en vuelo, el stub genérico
    // recién registrado la respondería con otra forma y StudyProgress fallaría (carrera del test)
    cy.wait('@stats')
    cy.location('pathname').should('eq', '/tabs/study')
    cy.location('search').should('eq', '?tab=progress')
    expectActive('Progreso')

    open('/users')
    expectScreen('/tabs/users', 'users')
    expectActive('Miembros de LaU')

    open('/marketplace/cart')
    cy.location('pathname').should('eq', '/tabs/marketplace/cart')
    expectActive('Carrito')

    open('/tasks/7')
    cy.location('pathname').should('eq', '/tabs/tasks/7')
    expectActive('Tareas')

    stubApi()
    cy.visit('/tabs/post/12')
    nav().should('have.class', 'is-hidden').and('not.be.visible')
  })

  it('Enfoque responde con un toque tras volver (atrás) a /tabs/study sin ?tab', () => {
    open('/tabs/study')
    tap('Progreso')
    cy.location('search').should('eq', '?tab=progress')
    cy.go('back')
    // La pantalla y el menú coinciden: sin ?tab significa Enfoque
    cy.get('.focus-canvas').filter(':visible').should('have.length', 1)
    expectActive('Enfoque')
    tap('Ranking')
    cy.location('search').should('eq', '?tab=ranking')
    tap('Enfoque')
    cy.location('search').should('eq', '?tab=focus')
    cy.get('.focus-canvas').filter(':visible').should('have.length', 1)
  })

  it('en el detalle de post los botones del menú no se pueden enfocar ni activar', () => {
    stubApi()
    cy.visit('/tabs/post/12', { onBeforeLoad(win) { win.localStorage.setItem('auth_token', 'e2e-token'); win.localStorage.setItem('user', JSON.stringify(user)) } })
    cy.get('ion-tab-bar.lau-nav .nav-stage').should('have.attr', 'inert')
    cy.get('ion-tab-bar.lau-nav button').each($b => {
      cy.wrap($b).should($el => expect(getComputedStyle($el[0]).visibility).to.eq('hidden'))
    })
  })

  it('al ir a una ruta fuera de /tabs el menú conserva su estado y un "%" en el perfil no rompe nada', () => {
    open('/tabs/study?tab=ranking')
    nav().should('have.class', 'module-study')
    cy.window().then(win => (win.document.querySelector('#app') as any).__vue_app__.config.globalProperties.$router.push('/settings'))
    cy.location('pathname').should('eq', '/settings')
    nav().should('have.class', 'module-study')
    cy.get('.nav-indicator-slot').should('have.class', 'is-visible')
    cy.go('back')
    cy.location('pathname').should('eq', '/tabs/study')
    expectActive('Ranking')

    cy.window().then(win => (win.document.querySelector('#app') as any).__vue_app__.config.globalProperties.$router.push('/tabs/perfil/100%'))
    cy.location('pathname').should('include', '/tabs/perfil/100')
    nav().should('have.class', 'module-social')
    expectActive(null)
  })

  it('respeta prefers-reduced-motion', () => {
    const emulate = (value: string) => Cypress.automation('remote:debugger:protocol', {
      command: 'Emulation.setEmulatedMedia', params: { features: [{ name: 'prefers-reduced-motion', value }] },
    })
    cy.wrap(null).then(() => emulate('reduce'))
    open('/tabs/tab1')
    cy.get('.nav-indicator-slot').should($el => expect(getComputedStyle($el[0]).transitionDuration).to.eq('0.001s'))
    cy.get('.nav-pill').should($el => expect(getComputedStyle($el[0]).transitionDuration).to.eq('0.001s'))
    tap('Mensajes')
    expectScreen('/tabs/chat', 'chat')
    cy.wrap(null).then(() => emulate(''))
  })

  for (const dark of [false, true]) {
    for (const glass of [false, true]) {
      it(`superficies sin borde extraño (${dark ? 'oscuro' : 'claro'}, cristal ${glass ? 'encendido' : 'apagado'})`, () => {
        open('/tabs/tab1', { dark, glass })
        cy.get('html').should(dark ? 'have.class' : 'not.have.class', 'ion-palette-dark')
        nav().should(glass ? 'have.class' : 'not.have.class', 'is-glass')
        nav().then($bar => {
          const style = getComputedStyle($bar[0])
          expect(style.borderTopWidth, 'borde superior del ion-tab-bar').to.eq('0px')
        })
        cy.get('.nav-pill > .nav-surface, .nav-side.is-shown > .nav-surface').should('have.length', 2).each($surface => {
          const after = getComputedStyle($surface[0], '::after')
          if (glass) expect(after.content, 'destello en cristal').to.eq('""')
          else expect(after.content, 'sin destello con cristal apagado').to.be.oneOf(['none', 'normal'])
          expect(getComputedStyle($surface[0]).borderTopWidth).to.eq('0px')
        })
        cy.wait(500)
        cy.screenshot(`navbar-home-${dark ? 'dark' : 'light'}-${glass ? 'glass' : 'solid'}`, { capture: 'viewport' })
        tap('Mi perfil')
        cy.wait(500)
        cy.screenshot(`navbar-profile-${dark ? 'dark' : 'light'}-${glass ? 'glass' : 'solid'}`, { capture: 'viewport' })
        tap('Inicio')
        headerButton('tasks')
        cy.wait(600)
        cy.screenshot(`navbar-study-${dark ? 'dark' : 'light'}-${glass ? 'glass' : 'solid'}`, { capture: 'viewport' })
      })
    }
  }
})
