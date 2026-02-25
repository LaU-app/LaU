import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';
import { Capacitor } from '@capacitor/core';

const obtenerTipoMime = (nombreArchivo) => {
    const extension = nombreArchivo.split('.').pop().toLowerCase();
    const tipos = {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'ppt': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'txt': 'text/plain',
        'zip': 'application/zip'
    };
    return tipos[extension] || '*/*'; 
};

// Exportamos la función para poder usarla en cualquier lado.
// OJO: Asumimos que "nombreArchivoOriginal" ya viene limpio (ej: "documento.pdf")
export const openNativeFile = async (urlCompleta, nombreArchivoOriginal) => {
    // Limpiamos los caracteres problemáticos
    const nombreSeguroCelular = nombreArchivoOriginal.replace(/[^a-zA-Z0-9.-]/g, '_');

    // Arreglamos la URL para tu servidor (el truco del # y espacios)
    const partesUrl = urlCompleta.split('/');
    const nombreArchivoEnUrl = partesUrl.pop();
    const urlSegura = partesUrl.join('/') + '/' + encodeURIComponent(nombreArchivoEnUrl);

    if (Capacitor.getPlatform() === 'web') {
        window.open(urlSegura, '_blank');
        return;
    }

    try {
        const tipoMimeDinamico = obtenerTipoMime(nombreSeguroCelular);

        const opciones = {
            url: urlSegura,
            directory: Directory.Cache, 
            path: nombreSeguroCelular 
        };

        const respuesta = await Filesystem.downloadFile(opciones);
        
        await FileOpener.open({
            filePath: respuesta.path,
            contentType: tipoMimeDinamico,
            openWithDefault: true 
        });

    } catch (error) {
        console.error('Error al abrir el archivo:', error);
        const mensajeError = error.message ? error.message : JSON.stringify(error);
        alert(`Error al abrir: ${mensajeError}`);
    }
};