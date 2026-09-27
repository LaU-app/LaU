/**
 * Convierte cualquier imagen a WebP redimensionada antes de subirla.
 * Portado del prototipo de Marketplace: utilidad pura, sin dependencias.
 */

const MAX_WIDTH = 1080
const QUALITY = 0.8

function resizeDimensions(width: number, height: number, maxWidth: number): { width: number; height: number } {
    if (width <= maxWidth && height <= maxWidth) return { width, height }
    const scale = maxWidth / Math.max(width, height)
    return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

export function optimizeImageToWebP(file: File | Blob, maxWidth = MAX_WIDTH, quality = QUALITY): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onerror = () => reject(new Error('No pudimos leer la imagen.'))
        reader.onload = () => {
            const image = new Image()

            image.onerror = () => reject(new Error('No pudimos procesar la imagen.'))
            image.onload = () => {
                const { width, height } = resizeDimensions(image.width, image.height, maxWidth)
                const canvas = document.createElement('canvas')
                canvas.width = width
                canvas.height = height

                const context = canvas.getContext('2d')
                if (!context) {
                    reject(new Error('Tu dispositivo no puede procesar la imagen.'))
                    return
                }

                context.drawImage(image, 0, 0, width, height)
                canvas.toBlob(
                    blob => (blob ? resolve(blob) : reject(new Error('No pudimos comprimir la imagen.'))),
                    'image/webp',
                    quality
                )
            }

            image.src = reader.result as string
        }

        reader.readAsDataURL(file)
    })
}

export default optimizeImageToWebP
