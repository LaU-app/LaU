# Campus, mapas y Google Cloud: guía paso a paso

En LaU Marketplace **todo se entrega dentro de un campus**. Cada producto tiene su universidad y, si el vendedor quiere, un punto exacto de entrega dentro del área del campus. El servidor rechaza puntos que queden fuera. Así nadie tiene que ir a otra zona del país para recibir lo que compró.

| Pieza | Qué hace | Necesita |
|---|---|---|
| Ubicar las universidades | `php artisan lau:ubicar-universidades`: Google Places propone lugares y **Jev elige cuál es el campus**. Si Jev duda, no guarda nada y la universidad queda para revisión manual. | Places API (New) + clave de servidor + `TYPESAFE_API_KEY` |
| Ajustar campus a mano | Panel del equipo → **Campus** (`/equipo/campus`): mover el pin y el radio de entrega | Maps JavaScript API + clave de navegador |
| Mapa 3D de campus | Marketplace → **Mapa** (`/tabs/marketplace/mapa`): universidades en 3D, «¿Dónde estoy?» con GPS y ferias | Maps JavaScript API + clave de navegador (Map ID recomendado) |
| Punto de entrega | Al publicar: elegir el campus y marcar el punto en el mapa | Maps JavaScript API + clave de navegador + Map ID |
| GPS | Plugin oficial `@capacitor/geolocation`: saber en qué campus estás. La ubicación no se envía al servidor. | Permiso de ubicación (ya está en el AndroidManifest) |
| Producto en la web por su foto | Cloud Vision (*Web Detection*) busca la foto en internet y **Jev descarta las páginas que no son del mismo producto** | Cloud Vision API + clave de servidor |
| Videos de reseñas | YouTube Data API v3, filtrada por Jev | YouTube Data API v3 + clave de servidor |
| Ferias | Panel del equipo → **Ferias**: feria en un campus con anuncio solo para los estudiantes de ese campus | Nada extra |

Sin claves, la app **sigue funcionando**: los mapas muestran una lista y las búsquedas web ofrecen un enlace de búsqueda.

## Sobre el plugin de Ionic y el 3D

- `@capacitor/google-maps`, el plugin oficial de mapas, dibuja el mapa **nativo** de Android/iOS. Ese mapa no tiene el 3D fotorrealista.
- Por eso LaU usa el **SDK de Google Maps para JavaScript**, que funciona en la web (Firebase) y dentro de la app Android, porque la app corre en un WebView.
- El mapa 3D (`Map3DElement`) todavía está en **vista previa** (canal `beta`):
  - el **relieve 3D** existe en todo el mundo, así que se ven los volcanes y la topografía de El Salvador;
  - los **edificios fotorrealistas** solo aparecen donde Google tiene cobertura. Podés revisar San Salvador en https://developers.google.com/maps/documentation/javascript/3d/coverage.
- Si el dispositivo no soporta 3D, el mapa cambia solo a un mapa 2D inclinado.
- Para el GPS sí se usa el plugin oficial de Capacitor: `@capacitor/geolocation`.

## 1. Proyecto y facturación

1. Entrá a https://console.cloud.google.com con la cuenta dueña de Firebase.
2. Arriba, en el selector de proyecto, elegí **`lauapp-81f4d`**. El proyecto de Firebase es un proyecto de Google Cloud, así que todo queda junto.
3. Menú ☰ → **Facturación** → vinculá una cuenta de facturación.
   - Google Maps Platform y Cloud Vision **exigen facturación activa**, aunque el uso de LaU va a estar muy por debajo de los niveles gratis mensuales.
   - Desde marzo de 2025, Maps no da un crédito único: cada producto tiene su cupo gratis mensual. Los precios están en https://mapsplatform.google.com/pricing y https://cloud.google.com/vision/pricing.
4. **Facturación → Presupuestos y alertas → Crear presupuesto:** ponele 5 USD con alertas al 50 %, 90 % y 100 %. Una alerta avisa, pero **no detiene** el uso; para eso están las cuotas del paso 6.

## 2. Activar las APIs

Menú ☰ → **APIs y servicios → Biblioteca**. Buscá y tocá **Habilitar** en cada una:

| API | Para qué |
|---|---|
| **Maps JavaScript API** | Mapa 3D, mapa del punto de entrega, editor de campus |
| **Places API (New)** | Comando que ubica las universidades. Ojo: es la que dice *(New)* |
| **Cloud Vision API** | Buscar el producto en la web por su foto |
| **YouTube Data API v3** | Videos de reseñas |

No hacen falta *Maps SDK for Android* ni *Map Tiles API*.

## 3. Clave de NAVEGADOR (frontend)

**APIs y servicios → Credenciales → + Crear credenciales → Clave de API.** Después tocá la clave para editarla:

1. **Nombre:** `LaU navegador (Maps JS)`.
2. **Restricciones de aplicaciones → Sitios web.** Agregá estos sitios, uno por línea:
   ```
   https://lauapp.es/*
   https://www.lauapp.es/*
   https://lauapp-81f4d.web.app/*
   https://lauapp-81f4d.firebaseapp.com/*
   https://localhost/*
   http://localhost:5173/*
   http://127.0.0.1:5180/*
   ```
   `https://localhost/*` es el origen de la app Android: Capacitor sirve la app desde ahí.
3. **Restricciones de API → Restringir clave** → marcá solo **Maps JavaScript API**.
4. Guardar y copiar la clave.

Esta clave es **pública por diseño**: va dentro del JavaScript del navegador. La protegen las dos restricciones de arriba, no el secreto. Por eso puede ir en `VITE_*`.

## 4. Map ID (para marcadores y mapa inclinado)

Menú ☰ → **Google Maps Platform → Administración de mapas** (*Map management*) → **Crear ID de mapa**:
- **Nombre:** `LaU campus`;
- **Tipo de mapa:** JavaScript;
- **Tipo de renderización:** **Vectorial**, con **Inclinación** y **Rotación** marcadas.

Guardá y copiá el **Map ID**.

## 5. Clave de SERVIDOR (backend)

Otra vez **Crear credenciales → Clave de API**, y editala:

1. **Nombre:** `LaU servidor`.
2. **Restricciones de aplicaciones → Direcciones IP** → `153.75.224.160`, la IP de tu VPS.
   - Para probar en tu laptop, agregá también tu IP pública (https://ifconfig.me). Otra opción es crear una tercera clave `LaU desarrollo` sin restricción de IP, pero con las mismas APIs, y no usarla en producción.
3. **Restricciones de API:** **Places API (New)**, **Cloud Vision API** y **YouTube Data API v3**.
4. Guardar y copiar.

Esta clave **nunca** va en el frontend ni en Git: solo en el `.env` del servidor.

## 6. Cuotas (para que nunca se pase del nivel gratis)

**APIs y servicios →** elegí la API → pestaña **Cuotas y límites del sistema** → editá el límite por día:
- Cloud Vision: 200 solicitudes por día. Cada producto se busca una vez y se guarda en caché 24 h.
- Places API (New), *Text Search*: 50 por día. Solo se usa al ubicar universidades.
- YouTube Data API v3: viene con 10 000 unidades por día. Cada búsqueda gasta 100 y se guarda 12 h.
- Maps JavaScript API: por ejemplo, 2 000 cargas de mapa por día.

## 7. Configurar LaU

**Backend** (`.env` del servidor):
```
GOOGLE_SERVER_KEY=<clave de servidor>
YOUTUBE_API_KEY=               # vacío = usa GOOGLE_SERVER_KEY
```
Luego:
```
php artisan migrate --force
php artisan config:cache
php artisan lau:ubicar-universidades      # Places + Jev; lista las que quedan para revisar a mano
```

**Frontend** (`.env.production`, y `.env.development.local` para probar en tu compu):
```
VITE_GOOGLE_MAPS_API_KEY=<clave de navegador>
VITE_GOOGLE_MAPS_MAP_ID=<Map ID>
```
Luego `npm run build` y el deploy a Firebase.

**Android:**
```
npm run build
npx cap sync android        # instala @capacitor/geolocation en el proyecto nativo
```
Después generá el APK como siempre. La primera vez que el estudiante toque **¿Dónde estoy?** o **Usar mi ubicación**, Android le pide el permiso.

## 8. Revisar campus y ferias

1. Entrá a `https://lauapp.es/equipo` → **Campus**.
2. Revisá cada universidad: arrastrá el pin al centro del campus y ajustá el **radio de entrega**. Va de 100 a 2000 m; la UES necesita más que una universidad de un solo edificio. Las universidades con varias sedes (UGB, UNAB, ITCA) quedan ubicadas en su campus principal.
3. **Ferias:** creá la feria con su campus, fechas y lugar, y dejá marcado *Publicar anuncio*. El anuncio solo lo ven los estudiantes de ese campus: aparece desde una semana antes hasta que la feria termina. La feria también se ve en el mapa.

## Privacidad

- La ubicación del estudiante (GPS) se usa **solo en el teléfono** para saber en qué campus está. No se guarda ni se envía.
- El punto de entrega que marca el vendedor sí se guarda, porque es público: es dónde se entrega el producto.
