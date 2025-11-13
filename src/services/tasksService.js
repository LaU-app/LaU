import { api } from "./api";
import localforage from "localforage";

// Configurar localforage para tareas
const tasksStorage = localforage.createInstance({
  name: "SivarSocial",
  storeName: "tasks",
});

const syncQueueStorage = localforage.createInstance({
  name: "SivarSocial",
  storeName: "sync_queue",
});

export default {
  /**
   * Obtener todas las tareas con filtros
   */
  async getTasks({
    status = null,
    priority = null,
    search = null,
    sortBy = "created_at",
    sortOrder = "desc",
    overdue = false,
    page = null,
  } = {}) {
    try {
      const params = {};
      if (status) params.status = status;
      if (priority) params.priority = priority;
      if (search) params.search = search;
      if (overdue) params.overdue = true;
      params.sort_by = sortBy;
      params.sort_order = sortOrder;
      if (page) params.page = page;

      const response = await api.get("/tasks", { params });

      // Guardar en cache local
      await tasksStorage.setItem("tasks_cache", response.data.data);

      return response.data;
    } catch (error) {
      console.error("[TasksService] Error al obtener tareas:", error);

      // Si falla, intentar obtener del cache local
      const cachedTasks = await tasksStorage.getItem("tasks_cache");
      if (cachedTasks) {
        console.log("[TasksService] Retornando tareas del cache");
        return { success: true, data: cachedTasks };
      }

      throw error;
    }
  },

  /**
   * Obtener una tarea específica por ID
   */
  async getTaskById(taskId) {
    try {
      const response = await api.get(`/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      console.error("[TasksService] Error al obtener tarea:", error);
      throw error;
    }
  },

  /**
   * Crear una nueva tarea
   */
  async createTask(taskData) {
    const uuid = crypto.randomUUID();
    const localTask = {
      uuid_cliente: uuid,
      title: taskData.title,
      description: taskData.description || null,
      priority: taskData.priority || "medium",
      due_date: taskData.due_date || null,
      estimated_pomodoros: taskData.estimated_pomodoros || null,
      status: "pending",
      created_at: new Date().toISOString(),
      synced: false,
    };

    // Guardar localmente primero
    await tasksStorage.setItem(`task:${uuid}`, localTask);

    try {
      const response = await api.post("/tasks", {
        ...taskData,
        uuid_cliente: uuid,
      });

      // Actualizar con datos del servidor
      await tasksStorage.setItem(`task:${uuid}`, {
        ...response.data.data,
        synced: true,
      });

      return response.data;
    } catch (error) {
      console.error(
        "[TasksService] Error al crear tarea, agregando a cola de sync:",
        error
      );

      // Agregar a cola de sincronización
      const queue = (await syncQueueStorage.getItem("queue")) || [];
      queue.push({
        action: "task_create",
        payload: localTask,
        timestamp: new Date().toISOString(),
      });
      await syncQueueStorage.setItem("queue", queue);

      return {
        success: true,
        data: localTask,
        offline: true,
        message:
          "Tarea guardada localmente. Se sincronizará cuando haya conexión.",
      };
    }
  },

  /**
   * Actualizar una tarea existente
   */
  async updateTask(taskId, taskData) {
    try {
      const response = await api.put(`/tasks/${taskId}`, taskData);
      return response.data;
    } catch (error) {
      console.error("[TasksService] Error al actualizar tarea:", error);

      // Agregar a cola de sincronización
      const queue = (await syncQueueStorage.getItem("queue")) || [];
      queue.push({
        action: "task_update",
        payload: { id: taskId, ...taskData },
        timestamp: new Date().toISOString(),
      });
      await syncQueueStorage.setItem("queue", queue);

      throw error;
    }
  },

  /**
   * Eliminar una tarea
   */
  async deleteTask(taskId) {
    try {
      const response = await api.delete(`/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      console.error("[TasksService] Error al eliminar tarea:", error);
      throw error;
    }
  },

  /**
   * Obtener estadísticas de tareas
   */
  async getTasksStats() {
    try {
      const response = await api.get("/tasks-stats");

      // Guardar en cache
      await tasksStorage.setItem("stats_cache", response.data.data);

      return response.data;
    } catch (error) {
      console.error("[TasksService] Error al obtener estadísticas:", error);

      // Intentar obtener del cache
      const cachedStats = await tasksStorage.getItem("stats_cache");
      if (cachedStats) {
        return { success: true, data: cachedStats };
      }

      throw error;
    }
  },

  /**
   * Marcar tarea como completada
   */
  async completeTask(taskId) {
    return this.updateTask(taskId, {
      status: "completed",
      completed_at: new Date().toISOString(),
    });
  },

  /**
   * Sincronizar cola de tareas pendientes
   */
  async flushSyncQueue() {
    const queue = (await syncQueueStorage.getItem("queue")) || [];
    const failedItems = [];

    console.log(`[TasksService] Sincronizando ${queue.length} items en cola`);

    for (const item of queue) {
      try {
        if (item.action === "task_create") {
          await api.post("/tasks", item.payload);
          console.log(
            "[TasksService] Tarea creada sincronizada:",
            item.payload.uuid_cliente
          );
        } else if (item.action === "task_update") {
          const { id, ...data } = item.payload;
          await api.put(`/tasks/${id}`, data);
          console.log("[TasksService] Tarea actualizada sincronizada:", id);
        }
      } catch (error) {
        console.error("[TasksService] Error al sincronizar item:", error);
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
    await tasksStorage.clear();
    await syncQueueStorage.clear();
  },
};
