import { Capacitor } from "@capacitor/core";
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import api from './api';

const isWeb = Capacitor.getPlatform() === "web";
const webCallback = window.location.origin + "/auth/callback";
// ==========================================
// CONFIGURACIÓN
// ==========================================
const URIS = {
  google: isWeb
    ? webCallback
    : "com.googleusercontent.apps.620970885957-eefuba02v7f89d9gupfh3kjtfg5u321d:/callback",
  microsoft: isWeb
    ? webCallback
    : "msauth://io.ionic.lauapp/svQa0bZXNPaIsVOBJD%2B0tACC1Lw%3D",
};

const providers = {
  google: {
    clientId: isWeb
      ? "620970885957-jo1cvl0a27eqo51vq5d5lt45i0sd6llo.apps.googleusercontent.com" // ID WEB 
      : "620970885957-eefuba02v7f89d9gupfh3kjtfg5u321d.apps.googleusercontent.com", // ID IOS
    
    // El client secret de la app web vive solo en el backend: en web el código se canjea
    // con POST /auth/oauth/google/token (ver processCallback).
    exchangeOnServer: isWeb,
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
    scope: "openid email profile",
  },
  microsoft: {
    clientId: "14ad6951-16cc-405e-83a0-fa28655bbc46",
    authorizationEndpoint: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenEndpoint: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    scope: "openid email profile offline_access User.Read",
  },
};

// ==========================================
// LÓGICA MANUAL UNIFICADA (PKCE PURO)
// ==========================================

function generateRandomString(length) {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
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

async function loginProvider(providerName) {
  const provider = providers[providerName];
  const redirectUri = URIS[providerName];

  const verifier = generateRandomString(128);
  const challenge = await generateCodeChallenge(verifier);
  const state = generateRandomString(32);

  // Guardamos la sesión (Compatible con cualquier navegador)
  const sessionData = { provider: providerName, verifier: verifier, state: state };
  localStorage.setItem("web_auth_session", JSON.stringify(sessionData));
  
  // Le decimos explícitamente a Vue qué proveedor se está usando ahorita.
  localStorage.setItem('auth_provider', providerName);

  const params = new URLSearchParams({
    client_id: provider.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: provider.scope,
    state: state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "consent",
  });

  const url = `${provider.authorizationEndpoint}?${params.toString()}`;

  if (isWeb) {
    window.location.href = url;
  } else {
    await Browser.open({ url: url, windowName: '_self' });
  }
}

async function processCallback(queryParams) {
  const storedSession = localStorage.getItem("web_auth_session");
  if (!storedSession) throw new Error("Sesión caducada. Por favor, intenta de nuevo.");

  const session = JSON.parse(storedSession);

  if (queryParams.state !== session.state) {
    throw new Error("Error de seguridad: El origen de la petición no coincide.");
  }

  const provider = providers[session.provider];

  // Google web: el backend canjea el código con el client secret (nunca llega al navegador).
  if (provider.exchangeOnServer) {
    let res;
    try {
      res = await api.post("/auth/oauth/google/token", {
        code: queryParams.code,
        code_verifier: session.verifier,
        redirect_uri: URIS[session.provider],
      });
    } catch (e) {
      throw new Error(e?.response?.data?.message || "Error al canjear el token con el servidor");
    }
    const data = res.data?.data || res.data;
    localStorage.removeItem("web_auth_session");
    return { accessToken: data.access_token, idToken: data.id_token, refreshToken: null };
  }

  const bodyParams = {
    grant_type: "authorization_code",
    client_id: provider.clientId,
    redirect_uri: URIS[session.provider],
    code: queryParams.code,
    code_verifier: session.verifier,
  };

  const body = new URLSearchParams(bodyParams);

  // Pedimos el token directamente, sin usar librerías externas
  const response = await fetch(provider.tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error_description || data.error || "Error al canjear el token con el servidor");
  }

  localStorage.removeItem("web_auth_session");

  return {
    accessToken: data.access_token,
    idToken: data.id_token,
    refreshToken: data.refresh_token,
  };
}

// ==========================================
// INTERCEPTOR PARA MÓVIL
// ==========================================
if (!isWeb) {
  App.addListener('appUrlOpen', (event) => {
    if (event.url && (event.url.includes(":/callback") || event.url.startsWith("msauth://"))) {
      Browser.close();
      
      let queryString = event.url.split('?')[1];
      if (!queryString && event.url.includes('#')) {
          queryString = event.url.split('#')[1];
      }

      if (queryString) {
        window.location.href = '/auth/callback?' + queryString;
      }
    }
  });
}

// ==========================================
// EXPORTACIÓN PARA VUE
// ==========================================
let authListener = null;

export default {
  listenForAuth(callback) {
    authListener = callback;
  },

  async handleCallback(queryParams) {
    try {
      const data = await processCallback(queryParams);
      if (authListener) authListener(data, null);
    } catch (error) {
      console.error("Error canjeando token:", error);
      if (authListener) authListener(null, error);
    }
  },

  login(providerName) {
    loginProvider(providerName).catch(err => console.error("Error al abrir login:", err));
  }
};