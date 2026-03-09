import api, { BASE_URL } from "./api"; // Tu instancia de Axios configurada

// Helper para transformar usuarios del chat a formato consistente con el resto de la app
const transformChatUser = (user) => {
  if (!user) return user;

  // Si tiene avatar pero no imagen_url, construir imagen_url
  if (user.avatar && !user.imagen_url) {
    if (user.avatar.startsWith("http")) {
      user.imagen_url = user.avatar;
    } else {
      user.imagen_url = `${BASE_URL}${user.avatar}`;
    }
  }

  return user;
};

export default {
  async getContacts() {
    const response = await api.get("/chat/contacts");

    // Transformar cada contacto para tener imagen_url
    if (response.data && Array.isArray(response.data)) {
      response.data = response.data.map(transformChatUser);
    }
    return response;
  },

  getMessages(userId) {
    return api.post("/chat/messages", { id: userId });
  },

  sendMessage(userId, message, file = null) {
    const formData = new FormData();
    formData.append("id", userId);
    if (message) formData.append("message", message);
    if (file) formData.append("file", file);

    return api.post("/chat/send", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  makeSeen(userId) {
    return api.post("/chat/makeSeen", { id: userId });
  },

  async getFavorites() {
    const response = await api.get("/chat/favorites");
    // Transformar cada favorito para tener imagen_url
    if (response.data && Array.isArray(response.data)) {
      response.data = response.data.map(transformChatUser);
    }
    return response;
  },

  toggleFavorite(userId) {
    return api.post("/chat/favorite", { id: userId });
  },

  checkFavorite(userId) {
    return api.post("/chat/checkFavorite", { id: userId });
  },

  getSharedPhotos(userId) {
    return api.post("/chat/shared", { id: userId });
  },

  /**
   * Obtener el total de mensajes no leídos de todos los chats
   * Endpoint debe crearse en el backend: GET /chat/unread-count
   * @returns {Promise} - Respuesta con el contador total
   */
  async getUnreadCount() {
    try {
      const response = await api.get("/chat/unread-count");
      return response.data;
    } catch (error) {
      // Silencioso si el endpoint no existe (404) - pendiente de implementación en backend
      if (error.response?.status === 404) {
        return { success: true, count: 0 };
      }
      console.error(
        "[ChatService] Error al obtener contador de mensajes:",
        error,
      );
      throw error;
    }
  },
};
