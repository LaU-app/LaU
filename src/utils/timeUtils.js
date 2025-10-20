/**
 * Utilidades de tiempo compartidas
 * Principio SOLID: Single Responsibility - Solo maneja formateo de tiempo
 */

/**
 * Calcula el tiempo transcurrido desde una fecha
 * @param {string} iso - Fecha en formato ISO
 * @returns {string} Tiempo transcurrido en formato legible
 */
export function timeAgo(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "justo ahora";
  if (diffMin < 60) return `${diffMin} min`;
  if (diffHour < 24) return `${diffHour} h`;
  if (diffDay < 7) return `${diffDay} días`;
  return date.toLocaleDateString();
}

/**
 * Formatea una fecha completa
 * @param {string} iso - Fecha en formato ISO
 * @returns {string} Fecha formateada
 */
export function formatDate(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Formatea una fecha con hora
 * @param {string} iso - Fecha en formato ISO
 * @returns {string} Fecha y hora formateadas
 */
export function formatDateTime(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
