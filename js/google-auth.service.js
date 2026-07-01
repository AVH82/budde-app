const GOOGLE_CLIENT_ID = '336553597848-ooiu6khcjtodrhkku13olc5cfqi93a5f.apps.googleusercontent.com';
const GOOGLE_AUTH_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';

const GoogleAuthService = (() => {
  const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
  const state = {
    initialized: false,
    configured: false,
    tokenClient: null,
    accessToken: null,
    tokenExpiresAt: null,
    user: null,
    message: ''
  };

  function hasClientId() {
    return Boolean(GOOGLE_CLIENT_ID);
  }

  function markNotConfigured() {
    state.initialized = true;
    state.configured = false;
    state.message = 'Google Auth non configuré : renseignez GOOGLE_CLIENT_ID dans js/google-auth.service.js.';
    console.info(state.message);
    return getStatus();
  }

  function loadScript() {
    if (window.google?.accounts?.oauth2) return Promise.resolve();
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      return new Promise((resolve, reject) => {
        existing.addEventListener('load', resolve, { once: true });
        existing.addEventListener('error', reject, { once: true });
      });
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Impossible de charger Google Identity Services.'));
      document.head.appendChild(script);
    });
  }

  function decodeJwtPayload(token) {
    if (!token) return null;
    try {
      const payload = token.split('.')[1];
      if (!payload) return null;
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(atob(normalized).split('').map(char => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`).join(''));
      return JSON.parse(json);
    } catch (error) {
      console.warn('Profil Google non décodable depuis le jeton.', error);
      return null;
    }
  }

  const listeners = new Set();

  function notify() {
    listeners.forEach(listener => listener(getStatus()));
  }

  async function fetchUserInfo(accessToken) {
    try {
      const res = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${encodeURIComponent(accessToken)}`);
      if (!res.ok) return null;
      const info = await res.json();
      return {
        id: info.sub || null,
        email: info.email || null,
        name: info.name || null,
        picture: info.picture || null
      };
    } catch (error) {
      console.warn('Profil Google indisponible après connexion.', error);
      return null;
    }
  }

  async function updateToken(response) {
    console.info('Google Auth : réponse jeton reçue.', { hasAccessToken: Boolean(response?.access_token), expiresIn: response?.expires_in, error: response?.error });
    if (response.error) {
      state.message = `Erreur Google Auth : ${response.error}`;
      console.warn(state.message, response);
      notify();
      return;
    }
    state.accessToken = response.access_token || null;
    state.tokenExpiresAt = response.expires_in ? Date.now() + response.expires_in * 1000 : null;
    const profile = decodeJwtPayload(response.id_token);
    state.user = profile ? {
      id: profile.sub,
      email: profile.email,
      name: profile.name,
      picture: profile.picture
    } : null;
    if (state.accessToken && (!state.user?.email || !state.user?.name)) {
      state.user = { ...(state.user || {}), ...(await fetchUserInfo(state.accessToken) || {}) };
    }
    state.message = state.accessToken ? 'Connecté à Google.' : 'Réponse Google reçue sans jeton d’accès.';
    if (state.accessToken) {
      console.info('Google Auth : jeton d’accès disponible.', { expiresAt: state.tokenExpiresAt ? new Date(state.tokenExpiresAt).toISOString() : null });
    } else {
      console.warn('Google Auth : aucun jeton d’accès dans la réponse Google.', response);
    }
    notify();
  }

  function getStatus() {
    const expired = Boolean(state.tokenExpiresAt && Date.now() >= state.tokenExpiresAt);
    return {
      configured: state.configured,
      initialized: state.initialized,
      signedIn: Boolean(state.accessToken && !expired),
      provider: 'google',
      scope: GOOGLE_AUTH_SCOPE,
      message: state.message || (state.configured ? 'Google Auth prêt.' : 'Google Auth non configuré.')
    };
  }

  async function init() {
    if (!hasClientId()) return markNotConfigured();
    if (state.initialized && state.tokenClient) return getStatus();
    await loadScript();
    state.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: GOOGLE_AUTH_SCOPE,
      callback: updateToken
    });
    state.initialized = true;
    state.configured = true;
    state.message = 'Google Auth prêt.';
    notify();
    return getStatus();
  }

  async function requestAccessToken(prompt = 'consent') {
    const status = await init();
    if (!status.configured) return null;
    return new Promise((resolve, reject) => {
      const previousCallback = state.tokenClient.callback;
      state.tokenClient.callback = async response => {
        state.tokenClient.callback = previousCallback || updateToken;
        try {
          await updateToken(response);
          if (response?.error) {
            reject(new Error(`Erreur Google Auth : ${response.error}`));
            return;
          }
          resolve(getStatus().signedIn ? state.accessToken : null);
        } catch (error) {
          reject(error);
        }
      };
      console.info('Google Auth : demande de jeton d’accès.', { prompt });
      state.tokenClient.requestAccessToken({ prompt });
    });
  }

  async function signIn() {
    await requestAccessToken('consent');
    return getStatus();
  }

  async function ensureAccessToken() {
    const current = getStatus();
    if (current.signedIn && state.accessToken) {
      console.info('Google Auth : jeton existant valide au moment du clic.', { expiresAt: state.tokenExpiresAt ? new Date(state.tokenExpiresAt).toISOString() : null });
      return state.accessToken;
    }
    console.warn('Google Auth : jeton absent ou expiré, nouvelle demande avant sauvegarde Drive.', { signedIn: current.signedIn, expiresAt: state.tokenExpiresAt ? new Date(state.tokenExpiresAt).toISOString() : null });
    return requestAccessToken(state.accessToken ? '' : 'consent');
  }

  function signOut() {
    if (state.accessToken && window.google?.accounts?.oauth2) {
      google.accounts.oauth2.revoke(state.accessToken, () => {});
    }
    state.accessToken = null;
    state.tokenExpiresAt = null;
    state.user = null;
    state.message = state.configured ? 'Déconnecté de Google.' : state.message;
    notify();
    return getStatus();
  }

  return {
    init,
    signIn,
    signOut,
    isSignedIn: () => getStatus().signedIn,
    getUser: () => state.user,
    getAccessToken: () => getStatus().signedIn ? state.accessToken : null,
    ensureAccessToken,
    onChange: listener => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getStatus
  };
})();

window.GoogleAuthService = GoogleAuthService;
