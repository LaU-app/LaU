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
4. Preparar la base de datos y los datos de la demo:
   - `php artisan migrate --force`
   - `php artisan db:seed --class=MarketplaceShowcaseSeeder --force`. Crea "Papelería Campus Central" (aprobada, con 7 productos) y "TecnoCampus SV" (en revisión). Son datos ficticios **visibles para todos en el Marketplace**.
   - `php artisan paypal:link-store papeleria-campus-central lau-sandbox-tienda-04`. Debe terminar en `OK`.
   - `php artisan marketplace:demo-accounts`. Pide una contraseña que no queda en ningún archivo.
5. Aplicar la configuración y comprobar:
   - `php artisan config:cache`
   - `php artisan paypal:check`: deben aparecer los dos scopes en `[OK]`.
6. Comprobar que la carpeta `storage/app/private` permite escritura. Ahí se guardan los documentos legales.

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
| Panel admin de LaU | — | **No se comparte con los jurados.** Expone datos reales de usuarios. La aprobación se muestra en el video y la hace el equipo. |

### Cómo deben probar los jurados

Con **dos navegadores a la vez**, o una ventana normal y otra privada:
- **A = estudiante:** compra con el asistente y paga con la cuenta Personal de Sandbox.
- **B = comercio:** ve la venta como "Pagado" y recibe el mensaje en el chat con la vista previa del producto.

Si quieren probar el alta de un comercio nuevo, usan una tercera cuenta de LaU, y el equipo la aprueba desde el panel durante el periodo de evaluación.

## 3. Hacer públicos los repositorios (requisito del hackathon)

Antes de cambiar la visibilidad, resolvé esto. El **historial de Git** también se publica:

1. **Rotar secretos que ya están en el historial**, aunque ya no estén en los archivos:
   - contraseña de aplicación de `sivarsocial503@gmail.com`, que estaba en el `.env.example` del backend;
   - `PUSHER_APP_SECRET`;
   - URL del webhook de Make;
   - *client secret* de Google OAuth (`src/services/oauthServices.js`, frontend);
   - contraseña del superusuario (`database/seeders/SuperUserSeeder.php`).
2. **Borrar del backend** `cookies.txt`, que tiene cookies de sesión, y `get-token.php`.
3. **Alternativa recomendada:** publicar un repositorio **nuevo** con una copia limpia del código, sin historial, por ejemplo `LaU-app/lau-paypal-hackathon` con `frontend/` y `backend/`. Los repos de trabajo quedan privados.
4. **Licencia:** agregué `LICENSE` (MIT) en ambos repos, como ya declaraba el `composer.json` del backend. Si el equipo prefiere otra, se cambia antes de publicar. La licencia debe verse en el *About* del repo.

## 4. Formulario de Devpost

| Campo | Qué poner |
|---|---|
| Text description | `DEVPOST.md`, secciones Inspiration a What's next |
| Built with | La lista de `DEVPOST.md` |
| Try it out | https://lauapp.es, https://lauapp.es/empresas y los repos públicos |
| Testing instructions | La sección "Testing instructions" de `DEVPOST.md`, con las contraseñas |
| Video | Pendiente: menos de 3 min, YouTube público, sin música con copyright |

## 5. Cómo cumple la app cada criterio

| Criterio | Evidencia |
|---|---|
| Implementación técnica | PayPal: Partner Referrals, Merchant Integrations, Orders v2 con *payee* e idempotencia, y JS SDK. IA: preguntas tipadas a Jev, tabla de decisión y bitácora. Pruebas automatizadas en backend y frontend. |
| Diseño | Experiencia completa: landing de comercios, verificación, asistente, hoja de pago, comprobante, pedidos, chat con vista previa y panel admin. |
| Impacto potencial | Comercio de campus confiable para estudiantes y pequeños negocios de El Salvador, dentro de una app que ya usan. |
| Innovación | Asistente que decide con probabilidades auditables sobre inventario real verificado y luego delega el pago a PayPal. No es un chatbot que inventa respuestas. |
| Presentación | Pendiente: el video. Debe mostrar el flujo de punta a punta en menos de 3 minutos. |
| Premios a los que apunta | *Best Use of PayPal + AI*, *Best Use of Agentic Commerce*, *Most Impactful* y los generales. |
