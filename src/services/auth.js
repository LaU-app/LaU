import { api } from "./api";
import { pushNotificationsService } from "./pushNotificationsService";

const TOKEN_KEY = "auth_token";
const USER_KEY = "user";
const REMEMBER_KEY = "remember_me";
const TOKEN_EXPIRY_KEY = "token_expiry";

export const AuthService = {
  async login(credentials, rememberMe = false) {
    try {
      // POST /auth/login con email y password
      const res = await api.post("/auth/login", credentials);

      // Adaptarse a la estructura de respuesta de tu API
      const data = res.data?.data || res.data;

      if (data?.token) {
        // Guardar token según la opción "Recuérdame"
        this.setToken(data.token, rememberMe);
      }

      if (data?.user) {
        this.setUser(data.user, rememberMe);
      }

      // Inicializar notificaciones push después del login exitoso
      if (pushNotificationsService.isAvailable()) {
        pushNotificationsService.initialize().catch((err) => {
          console.error(
            "Failed to initialize push notifications after login:",
            err
          );
        });
      }

      return data;
    } catch (error) {
      console.error("[AUTH] Error en login:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },

  /**
   * Guarda el token con o sin persistencia según "Recuérdame"
   */
  setToken(token, rememberMe = false) {
    const storage = rememberMe ? localStorage : sessionStorage;
    const expiryTime = rememberMe
      ? Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 días
      : Date.now() + 24 * 60 * 60 * 1000; // 24 horas

    storage.setItem(TOKEN_KEY, token);
    storage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    storage.setItem(REMEMBER_KEY, rememberMe.toString());

    // Si es rememberMe, también guardar en localStorage para persistencia
    if (rememberMe) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
      localStorage.setItem(REMEMBER_KEY, "true");
    }
  },

  /**
   * Guarda el usuario con o sin persistencia
   */
  setUser(user, rememberMe = false) {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(USER_KEY, JSON.stringify(user));

    if (rememberMe) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  },

  async register(data) {
    try {
      // POST /auth/register con los datos del usuario
      const res = await api.post("/auth/register", data);

      // Adaptarse a la estructura de respuesta de tu API
      const responseData = res.data?.data || res.data;

      if (responseData?.token) {
        localStorage.setItem(TOKEN_KEY, responseData.token);
      }

      if (responseData?.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(responseData.user));
      }

      return responseData;
    } catch (error) {
      console.error("Error en register:", error);
      throw error;
    }
  },

  async logout() {
    try {
      // Desregistrar notificaciones push antes del logout
      if (pushNotificationsService.isAvailable()) {
        await pushNotificationsService.unregister();
      }

      // Intenta hacer logout en la API
      await api.post("/auth/logout");
    } catch (e) {
      // Ignora errores de logout para limpiar local de todas formas
      console.warn("Error al hacer logout en API:", e);
    }

    // Limpia los datos de ambos storages
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(REMEMBER_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);

    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(REMEMBER_KEY);
    sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
  },

  getToken() {
    // Primero verifica si el token expiró
    const expiry =
      localStorage.getItem(TOKEN_EXPIRY_KEY) ||
      sessionStorage.getItem(TOKEN_EXPIRY_KEY);
    if (expiry && Date.now() > parseInt(expiry)) {
      // Token expirado, limpia todo
      this.logout();
      return null;
    }

    // Intenta obtener de localStorage primero, luego sessionStorage
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  },

  getUser() {
    const userStr =
      localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  /**
   * Obtiene las estadísticas completas de un usuario
   * Incluye: posts, seguidores, siguiendo, likes, comentarios, is_following
   */
  async getUserStats(userIdentifier) {
    try {
      const res = await api.get(`/users/${userIdentifier}/stats`);
      return res.data;
    } catch (error) {
      console.error("[AUTH] Error al obtener estadísticas:", error.message);
      throw error;
    }
  },

  /**
   * Obtiene los seguidores de un usuario
   * Usa el endpoint /auth/followers/{id} del backend
   */
  async getFollowers(userIdentifier) {
    try {
      const res = await api.get(`/auth/followers/${userIdentifier}`);
      return res.data;
    } catch (error) {
      console.error("[AUTH] Error al obtener seguidores:", error.message);
      // Retornar estructura vacía en lugar de lanzar error
      return { followers: [] };
    }
  },

  /**
   * Obtiene los usuarios que sigue un usuario
   * Usa el endpoint /auth/following/{id} del backend
   */
  async getFollowing(userIdentifier) {
    try {
      const res = await api.get(`/auth/following/${userIdentifier}`);
      return res.data;
    } catch (error) {
      console.error("[AUTH] Error al obtener seguidos:", error.message);
      // Retornar estructura vacía en lugar de lanzar error
      return { following: [] };
    }
  },

  /**
   * Obtiene los posts de un usuario específico (paginados)
   * Usa el endpoint /posts/user/{id} del backend
   */
  async getUserPosts(userIdentifier, page = 1) {
    try {
      const res = await api.get(`/posts/user/${userIdentifier}`, {
        params: { page },
      });
      return res.data;
    } catch (error) {
      console.error(
        "[AUTH] Error al obtener posts del usuario:",
        error.message
      );
      throw error;
    }
  },

  /**
   * Obtiene los posts de un usuario específico (paginados)
   */
  async getUserPosts(userIdentifier, page = 1) {
    try {
      console.log(
        "[AUTH] Obteniendo posts para usuario:",
        userIdentifier,
        "página:",
        page
      );
      const res = await api.get(`/users/${userIdentifier}/posts`, {
        params: { page },
      });
      console.log("[AUTH] Respuesta de posts:", res.data);
      return res.data;
    } catch (error) {
      console.error("[AUTH] Error al obtener posts del usuario:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  async fetchProfile() {
    try {
      // GET /auth/user para validar token y obtener user actualizado
      // Este endpoint está dentro del grupo middleware auth:sanctum
      const res = await api.get("/auth/user");

      // Adaptarse a la estructura de respuesta
      const userData = res.data?.data || res.data;

      if (userData) {
        const rememberMe = localStorage.getItem(REMEMBER_KEY) === "true";
        this.setUser(userData, rememberMe);
      }

      return userData;
    } catch (error) {
      console.error("Error al obtener perfil:", error);
      // NO hacemos logout automáticamente aquí, dejamos que el componente decida
      // Solo si es 401, el componente limpiará la sesión
      throw error;
    }
  },
  async fetchForeignProfile(usuario_username) {
    try {
      // GET /auth/user para validar token y obtener user actualizado
      // Este endpoint está dentro del grupo middleware auth:sanctum
      const res = await api.get(`/user/${usuario_username}`);
      return res.data;
    } catch (error) {
      console.error("Error al obtener perfil:", error);
      // NO hacemos logout automáticamente aquí, dejamos que el componente decida
      // Solo si es 401, el componente limpiará la sesión
      throw error;
    }
  },

  /**
   * Actualiza los datos del perfil del usuario
   * @param {Object} data - Datos del perfil a actualizar
   * @returns {Promise} Respuesta con el usuario actualizado
   */
  async updateProfile(data) {
    try {
      // Usar POST con _method=PUT para compatibilidad con Laravel
      const formData = new FormData();

      // Agregar _method para method spoofing
      formData.append('_method', 'PUT');

      // Campos obligatorios - siempre deben enviarse
      const requiredFields = ['id', 'name', 'username', 'email'];
      requiredFields.forEach(field => {
        if (data[field]) {
          formData.append(field, String(data[field]));
        }
      });

      // Campos opcionales - solo si tienen valor
      const optionalFields = ['profession', 'gender', 'universidad_id', 'carrera_id'];
      optionalFields.forEach(field => {
        if (data[field] !== null && data[field] !== undefined && data[field] !== '') {
          formData.append(field, String(data[field]));
        }
      });

      // Debug: Mostrar qué se está enviando
      console.log('[AUTH] Actualizando perfil con:');
      for (let pair of formData.entries()) {
        console.log(`  ${pair[0]}: ${pair[1]}`);
      }

      const res = await api.post("/user/edit", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const userData = res.data?.data || res.data;

      if (userData) {
        const rememberMe = localStorage.getItem(REMEMBER_KEY) === "true";
        this.setUser(userData, rememberMe);
      }

      return res.data;
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      console.error("Detalles del error:", {
        status: error.response?.status,
        data: error.response?.data,
        errors: error.response?.data?.errors
      });
      throw error;
    }
  },

  /**
   * Actualiza la imagen de perfil del usuario
   * Usa el mismo endpoint /user/edit pero solo con imagen
   * @param {FormData} formData - FormData con la imagen y datos del usuario (debe incluir _method=PUT)
   * @returns {Promise} Respuesta con el usuario actualizado
   */
  async updateProfileImage(formData) {
    try {
      // IMPORTANTE: Usar POST con _method=PUT porque Laravel no procesa FormData en PUT
      const res = await api.post("/user/edit", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const userData = res.data?.data || res.data;

      if (userData) {
        const rememberMe = localStorage.getItem(REMEMBER_KEY) === "true";
        this.setUser(userData, rememberMe);
      }

      return res.data;
    } catch (error) {
      console.error("Error al actualizar imagen de perfil:", error);
      throw error;
    }
  },
};

export default AuthService;
