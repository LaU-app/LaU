import api from "./api";

export const UniversidadService = {
  /**
   * Obtiene todas las universidades disponibles
   */
  async getUniversidades() {
    const response = await api.get("/universidades");
    return response.data;
  },

  /**
   * Obtiene las carreras de una universidad específica
   */
  async getCarreras(universidadId) {
    const response = await api.get(`/universidades/${universidadId}/carreras`);
    return response.data;
  },

  /**
   * Obtiene todas las carreras disponibles
   */
  async getAllCarreras() {
    const response = await api.get("/carreras");
    return response.data;
  },
};
