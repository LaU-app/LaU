//importaciones axios para hacer peticiones HTTP
import axios from "axios";

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
export const API_URL = (configuredApiUrl || (import.meta.env.DEV
  ? "http://127.0.0.1:8000/api"
  : `${window.location.origin}/api`)).replace(/\/+$/, "");
export const BASE_URL = API_URL.replace(/\/api$/, "");

//Creamos una instancia de axios para configuracion basica
const api = axios.create({
  baseURL: API_URL, //url para toodas las peticiones
  headers: {
    "Content-Type": "application/json", //el tipo contenido que enviamos
    Accept: "application/json", //tipo de contenitdo que espero recibir
  },
  timeout: 10000, //10 segundos de espera como max
});

// Interceptor para agregar el token automáticamente a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("auth_token") ||
      sessionStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      /* console.log('[API] Token agregado al request:', token.substring(0, 20) + '...'); */
    } else {
      /* console.warn('[API] No hay token disponible'); */
    }
    /* console.log('[API] Request:', config.method.toUpperCase(), config.url); */
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Interceptor para manejar errores de autenticación globalmente
api.interceptors.response.use(
  (response) => {
    /* console.log('[API] Response OK:', response.config.url, response.status); */
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Opcional: Redirigir a login si expira el token
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// Exportar la instancia de axios directamente para uso en otros servicios
export { api };

// Exportamos funciones simples para cada endpoint (métodos helper)
export default {
  // La instancia de axios con interceptores
  ...api,

  //funcion para probar la conexion con la API
  test: () => {
    return api.get("/test"); // GET http://localhost:8000/api/test
  },

  //funcion para hacer el login y obtener token
  login: (email, password) => {
    return api.post("/auth/login", {
      // POST http://localhost:8000/api/auth/login
      email: email, // se envia el email y la contra
      password: password,
    });
  },

  //funciones para obtener los posts (ya no necesitan token manualmente)
  getPost: () => {
    return api.get("/posts"); // GET http://localhost:8000/api/posts
  },

  // Obtener un post específico por ID
  getPostById: (postId) => {
    return api.get(`/posts/${postId}`); // GET http://localhost:8000/api/posts/{id}
  },

  // Crear un nuevo post (imagen o normal)
  createPost: (formData) => {
    return api.post("/posts", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  getUsers(params = {}) {
      // Axios toma el objeto 'params' y lo convierte automáticamente en 
      // ?page=1&search=Juan&universidad_id=2
      return api.get('/users', { params }); // GET http://localhost:8000/api/users
  },

  // Verificar disponibilidad de username y email
  checkUsernameAvailability: (username) => {
    return api.post("/auth/check-username", { username });
  },

  checkEmailAvailability: (email) => {
    return api.post("/auth/check-email", { email });
  },

  // Endpoints de búsqueda de música
  searchMusic: (query, limit = 20, country = "US") => {
    return api.get("/music/search", {
      params: { query, limit, country },
    });
  },

  getMusicTrack: (trackId) => {
    return api.get("/music/track", {
      params: { trackId },
    });
  },

  searchMusicByGenre: (genre, limit = 10) => {
    return api.get("/music/genre", {
      params: { genre, limit },
    });
  },

  getPopularMusic: (limit = 20, country = "US") => {
    return api.get("/music/popular", {
      params: { limit, country },
    });
  },

  // ✨ NUEVO: Endpoint para buscar actualizaciones de la app ✨
  checkAppUpdate: (currentVersion) => {
    return api.get("/check-update", {
      params: {
        app_version: currentVersion
      }
    }); 
    // Esto generará automáticamente: GET https://api.lauapp.es/api/check-update?app_version=2.0.0
  },

  // Métodos HTTP genéricos para usar en otros servicios
  get: (url, config) => api.get(url, config),
  post: (url, data, config) => api.post(url, data, config),
  put: (url, data, config) => api.put(url, data, config),
  delete: (url, config) => api.delete(url, config),
  patch: (url, data, config) => api.patch(url, data, config),
};
