# Entrega del hackathon: lista para el equipo

Esta es la guía interna, en español. La de los jurados, en inglés, es [`HACKATHON.md`](../../HACKATHON.md), y el texto para Devpost está en [`DEVPOST.md`](DEVPOST.md).

## 1. Publicar el código en el entorno de pruebas

Usamos los servidores reales (`lauapp.es` y `api.lauapp.es`), pero los pagos van por **PayPal Sandbox**. Así lo explica `HACKATHON.md` a los jurados.

### Backend (`api.lauapp.es`)

1. Merge del PR de LaUapi a `master` y `git pull` en el servidor.
2. Instalar dependencias:
   - `composer install --no-dev --optimize-autoloader`
   - `npm ci && npm run build`. Este paso ahora incluye `script-lau.js`, que antes faltaba y rompía el panel.
3. Agregar estas variables al `.env` del servidor. Los nombres están en `.env.example`; nunca subas los valores:
   - `PAYPAL_MODE=sandbox`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_PLATFORM_ACCOUNT_ID` (o los `PAYPAL_SANDBOX_*` actuales).
   - `TYPESAFE_API_KEY` y `TYPESAFE_MODEL=jev-latest`.
   - `FRONTEND_URL=https://lauapp.es`.
   - Correo: `MAIL_*` con la opción A (Gmail) o la B (Resend), según se explica en `.env.example`. Remitente `lauapp.es@gmail.com` o `no-reply@lauapp.es`.
   - **Google (web):** `GOOGLE_WEB_CLIENT_SECRET`, con el **mismo** valor que antes estaba en `src/services/oauthServices.js`. No se cambia la clave: solo se movió al servidor. Sin esta variable, el inicio de sesión con Google en la web deja de funcionar.
   - **Agente (chat):** el servidor no tiene GPU, así que el modelo abierto lo sirve un proveedor gratuito compatible con OpenAI. Con Groq:
     1. Creá una cuenta gratis en https://console.groq.com.
     2. En *API Keys*, creá una clave.
     3. Configurá `AGENT_LLM_BASE_URL=https://api.groq.com/openai/v1`, `AGENT_LLM_MODEL=openai/gpt-oss-120b`, `AGENT_LLM_API_KEY=<la clave>` y `AGENT_LLM_REASONING=low`.

     El plan gratis permite unas 1 000 consultas al día, de sobra para los jurados. Si se deja vacío, el chat muestra "no disponible" y la búsqueda inteligente sigue funcionando.
   - Opcional: `YOUTUBE_API_KEY` para mostrar videos de reseñas.
4. Preparar la base de datos y los datos de la demo:
   - `php artisan migrate --force`
   - `php artisan db:seed --class=MarketplaceShowcaseSeeder --force`. Crea "Papelería Campus Central" (aprobada, con 7 productos) y "TecnoCampus SV" (en revisión). Son datos ficticios **visibles para todos en el Marketplace**.
   - `php artisan paypal:link-store papeleria-campus-central lau-sandbox-tienda-04`. Debe terminar en `OK`.
   - `php artisan marketplace:demo-accounts`. Pide una contraseña que no queda en ningún archivo.
5. Aplicar la configuración y comprobar:
   - `php artisan config:cache`
   - `php artisan paypal:check`: deben aparecer los dos scopes en `[OK]`.
6. Comprobar que la carpeta `storage/app/private` permite escritura. Ahí se guardan los documentos legales.
7. **Panel del equipo en la app** (`https://lauapp.es/equipo`): se entra con el superusuario del panel web. Si conviene cambiar su contraseña (la anterior quedó en el historial público), usá `php artisan lau:admin-password <correo>`: la pide de forma oculta y cierra las sesiones abiertas.

### Frontend (`lauapp.es`)

- Merge del PR de LaU a `master`. GitHub Actions construye y publica en Firebase solo.
- `.env.production` ya trae `VITE_PAYPAL_CLIENT_ID`. Es el Client ID **público** de la app de Sandbox, no un secreto.

### Prueba final en producción

Hacer una compra completa con las cuentas demo (ver la sección 2) y aprobar desde el panel una solicitud de comercio de prueba para confirmar que llega el correo.

## 2. Cuentas

| Para qué | Cuenta | Dónde está la contraseña |
|---|---|---|
| LaU · estudiante | `estudiante.demo@lauapp.es` | La que pusiste en `marketplace:demo-accounts` |
| LaU · comercio de vitrina | `comercio.demo@lauapp.es` | La misma |
| PayPal Sandbox · comprador | `sb-g9x2153766254@personal.example.com` (Personal, SV) | developer.paypal.com → Testing Tools → Sandbox Accounts → la cuenta → *View/Edit account*. Conviene cambiarla por una fácil de compartir. |
| PayPal Sandbox · comercio | `sb-dqboa53594124@business.example.com` (Business, SV) | Es la que conectaste como `lau-sandbox-tienda-04`. Confirmalo en el panel de Sandbox. **No hace falta dársela a los jurados.** |
| PayPal Sandbox · plataforma | `sb-2aguz53776934@business.example.com` (Business, US, *Partner*) | Es la dueña de la app Platform (`PAYPAL_PLATFORM_ACCOUNT_ID`). **Nunca se comparte.** |
| Panel del equipo (app: `/equipo`; web: `api.lauapp.es/us/su/lau`) | superusuario | **No se comparte con los jurados.** El panel web expone datos reales de usuarios. El de la app solo muestra solicitudes de comercios, y lo usa el equipo para aprobar durante la evaluación. |

### Cómo deben probar los jurados

Con **dos navegadores a la vez**, o una ventana normal y otra privada:
- **A = estudiante:** busca con la búsqueda inteligente, abre el chat con el asistente, le pide preparar la compra y paga con la cuenta Personal de Sandbox.
- **B = comercio:** ve la venta como "Pagado" y recibe el mensaje en el chat con la vista previa del producto.

Si quieren probar el alta de un comercio nuevo, usan una tercera cuenta de LaU, y el equipo la aprueba desde el panel durante el periodo de evaluación.

## 3. Repositorios: qué se entrega

No hace falta un repositorio nuevo. Se entregan los **dos repos actuales**, porque la app solo funciona con ambos. Las reglas piden que el repositorio tenga "todo el código necesario para que el proyecto funcione":
- el frontend tiene la interfaz, el botón de PayPal (JS SDK), la búsqueda y el chat;
- el backend tiene PayPal (Orders, Partner Referrals), Jev y el agente.

Entregar solo una parte, o solo los archivos del hackathon, no cumpliría esa regla.

1. **Enlace principal en Devpost:** `https://github.com/LaU-app/LaUapi`, que ya es público y tiene el núcleo de PayPal + IA. En *Try it out* va también `https://github.com/LaU-app/LaU`. `HACKATHON.md` está en la raíz de **los dos** repos y enlaza al otro.
2. **Hacer público el frontend** (`LaU-app/LaU`, hoy privado): *Settings → General → Danger Zone → Change visibility*.
3. **Licencia visible en el *About*:** `LICENSE` (MIT) está en las ramas del hackathon. GitHub la detecta cuando llega a `master`, la rama por defecto, al mergear los PRs.
4. **Secretos:** ya no quedan en los archivos actuales. Saqué el *client secret* de Google del frontend (ahora vive en el `.env` del servidor), la contraseña del seeder del superusuario y una contraseña de base de datos en `MIGRATIONS_APPLIED.md`, y borré `cookies.txt` y `get-token.php`. No se cambió ninguna clave, por decisión del equipo.

   El **historial de Git** sigue conteniendo los valores anteriores: Gmail, Pusher, webhook de Make, Google y la contraseña del superusuario. Si en algún momento se quiere cerrar eso, las opciones son cambiar esas claves o reescribir el historial. Reescribirlo es destructivo: obliga a todo el equipo a volver a clonar y no borra copias que ya existan.

## 4. Formulario de Devpost

| Campo | Qué poner |
|---|---|
| Text description | `DEVPOST.md`, secciones Inspiration a What's next |
| Built with | La lista de `DEVPOST.md` |
| Try it out | https://lauapp.es, https://lauapp.es/empresas y los repos públicos |
| Testing instructions | La sección "Testing instructions" de `DEVPOST.md`, con las contraseñas |
| Video | Pendiente: menos de 3 min, YouTube público, sin música con copyright, grabado en el celular (el dispositivo para el que se hizo la app) y con **subtítulos o narración en inglés**, porque la interfaz está en español |
| Fecha límite | **Jueves 12 de noviembre de 2026, 12:00 p. m. hora del Pacífico** (1:00 p. m. en El Salvador). Después no se puede editar la entrega. |

## 5. Cómo cumple la app cada criterio

| Criterio | Evidencia |
|---|---|
| Implementación técnica | PayPal: Partner Referrals, Merchant Integrations, Orders v2 con *payee* e idempotencia, y JS SDK. IA: preguntas tipadas a Jev, tabla de decisión y bitácora. Pruebas automatizadas en backend y frontend. |
| Diseño | Experiencia completa: landing de comercios, verificación, búsqueda inteligente con razones y reseñas, panel de ventas personal, hoja de pago, comprobante, pedidos, chat con vista previa y panel admin. |
| Impacto potencial | Comercio de campus confiable para estudiantes y pequeños negocios de El Salvador, dentro de una app que ya usan. |
| Innovación | Un agente con modelo abierto que planifica y usa herramientas, con Jev como capa de juicio: decide si el mensaje es de compras y verifica cada frase contra los datos reales. Trabaja sobre inventario verificado y deja el pago a PayPal, siempre con la confirmación del estudiante. No es un chatbot que inventa respuestas. |
| Presentación | Pendiente: el video. Debe mostrar el flujo de punta a punta en menos de 3 minutos. |
| Premios a los que apunta | *Best Use of PayPal + AI*, *Best Use of Agentic Commerce*, *Most Impactful* y los generales. |
