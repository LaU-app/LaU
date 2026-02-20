/**
 * Servicio de Seguidores
 * Maneja todas las operaciones relacionadas con seguir/dejar de seguir usuarios
 */

import { api } from './api';

export const followersService = {
    /**
     * Seguir a un usuario
     * @param {number} userId - ID del usuario a seguir
     * @returns {Promise} - Respuesta con el estado actualizado
     */
    async followUser(userId) {
        const endpoints = [
            `/users/${userId}/follow`,  // ✅ Ruta definida en Laravel
        ];

        let lastError = null;

        for (const endpoint of endpoints) {
            try {
                const response = await api.post(endpoint);
                /* console.log(`✅ [FollowersService] Usuario seguido usando: ${endpoint}`, response.data); */
                return {
                    success: true,
                    data: response.data.data || response.data,
                    message: response.data.message
                };
            } catch (error) {
                // Error 404: endpoint no existe
                if (error.response?.status === 404) {
                    /* console.log(`❌ [FollowersService] Endpoint no encontrado: ${endpoint}`); */
                    lastError = error;
                    continue;
                }

                // Error específico: Usuario no encontrado
                const errorMessage = error.response?.data?.message || error.message || '';
                if (errorMessage.includes('No query results') || errorMessage.includes('not found')) {
                    console.error('[FollowersService] ❌ Usuario no encontrado en la base de datos');
                    return {
                        success: false,
                        error: 'Este usuario no existe o fue eliminado'
                    };
                }

                console.error('[FollowersService] Error al seguir usuario:', error);
                return {
                    success: false,
                    error: error.response?.data?.message || 'Error al procesar la solicitud'
                };
            }
        }

        return {
            success: false,
            error: lastError?.response?.data?.message || 'No se encontró un endpoint válido para seguir'
        };
    },

    /**
     * Dejar de seguir a un usuario
     * @param {number} userId - ID del usuario a dejar de seguir
     * @returns {Promise} - Respuesta con el estado actualizado
     */
    async unfollowUser(userId) {
        const endpoints = [
            `/users/${userId}/unfollow`,  // ✅ Ruta definida en Laravel
        ];

        let lastError = null;

        for (const endpoint of endpoints) {
            try {
                const response = await api.post(endpoint);
                /* console.log(`✅ [FollowersService] Usuario dejado de seguir usando: ${endpoint}`, response.data); */
                return {
                    success: true,
                    data: response.data.data || response.data,
                    message: response.data.message
                };
            } catch (error) {
                // Error 404: endpoint no existe
                if (error.response?.status === 404) {
                    /* console.log(`❌ [FollowersService] Endpoint no encontrado: ${endpoint}`); */
                    lastError = error;
                    continue;
                }

                // Error específico: Usuario no encontrado
                const errorMessage = error.response?.data?.message || error.message || '';
                if (errorMessage.includes('No query results') || errorMessage.includes('not found')) {
                    console.error('[FollowersService] ❌ Usuario no encontrado en la base de datos');
                    return {
                        success: false,
                        error: 'Este usuario no existe o fue eliminado'
                    };
                }

                console.error('[FollowersService] Error al dejar de seguir:', error);
                return {
                    success: false,
                    error: error.response?.data?.message || 'Error al procesar la solicitud'
                };
            }
        }

        return {
            success: false,
            error: lastError?.response?.data?.message || 'No se encontró un endpoint válido para dejar de seguir'
        };
    },

    /**
     * Toggle follow/unfollow (alternar entre seguir y dejar de seguir)
     * @param {number} userId - ID del usuario
     * @returns {Promise} - Respuesta con el estado actualizado
     */
    async toggleFollow(userId) {
        // Lista de endpoints posibles según diferentes configuraciones de Laravel
        const endpoints = [
            `/users/${userId}/follow/toggle`,    // ✅ Ruta definida en Laravel
        ];

        let lastError = null;

        // Intentar cada endpoint hasta que uno funcione
        for (const endpoint of endpoints) {
            try {
                const response = await api.post(endpoint);
                /* console.log(`✅ [FollowersService] Toggle follow exitoso usando: ${endpoint}`);
                console.log('[FollowersService] Respuesta completa del backend:', response.data);
                console.log('[FollowersService] Tipo de respuesta:', typeof response.data);
                console.log('[FollowersService] Keys de respuesta:', Object.keys(response.data)); */

                // Normalizar la respuesta del backend
                // Laravel puede retornar: { data: {...} } o directamente {...}
                const data = response.data.data || response.data;

                /* console.log('[FollowersService] Data normalizada:', data);
                console.log('[FollowersService] is_following:', data.is_following);
                console.log('[FollowersService] isFollowing:', data.isFollowing); */

                return {
                    success: true,
                    data: data,
                    message: response.data.message || 'Operación exitosa'
                };
            } catch (error) {
                // Error 404: endpoint no existe
                if (error.response?.status === 404) {
                    /* console.log(`❌ [FollowersService] Endpoint no encontrado: ${endpoint}`); */
                    lastError = error;
                    continue;
                }

                // Error específico: Usuario no encontrado
                const errorMessage = error.response?.data?.message || error.message || '';
                if (errorMessage.includes('No query results') || errorMessage.includes('not found')) {
                    console.error('[FollowersService] ❌ Usuario no encontrado en la base de datos');
                    return {
                        success: false,
                        error: 'Este usuario no existe o fue eliminado'
                    };
                }

                // Otros errores
                console.error('[FollowersService] Error en toggle follow:', error);
                return {
                    success: false,
                    error: error.response?.data?.message || 'Error al procesar la solicitud'
                };
            }
        }

        // Si ningún endpoint funcionó
        console.error('[FollowersService] Ningún endpoint de toggle follow funcionó');
        return {
            success: false,
            error: lastError?.response?.data?.message || 'No se encontró un endpoint válido para toggle follow'
        };
    },

    /**
     * Verificar si sigues a un usuario
     * @param {number} userId - ID del usuario
     * @returns {Promise} - Respuesta con el estado de seguimiento
     */
    async checkFollowStatus(userId) {
        const endpoints = [
            `/users/${userId}/follow/check`,  // ✅ Ruta definida en Laravel
        ];

        let lastError = null;

        for (const endpoint of endpoints) {
            try {
                const response = await api.get(endpoint);
                /* console.log(`✅ [FollowersService] Estado verificado usando: ${endpoint}`); */
                return {
                    success: true,
                    data: response.data.data || response.data
                };
            } catch (error) {
                if (error.response?.status === 404) {
                    /* console.log(`❌ [FollowersService] Endpoint no encontrado: ${endpoint}`); */
                    lastError = error;
                    continue;
                }
                console.error('[FollowersService] Error al verificar estado:', error);
                return {
                    success: false,
                    error: error.response?.data?.message || error.message
                };
            }
        }

        return {
            success: false,
            error: lastError?.response?.data?.message || 'No se encontró un endpoint válido para verificar estado'
        };
    },

    /**
     * Obtener lista de seguidores de un usuario
     * @param {number} userId - ID del usuario
     * @param {number} page - Número de página
     * @returns {Promise} - Lista de seguidores
     */
    async getFollowers(userId, page = 1) {
        const endpoints = [
            `/users/${userId}/followers?page=${page}`,  // ✅ Ruta definida en Laravel
        ];

        let lastError = null;

        for (const endpoint of endpoints) {
            try {
                const response = await api.get(endpoint);
                /* console.log(`✅ [FollowersService] Seguidores obtenidos usando: ${endpoint}`); */
                return {
                    success: true,
                    data: response.data.data || response.data
                };
            } catch (error) {
                if (error.response?.status === 404) {
                    /* console.log(`❌ [FollowersService] Endpoint no encontrado: ${endpoint}`); */
                    lastError = error;
                    continue;
                }
                console.error('[FollowersService] Error al obtener seguidores:', error);
                return {
                    success: false,
                    error: error.response?.data?.message || error.message
                };
            }
        }

        return {
            success: false,
            error: lastError?.response?.data?.message || 'No se encontró un endpoint válido'
        };
    },

    /**
     * Obtener lista de usuarios que sigue un usuario
     * @param {number} userId - ID del usuario
     * @param {number} page - Número de página
     * @returns {Promise} - Lista de usuarios seguidos
     */
    async getFollowing(userId, page = 1) {
        const endpoints = [
            `/users/${userId}/following?page=${page}`,  // ✅ Ruta definida en Laravel
        ];

        let lastError = null;

        for (const endpoint of endpoints) {
            try {
                const response = await api.get(endpoint);
                /* console.log(`✅ [FollowersService] Siguiendo obtenidos usando: ${endpoint}`); */
                return {
                    success: true,
                    data: response.data.data || response.data
                };
            } catch (error) {
                if (error.response?.status === 404) {
                    /* console.log(`❌ [FollowersService] Endpoint no encontrado: ${endpoint}`); */
                    lastError = error;
                    continue;
                }
                console.error('[FollowersService] Error al obtener siguiendo:', error);
                return {
                    success: false,
                    error: error.response?.data?.message || error.message
                };
            }
        }

        return {
            success: false,
            error: lastError?.response?.data?.message || 'No se encontró un endpoint válido'
        };
    },

    /**
     * Obtener estadísticas de seguimiento de un usuario
     * @param {number} userId - ID del usuario
     * @returns {Promise} - Estadísticas de seguidores/siguiendo
     */
    async getStats(userId) {
        const endpoints = [
            `/users/${userId}/follow/stats`,  // ✅ Ruta definida en Laravel
        ];

        let lastError = null;

        for (const endpoint of endpoints) {
            try {
                const response = await api.get(endpoint);
                /* console.log(`✅ [FollowersService] Estadísticas obtenidas usando: ${endpoint}`); */
                return {
                    success: true,
                    data: response.data.data || response.data
                };
            } catch (error) {
                if (error.response?.status === 404) {
                    /* console.log(`❌ [FollowersService] Endpoint no encontrado: ${endpoint}`); */
                    lastError = error;
                    continue;
                }
                console.error('[FollowersService] Error al obtener estadísticas:', error);
                return {
                    success: false,
                    error: error.response?.data?.message || error.message
                };
            }
        }

        return {
            success: false,
            error: lastError?.response?.data?.message || 'No se encontró un endpoint válido'
        };
    },

    /**
     * Obtener los IDs de usuarios que el usuario actual está siguiendo
     * Útil para sincronizar el estado de "siguiendo" en la UI
     * @returns {Promise<Array<number>>} - Array de IDs de usuarios seguidos
     */
    async getFollowingIds() {
        try {
            // Obtener el usuario actual del localStorage
            const currentUser = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
            if (!currentUser.id) {
                console.error('[FollowersService] No hay usuario autenticado');
                return [];
            }

            /* console.log('[FollowersService] Obteniendo lista de usuarios seguidos...'); */

            // Obtener la lista completa de usuarios que sigo
            const result = await this.getFollowing(currentUser.id);

            if (result.success && result.data) {
                // Extraer solo los IDs
                const followingData = result.data.data || result.data;
                const followingIds = Array.isArray(followingData)
                    ? followingData.map(user => user.id || user.following_id)
                    : [];

                /* console.log('[FollowersService] IDs de usuarios seguidos:', followingIds); */
                return followingIds;
            }

            return [];
        } catch (error) {
            console.error('[FollowersService] Error obteniendo following IDs:', error);
            return [];
        }
    }
};
