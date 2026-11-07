// Marketplace móvil: el FAB "+" queda por encima del menú inferior y el formulario de
// publicar/editar se abre como hoja inferior (diálogo en pantallas grandes). API simulada.
const me = { id: 1, name: 'Mateo Prueba', username: 'mateo', email: 'mateo@lau.test', imagen_url: null }
const categories = [
  { id: 1, name: 'Libros', slug: 'libros', description: null, icon: 'book', sort_order: 1, is_active: true },
  { id: 2, name: 'Tecnología', slug: 'tecnologia', description: null, icon: 'laptop', sort_order: 2, is_active: true },
  { id: 3, name: 'Herramientas', slug: 'herramientas', description: null, icon: 'construct', sort_order: 3, is_active: true },
  { id: 4, name: 'Ropa', slug: 'ropa', description: null, icon: 'shirt', sort_order: 4, is_active: true },
]
const image = (filename: string, position = 0) => ({ id: position + 1, filename, position, url: '/LaU.png' })
const product = (id: number, extra: Record<string, unknown> = {}) => ({
  id, user_id: 99, store_id: null, category_id: 1, universidad_id: 1, name: `Producto ${id}`, description: 'Buen estado',
  price: '10.00', stock: 2, status: 'active', condition: 'buen_estado', delivery_point: 'Cafetería', is_available: true,
  created_at: '2026-11-01T10:00:00Z', updated_at: '2026-11-01T10:00:00Z', images: [image(`p${id}.webp`)],
  category: categories[0], user: { id: 99, name: 'Ana López', username: 'ana' }, ...extra,
})
const mine = product(5, { user_id: 1, name: 'Calculadora TI-84', price: '40.00', images: [image('p5a.webp', 0), image('p5b.webp', 1)] })
const list = Array.from({ length: 9 }, (_, i) => product(i + 10))

function stubApi() {
  cy.intercept('**/api/**', { statusCode: 200, body: { success: true, data: { data: [], current_page: 1, last_page: 1, total: 0 }, count: 0 } })
  cy.intercept('GET', '**/api/auth/user', { body: { success: true, data: me } })
  cy.intercept('GET', '**/api/chat/unread-count', { body: { success: true, count: 0 } })
  cy.intercept('GET', '**/api/banners/active', { body: { success: true, data: null } })
  cy.intercept('POST', '**/api/realtime/auth', { statusCode: 403, body: { message: 'e2e' } })
  cy.intercept('GET', '**/api/marketplace/categories', { body: { success: true, data: categories } })
  cy.intercept('GET', /\/api\/marketplace\/products(\?.*)?$/, { body: { success: true, data: { data: list, current_page: 1, last_page: 1, total: list.length } } }).as('products')
  cy.intercept('GET', '**/api/marketplace/products/5', { body: { success: true, data: mine } }).as('product5')
}

function open(path: string, { dark = false, glass = false } = {}) {
  stubApi()
  cy.visit(path, {
    onBeforeLoad(win) {
      win.localStorage.setItem('auth_token', 'e2e-token')
      win.localStorage.setItem('user', JSON.stringify(me))
      win.localStorage.setItem('darkMode', String(dark))
      win.localStorage.setItem('lau_glass_mode', String(glass))
      win.localStorage.setItem('has_seen_glass_banner', 'true')
      win.localStorage.setItem('has_asked_notifications', 'true')
      cy.spy(win.console, 'error').as('consoleError')
      cy.spy(win.console, 'warn').as('consoleWarn')
      // "Buscar archivo" crea un <input type=file> y le hace click: se responde con una imagen generada
      cy.stub(win.HTMLInputElement.prototype, 'click').callsFake(function (this: HTMLInputElement) {
        if (this.type !== 'file') return
        const canvas = win.document.createElement('canvas')
        canvas.width = canvas.height = 96
        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
        ctx.fillStyle = ['#7b32d9', '#2853e0', '#76d26b', '#f97316'][(win as any).__photo = ((win as any).__photo ?? -1) + 1] ?? '#141416'
        ctx.fillRect(0, 0, 96, 96)
        canvas.toBlob(blob => {
          const transfer = new win.DataTransfer()
          transfer.items.add(new win.File([blob as Blob], 'foto.png', { type: 'image/png' }))
          this.files = transfer.files
          ;(this.onchange as any)?.(new win.Event('change'))
        }, 'image/png')
      })
    },
  })
}

const EXPECTED_TEST_ERRORS = [/^Pusher Auth Error/] // el stub de /realtime/auth responde 403 a propósito

function expectNoConsoleErrors() {
  cy.get('@consoleError').then(spy => {
    const calls = (spy as unknown as sinon.SinonSpy).getCalls().map(c => c.args.map(String).join(' '))
      .filter(message => !EXPECTED_TEST_ERRORS.some(pattern => pattern.test(message)))
    expect(calls, 'console.error').to.deep.equal([])
  })
  cy.get('@consoleWarn').then(spy => {
    const warnings = (spy as unknown as sinon.SinonSpy).getCalls().map(c => c.args.map(String).join(' ')).filter(m => m.includes('[Vue warn]'))
    expect(warnings, 'Vue warnings').to.deep.equal([])
  })
}

const fab = () => cy.get('ion-fab.market-fab ion-fab-button').filter(':visible').should('have.length', 1)
const sheet = () => cy.get('ion-modal.lau-sheet-modal').should('have.length', 1)
const inSheet = (selector: string) => sheet().find(selector)
// Ionic deja .modal-wrapper con opacity 0.01 en md: la animación debe terminar en 1 y sin desplazamiento
const expectSheetOpaque = () => sheet().should($m => {
  const style = getComputedStyle(($m[0].shadowRoot as ShadowRoot).querySelector('.modal-wrapper') as Element)
  expect(style.opacity, 'hoja opaca').to.eq('1')
  expect(['none', 'matrix(1, 0, 0, 1, 0, 0)'], 'sin desplazamiento residual').to.include(style.transform)
})
const overlayButton = (overlay: string, text: string) => cy.get(overlay, { includeShadowDom: true }).contains('button', text, { includeShadowDom: true })

function expectFabAboveNav() {
  fab().then($fab => {
    const box = $fab[0].getBoundingClientRect()
    cy.get('ion-tab-bar.lau-nav').then($nav => {
      const nav = $nav[0].getBoundingClientRect()
      const doc = $fab[0].ownerDocument
      expect(box.bottom, 'FAB por encima del menú').to.be.at.most(nav.top - 8)
      expect(box.top, 'dentro de la pantalla').to.be.at.least(0)
      expect(box.right, 'dentro de la pantalla').to.be.at.most(doc.documentElement.clientWidth)
      expect(box.width, 'zona táctil').to.be.at.least(44)
      expect(box.height, 'zona táctil').to.be.at.least(44)
      const hit = doc.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
      expect(hit === $fab[0] || $fab[0].contains(hit), 'nada tapa el FAB').to.equal(true)
    })
  })
}

function expectLastCardClear() {
  cy.get('.marketplace-page ion-content').filter(':visible').then($c => (($c[0] as any).scrollToBottom(0)))
  cy.wait(250)
  cy.get('.product-card').filter(':visible').last().then($card => {
    const card = $card[0].getBoundingClientRect()
    fab().then($fab => {
      const box = $fab[0].getBoundingClientRect()
      expect(card.bottom, 'la última tarjeta termina por encima del FAB').to.be.at.most(box.top - 8)
    })
  })
}

function addPhoto(fromEmpty: boolean) {
  inSheet(fromEmpty ? 'button.photo-empty' : 'button.photo-add').click()
  overlayButton('ion-action-sheet', 'Agregar desde un archivo').click()
}

function fillStep1() {
  addPhoto(true)
  inSheet('.photo-tile.cover img').should('be.visible')
  inSheet('input[maxlength="120"]').first().type('Juego de herramientas')
  inSheet('input[type="number"]').type('15.50')
  inSheet('.category-chips button').contains('Herramientas').click()
}

describe('Marketplace móvil', () => {
  beforeEach(() => cy.viewport(390, 844))

  for (const [width, height] of [[360, 800], [390, 844], [844, 390], [1024, 768]]) {
    for (const dark of [false, true]) {
      for (const glass of [false, true]) {
        it(`FAB visible sobre el menú ${width}×${height} (${dark ? 'oscuro' : 'claro'}, cristal ${glass ? 'sí' : 'no'})`, () => {
          cy.viewport(width, height)
          open('/tabs/marketplace', { dark, glass })
          cy.get('.product-card').should('have.length', list.length)
          expectFabAboveNav()
          expectLastCardClear()
          expectFabAboveNav()
          if (width === 390 && !glass) cy.screenshot(`market-fab-${dark ? 'dark' : 'light'}`, { capture: 'viewport' })
        })
      }
    }
  }

  it('con el menú oculto por el teclado el FAB baja y sigue visible', () => {
    open('/tabs/marketplace')
    fab()
    cy.get('ion-tab-bar.lau-nav').then($nav => $nav[0].classList.add('tab-bar-hidden'))
    fab().should($fab => {
      const box = $fab[0].getBoundingClientRect()
      const page = $fab[0].closest('ion-content')!.getBoundingClientRect()
      expect(page.bottom - box.bottom).to.be.closeTo(16, 2)
    })
  })

  it('un toque en el FAB abre la hoja inferior (no pantalla completa) con el foco en el título', () => {
    open('/tabs/marketplace')
    fab().click()
    sheet().should('be.visible')
    expectSheetOpaque()
    sheet().then($m => {
      const wrapper = ($m[0].shadowRoot as ShadowRoot).querySelector('.modal-wrapper')!.getBoundingClientRect()
      const vh = $m[0].ownerDocument.documentElement.clientHeight
      expect(wrapper.bottom, 'pegada al borde inferior').to.be.closeTo(vh, 1)
      expect(wrapper.top, 'no ocupa toda la pantalla').to.be.greaterThan(40)
      expect(wrapper.height).to.be.at.most(vh * 0.9 + 1)
      expect(getComputedStyle($m[0].shadowRoot!.querySelector('.modal-wrapper')!).borderTopLeftRadius).to.eq('28px')
    })
    cy.focused().should('have.id', 'product-form-title')
    inSheet('.sheet-steps button[aria-current="step"]').should('contain.text', 'Fotos y datos')
    // El selector de fotos ya no se come la primera pantalla
    inSheet('.photo-picker').should($p => expect($p[0].getBoundingClientRect().height).to.be.lessThan(140))
    inSheet('.sheet-foot .study-button').should('be.visible').and('be.disabled')
    inSheet('.publish-hint').should('contain.text', 'una foto, el título, el precio y la categoría')
    cy.screenshot('market-sheet-step1-empty', { capture: 'viewport' })
    expectNoConsoleErrors()
  })

  it('en pantallas grandes se muestra como diálogo centrado con ancho máximo', () => {
    cy.viewport(1280, 900)
    open('/tabs/marketplace')
    fab().click()
    expectSheetOpaque()
    sheet().then($m => {
      const wrapper = ($m[0].shadowRoot as ShadowRoot).querySelector('.modal-wrapper')!.getBoundingClientRect()
      const doc = $m[0].ownerDocument.documentElement
      expect(wrapper.width).to.be.at.most(560)
      expect(wrapper.left + wrapper.width / 2).to.be.closeTo(doc.clientWidth / 2, 2)
      expect(wrapper.top).to.be.greaterThan(0)
      expect(wrapper.bottom).to.be.lessThan(doc.clientHeight)
    })
    cy.screenshot('market-dialog-large', { capture: 'viewport' })
  })

  it('crea un producto en dos pasos sin perder datos y publica con un solo envío', () => {
    let uploads = 0
    open('/tabs/marketplace')
    // Después de open(): los intercepts definidos al final tienen prioridad sobre el genérico
    cy.intercept('POST', '**/api/marketplace/images', req => { uploads++; req.reply({ body: { success: true, data: { filename: `nueva-${uploads}.webp`, url: '/LaU.png' } } }) }).as('upload')
    cy.intercept('POST', /\/api\/marketplace\/products$/, req => req.reply({ statusCode: 201, delay: 500, body: { success: true, data: product(50) } })).as('create')
    cy.wait('@products')
    fab().click()
    fillStep1()
    addPhoto(false)
    inSheet('.photo-tile-main').should('have.length', 2)
    inSheet('.photo-hint').should('contain.text', '2 de 6')
    // Usar la segunda como portada y luego quitar una
    inSheet('.photo-tile').eq(1).find('.photo-tile-main').click()
    overlayButton('ion-action-sheet', 'Usar como portada').click()
    addPhoto(false)
    inSheet('.photo-tile-main').should('have.length', 3)
    inSheet('.photo-tile').eq(2).find('.photo-tile-main').click()
    overlayButton('ion-action-sheet', 'Quitar foto').click()
    inSheet('.photo-tile-main').should('have.length', 2)
    cy.screenshot('market-sheet-step1-filled', { capture: 'viewport' })

    inSheet('.sheet-foot .study-button').should('be.enabled').click()
    inSheet('.sheet-steps button[aria-current="step"]').should('contain.text', 'Detalles')
    inSheet('.quick-chips button').contains('Cafetería').click()
    inSheet('button[aria-label="Añadir una unidad"]').click()
    inSheet('textarea').type('Completo, con estuche.')
    cy.screenshot('market-sheet-step2', { capture: 'viewport' })

    // Volver no pierde nada
    inSheet('.sheet-back').click()
    inSheet('input[maxlength="120"]').first().should('have.value', 'Juego de herramientas')
    inSheet('.photo-tile-main').should('have.length', 2)
    inSheet('.sheet-foot .study-button').click()
    inSheet('textarea').should('have.value', 'Completo, con estuche.')

    // Doble toque en Publicar: un solo envío
    inSheet('.sheet-foot .study-button').contains('Publicar').then($btn => { $btn[0].click(); $btn[0].click() })
    inSheet('.sheet-foot .study-button').should('be.disabled').and('have.attr', 'aria-busy', 'true')
    cy.wait('@create').its('request.body').then(body => {
      expect(body).to.include({ name: 'Juego de herramientas', price: 15.5, stock: 2, category_id: 3, delivery_point: 'Cafetería', description: 'Completo, con estuche.' })
      expect(body.images).to.have.length(2)
      expect(body.images.every((name: string) => /^nueva-\d\.webp$/.test(name))).to.equal(true)
    })
    cy.get('ion-modal.lau-sheet-modal').should('not.exist')
    cy.get('@create.all').should('have.length', 1)
    cy.get('@products.all').should('have.length.at.least', 2) // el listado se recarga
    expectNoConsoleErrors()
  })

  it('un error de subida se muestra junto al botón y el formulario sigue abierto', () => {
    open('/tabs/marketplace')
    cy.intercept('POST', '**/api/marketplace/images', { statusCode: 500, body: { success: false, message: 'El servidor no aceptó la imagen.' } }).as('upload')
    fab().click()
    fillStep1()
    inSheet('.sheet-foot .study-button').click()
    inSheet('.sheet-foot .study-button').contains('Publicar').click()
    cy.wait('@upload')
    inSheet('.sheet-foot .sheet-error[role="alert"]').should('be.visible')
    sheet().should('be.visible')
    inSheet('.sheet-foot .study-button').should('be.enabled').and('contain.text', 'Publicar')
  })

  it('cerrar con cambios pide confirmación; sin cambios cierra directo', () => {
    open('/tabs/marketplace')
    fab().click()
    inSheet('.sheet-close').click()
    cy.get('ion-modal.lau-sheet-modal').should('not.exist')
    cy.get('ion-alert').should('not.exist')

    fab().click()
    inSheet('input[maxlength="120"]').first().type('Libro de cálculo')
    inSheet('.sheet-close').click()
    overlayButton('ion-alert', 'Seguir editando').click()
    inSheet('input[maxlength="120"]').first().should('have.value', 'Libro de cálculo')
    inSheet('.sheet-close').click()
    overlayButton('ion-alert', 'Descartar').click()
    cy.get('ion-modal.lau-sheet-modal').should('not.exist')
  })

  it('editar usa la misma hoja, carga las fotos actuales y solo envía imágenes si cambiaron', () => {
    open('/tabs/marketplace/product/5')
    cy.intercept('PUT', '**/api/marketplace/products/5', req => req.reply({ body: { success: true, data: { ...mine, ...req.body } } })).as('update')
    cy.wait('@product5')
    cy.get('button[aria-label="Editar producto"]').filter(':visible').click()
    sheet().should('be.visible')
    expectSheetOpaque()
    inSheet('#product-form-title').should('have.text', 'Editar producto')
    inSheet('input[maxlength="120"]').first().should('have.value', 'Calculadora TI-84')
    inSheet('.photo-tile .photo-tile-main').should('have.length', 2)
    inSheet('.photo-tile.cover .photo-cover').should('contain.text', 'PORTADA')
    inSheet('input[type="number"]').clear().type('35')
    inSheet('.sheet-foot .study-button').click()
    inSheet('.sheet-foot .study-button').contains('Guardar cambios').click()
    cy.wait('@update').its('request.body').then(body => {
      expect(body.price).to.eq(35)
      expect(body).not.to.have.property('images')
    })
    cy.get('ion-modal.lau-sheet-modal').should('not.exist')

    // Cambiar la portada sí envía el nuevo orden con los mismos archivos
    cy.get('button[aria-label="Editar producto"]').filter(':visible').click()
    inSheet('.photo-tile').eq(1).find('.photo-tile-main').click()
    overlayButton('ion-action-sheet', 'Usar como portada').click()
    inSheet('.sheet-foot .study-button').click()
    inSheet('.sheet-foot .study-button').contains('Guardar cambios').click()
    cy.wait('@update').its('request.body.images').should('deep.equal', ['p5b.webp', 'p5a.webp'])
    expectNoConsoleErrors()
  })

  it('tema oscuro y pantalla de 360 px: el formulario entra y el pie queda visible', () => {
    cy.viewport(360, 800)
    open('/tabs/marketplace', { dark: true })
    fab().click()
    cy.wait(600)
    fillStep1()
    inSheet('.sheet-foot').should($foot => {
      const foot = $foot[0].getBoundingClientRect()
      expect(foot.bottom).to.be.at.most($foot[0].ownerDocument.documentElement.clientHeight + 1)
    })
    cy.screenshot('market-sheet-dark-360', { capture: 'viewport' })
  })

  it('respeta prefers-reduced-motion', () => {
    const emulate = (value: string) => Cypress.automation('remote:debugger:protocol', {
      command: 'Emulation.setEmulatedMedia', params: { features: [{ name: 'prefers-reduced-motion', value }] },
    })
    cy.wrap(null).then(() => emulate('reduce'))
    open('/tabs/marketplace')
    fab().should($b => expect(getComputedStyle($b[0]).transitionDuration).to.eq('0s'))
    fab().click()
    expectSheetOpaque()
    inSheet('.sheet-step').filter(':visible').should($s => expect(getComputedStyle($s[0]).animationName).to.eq('none'))
    cy.wrap(null).then(() => emulate(''))
  })
})
