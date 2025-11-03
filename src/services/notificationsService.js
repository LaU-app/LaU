/**
 * Servicio de Notificaciones
 * Maneja todas las operaciones relacionadas con notificaciones de usuarios
 * 
 * IMPORTANTE: El backend envía los datos en:
 * - from_user_data: Información del usuario que generó la notificación
 * - post_data: Información del post relacionado (si existe)
 */

import { api } from './api';

export const notificationsService = {
    /**
     * Obtener todas las notificaciones del usuario autenticado
     * @param {number} page - Número de página para paginación
     * @returns {Promise} - Respuesta con las notificaciones
     */
    async getNotifications(page = 1) {
        try {
            const response = await api.get(`/notifications?page=${page}`);
            return response.data;
        } catch (error) {
            console.error('[NotificationsService] Error al obtener notificaciones:', error);
            throw error;
        }
    },

    /**
     * Obtener solo las notificaciones no leídas
     * @returns {Promise} - Respuesta con las notificaciones no leídas
     */
    async getUnreadNotifications() {
        try {
            const response = await api.get('/notifications/unread');
            return response.data;
        } catch (error) {
            console.error('[NotificationsService] Error al obtener notificaciones no leídas:', error);
            throw error;
        }
    },

    /**
     * Obtener el contador de notificaciones no leídas
     * @returns {Promise} - Respuesta con el contador
     */
    async getUnreadCount() {
        try {
            const response = await api.get('/notifications/count');
            return response.data;
        } catch (error) {
            console.error('[NotificationsService] Error al obtener contador:', error);
            throw error;
        }
    },

    /**
     * Marcar una notificación específica como leída
     * @param {number} notificationId - ID de la notificación
     * @returns {Promise} - Respuesta de la operación
     */
    async markAsRead(notificationId) {
        try {
            const response = await api.put(`/notifications/${notificationId}/read`);
            return response.data;
        } catch (error) {
            console.error('[NotificationsService] Error al marcar como leída:', error);
            throw error;
        }
    },

    /**
     * Marcar todas las notificaciones como leídas
     * @returns {Promise} - Respuesta de la operación
     */
    async markAllAsRead() {
        try {
            const response = await api.put('/notifications/read-all');
            return response.data;
        } catch (error) {
            console.error('[NotificationsService] Error al marcar todas como leídas:', error);
            throw error;
        }
    },

    /**
     * Eliminar una notificación específica
     * @param {number} notificationId - ID de la notificación
     * @returns {Promise} - Respuesta de la operación
     */
    async deleteNotification(notificationId) {
        try {
            const response = await api.delete(`/notifications/${notificationId}`);
            return response.data;
        } catch (error) {
            console.error('[NotificationsService] Error al eliminar notificación:', error);
            throw error;
        }
    },

    /**
     * Eliminar todas las notificaciones leídas
     * @returns {Promise} - Respuesta de la operación
     */
    async clearReadNotifications() {
        try {
            const response = await api.delete('/notifications/clear-read');
            return response.data;
        } catch (error) {
            console.error('[NotificationsService] Error al limpiar notificaciones:', error);
            throw error;
        }
    },

    /**
     * Obtener notificaciones filtradas por tipo
     * @param {string} type - Tipo de notificación (like, comment, follow)
     * @param {number} page - Número de página
     * @returns {Promise} - Respuesta con las notificaciones filtradas
     */
    async getNotificationsByType(type, page = 1) {
        try {
            const response = await api.get(`/notifications/type?type=${type}&page=${page}`);
            return response.data;
        } catch (error) {
            console.error('[NotificationsService] Error al obtener notificaciones por tipo:', error);
            throw error;
        }
    }
};
