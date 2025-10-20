//importaciones axios para hacer peticiones HTTP
import axios from "axios";

const API_URL = "http://localhost:8000/api";

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
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
    }
    return Promise.reject(error);
  }
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

  getUsers: () => {
    return api.get("/users"); // GET http://localhost:8000/api/users
  },

  // Métodos HTTP genéricos para usar en otros servicios
  get: (url, config) => api.get(url, config),
  post: (url, data, config) => api.post(url, data, config),
  put: (url, data, config) => api.put(url, data, config),
  delete: (url, config) => api.delete(url, config),
  patch: (url, data, config) => api.patch(url, data, config),
};
