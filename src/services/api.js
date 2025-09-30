//importaciones axios para hacer peticiones HTTP
import axios from 'axios'

const API_URL = 'http://localhost:8000/api'

//Creamos una instancia de axios para configuracion basica
const api = axios.create({
    baseURL: API_URL, //url para toodas las peticiones
    headers: {
        'Content-Type': 'application/json', //el tipo contenido que enviamos 
        'Accept': 'application/json' //tipo de contenitdo que espero recibir
    },
    timeout: 10000 //10 segundos de espera como max
})

//Exportamos funciones simples para cada endpoint
export default {
    //funcion para probar la conexion con la API
    test: () => {
        return api.get('/test') // GET http://localhost:8000/api/test
    },

    //funcion para hacer el login y obtener token
    login: (email, password) => {
        return api.post('/auth/login', { // POST http://localhost:8000/api/auth/login
            email: email, // se envia el email y la contra
            password: password
        })
    },

    //funciones para obtener los posts
    getPost: (token) => {
        return api.get('/posts', { // GET http://localhost:8000/api/posts
            headers: {
                'Authorization': `Bearer ${token}` // enviamos el token en el header
            }
        })
    },

    getUsers: (token) => {
        return api.get('/users', {  // GET http://localhost:8000/api/users
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
    }
}