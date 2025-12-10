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
import { Capacitor } from "@capacitor/core";

const isWeb = Capacitor.getPlatform() === "web";

// ==========================================
// CONFIGURACIÓN
// ==========================================
const URIS = {
  google: isWeb
    ? "http://localhost:8100/auth/callback"
    : "io.ionic.lauapp:/callback",
  microsoft: isWeb
    ? "http://localhost:8100/auth/callback"
    : "msauth://io.ionic.lauapp/svQa0bZXNPaIsVOBJD%2B0tACC1Lw%3D",
};

const providers = {
  google: {
    clientId: isWeb
      ? "620970885957-jo1cvl0a27eqo51vq5d5lt45i0sd6llo.apps.googleusercontent.com" // ID WEB (Correcto)
      : "620970885957-drb97ogulk7rfcufto5r4loobo383f52.apps.googleusercontent.com", // ID ANDROID (Correcto)

    // --- IMPORTANTE: PEGA AQUÍ TU SECRETO DE GOOGLE ---
    // Solo necesario para la versión Web
    clientSecret: isWeb ? "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" : null,

    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
    scope: "openid email profile",
  },
  microsoft: {
    clientId: "14ad6951-16cc-405e-83a0-fa28655bbc46",
    // PEGA AQUÍ TU SECRETO DE MICROSOFT (Solo se usa si isWeb es true)
    clientSecret: null, 
    authorizationEndpoint: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenEndpoint: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    scope: "openid email profile offline_access User.Read",
  },
};

// ==========================================
// LÓGICA MANUAL PARA WEB (PURE JS)
// ==========================================

function generateRandomString(length) {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let result = "";
  const values = new Uint32Array(length);
  window.crypto.getRandomValues(values);
  for (let i = 0; i < length; i++) {
    result += charset[values[i] % charset.length];
  }
  return result;
}

async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function loginWeb(providerName) {
  const provider = providers[providerName];
  const redirectUri = URIS[providerName];

  const verifier = generateRandomString(128);
  const challenge = await generateCodeChallenge(verifier);
  const state = generateRandomString(32);

  const sessionData = {
    provider: providerName,
    verifier: verifier,
    state: state,
  };
  localStorage.setItem("web_auth_session", JSON.stringify(sessionData));

  const params = new URLSearchParams({
    client_id: provider.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: provider.scope,
    state: state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "consent",
    access_type: "offline",
  });

  window.location.href = `${
    provider.authorizationEndpoint
  }?${params.toString()}`;
}

async function handleWebCallback(queryParams) {
  console.log("[WEB-AUTH] Procesando callback manual...");

  const storedSession = localStorage.getItem("web_auth_session");
  if (!storedSession)
    throw new Error("No se encontró sesión. Intenta de nuevo.");

  const session = JSON.parse(storedSession);

  if (queryParams.state !== session.state) {
    throw new Error("Error de seguridad: State no coincide.");
  }

  const provider = providers[session.provider];

  // PREPARAR DATOS PARA EL CANJE
  const bodyParams = {
    grant_type: "authorization_code",
    client_id: provider.clientId,
    redirect_uri: URIS[session.provider],
    code: queryParams.code,
    code_verifier: session.verifier,
  };

  // --- CORRECCIÓN: AGREGAR CLIENT_SECRET SI EXISTE ---
  if (provider.clientSecret) {
    bodyParams.client_secret = provider.clientSecret;
  }

  const body = new URLSearchParams(bodyParams);

  console.log("[WEB-AUTH] Solicitando token...");

  const response = await fetch(provider.tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body,
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("[WEB-AUTH] Error del proveedor:", data);
    throw new Error(
      data.error_description || data.error || "Error al obtener token"
    );
  }

  localStorage.removeItem("web_auth_session");

  return {
    accessToken: data.access_token,
    idToken: data.id_token,
    refreshToken: data.refresh_token,
  };
}

// ==========================================
// LÓGICA PARA MÓVIL
// ==========================================
class MobileRequestHandler extends RedirectRequestHandler {
  constructor() {
    super(new LocalStorageBackend(), new BasicQueryStringUtils());
  }
  performAuthorizationRequest(config, request) {
    const utils = new BasicQueryStringUtils();
    const query = utils.stringify(request.toStringMap());
    const url = `${config.authorizationEndpoint}?${query}`;
    const browser = window.cordova?.InAppBrowser?.open(
      url,
      "_blank",
      "location=no,clearcache=yes,clearsessioncache=yes"
    );
    if (browser && browser.addEventListener) {
      browser.addEventListener("loadstart", (event) => {
        if (event.url && event.url.startsWith(request.redirectUri)) {
          browser.close();
          const params = new URL(event.url).searchParams;
          const responseParams = Object.fromEntries(params.entries());
          if (responseParams.code)
            this.completeAuthorizationRequestIfPossible(responseParams);
        }
      });
    }
  }
}

const mobileHandler = new MobileRequestHandler();
const notifier = new AuthorizationNotifier();
mobileHandler.setAuthorizationNotifier(notifier);

// ==========================================
// EXPORTACIÓN
// ==========================================
export default {
  async handleCallback(queryParams) {
    if (isWeb && queryParams.code) {
      try {
        const tokenData = await handleWebCallback(queryParams);
        window.dispatchEvent(
          new CustomEvent("oauth_success", { detail: tokenData })
        );
      } catch (err) {
        console.error("[WEB-AUTH] Fallo:", err);
        window.dispatchEvent(new CustomEvent("oauth_error", { detail: err }));
      }
    } else {
      if (queryParams.code)
        mobileHandler.completeAuthorizationRequestIfPossible(queryParams);
    }
  },

  login(providerName) {
    // --- CORRECCIÓN CRÍTICA ---
    // Guardamos explícitamente el nombre (google/microsoft) para que AuthCallback no se confunda
    // con intentos anteriores.
    localStorage.setItem('auth_provider', providerName); 

    if (isWeb) {
        loginWeb(providerName).catch(err => console.error("Error web:", err));
    } else {
        const provider = providers[providerName];
        const config = new AuthorizationServiceConfiguration({
            authorization_endpoint: provider.authorizationEndpoint,
            token_endpoint: provider.tokenEndpoint,
        });
        const request = new AuthorizationRequest({
            client_id: provider.clientId,
            redirect_uri: URIS[providerName],
            scope: provider.scope,
            response_type: "code",
            extras: { prompt: "consent", access_type: "offline" },
        });
        mobileHandler.performAuthorizationRequest(config, request);
    }
  },

  listenForAuth(callback) {
    window.addEventListener("oauth_success", (e) => callback(e.detail, null));
    window.addEventListener("oauth_error", (e) => callback(null, e.detail));

    notifier.setAuthorizationListener(async (req, res, error) => {
      if (error || !res) {
        if (!isWeb) callback(null, error);
        return;
      }
      const providerKey = Object.keys(providers).find(
        (k) => providers[k].clientId === req.clientId
      );
      if (!providerKey) return;

      const tokenRequest = new TokenRequest({
        client_id: req.clientId,
        redirect_uri: URIS[providerKey],
        grant_type: GRANT_TYPE_AUTHORIZATION_CODE,
        code: res.code,
        extras: { code_verifier: req.internal?.code_verifier },
      });
      try {
        const response = await TokenRequest.performTokenRequest(
          new FetchRequestor(),
          new AuthorizationServiceConfiguration({
            authorization_endpoint:
              providers[providerKey].authorizationEndpoint,
            token_endpoint: providers[providerKey].tokenEndpoint,
          }),
          tokenRequest
        );
        callback(response, null);
      } catch (err) {
        callback(null, err);
      }
    });
  },
};
