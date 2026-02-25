import { api } from '@/services/api'; // Usamos tu misma instancia ya configurada

export default {
    async getActiveBanner() {
        try {
            // Como 'api' ya tiene la baseURL (/api) y el token, solo llamamos la ruta final
            const response = await api.get('/banners/active');
            
            // Adaptamos por si tu interceptor o Laravel devuelve la data anidada
            return response.data?.data || response.data; 
        } catch (error) {
            console.error('Error cargando el banner:', error);
            return null;
        }
    },

    async markAsViewed(bannerId) {
        try {
            await api.post(`/banners/${bannerId}/view`);
            return true;
        } catch (error) {
            console.error('Error marcando el banner como visto:', error);
            return false;
        }
    }
}