import { ref, onMounted, onUnmounted } from "vue";
import tasksService from "@/services/tasksService";
import pomodoroService from "@/services/pomodoroService";

export function useSyncQueue() {
  const isSyncing = ref(false);
  const syncInterval = ref(null);
  const SYNC_INTERVAL_MS = 60000; // 1 minuto

  const syncAll = async () => {
    if (isSyncing.value) return;

    isSyncing.value = true;

    try {
      // Sincronizar tareas
      const tasksResult = await tasksService.flushSyncQueue();

      // Sincronizar sesiones de pomodoro
      const pomodoroResult = await pomodoroService.flushSyncQueue();

      const totalSynced = tasksResult.synced + pomodoroResult.synced;
      const totalFailed = tasksResult.failed + pomodoroResult.failed;

      return {
        success: true,
        synced: totalSynced,
        failed: totalFailed,
      };
    } catch (error) {
      console.error("[SyncQueue] Error durante sincronización:", error);
      return {
        success: false,
        error,
      };
    } finally {
      isSyncing.value = false;
    }
  };

  const startAutoSync = () => {
    // Sincronizar inmediatamente
    syncAll();

    // Configurar sincronización periódica
    syncInterval.value = setInterval(() => {
      syncAll();
    }, SYNC_INTERVAL_MS);
  };

  const stopAutoSync = () => {
    if (syncInterval.value) {
      clearInterval(syncInterval.value);
      syncInterval.value = null;
      /* console.log("[SyncQueue] Auto-sincronización desactivada"); */
    }
  };

  onMounted(() => {
    // Escuchar evento de conexión
    window.addEventListener("online", syncAll);
    startAutoSync();
  });

  onUnmounted(() => {
    window.removeEventListener("online", syncAll);
    stopAutoSync();
  });

  return {
    isSyncing,
    syncAll,
    startAutoSync,
    stopAutoSync,
  };
}
