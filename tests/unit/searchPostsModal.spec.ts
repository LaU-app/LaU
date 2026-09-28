import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'

const { postsService, UniversidadService, route, router } = vi.hoisted(() => ({
  postsService: { searchPosts: vi.fn(), likePost: vi.fn(), clearSearchCache: vi.fn() },
  UniversidadService: { getUniversidades: vi.fn(), getCarreras: vi.fn() },
  route: { fullPath: '/tabs/tab1' },
  router: { push: vi.fn() },
}))

vi.mock('@/services/postsService', () => ({ default: postsService }))
vi.mock('@/services/universidad', () => ({ UniversidadService }))
vi.mock('@/services/auth', () => ({ AuthService: { getUser: () => ({ id: 7 }) } }))
vi.mock('vue-router', async () => {
  const { reactive } = await import('vue')
  const reactiveRoute = reactive(route)
  return { useRoute: () => reactiveRoute, useRouter: () => router, __route: reactiveRoute }
})

// PostCard real arrastra reproductor, visor, etc.; aquí basta con sus eventos
vi.mock('@/components/PostCard.vue', async () => {
  const { defineComponent, h } = await import('vue')
  return {
    default: defineComponent({
      name: 'PostCard',
      props: { post: { type: Object, required: true } },
      emits: ['like', 'comment', 'share', 'imageError'],
      setup(props) {
        return () => h('article', { class: 'post-card-stub' }, `${props.post.texto} · ${props.post.likes_count} · ${props.post.user_has_liked}`)
      },
    }),
  }
})

// Los web components de Ionic no corren en jsdom: se reemplazan por equivalentes simples
vi.mock('@ionic/vue', async () => {
  const { defineComponent, h } = await import('vue')
  const passthrough = (tag: string) =>
    defineComponent({ name: tag, setup: (_, { slots }) => () => h('div', { 'data-stub': tag }, slots.default?.()) })

  return {
    IonModal: defineComponent({
      name: 'IonModal',
      props: { isOpen: Boolean },
      emits: ['willPresent', 'didPresent', 'didDismiss'],
      setup: (props, { slots }) => () => (props.isOpen ? h('div', { 'data-stub': 'ion-modal' }, slots.default?.()) : null),
    }),
    IonSearchbar: defineComponent({
      name: 'IonSearchbar',
      props: { modelValue: String },
      emits: ['update:modelValue', 'ionInput', 'ionChange', 'ionCancel'],
      setup: (props, { emit }) => () =>
        h('input', {
          class: 'searchbar-stub',
          value: props.modelValue,
          onInput: (event: Event) => {
            emit('update:modelValue', (event.target as HTMLInputElement).value)
            emit('ionInput', event)
          },
        }),
    }),
    IonSelect: defineComponent({
      name: 'IonSelect',
      props: { value: [Number, String], disabled: Boolean },
      emits: ['ionChange'],
      setup: (_, { slots }) => () => h('div', { 'data-stub': 'ion-select' }, slots.default?.()),
    }),
    IonButton: defineComponent({
      name: 'IonButton',
      emits: ['click'],
      setup: (_, { slots, emit }) => () => h('button', { onClick: () => emit('click') }, slots.default?.()),
    }),
    IonHeader: passthrough('ion-header'),
    IonToolbar: passthrough('ion-toolbar'),
    IonContent: passthrough('ion-content'),
    IonIcon: passthrough('ion-icon'),
    IonSelectOption: passthrough('ion-select-option'),
    IonProgressBar: passthrough('ion-progress-bar'),
    IonInfiniteScroll: defineComponent({
      name: 'IonInfiniteScroll',
      emits: ['ionInfinite'],
      setup: (_, { slots }) => () => h('div', { 'data-stub': 'ion-infinite-scroll' }, slots.default?.()),
    }),
    IonInfiniteScrollContent: passthrough('ion-infinite-scroll-content'),
  }
})

import SearchPostsModal from '@/components/SearchPostsModal.vue'

let wrapper: VueWrapper

function post(id: number, overrides: Record<string, unknown> = {}) {
  return { id, texto: `Post ${id}`, likes_count: 2, user_has_liked: false, ...overrides }
}

function found(posts: unknown[], scope = 'recent') {
  return { success: true, data: posts, scope }
}

async function open() {
  wrapper = mount(SearchPostsModal, { props: { isOpen: true } })
  wrapper.findComponent({ name: 'IonModal' }).vm.$emit('willPresent')
  await flushPromises()
}

async function type(value: string) {
  await wrapper.find('.searchbar-stub').setValue(value)
  await vi.advanceTimersByTimeAsync(350)
  await flushPromises()
}

async function commit() {
  wrapper.findComponent({ name: 'IonSearchbar' }).vm.$emit('ionChange')
  await flushPromises()
}

const selects = () => wrapper.findAllComponents({ name: 'IonSelect' })
const cards = () => wrapper.findAll('.post-card-stub')

beforeEach(() => {
  vi.useFakeTimers()
  vi.resetAllMocks()
  localStorage.clear()
  route.fullPath = '/tabs/tab1'
  UniversidadService.getUniversidades.mockResolvedValue({ data: [{ id: 1, nombre: 'UCA' }, { id: 2, nombre: 'UES' }] })
  UniversidadService.getCarreras.mockResolvedValue([{ id: 10, nombre: 'Ingeniería' }])
})

afterEach(() => {
  wrapper?.unmount()
  vi.useRealTimers()
})

describe('SearchPostsModal', () => {
  it('al abrir limpia la caché, carga universidades y muestra la ayuda inicial', async () => {
    await open()
    expect(postsService.clearSearchCache).toHaveBeenCalled()
    expect(wrapper.findAll('ion-select-option, [data-stub="ion-select-option"]')).toHaveLength(2)
    expect(wrapper.text()).toContain('Encuentra lo que buscas')
  })

  it('espera a que se deje de escribir y muestra los resultados', async () => {
    postsService.searchPosts.mockResolvedValue(found([post(1, { texto: 'Guía de cálculo' })]))
    await open()

    await wrapper.find('.searchbar-stub').setValue('cál')
    await wrapper.find('.searchbar-stub').setValue('cálculo')
    expect(postsService.searchPosts).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(350)
    await flushPromises()

    expect(postsService.searchPosts).toHaveBeenCalledTimes(1)
    expect(postsService.searchPosts).toHaveBeenCalledWith('cálculo', { universidad_id: null, carrera_id: null })
    expect(cards()).toHaveLength(1)
    expect(wrapper.find('.results-count').text()).toBe('1 resultado')
    expect(wrapper.find('.results-scope').exists()).toBe(true)
  })

  it('descarta la respuesta de una búsqueda vieja que llega tarde', async () => {
    let resolveOld!: (value: unknown) => void
    postsService.searchPosts
      .mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve }))
      .mockResolvedValueOnce(found([post(2, { texto: 'nuevo' })]))
    await open()

    await type('viejo')
    await type('nuevo')
    resolveOld(found([post(1, { texto: 'viejo' })]))
    await flushPromises()

    expect(cards()).toHaveLength(1)
    expect(cards()[0].text()).toContain('nuevo')
  })

  it('muestra "Sin resultados" y el error con opción de reintentar', async () => {
    postsService.searchPosts.mockResolvedValueOnce(found([]))
    await open()
    await type('zzz')
    expect(wrapper.text()).toContain('Sin resultados')
    expect(wrapper.text()).toContain('“zzz”')

    postsService.searchPosts
      .mockResolvedValueOnce({ success: false, error: 'No se pudo conectar con el servidor.', data: [] })
      .mockResolvedValueOnce(found([post(3)]))
    await type('otra')
    expect(wrapper.text()).toContain('No pudimos buscar')

    await wrapper.findAll('button').find((b) => b.text() === 'Reintentar')!.trigger('click')
    await flushPromises()
    expect(cards()).toHaveLength(1)
  })

  it('da like desde los resultados y avisa al feed con el valor del servidor', async () => {
    postsService.searchPosts.mockResolvedValue(found([post(1, { likes_count: 2 })]))
    postsService.likePost.mockResolvedValue({ success: true, data: { user_has_liked: true, likes_count: 5 } })
    await open()
    await type('post')

    wrapper.findComponent({ name: 'PostCard' }).vm.$emit('like', 1)
    await nextTick()
    expect(cards()[0].text()).toContain('3 · true') // optimista

    await flushPromises()
    expect(cards()[0].text()).toContain('5 · true')
    expect(wrapper.emitted('post-updated')![0]).toEqual([{ id: 1, user_has_liked: true, likes_count: 5 }])
  })

  it('revierte el like si el servidor falla', async () => {
    postsService.searchPosts.mockResolvedValue(found([post(1, { likes_count: 2 })]))
    postsService.likePost.mockResolvedValue({ success: false, error: 'Unauthenticated' })
    await open()
    await type('post')

    wrapper.findComponent({ name: 'PostCard' }).vm.$emit('like', 1)
    await flushPromises()

    expect(cards()[0].text()).toContain('2 · false')
    expect(wrapper.emitted('post-updated')).toBeUndefined()
  })

  it('guarda como reciente solo lo confirmado que dio resultados, por cuenta', async () => {
    postsService.searchPosts
      .mockResolvedValueOnce(found([]))
      .mockResolvedValueOnce(found([post(1)]))
    await open()

    await type('nada')
    await commit()
    expect(localStorage.getItem('recent_searches_7')).toBeNull()

    await type('parcial')
    await commit()
    expect(JSON.parse(localStorage.getItem('recent_searches_7')!)).toEqual(['parcial'])

    // Al vaciar el campo vuelven a verse los recientes, y se pueden quitar
    await type('')
    expect(wrapper.find('.recent-text').text()).toBe('parcial')
    await wrapper.find('.recent-remove').trigger('click')
    expect(wrapper.find('.recent-searches').exists()).toBe(false)
    expect(localStorage.getItem('recent_searches_7')).toBeNull()
  })

  it('Enter busca de inmediato sin esperar el debounce', async () => {
    postsService.searchPosts.mockResolvedValue(found([post(1)]))
    await open()

    await wrapper.find('.searchbar-stub').setValue('apuntes')
    await commit()

    expect(postsService.searchPosts).toHaveBeenCalledTimes(1)
    expect(JSON.parse(localStorage.getItem('recent_searches_7')!)).toEqual(['apuntes'])
  })

  it('filtra por universidad y carrera, y se puede quitar el filtro', async () => {
    postsService.searchPosts.mockResolvedValue(found([post(1)]))
    await open()

    selects()[0].vm.$emit('ionChange', { detail: { value: 1 } })
    await flushPromises()
    expect(postsService.searchPosts).toHaveBeenLastCalledWith('', { universidad_id: 1, carrera_id: null })
    expect(UniversidadService.getCarreras).toHaveBeenCalledWith(1)
    expect(selects()[1].props('disabled')).toBe(false)

    selects()[1].vm.$emit('ionChange', { detail: { value: 10 } })
    await flushPromises()
    expect(postsService.searchPosts).toHaveBeenLastCalledWith('', { universidad_id: 1, carrera_id: 10 })

    await wrapper.find('.filter-clear').trigger('click')
    await flushPromises()
    expect(wrapper.find('.filter-clear').exists()).toBe(false)
    expect(selects()[1].props('disabled')).toBe(true)
    expect(wrapper.text()).toContain('Encuentra lo que buscas')
  })

  it('muestra el total del servidor y carga más páginas al hacer scroll', async () => {
    postsService.searchPosts
      .mockResolvedValueOnce({ ...found([post(1), post(2)], 'all'), pagination: { currentPage: 1, hasMorePages: true, total: 3 } })
      // El post 2 se repite (se corrió la paginación) y no debe duplicarse
      .mockResolvedValueOnce({ ...found([post(2), post(3)], 'all'), pagination: { currentPage: 2, hasMorePages: false, total: 3 } })
    await open()
    await type('parcial')

    expect(wrapper.find('.results-count').text()).toBe('3 resultados')
    expect(wrapper.find('.results-scope').exists()).toBe(false)

    const complete = vi.fn()
    wrapper.findComponent({ name: 'IonInfiniteScroll' }).vm.$emit('ionInfinite', { target: { complete } })
    await flushPromises()

    expect(postsService.searchPosts).toHaveBeenLastCalledWith('parcial', { universidad_id: null, carrera_id: null }, 2)
    expect(cards()).toHaveLength(3)
    expect(complete).toHaveBeenCalled()
    expect(wrapper.findComponent({ name: 'IonInfiniteScroll' }).exists()).toBe(false)
  })

  it('descarta la página si mientras tanto empezó otra búsqueda', async () => {
    let resolvePage!: (value: unknown) => void
    postsService.searchPosts
      .mockResolvedValueOnce({ ...found([post(1)], 'all'), pagination: { currentPage: 1, hasMorePages: true, total: 2 } })
      .mockImplementationOnce(() => new Promise((resolve) => { resolvePage = resolve }))
      .mockResolvedValueOnce({ ...found([post(9, { texto: 'otra' })], 'all'), pagination: { currentPage: 1, hasMorePages: false, total: 1 } })
    await open()
    await type('primera')

    wrapper.findComponent({ name: 'IonInfiniteScroll' }).vm.$emit('ionInfinite', { target: { complete: vi.fn() } })
    await type('otra')
    resolvePage({ ...found([post(2)], 'all'), pagination: { currentPage: 2, hasMorePages: false, total: 2 } })
    await flushPromises()

    expect(cards()).toHaveLength(1)
    expect(cards()[0].text()).toContain('otra')
  })

  it('si falla cargar más ofrece reintentar', async () => {
    postsService.searchPosts
      .mockResolvedValueOnce({ ...found([post(1)], 'all'), pagination: { currentPage: 1, hasMorePages: true, total: 2 } })
      .mockResolvedValueOnce({ success: false, error: 'No se pudieron cargar más resultados', data: [] })
      .mockResolvedValueOnce({ ...found([post(2)], 'all'), pagination: { currentPage: 2, hasMorePages: false, total: 2 } })
    await open()
    await type('hola')

    wrapper.findComponent({ name: 'IonInfiniteScroll' }).vm.$emit('ionInfinite', { target: { complete: vi.fn() } })
    await flushPromises()
    expect(wrapper.find('.load-more-error').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'IonInfiniteScroll' }).exists()).toBe(false)

    await wrapper.find('.load-more-error button').trigger('click')
    await flushPromises()
    expect(cards()).toHaveLength(2)
    expect(wrapper.find('.load-more-error').exists()).toBe(false)
  })

  it('abre el post y se cierra al navegar', async () => {
    postsService.searchPosts.mockResolvedValue(found([post(4)]))
    await open()
    await type('post')

    wrapper.findComponent({ name: 'PostCard' }).vm.$emit('comment', 4)
    expect(router.push).toHaveBeenCalledWith('/tabs/post/4')

    const { __route } = (await import('vue-router')) as unknown as { __route: { fullPath: string } }
    __route.fullPath = '/tabs/post/4'
    await nextTick()
    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})
