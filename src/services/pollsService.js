/**
 * Servicio para manejar operaciones de encuestas (polls)
 */
import { api } from "./api";
import { AuthService } from "./auth";

class PollsService {
  /**
   * Obtiene todas las encuestas
   * @param {number} page - Número de página
   * @returns {Promise<Object>} Respuesta con encuestas
   */
  async getPolls(page = 1) {
    try {
      const response = await api.get("/polls", {
        params: { page },
      });

      if (response.data.success && response.data.data) {
        const polls = response.data.data.data || [];

        const enrichedPolls = polls.map((poll) => {
          return {
            ...poll,
            user_has_voted: poll.user_has_voted || false,
            is_closed: poll.is_closed || false,
          };
        });

        return {
          success: true,
          data: enrichedPolls,
          pagination: {
            currentPage: response.data.data.current_page || 1,
            lastPage: response.data.data.last_page || 1,
            hasMorePages:
              (response.data.data.current_page || 1) <
              (response.data.data.last_page || 1),
            total: response.data.data.total || 0,
            perPage: response.data.data.per_page || 20,
          },
        };
      }

      return {
        success: false,
        error: "No se encontraron encuestas",
        data: [],
        pagination: {
          currentPage: 1,
          lastPage: 1,
          hasMorePages: false,
          total: 0,
          perPage: 20,
        },
      };
    } catch (err) {
      let errorMessage = "Error desconocido";

      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = "Sesión expirada. Por favor, inicia sesión de nuevo.";
          await AuthService.logout();
        } else {
          errorMessage = `Error ${err.response.status}: ${err.response.data?.message || "Error del servidor"
            }`;
        }
      } else if (err.request) {
        errorMessage =
          "No se pudo conectar con el servidor. Verifica tu conexión.";
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
          perPage: 20,
        },
      };
    }
  }

  /**
   * Obtiene una encuesta específica
   * @param {number} pollId - ID de la encuesta
   * @returns {Promise<Object>} Respuesta con datos de la encuesta
   */
  async getPoll(pollId) {
    try {
      const response = await api.get(`/polls/${pollId}`);
      const poll = response.data?.data || response.data;

      return {
        success: true,
        data: {
          ...poll,
          user_has_voted: poll.user_has_voted || false,
          is_closed: poll.is_closed || false,
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
   * Crea una nueva encuesta
   * @param {string} question - Pregunta de la encuesta
   * @param {Array} options - Opciones de respuesta [{text}, ...]
   * @param {number} expiresInHours - Horas hasta que expire (1-72)
   * @param {string} visibility - 'public' o 'followers'
   * @returns {Promise<Object>} Respuesta con la encuesta creada
   */
  async createPoll(question, options, expiresInHours, visibility = "public") {
    try {
      const payload = {
        question: question,
        options: options,
        expires_in_hours: expiresInHours,
        visibility: visibility,
      };

      const response = await api.post("/polls", payload);

      return {
        success: true,
        data: response.data?.data || response.data,
        message: response.data?.message || "Encuesta creada exitosamente",
      };
    } catch (err) {
      let errorMessage = "Error al crear la encuesta";

      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = "Debes iniciar sesión para crear una encuesta";
        } else if (err.response.status === 422) {
          errorMessage = err.response.data?.message || "Datos inválidos";
        } else {
          errorMessage =
            err.response.data?.message || "Error del servidor al crear encuesta";
        }
      } else if (err.request) {
        errorMessage = "No se pudo conectar con el servidor";
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Emite un voto en una opción de encuesta
   * @param {number} pollId - ID de la encuesta
   * @param {number} optionId - ID de la opción
   * @returns {Promise<Object>} Respuesta con el nuevo estado de votación
   */
  async voteOnPoll(pollId, optionId) {
    try {
      const response = await api.post(`/polls/${pollId}/vote`, {
        option_id: optionId,
      });

      return {
        success: true,
        data: response.data?.data || response.data,
        message:
          response.data?.message || "Voto registrado exitosamente",
      };
    } catch (err) {
      let errorMessage = "Error al registrar el voto";

      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = "Debes iniciar sesión para votar";
        } else if (err.response.status === 422) {
          errorMessage = err.response.data?.message || "No puedes votar en esta encuesta";
        } else if (err.response.status === 404) {
          errorMessage = "Encuesta no encontrada";
        } else {
          errorMessage =
            err.response.data?.message || "Error del servidor";
        }
      } else if (err.request) {
        errorMessage = "No se pudo conectar con el servidor";
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Elimina una encuesta
   * @param {number} pollId - ID de la encuesta
   * @returns {Promise<Object>} Respuesta de eliminación
   */
  async deletePoll(pollId) {
    try {
      const response = await api.delete(`/polls/${pollId}`);
      return {
        success: true,
        message: response.data?.message || "Encuesta eliminada exitosamente",
      };
    } catch (err) {
      let errorMessage = "Error al eliminar la encuesta";

      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = "No tienes permiso para eliminar esta encuesta";
        } else if (err.response.status === 403) {
          errorMessage = "No puedes eliminar esta encuesta";
        } else if (err.response.status === 404) {
          errorMessage = "Encuesta no encontrada";
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

export default new PollsService();
