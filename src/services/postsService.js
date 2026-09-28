/**
 * Servicio para manejar las operaciones relacionadas con posts
 * Principio SOLID: Single Responsibility - Este servicio solo maneja posts
 */
import { api } from "./api";
import { AuthService } from "./auth";

// Búsqueda en cliente: cuántas páginas del feed se revisan y cuánto dura la caché
const SEARCH_MAX_PAGES = 5;
const SEARCH_CACHE_TTL = 60 * 1000;

/**
 * Minúsculas y sin tildes, para que "calculo" encuentre "Cálculo"
 * @param {string} value
 * @returns {string}
 */
export function normalizeSearchText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Indica si un post contiene todas las palabras del término de búsqueda,
 * mirando el contenido, el autor y la canción
 * @param {Object} post
 * @param {string} query
 * @returns {boolean}
 */
export function postMatchesQuery(post, query) {
  const words = normalizeSearchText(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;

  const haystack = normalizeSearchText(
    [
      post.texto,
      post.titulo,
      post.descripcion,
      post.user?.name,
      post.user?.username,
      post.itunes_track_name,
      post.itunes_artist_name,
    ]
      .filter(Boolean)
      .join(" "),
  );

  return words.every((word) => haystack.includes(word));
}

// Paginación de un resultado que ya viene completo
const singlePage = (page, total) => ({ currentPage: page, lastPage: page, hasMorePages: false, total });

class PostsService {
  constructor() {
    // Ya no necesitamos apiBaseUrl ni headers porque api.js lo maneja

    // null = aún no sabemos si el backend expone GET /posts/search
    this._searchEndpointAvailable = null;
    this._searchCache = new Map();
  }

  /**
   * Agrega user_has_liked y los contadores que usa PostCard
   * @param {Object} post - Post tal como viene del backend
   * @param {number} currentUserId - ID del usuario autenticado
   * @returns {Object} Post enriquecido
   */
  _enrichPost(post, currentUserId) {
    // Calcular user_has_liked desde el array de likes si no viene del backend
    let hasLiked = false;

    if (post.user_has_liked !== undefined) {
      // Si el backend envía user_has_liked, usarlo
      hasLiked = post.user_has_liked;
    } else if (post.likes && Array.isArray(post.likes) && currentUserId) {
      // Si no viene user_has_liked pero sí el array de likes, calcularlo
      hasLiked = post.likes.some(like =>
        like.user_id === currentUserId ||
        like.usuario_id === currentUserId ||
        like.id === currentUserId
      );
    }

    return {
      ...post,
      // IMPORTANTE: Preservar el valor calculado o del backend
      user_has_liked: hasLiked,
      // Contar likes (puede venir como count o array)
      likes_count: post.likes_count !== undefined ? post.likes_count : (post.likes?.length || 0),
      // Contar comentarios
      comments_count: post.comentarios?.length || 0,
    };
  }

  /**
   * Obtiene los posts desde la API con feed personalizado
   *
   * LÓGICA DEL BACKEND:
   * - Usuario autenticado: Posts públicos + posts privados de quien sigue + sus propios posts
   * - Usuario NO autenticado: Solo posts públicos
   *
   * @param {number} page - Número de página a cargar
   * @returns {Promise<Object>} Respuesta de la API
   */
  async fetchPosts(page = 1, filters = {}) {
    try {
      // El backend detectará automáticamente si hay token en el header
      // y devolverá el feed correspondiente (personalizado o público)
      // Construimos los parámetros base (siempre paginación)
      const queryParams = { page };

      // Verificamos si hay filtros activos de forma limpia
      const hasFilters = filters.universidad_id || filters.carrera_id;

      let response;

      if (hasFilters) {
        // Si hay filtros, usamos el endpoint POST
        // Preparamos el body con los datos exactos que espera la API
        const filterBody = {
          universidad: filters.universidad_id,
          carrera: filters.carrera_id,
        };

        // Pasamos page en la URL porque POST no suele llevar params de query,
        // pero Laravel los lee igual de la Request si es necesario para la paginación interna.
        // Aunque lo ideal sería enviarlo también en el body o que el backend lo maneje.
        // Asumiré tu estructura actual.
        response = await api.post(`/posts/filter?page=${page}`, filterBody);
      } else {
        // Si hay filtros, usamos el endpoint GET general.
        response = await api.get("/posts", { params: queryParams });
      }

      if (response.data.success && response.data.data) {
        const posts = response.data.data.data || [];

        // Obtener el ID del usuario actual para verificar likes
        const currentUser = AuthService.getUser();
        const currentUserId = currentUser?.id;

        // Log para debugging - ver qué está enviando el backend
        /* if (posts.length > 0) {
          console.log('[PostsService] Ejemplo de post del backend:', {
            id: posts[0].id,
            user_has_liked: posts[0].user_has_liked,
            likes_count: posts[0].likes_count,
            likes: posts[0].likes,
            currentUserId: currentUserId
          });
        } */

        // Enriquecer posts con información de autenticación
        const enrichedPosts = posts.map((post) => this._enrichPost(post, currentUserId));

        return {
          success: true,
          data: enrichedPosts,
          pagination: {
            currentPage: response.data.data.current_page || 1,
            lastPage: response.data.data.last_page || 1,
            hasMorePages:
              (response.data.data.current_page || 1) <
              (response.data.data.last_page || 1),
            total: response.data.data.total || 0,
            perPage: response.data.data.per_page || 6,
          },
          // Información adicional sobre el tipo de feed
          feedType: AuthService.isAuthenticated() ? "personalized" : "public",
        };
      }

      return {
        success: false,
        error: "No se encontraron posts en la respuesta de la API",
        data: [],
        pagination: {
          currentPage: 1,
          lastPage: 1,
          hasMorePages: false,
          total: 0,
          perPage: 6,
        },
        feedType: AuthService.isAuthenticated() ? "personalized" : "public",
      };
    } catch (err) {
      let errorMessage = "Error desconocido";

      if (err.response) {
        // Error de la API
        if (err.response.status === 401) {
          errorMessage = "Sesión expirada. Por favor, inicia sesión de nuevo.";
          // Limpiar sesión si el token es inválido
          await AuthService.logout();
        } else {
          errorMessage = `Error ${err.response.status}: ${err.response.data?.message || "Error del servidor"
            }`;
        }
      } else if (err.request) {
        errorMessage =
          "No se pudo conectar con el servidor. Verifica tu conexión.";
      } else {
        errorMessage = err.message || "Error desconocido";
      }

      return {
        success: false,
        error: errorMessage,
        data: [],
        pagination: {
          currentPage: 1,
          lastPage: 1,
          hasMorePages: false,
          total: 0,
          perPage: 6,
        },
        feedType: "error",
      };
    }
  }

  /**
   * Obtiene un post específico por ID
   * @param {number} postId - ID del post
   * @returns {Promise<Object>} Respuesta de la API
   */
  async getPost(postId) {
    try {
      const response = await api.get(`/posts/${postId}`);
      const post = response.data?.data || response.data;

      // Obtener el ID del usuario actual
      const currentUser = AuthService.getUser();
      const currentUserId = currentUser?.id;

      // Calcular user_has_liked desde el array de likes si no viene del backend
      let hasLiked = false;

      if (post.user_has_liked !== undefined) {
        hasLiked = post.user_has_liked;
      } else if (post.likes && Array.isArray(post.likes) && currentUserId) {
        hasLiked = post.likes.some(like =>
          like.user_id === currentUserId ||
          like.usuario_id === currentUserId ||
          like.id === currentUserId
        );
      }

      // Log para debugging
      /* console.log('[PostsService] Post individual del backend:', {
        id: post.id,
        user_has_liked_backend: post.user_has_liked,
        user_has_liked_calculado: hasLiked,
        likes_count: post.likes_count,
        currentUserId: currentUserId
      }); */

      return {
        success: true,
        data: {
          ...post,
          // Preservar el valor calculado
          user_has_liked: hasLiked,
          likes_count: post.likes_count !== undefined ? post.likes_count : (post.likes?.length || 0),
        },
      };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || err.message,
      };
    }
  }

  /**
   * Da like a un post
   * @param {number} postId - ID del post
   * @returns {Promise<Object>} Respuesta de la API con el estado actualizado
   */
  async likePost(postId) {
    try {
      const response = await api.post(`/posts/${postId}/like`, {});

      // El backend puede devolver diferentes estructuras
      const data = response.data?.data || response.data;

      // Log detallado para debugging
      /* console.log('[PostsService] Respuesta de like del backend:', {
        postId,
        rawResponse: response.data,
        user_has_liked: data.user_has_liked,
        liked: data.liked,
        likes_count: data.likes_count, 
        total_likes: data.total_likes
      }); */

      return {
        success: true,
        data: {
          user_has_liked: data.user_has_liked !== undefined ? data.user_has_liked : data.liked,
          likes_count: data.likes_count !== undefined ? data.likes_count : data.total_likes,
          message: data.message
        }
      };
    } catch (err) {
      console.error('[PostsService] Error en likePost:', err);
      return {
        success: false,
        error: err.response?.data?.message || err.message
      };
    }
  }

  /**
   * Comenta en un post
   * Intenta múltiples endpoints hasta encontrar uno que funcione
   * @param {number} postId - ID del post
   * @param {string} comentario - Texto del comentario
   * @returns {Promise<Object>} Respuesta de la API
   */
  async commentPost(postId, comentario) {
    // Lista de endpoints posibles que el backend podría tener
    const endpoints = [
      { url: `/posts/${postId}/comments`, body: { comentario } },
      { url: `/posts/${postId}/comentarios`, body: { comentario } },
      { url: `/comentarios`, body: { post_id: postId, comentario } },
      { url: `/comments`, body: { post_id: postId, comentario } },
    ];

    let lastError = null;

    // Intentar cada endpoint hasta que uno funcione
    for (const endpoint of endpoints) {
      try {
        const response = await api.post(endpoint.url, endpoint.body);
        /* console.log(`✅ Comentario enviado usando: ${endpoint.url}`); */
        return { success: true, data: response.data };
      } catch (err) {
        lastError = err;
        // Si es 404, intentar el siguiente endpoint
        if (err.response?.status === 404) {
          /* console.log(`❌ Endpoint no encontrado: ${endpoint.url}`); */
          continue;
        }
        // Si es otro error, retornarlo inmediatamente
        return {
          success: false,
          error: err.response?.data?.message || err.message,
        };
      }
    }

    // Si ningún endpoint funcionó
    return {
      success: false,
      error:
        lastError?.response?.data?.message ||
        lastError?.message ||
        "No se encontró un endpoint válido para comentarios",
    };
  }

  /**
   * Comparte un post
   * @param {number} postId - ID del post
   * @returns {Promise<Object>} Respuesta de la API
   */
  async sharePost(postId) {
    try {
      const response = await api.post(`/posts/${postId}/share`, {});
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Crea un nuevo post de solo texto
   * @param {string} texto - Contenido del post
   * @returns {Promise<Object>} Respuesta de la API
   */
  async createTextPost(texto) {
    try {
      const payload = {
        tipo: "texto",
        texto: texto,
      };

      const response = await api.post("/posts", payload);

      return {
        success: true,
        data: response.data?.data || response.data,
      };
    } catch (err) {
      let errorMessage = "Error al crear el post";

      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = "Debes iniciar sesión para publicar";
        } else if (err.response.status === 422) {
          errorMessage =
            err.response.data?.message || "Datos inválidos para el post";
        } else {
          errorMessage =
            err.response.data?.message || "Error del servidor al crear post";
        }
      } else if (err.request) {
        errorMessage = "No se pudo conectar con el servidor";
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Busca posts por texto y/o por la universidad y carrera del autor
   *
   * Usa GET /posts/search (paginado, sobre todo el historial). Si el backend
   * responde 404/405 se recuerda y, a partir de ahí, se busca en cliente sobre
   * las publicaciones más recientes del feed (scope "recent", sin más páginas).
   *
   * @param {string} query - Término de búsqueda (puede ir vacío si hay filtros)
   * @param {Object} filters - { universidad_id, carrera_id }
   * @param {number} page - Página de resultados
   * @returns {Promise<Object>} { success, data, scope, pagination, error? }
   */
  async searchPosts(query, filters = {}, page = 1) {
    const term = (query || "").trim();
    const hasFilters = Boolean(filters.universidad_id || filters.carrera_id);

    if (!term && !hasFilters) {
      return { success: true, data: [], scope: null, pagination: singlePage(page, 0) };
    }

    if (this._searchEndpointAvailable !== false) {
      try {
        const response = await api.get("/posts/search", {
          params: {
            q: term || undefined,
            universidad: filters.universidad_id || undefined,
            carrera: filters.carrera_id || undefined,
            page,
          },
        });

        // Acepta tanto { data: [...] } como la paginación de Laravel { data: { data: [...] } }
        const payload = response.data?.data;
        const posts = Array.isArray(payload) ? payload : payload?.data;

        if (response.data?.success && Array.isArray(posts)) {
          this._searchEndpointAvailable = true;
          const currentUserId = AuthService.getUser()?.id;
          const currentPage = payload?.current_page || page;
          const lastPage = payload?.last_page || currentPage;

          return {
            success: true,
            data: posts.map((post) => this._enrichPost(post, currentUserId)),
            scope: "all",
            pagination: {
              currentPage,
              lastPage,
              hasMorePages: currentPage < lastPage,
              total: payload?.total ?? posts.length,
            },
          };
        }
      } catch (err) {
        const status = err.response?.status;
        if (status === 404 || status === 405) {
          this._searchEndpointAvailable = false;
        } else if (page > 1) {
          // A mitad del scroll no tiene sentido cambiar a la búsqueda en cliente
          return {
            success: false,
            error: err.response?.data?.message || "No se pudieron cargar más resultados",
            data: [],
            scope: "all",
          };
        }
        // Cualquier otro fallo (red, 500...) cae a la búsqueda en cliente
      }
    }

    // La búsqueda en cliente devuelve todo en la primera página
    if (page > 1) {
      return { success: true, data: [], scope: "recent", pagination: singlePage(page, 0) };
    }
    return this._searchPostsClientSide(term, filters);
  }

  /**
   * Olvida las publicaciones guardadas para la búsqueda en cliente
   */
  clearSearchCache() {
    this._searchCache.clear();
  }

  /**
   * Filtra en cliente las publicaciones recientes (con los filtros aplicados)
   * @private
   */
  async _searchPostsClientSide(term, filters) {
    const corpus = await this._getSearchCorpus(filters);

    if (!corpus.success) {
      return {
        success: false,
        error: corpus.error || "Error al buscar publicaciones",
        data: [],
        scope: "recent",
      };
    }

    const data = corpus.data.filter((post) => postMatchesQuery(post, term));
    return { success: true, data, scope: "recent", pagination: singlePage(1, data.length) };
  }

  /**
   * Devuelve hasta SEARCH_MAX_PAGES páginas del feed (o de /posts/filter).
   * Se guarda la promesa para que varias búsquedas seguidas compartan la
   * misma descarga en lugar de repetirla con cada tecla.
   * @private
   */
  async _getSearchCorpus(filters = {}) {
    const key = `${filters.universidad_id || ""}:${filters.carrera_id || ""}`;
    const cached = this._searchCache.get(key);

    if (cached && Date.now() - cached.at < SEARCH_CACHE_TTL) {
      return cached.promise;
    }

    const promise = this._loadSearchCorpus(filters);
    this._searchCache.set(key, { at: Date.now(), promise });

    const result = await promise;
    if (!result.success) {
      // No guardar errores: el siguiente intento debe volver a pedir los datos
      this._searchCache.delete(key);
    }
    return result;
  }

  /** @private */
  async _loadSearchCorpus(filters) {
    const firstPage = await this.fetchPosts(1, filters);
    if (!firstPage.success) {
      return { success: false, error: firstPage.error };
    }

    const lastPage = Math.min(firstPage.pagination.lastPage, SEARCH_MAX_PAGES);
    const otherPages = await Promise.all(
      Array.from({ length: Math.max(0, lastPage - 1) }, (_, index) =>
        this.fetchPosts(index + 2, filters),
      ),
    );

    // Si entra un post nuevo mientras se piden las páginas, el mismo post
    // puede venir en dos de ellas; una página que falle simplemente se omite
    const seen = new Set();
    const data = [];
    for (const page of [firstPage, ...otherPages]) {
      if (!page.success) continue;
      for (const post of page.data) {
        if (seen.has(post.id)) continue;
        seen.add(post.id);
        data.push(post);
      }
    }

    return { success: true, data };
  }

  /**
   * Elimina un post
   * @param {number} postId - ID del post a eliminar
   * @returns {Promise<Object>} Respuesta de la API
   */
  async deletePost(postId) {
    try {
      const response = await api.delete(`/posts/${postId}`);
      return {
        success: true,
        data: response.data?.data || response.data,
        message: response.data?.message || "Post eliminado exitosamente"
      };
    } catch (err) {
      let errorMessage = "Error al eliminar el post";

      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = "No tienes permiso para eliminar este post";
        } else if (err.response.status === 403) {
          errorMessage = "No puedes eliminar este post";
        } else if (err.response.status === 404) {
          errorMessage = "Post no encontrado";
        } else {
          errorMessage = err.response.data?.message || "Error del servidor";
        }
      } else if (err.request) {
        errorMessage = "No se pudo conectar con el servidor";
      }

      return { success: false, error: errorMessage };
    }
  }
}

// Exportar instancia singleton del servicio
export default new PostsService();
