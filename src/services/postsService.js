/**
 * Servicio para manejar las operaciones relacionadas con posts
 * Principio SOLID: Single Responsibility - Este servicio solo maneja posts
 */
import { api } from "./api";
import { AuthService } from "./auth";

class PostsService {
  constructor() {
    // Ya no necesitamos apiBaseUrl ni headers porque api.js lo maneja
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
  async fetchPosts(page = 1) {
    try {
      // El backend detectará automáticamente si hay token en el header
      // y devolverá el feed correspondiente (personalizado o público)
      const response = await api.get("/posts", {
        params: { page },
      });

      if (response.data.success && response.data.data) {
        const posts = response.data.data.data || [];

        // Enriquecer posts con información de autenticación
        const enrichedPosts = posts.map((post) => ({
          ...post,
          // Verificar si el usuario actual dio like (viene del backend)
          user_has_liked: post.user_has_liked || false,
          // Contar likes (puede venir como count o array)
          likes_count: post.likes_count || post.likes?.length || 0,
          // Contar comentarios
          comments_count: post.comentarios?.length || 0,
        }));

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
      return {
        success: true,
        data: response.data?.data || response.data,
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
   * @returns {Promise<Object>} Respuesta de la API
   */
  async likePost(postId) {
    try {
      const response = await api.post(`/posts/${postId}/like`, {});
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, error: err.message };
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
        console.log(`✅ Comentario enviado usando: ${endpoint.url}`);
        return { success: true, data: response.data };
      } catch (err) {
        lastError = err;
        // Si es 404, intentar el siguiente endpoint
        if (err.response?.status === 404) {
          console.log(`❌ Endpoint no encontrado: ${endpoint.url}`);
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
}

// Exportar instancia singleton del servicio
export default new PostsService();
