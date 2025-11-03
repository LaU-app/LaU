import { api } from "./api";

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

      return data;
    } catch (error) {
      console.error("Error en login:", error);
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

  async updateProfile(data) {
    try {
      // PUT /profile para actualizar datos del usuario
      const res = await api.put("/profile", data);

      if (res.data) {
        localStorage.setItem(USER_KEY, JSON.stringify(res.data));
      }

      return res.data;
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      throw error;
    }
  },
};

export default AuthService;
