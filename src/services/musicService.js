/**
 * Servicio para manejar operaciones con la API de iTunes
 * Permite buscar canciones, álbumes y artistas
 */
import { api } from "./api";

class MusicService {
  /**
   * Buscar canciones en iTunes
   * @param {string} query - Término de búsqueda
   * @param {number} limit - Límite de resultados (default: 20)
   * @param {string} country - Código de país (default: 'US')
   * @returns {Promise<Object>} Resultados de búsqueda
   */
  async searchTracks(query, limit = 20, country = "US") {
    try {
      if (!query || query.trim().length < 2) {
        return {
          success: true,
          data: [],
          count: 0,
        };
      }

      const response = await api.get("/music/search", {
        params: {
          query: query.trim(),
          limit,
          country,
        },
      });

      return {
        success: true,
        data: response.data.data || [],
        count: response.data.count || 0,
      };
    } catch (err) {
      console.error("Error buscando música:", err);
      return {
        success: false,
        error: err.response?.data?.message || err.message || "Error al buscar música",
        data: [],
        count: 0,
      };
    }
  }

  /**
   * Obtener información de una canción por ID
   * @param {number} trackId - ID de la canción en iTunes
   * @returns {Promise<Object>} Información de la canción
   */
  async getTrack(trackId) {
    try {
      const response = await api.get("/music/track", {
        params: { trackId },
      });

      return {
        success: true,
        data: response.data.data || null,
      };
    } catch (err) {
      console.error("Error obteniendo track:", err);
      return {
        success: false,
        error: err.response?.data?.message || err.message,
        data: null,
      };
    }
  }

  /**
   * Buscar por género musical
   * @param {string} genre - Género musical
   * @param {number} limit - Límite de resultados
   * @returns {Promise<Object>} Resultados de búsqueda
   */
  async searchByGenre(genre, limit = 10) {
    try {
      const response = await api.get("/music/genre", {
        params: { genre, limit },
      });

      return {
        success: true,
        data: response.data.data || [],
        count: response.data.count || 0,
      };
    } catch (err) {
      console.error("Error buscando por género:", err);
      return {
        success: false,
        error: err.response?.data?.message || err.message,
        data: [],
        count: 0,
      };
    }
  }

  /**
   * Obtener canciones populares
   * @param {number} limit - Límite de resultados
   * @param {string} country - Código de país
   * @returns {Promise<Object>} Canciones populares
   */
  async getPopular(limit = 20, country = "US") {
    try {
      const response = await api.get("/music/popular", {
        params: { limit, country },
      });

      return {
        success: true,
        data: response.data.data || [],
        count: response.data.count || 0,
      };
    } catch (err) {
      console.error("Error obteniendo canciones populares:", err);
      return {
        success: false,
        error: err.response?.data?.message || err.message,
        data: [],
        count: 0,
      };
    }
  }

  /**
   * Formatear datos de canción para crear un post
   * @param {Object} track - Datos de la canción desde iTunes
   * @returns {Object} Datos formateados para el post
   */
  formatTrackForPost(track) {
    return {
      tipo: "musica",
      titulo: track.trackName || "Canción desconocida",
      descripcion: `${track.artistName} - ${track.collectionName}`,
      musica_url: track.previewUrl,
      musica_imagen: track.artworkUrlHigh || track.artworkUrl100,
      musica_artista: track.artistName,
      musica_titulo: track.trackName,
      musica_album: track.collectionName,
      musica_duracion: track.duration,
      musica_genero: track.primaryGenreName,
      itunes_track_id: track.trackId,
      itunes_url: track.appleMusicUrl,
    };
  }
}

// Exportar instancia singleton
export default new MusicService();
