import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";
import api from "./api";

class PushNotificationsService {
  constructor() {
    this.isInitialized = false;
    this.currentToken = null;
  }

  /**
   * Inicializa el servicio de notificaciones push
   */
  async initialize() {
    if (this.isInitialized) {
      console.log("Push notifications already initialized");
      return;
    }

    try {
      // Agregar listeners
      await this.addListeners();

      // Registrar notificaciones
      await this.registerNotifications();

      this.isInitialized = true;
      console.log("Push notifications initialized successfully");
    } catch (error) {
      console.error("Error initializing push notifications:", error);
      throw error;
    }
  }

  /**
   * Agregar todos los listeners necesarios
   */
  async addListeners() {
    // Listener para cuando se registra exitosamente
    await PushNotifications.addListener("registration", async (token) => {
      console.info("Push registration success, token:", token.value);
      this.currentToken = token.value;

      // Enviar el token al backend
      await this.sendTokenToBackend(token.value);
    });

    // Listener para errores de registro
    await PushNotifications.addListener("registrationError", (error) => {
      console.error("Push registration error:", error.error);
    });

    // Listener para cuando se recibe una notificación (app en foreground)
    await PushNotifications.addListener(
      "pushNotificationReceived",
      // 2. Convertir la función a 'async'
      async (notification) => {
        console.log("Push notification received:", notification);

        // 3. AÑADIDO: Mostrar una notificación local
        // ya que la app está en primer plano
        try {
          await LocalNotifications.schedule({
            notifications: [
              {
                title: notification.title || "Nueva Notificación",
                body: notification.body || "",
                // Usar un ID único (basado en la hora o el ID de la notificación si existe)
                id: notification.id
                  ? parseInt(notification.id.replace(/\D/g, "").substring(0, 9))
                  : new Date().getTime(),
                extra: notification.data,
                // Asegúrate de tener un icono 'push_icon.png' en
                // android/app/src/main/res/drawable-XXXX/
                smallIcon: "res://push_icon", 
              },
            ],
          });
        } catch (e) {
          console.error("Error showing local notification", e);
        }

        // Emitir evento personalizado para que otros componentes lo escuchen
        window.dispatchEvent(
          new CustomEvent("pushNotificationReceived", {
            detail: {
              title: notification.title,
              body: notification.body,
              data: notification.data,
              id: notification.id,
            },
          })
        );
      }
    );

    // Listener para cuando el usuario hace tap en una notificación
    await PushNotifications.addListener(
      "pushNotificationActionPerformed",
      (notification) => {
        console.log("Push notification action performed:", notification);

        // Manejar la navegación según el tipo de notificación
        this.handleNotificationAction(notification);
      }
    );
  }

  /**
   * Verifica y solicita permisos, luego registra las notificaciones
   */
  async registerNotifications() {
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === "prompt") {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== "granted") {
      console.warn("Push notification permission denied");
      throw new Error("User denied push notification permissions");
    }

    await PushNotifications.register();
  }

  /**
   * Enviar el token FCM/APNS al backend
   */
  async sendTokenToBackend(token) {
    try {
      const response = await api.post("/notifications/register-device", {
        device_token: token,
        platform: this.getPlatform(),
      });

      if (response.data.success) {
        console.log("Device token registered on backend");
      }
    } catch (error) {
      console.error("Error sending token to backend:", error);
      // No lanzar error aquí para no interrumpir el flujo
    }
  }

  /**
   * Eliminar el token del backend al cerrar sesión
   */
  async removeTokenFromBackend() {
    if (!this.currentToken) return;

    try {
      await api.post("/notifications/unregister-device", {
        device_token: this.currentToken,
      });
      console.log("Device token removed from backend");
    } catch (error) {
      console.error("Error removing token from backend:", error);
    }
  }

  /**
   * Desregistrar notificaciones push
   */
  async unregister() {
    try {
      await this.removeTokenFromBackend();
      await PushNotifications.unregister();
      await PushNotifications.removeAllListeners();
      this.isInitialized = false;
      this.currentToken = null;
      console.log("Push notifications unregistered");
    } catch (error) {
      console.error("Error unregistering push notifications:", error);
    }
  }

  /**
   * Manejar las acciones cuando se hace tap en una notificación
   */
  handleNotificationAction(notification) {
    const { data } = notification.notification;

    // Emitir evento para que el router lo maneje
    window.dispatchEvent(
      new CustomEvent("pushNotificationAction", {
        detail: {
          type: data?.type,
          postId: data?.post_id,
          userId: data?.user_id,
          notificationId: data?.notification_id,
          actionId: notification.actionId,
        },
      })
    );
  }

  /**
   * Obtener notificaciones entregadas
   */
  async getDeliveredNotifications() {
    try {
      const result = await PushNotifications.getDeliveredNotifications();
      return result.notifications;
    } catch (error) {
      console.error("Error getting delivered notifications:", error);
      return [];
    }
  }

  /**
   * Eliminar notificaciones específicas
   */
  async removeDeliveredNotifications(notificationIds) {
    try {
      await PushNotifications.removeDeliveredNotifications({
        notifications: notificationIds.map((id) => ({ id })),
      });
    } catch (error) {
      console.error("Error removing delivered notifications:", error);
    }
  }

  /**
   * Eliminar todas las notificaciones entregadas
   */
  async removeAllDeliveredNotifications() {
    try {
      await PushNotifications.removeAllDeliveredNotifications();
    } catch (error) {
      console.error("Error removing all delivered notifications:", error);
    }
  }

  /**
   * Crear un canal de notificaciones (solo Android)
   */
  async createChannel(channel) {
    try {
      await PushNotifications.createChannel(channel);
      console.log("Notification channel created:", channel.id);
    } catch (error) {
      console.error("Error creating notification channel:", error);
    }
  }

  /**
   * Listar canales de notificaciones (solo Android)
   */
  async listChannels() {
    try {
      const result = await PushNotifications.listChannels();
      return result.channels;
    } catch (error) {
      console.error("Error listing channels:", error);
      return [];
    }
  }

  /**
   * Eliminar un canal de notificaciones (solo Android)
   */
  async deleteChannel(channelId) {
    try {
      await PushNotifications.deleteChannel({ id: channelId });
      console.log("Notification channel deleted:", channelId);
    } catch (error) {
      console.error("Error deleting notification channel:", error);
    }
  }

  /**
   * Obtener la plataforma actual
   */
  getPlatform() {
    // Detectar plataforma
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;

    if (/android/i.test(userAgent)) {
      return "android";
    }

    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      return "ios";
    }

    return "web";
  }

  /**
   * Verificar si las notificaciones push están disponibles
   */
  isAvailable() {
    return this.getPlatform() !== "web";
  }
}

export const pushNotificationsService = new PushNotificationsService();