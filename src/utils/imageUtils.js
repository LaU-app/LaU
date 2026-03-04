import { BASE_URL } from "@/services/api";

/**
 * Convierte URLs de imágenes relativas a URLs absolutas
 * @param {string} imageUrl - URL de la imagen (puede ser relativa o absoluta)
 * @returns {string} URL absoluta de la imagen
 */
export const getFullImageUrl = (imageUrl) => {
  if (!imageUrl) return "";

  // Si ya es una URL completa, devolverla tal cual
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }

  // Si es una ruta relativa, agregar BASE_URL
  const cleanPath = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  return `${BASE_URL}${cleanPath}`;
};
