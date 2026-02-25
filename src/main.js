import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { IonicVue } from "@ionic/vue";

/* CSS Imports */
import "@ionic/vue/css/core.css";
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
import "./theme/input-override.css";

// --- PUSHER SETUP ---
import Echo from "laravel-echo";
import Pusher from "pusher-js";
import axios from "axios";
import { BASE_URL } from "./services/api"; // <--- IMPORTANTE: Importar la URL

window.Pusher = Pusher;
// Pusher.logToConsole = true; // Descomenta si quieres ver logs

const getAuthToken = () =>
  localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");

window.Echo = new Echo({
  broadcaster: "pusher",
  key: "dbc4b830fe504dac7663",
  cluster: "us2",
  forceTLS: true,

  // Usamos BASE_URL + la ruta correcta de auth
  authEndpoint: `${BASE_URL}/api/chat/auth`,

  auth: {
    headers: {
      Authorization: `Bearer ${getAuthToken()}`,
      Accept: "application/json",
    },
  },
  authorizer: (channel, options) => {
    return {
      authorize: (socketId, callback) => {
        axios
          .post(
            `${BASE_URL}/api/chat/auth`,
            {
              socket_id: socketId,
              channel_name: channel.name,
            },
            {
              headers: {
                Authorization: `Bearer ${getAuthToken()}`,
                Accept: "application/json",
              },
            }
          )
          .then((response) => {
            callback(false, response.data);
          })
          .catch((error) => {
            console.error("Pusher Auth Error:", error);
            callback(true, error);
          });
      },
    };
  },
});

const app = createApp(App).use(IonicVue).use(router);

router.isReady().then(() => {
  app.mount("#app");
});
