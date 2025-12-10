import {
  AuthorizationRequest,
  AuthorizationNotifier,
  AuthorizationServiceConfiguration,
  RedirectRequestHandler,
  LocalStorageBackend,
  BasicQueryStringUtils,
  FetchRequestor,
  TokenRequest,
  GRANT_TYPE_AUTHORIZATION_CODE,
} from "@openid/appauth";

// NOTA: Ya no importamos 'InAppBrowser' de los plugins de Ionic
// Usaremos directamente window.cordova.InAppBrowser para evitar el error de 'subscribe'

// URIs específicas
const URIS = {
  google: "io.ionic.lauapp:/callback",
  microsoft: "msauth://io.ionic.lauapp/svQa0bZXNPaIsVOBJD%2B0tACC1Lw%3D",
};

// Configuración de proveedores
const providers = {
  google: {
    clientId:
      "620970885957-drb97ogulk7rfcufto5r4loobo383f52.apps.googleusercontent.com",
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
    scope: "openid email profile",
  },
  microsoft: {
    clientId: "14ad6951-16cc-405e-83a0-fa28655bbc46",
    authorizationEndpoint:
      "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenEndpoint: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    scope: "openid email profile offline_access User.Read",
  },
};

class CustomBrowserRequestHandler extends RedirectRequestHandler {
  constructor() {
    super(new LocalStorageBackend(), new BasicQueryStringUtils());
  }

  performAuthorizationRequest(config, request) {
    const params = {
      client_id: request.clientId,
      redirect_uri: request.redirectUri,
      response_type: request.responseType,
      scope: request.scope,
      state: request.state,
    };

    if (request.extras) {
      Object.assign(params, request.extras);
    }

    const utils = new BasicQueryStringUtils();
    const query = utils.stringify(params);
    const url = `${config.authorizationEndpoint}?${query}`;

    console.log("[OAUTH] Intentando abrir navegador con URL:", url);

    // --- USO DIRECTO DE CORDOVA (SIN WRAPPER) ---
    let browser;
    const options = "location=no,clearcache=yes,clearsessioncache=yes,zoom=no";

    // Verificamos si el plugin nativo está disponible
    if (window.cordova && window.cordova.InAppBrowser) {
      console.log("[OAUTH] Usando plugin nativo window.cordova.InAppBrowser");
      browser = window.cordova.InAppBrowser.open(url, "_blank", options);
    } else {
      console.warn(
        "[OAUTH] Plugin nativo no encontrado, usando window.open estándar"
      );
      browser = window.open(url, "_blank", options);
    }

    if (!browser) {
      console.error(
        "[OAUTH] Error crítico: No se pudo crear la instancia del navegador"
      );
      return;
    }

    const expectedUri = request.redirectUri;
    console.log("[OAUTH] Esperando redirección a:", expectedUri);

    // Función para procesar la URL cuando cambia
    const handleUrlLoad = (eventUrl) => {
      console.log("[OAUTH] URL detectada:", eventUrl);

      if (eventUrl && eventUrl.startsWith(expectedUri)) {
        console.log("[OAUTH] ¡Coincidencia encontrada! Cerrando navegador...");

        // Cerrar navegador
        if (browser.close) browser.close();

        const queryPart = eventUrl.split("?")[1];
        if (queryPart) {
          const searchParams = new URLSearchParams(queryPart);
          const code = searchParams.get("code");
          const error = searchParams.get("error");

          if (code) {
            console.log("[OAUTH] Código obtenido exitosamente");
            this.completeAuthorizationRequestIfPossible({ code: code });
          } else if (error) {
            console.error("[OAUTH] El proveedor devolvió error:", error);
          }
        }
      }
    };

    // --- LISTENERS NATIVOS (SIN SUBSCRIBE) ---
    // InAppBrowser nativo usa addEventListener, NO subscribe.

    // Evento loadstart (cuando empieza a cargar una URL)
    if (browser.addEventListener) {
      browser.addEventListener("loadstart", (event) => {
        handleUrlLoad(event.url);
      });

      // Evento loadstop (por si acaso la redirección ocurre al final)
      browser.addEventListener("loadstop", (event) => {
        handleUrlLoad(event.url);
      });

      // Evento exit (si el usuario lo cierra manual)
      browser.addEventListener("exit", () => {
        console.log("[OAUTH] El usuario cerró el navegador manualmente");
      });
    } else {
      console.error(
        "[OAUTH] El objeto browser no tiene addEventListener. Algo está mal con el plugin."
      );
    }
  }
}

const notifier = new AuthorizationNotifier();
const handler = new CustomBrowserRequestHandler();
handler.setAuthorizationNotifier(notifier);

export default {
  login(providerName) {
    console.log(`[OAUTH] Iniciando flujo para: ${providerName}`);
    const provider = providers[providerName];
    if (!provider) throw new Error("Proveedor desconocido");

    const activeRedirectUri = URIS[providerName];
    console.log(
      `[OAUTH] URI de redirección seleccionada: ${activeRedirectUri}`
    );

    const config = new AuthorizationServiceConfiguration({
      authorization_endpoint: provider.authorizationEndpoint,
      token_endpoint: provider.tokenEndpoint,
    });

    const request = new AuthorizationRequest({
      client_id: provider.clientId,
      redirect_uri: activeRedirectUri,
      scope: provider.scope,
      response_type: "code",
      state: undefined,
      extras: { prompt: "consent", access_type: "offline" },
    });

    handler.performAuthorizationRequest(config, request);
  },

  listenForAuth(callback) {
    notifier.setAuthorizationListener(async (req, res, error) => {
      if (error) {
        console.error("[OAUTH] Error en listener:", error);
        callback(null, error);
        return;
      }

      console.log("[OAUTH] Respuesta recibida, procesando token...");

      const providerKey = Object.keys(providers).find(
        (key) => providers[key].clientId === req.clientId
      );

      if (!providerKey) {
        const msg = "Client ID recibido no coincide con la configuración";
        console.error(`[OAUTH] ${msg}`);
        callback(null, new Error(msg));
        return;
      }

      const provider = providers[providerKey];
      const activeRedirectUri = URIS[providerKey];

      const config = new AuthorizationServiceConfiguration({
        authorization_endpoint: provider.authorizationEndpoint,
        token_endpoint: provider.tokenEndpoint,
      });

      const tokenRequest = new TokenRequest({
        client_id: provider.clientId,
        redirect_uri: activeRedirectUri,
        grant_type: GRANT_TYPE_AUTHORIZATION_CODE,
        code: res.code,
        extras: {
          code_verifier: req.internal && req.internal.code_verifier,
        },
      });

      try {
        const tokenResponse = await TokenRequest.performTokenRequest(
          new FetchRequestor(),
          config,
          tokenRequest
        );
        console.log("[OAUTH] ¡Token obtenido con éxito!");
        callback(tokenResponse, null);
      } catch (err) {
        console.error("[OAUTH] Falló el canje del token:", err);
        callback(null, err);
      }
    });
  },
};
