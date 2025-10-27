import { api } from "./api";

const TOKEN_KEY = "auth_token";
const USER_KEY = "user";

export const AuthService = {
  async login(credentials) {
    try {
      // POST /auth/login con email y password
      const res = await api.post("/auth/login", credentials);

      // Adaptarse a la estructura de respuesta de tu API
      const data = res.data?.data || res.data;

      if (data?.token) {
        localStorage.setItem(TOKEN_KEY, data.token);
      }

      if (data?.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error("Error en login:", error);
      throw error;
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

    // Limpia los datos locales
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  getUser() {
    const userStr = localStorage.getItem(USER_KEY);
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
      // GET /me o /profile para validar token y obtener user actualizado
      // Intenta primero con /me, si falla intenta con /profile
      let res;
      try {
        res = await api.get("/me");
      } catch (error) {
        // Si /me no existe, intenta con /profile
        if (error.response?.status === 404) {
          res = await api.get("/profile");
        } else {
          throw error;
        }
      }

      // Adaptarse a la estructura de respuesta
      const userData = res.data?.data || res.data;

      if (userData) {
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
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
