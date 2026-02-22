import { api } from "./api";
import localforage from "localforage";

// Configurar localforage para pomodoro
const pomodoroStorage = localforage.createInstance({
  name: "SivarSocial",
  storeName: "pomodoro",
});

const syncQueueStorage = localforage.createInstance({
  name: "SivarSocial",
  storeName: "pomodoro_sync_queue",
});

export default {
  /**
   * Iniciar una sesión de Pomodoro
   */
  async startPomodoro({ taskId = null, uuidCliente = null }) {
    const uuid = uuidCliente || crypto.randomUUID();

    const localSession = {
      uuid_cliente: uuid,
      task_id: taskId,
      started_at: new Date().toISOString(),
      status: "running",
      synced: false,
    };

    // Guardar localmente primero
    await pomodoroStorage.setItem(`session:${uuid}`, localSession);
    await pomodoroStorage.setItem("active_session", localSession);

    try {
      const response = await api.post("/pomodoro/start", {
        task_id: taskId,
        uuid_cliente: uuid,
      });

      // Actualizar con datos del servidor
      const serverSession = { ...response.data.data, synced: true };
      await pomodoroStorage.setItem(`session:${uuid}`, serverSession);
      await pomodoroStorage.setItem("active_session", serverSession);

      return response.data;
    } catch (error) {
      console.error(
        "[PomodoroService] Error al iniciar pomodoro, guardando en cola:",
        error
      );

      // Agregar a cola de sincronización
      const queue = (await syncQueueStorage.getItem("queue")) || [];
      queue.push({
        action: "pomodoro_start",
        payload: localSession,
        timestamp: new Date().toISOString(),
      });
      await syncQueueStorage.setItem("queue", queue);

      return {
        success: true,
        data: localSession,
        offline: true,
        message:
          "Sesión iniciada localmente. Se sincronizará cuando haya conexión.",
      };
    }
  },

  /**
   * Completar una sesión de Pomodoro
   */
  async completePomodoro({
    sessionUuid,
    actualDurationSeconds,
    breakType = "short",
  }) {
    const completeData = {
      ended_at: new Date().toISOString(),
      duration_seconds: actualDurationSeconds,
      break_type: breakType,
      status: "completed",
    };

    try {
      const response = await api.post("/pomodoro/complete", {
        session_uuid: sessionUuid,
        actual_duration_seconds: actualDurationSeconds,
        break_type: breakType,
      });

      // Actualizar localmente
      const session = await pomodoroStorage.getItem(`session:${sessionUuid}`);
      if (session) {
        await pomodoroStorage.setItem(`session:${sessionUuid}`, {
          ...session,
          ...response.data.data,
          synced: true,
        });
      }

      // Limpiar sesión activa
      await pomodoroStorage.removeItem("active_session");

      return response.data;
    } catch (error) {
      console.error(
        "[PomodoroService] Error al completar pomodoro, guardando en cola:",
        error
      );

      // Agregar a cola de sincronización
      const queue = (await syncQueueStorage.getItem("queue")) || [];
      queue.push({
        action: "pomodoro_complete",
        payload: {
          session_uuid: sessionUuid,
          actual_duration_seconds: actualDurationSeconds,
          break_type: breakType,
        },
        timestamp: new Date().toISOString(),
      });
      await syncQueueStorage.setItem("queue", queue);

      // Actualizar sesión local
      const session = await pomodoroStorage.getItem(`session:${sessionUuid}`);
      if (session) {
        await pomodoroStorage.setItem(`session:${sessionUuid}`, {
          ...session,
          ...completeData,
          synced: false,
        });
      }

      // Limpiar sesión activa
      await pomodoroStorage.removeItem("active_session");

      return {
        success: true,
        data: { session_uuid: sessionUuid, ...completeData },
        offline: true,
        message:
          "Pomodoro completado localmente. Se sincronizará cuando haya conexión.",
      };
    }
  },

  /**
   * Cancelar una sesión de Pomodoro
   */
  async cancelPomodoro({ sessionUuid }) {
    try {
      const response = await api.post("/pomodoro/cancel", {
        session_uuid: sessionUuid,
      });

      // Actualizar localmente
      const session = await pomodoroStorage.getItem(`session:${sessionUuid}`);
      if (session) {
        await pomodoroStorage.setItem(`session:${sessionUuid}`, {
          ...session,
          status: "cancelled",
          ended_at: new Date().toISOString(),
          synced: true,
        });
      }

      // Limpiar sesión activa
      await pomodoroStorage.removeItem("active_session");

      return response.data;
    } catch (error) {
      console.error("[PomodoroService] Error al cancelar pomodoro:", error);

      // Limpiar sesión activa de todos modos
      await pomodoroStorage.removeItem("active_session");

      throw error;
    }
  },

  /**
   * Obtener sesión activa
   */
  async getActiveSession() {
    try {
      const response = await api.get("/pomodoro/active");

      // Guardar localmente
      await pomodoroStorage.setItem("active_session", response.data.data);

      return response.data;
    } catch (error) {
      // Si falla, buscar en local
      const localSession = await pomodoroStorage.getItem("active_session");
      if (localSession && localSession.status === "running") {
        return { success: true, data: localSession, offline: true };
      }

      // Si no hay sesión activa, retornar null en lugar de error
      if (error.response?.status === 404) {
        await pomodoroStorage.removeItem("active_session");
        return { success: false, data: null };
      }

      throw error;
    }
  },

  /**
   * Obtener historial de sesiones
   */
  async getSessions({ status = null, taskId = null, period = null } = {}) {
    try {
      const params = {};
      if (status) params.status = status;
      if (taskId) params.task_id = taskId;
      if (period) params.period = period;

      const response = await api.get("/pomodoro/sessions", { params });

      // Guardar en cache
      await pomodoroStorage.setItem("sessions_cache", response.data.data);

      return response.data;
    } catch (error) {
      console.error("[PomodoroService] Error al obtener sesiones:", error);

      // Intentar obtener del cache
      const cachedSessions = await pomodoroStorage.getItem("sessions_cache");
      if (cachedSessions) {
        return { success: true, data: cachedSessions };
      }

      throw error;
    }
  },

  /**
   * Obtener estadísticas de Pomodoro
   */
  async getPomodoroStats() {
    try {
      const response = await api.get("/pomodoro/stats");

      // Guardar en cache
      await pomodoroStorage.setItem("stats_cache", response.data.data);

      return response.data;
    } catch (error) {
      console.error("[PomodoroService] Error al obtener estadísticas:", error);

      // Intentar obtener del cache
      const cachedStats = await pomodoroStorage.getItem("stats_cache");
      if (cachedStats) {
        return { success: true, data: cachedStats };
      }

      throw error;
    }
  },

  /**
   * Obtener ranking semanal de pomodoros (podio)
   */
  async getWeeklyLeaderboard() {
    try {
      const response = await api.get("/pomodoro/leaderboard", {
        params: { period: "week" },
      });
      // cache result
      await pomodoroStorage.setItem("leaderboard_week", response.data.data);
      return response.data;
    } catch (error) {
      console.error(
        "[PomodoroService] Error al obtener leaderboard semanal:",
        error
      );
      const cached = await pomodoroStorage.getItem("leaderboard_week");
      if (cached) return { success: true, data: cached };
      throw error;
    }
  },

  /**
   * Sincronizar cola de pendientes
   */
  async flushSyncQueue() {
    const queue = (await syncQueueStorage.getItem("queue")) || [];
    const failedItems = [];

    for (const item of queue) {
      try {
        if (item.action === "pomodoro_start") {
          await api.post("/pomodoro/start", item.payload);
          console.log(
            "[PomodoroService] Inicio de pomodoro sincronizado:",
            item.payload.uuid_cliente
          );
        } else if (item.action === "pomodoro_complete") {
          await api.post("/pomodoro/complete", item.payload);
          console.log(
            "[PomodoroService] Completado de pomodoro sincronizado:",
            item.payload.session_uuid
          );
        }
      } catch (error) {
        console.error("[PomodoroService] Error al sincronizar item:", error);
        failedItems.push(item);
      }
    }

    // Guardar solo los items que fallaron
    await syncQueueStorage.setItem("queue", failedItems);

    return {
      synced: queue.length - failedItems.length,
      failed: failedItems.length,
    };
  },

  /**
   * Limpiar cache local
   */
  async clearCache() {
    await pomodoroStorage.clear();
    await syncQueueStorage.clear();
  },
};
