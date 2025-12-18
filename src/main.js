import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { IonicVue } from "@ionic/vue";

/* Core CSS required for Ionic components to work properly */
import "@ionic/vue/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/vue/css/normalize.css";
import "@ionic/vue/css/structure.css";
import "@ionic/vue/css/typography.css";

import "@ionic/vue/css/padding.css";
import "@ionic/vue/css/float-elements.css";
import "@ionic/vue/css/text-alignment.css";
import "@ionic/vue/css/text-transformation.css";
import "@ionic/vue/css/flex-utils.css";
import "@ionic/vue/css/display.css";

/* Theme variables */
import "./theme/variables.css";
import "./theme/input-override.css"; // Tus estilos personalizados

// --- CONFIGURACIÓN DEL CHAT (PUSHER) ---
import Echo from "laravel-echo";
import Pusher from "pusher-js";
import axios from "axios"; // Importar axios directamente

// Activar logs para ver "Pusher : ..." en la consola
window.Pusher = Pusher;
Pusher.logToConsole = true;

// Función para obtener el token
const getAuthToken = () =>
  localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");

// URL Base de tu API (Úsala igual que en tu archivo api.js)
// Si estás en navegador usa localhost, si es Android usa tu IP
const API_URL = "http://127.0.0.1:8000";

window.Echo = new Echo({
  broadcaster: "pusher",
  key: "dbc4b830fe504dac7663", 
  cluster: "us2", 
  forceTLS: true,

  // Ruta de autenticación
  authEndpoint: `${API_URL}/api/chat/auth`,

  auth: {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      Accept: "application/json",
    },
  },
  // Autorizador personalizado para enviar el token correctamente
  authorizer: (channel, options) => {
    return {
      authorize: (socketId, callback) => {
        axios
          .post(
            `${API_URL}/api/chat/auth`,
            {
              socket_id: socketId,
              channel_name: channel.name,
            },
            {
              headers: {
                Authorization: `Bearer ${getAuthToken()}`,
              },
            }
          )
          .then((response) => {
            callback(false, response.data);
          })
          .catch((error) => {
            console.error("❌ Error Auth Pusher:", error);
            callback(true, error);
          });
      },
    };
  },
});

// --- INICIALIZAR APP ---
const app = createApp(App).use(IonicVue).use(router);

router.isReady().then(() => {
  app.mount("#app");
});
