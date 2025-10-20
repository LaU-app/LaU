/**
 * Servicio para manejar las operaciones relacionadas con posts
 * Principio SOLID: Single Responsibility - Este servicio solo maneja posts
 */
import api from "./api";

class PostsService {
  constructor() {
    // Ya no necesitamos apiBaseUrl ni headers porque api.js lo maneja
  }

  /**
   * Obtiene los posts desde la API
   * @param {number} page - Número de página a cargar
   * @returns {Promise<Object>} Respuesta de la API
   */
  async fetchPosts(page = 1) {
    try {
      const response = await api.get("/posts", {
        params: { page },
      });

      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data.data || [],
          pagination: {
            currentPage: response.data.data.current_page || 1,
            lastPage: response.data.data.last_page || 1,
            hasMorePages:
              (response.data.data.current_page || 1) <
              (response.data.data.last_page || 1),
          },
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
        },
      };
    } catch (err) {
      let errorMessage = "Error desconocido";
      if (err.response) {
        errorMessage = `Error ${err.response.status}: ${
          err.response.data?.message || "Error del servidor"
        }`;
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
        },
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
   * @param {number} postId - ID del post
   * @param {string} comentario - Texto del comentario
   * @returns {Promise<Object>} Respuesta de la API
   */
  async commentPost(postId, comentario) {
    try {
      const response = await api.post(`/posts/${postId}/comments`, {
        comentario,
      });
      return { success: true, data: response.data };
    } catch (err) {
      return { success: false, error: err.message };
    }
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
}

// Exportar instancia singleton del servicio
export default new PostsService();
