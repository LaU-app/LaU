import {
  AuthorizationRequest,
  AuthorizationNotifier,
  AuthorizationServiceConfiguration,
  RedirectRequestHandler,
  LocalStorageBackend,
  BasicQueryStringUtils,
  FetchRequestor,
  TokenRequest,
  GRANT_TYPE_AUTHORIZATION_CODE
} from "@openid/appauth";

import { InAppBrowser } from '@awesome-cordova-plugins/in-app-browser';

const redirectUri = "com.myapp:/callback";

// Config de proveedores
const providers = {
  google: {
    clientId: "TU_GOOGLE_CLIENT_ID",
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
    scope: "openid email profile"
  },
  microsoft: {
    clientId: "TU_MICROSOFT_CLIENT_ID",
    authorizationEndpoint:
      "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenEndpoint:
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    scope: "openid email profile offline_access User.Read"
  }
};

// Configuración para abrir login con InAppBrowser
class CustomBrowserRequestHandler extends RedirectRequestHandler {
  constructor() {
    super(
      new LocalStorageBackend(),
      new BasicQueryStringUtils()
    );
  }

  performAuthorizationRequest(config, request) {
    const url = config.authorizationEndpoint +
      '?' + request.toUriQuery();

    const browser = InAppBrowser.create(url, '_blank', {
      location: 'no',
      clearsessioncache: 'yes',
      clearcache: 'yes'
    });

    browser.on('loadstart').subscribe((event) => {
      if (event.url.startsWith(redirectUri)) {
        browser.close();

        const query = event.url.split('?')[1];
        const params = new URLSearchParams(query);
        const code = params.get('code');

        this.completeAuthorizationRequestIfPossible({
          code: code
        });
      }
    });
  }
}

const notifier = new AuthorizationNotifier();
const handler = new CustomBrowserRequestHandler();
handler.setAuthorizationNotifier(notifier);

export default {
  login(providerName) {
    const provider = providers[providerName];
    if (!provider) throw new Error("Proveedor desconocido");

    const config = new AuthorizationServiceConfiguration({
      authorization_endpoint: provider.authorizationEndpoint,
      token_endpoint: provider.tokenEndpoint,
    });

    const request = new AuthorizationRequest({
      client_id: provider.clientId,
      redirect_uri: redirectUri,
      scope: provider.scope,
      response_type: "code"
    });

    handler.performAuthorizationRequest(config, request);
  },

  listenForAuth(callback) {
    notifier.setAuthorizationListener(async (req, res, error) => {
      if (error) {
        callback(null, error);
        return;
      }

      const provider = Object.values(providers).find(
        (p) => p.clientId === req.clientId
      );

      const config = new AuthorizationServiceConfiguration({
        authorization_endpoint: provider.authorizationEndpoint,
        token_endpoint: provider.tokenEndpoint
      });

      const tokenRequest = new TokenRequest({
        client_id: provider.clientId,
        redirect_uri: redirectUri,
        grant_type: GRANT_TYPE_AUTHORIZATION_CODE,
        code: res.code
      });

      const tokenResponse = await TokenRequest.performTokenRequest(
        new FetchRequestor(),
        config,
        tokenRequest
      );

      callback(tokenResponse, null);
    });
  }
};
