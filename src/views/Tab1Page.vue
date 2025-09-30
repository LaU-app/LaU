<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>API Test - SivarSocialApp</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">

      <!-- SECCIÓN 1: Probar conexión básica -->
      <div class="section">
        <h2>1. Test de Conexión</h2>
        <p>Resultado:</p>
        <pre style="color: black;">{{ testResult }}</pre>
      </div>

      <!-- SECCIÓN 2: Login y obtener token -->
      <div class="section">
        <h2>2. Login Test</h2>
        <p>Token obtenido:</p>
        <pre style="color: black;">{{ loginResult }}</pre>
      </div>

      <!-- SECCIÓN 3: Mostrar posts -->
      <div class="section">
        <h2>3. Posts desde API</h2>
        <p>Posts obtenidos:</p>
        <pre style="color: black;">{{ postsResult }}</pre>
      </div>

      <!-- SECCIÓN 4: Mostrar usuarios -->
      <div class="section">
        <h2>4. Usuarios desde API</h2>
        <div v-if="users.length > 0">
          <!-- Lista simple de usuarios -->
          <ul>
            <li v-for="user in users" :key="user.id">
              <strong style="color: black;">{{ user.name }}</strong><br>
              <span style="color: black;">{{ user.email }}</span><br>
              <span style="color: black;">@{{ user.username }}</span>
            </li>
          </ul>
        </div>
        <pre style="color: black;" v-else>{{ usersResult }}</pre>
      </div>

    </ion-content>
  </ion-page>
</template>

<script>
import api from '../services/api.js'
export default {
  name: 'Tab1Page',
  // Definimos las variables reactivas que vamos a usar
  data() {
    return {
      testResult: 'Sin datos aún...',      // Resultado del test de conexión
      loginResult: 'Sin datos aún...',     // Resultado del login
      postsResult: 'Sin datos aún...',     // Resultado de obtener posts
      usersResult: 'Sin datos aún...',     // Resultado de obtener usuarios (texto)
      users: [],                           // Array de usuarios para mostrar en lista
      token: null                          // Token de autenticación
    }
  },

  // Función que se ejecuta cuando se monta el componente
  async mounted() {
    console.log('Componente montado, iniciando pruebas API...')

    // Ejecutamos las pruebas en orden
    await this.testConnection()      // Paso 1: Probar conexión
    await this.testLogin()          // Paso 2: Hacer login
    await this.testGetPosts()       // Paso 3: Obtener posts
    await this.testGetUsers()       // Paso 4: Obtener usuarios
  },

  // Definimos los métodos del componente
  methods: {

    // MÉTODO 1: Probar la conexión básica con la API
    async testConnection() {
      try {
        console.log('Probando conexión con API...')

        // Hacemos la petición al endpoint de test
        const response = await api.test()

        // Si llega aquí, la petición fue exitosa
        this.testResult = JSON.stringify(response.data, null, 2)
        console.log('Test de conexión exitoso:', response.data)

      } catch (error) {
        // Si hay error, lo mostramos
        this.testResult = `ERROR: ${error.message}`
        console.error('Error en test de conexión:', error)
      }
    },

    // MÉTODO 2: Hacer login para obtener un token
    async testLogin() {
      try {
        console.log('Intentando hacer login...')

        // IMPORTANTE: Cambia estos datos por un usuario real de tu base de datos
        const email = 'mateocanalespinto@gmail.com'        // ← CAMBIA ESTO
        const password = 'itca123'            // ← CAMBIA ESTO

        // Hacemos la petición de login
        const response = await api.login(email, password)

        // Si el login es exitoso, guardamos el token
        if (response.data.success && response.data.data.token) {
          this.token = response.data.data.token
          this.loginResult = JSON.stringify(response.data, null, 2)
          console.log('Login exitoso, token obtenido')
        } else {
          this.loginResult = 'Login falló: ' + JSON.stringify(response.data, null, 2)
        }

      } catch (error) {
        this.loginResult = `ERROR: ${error.response?.data?.message || error.message}`
        console.error('Error en login:', error)
      }
    },

    // MÉTODO 3: Obtener posts usando el token
    async testGetPosts() {
      try {
        console.log('Obteniendo posts...')

        // Verificamos que tenemos un token
        if (!this.token) {
          this.postsResult = 'ERROR: No hay token disponible'
          return
        }

        // Hacemos la petición para obtener posts
        const response = await api.getPost(this.token)

        // Mostramos el resultado
        this.postsResult = JSON.stringify(response.data, null, 2)
        console.log('Posts obtenidos:', response.data)

      } catch (error) {
        this.postsResult = `ERROR: ${error.response?.data?.message || error.message}`
        console.error('Error obteniendo posts:', error)
      }
    },

    // MÉTODO 4: Obtener usuarios usando el token
    async testGetUsers() {
      try {
        console.log('Obteniendo usuarios...')

        // Verificamos que tenemos un token
        if (!this.token) {
          this.usersResult = 'ERROR: No hay token disponible'
          return
        }

        // Hacemos la petición para obtener usuarios
        const response = await api.getUsers(this.token)

        // Si la respuesta es exitosa, procesamos los datos
        if (response.data.success && response.data.data) {
          // Guardamos los usuarios en el array para mostrar en la lista
          this.users = response.data.data.data || response.data.data

          // También guardamos el JSON completo para mostrar como texto
          this.usersResult = JSON.stringify(response.data, null, 2)

          console.log('Usuarios obtenidos:', this.users)
        } else {
          this.usersResult = 'No se obtuvieron usuarios: ' + JSON.stringify(response.data, null, 2)
        }

      } catch (error) {
        this.usersResult = `ERROR: ${error.response?.data?.message || error.message}`
        console.error('Error obteniendo usuarios:', error)
      }
    }
  }

}
</script>

<style>
.section {
  margin-bottom: 2rem;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f9f9f9;
}

.section h2 {
  color: #333;
  margin-bottom: 0.5rem;
}

pre {
  background: #fff;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.8rem;
  border: 1px solid #ccc;
}
</style>
