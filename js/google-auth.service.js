const GOOGLE_CLIENT_ID = 'TODO_GOOGLE_CLIENT_ID';
const GOOGLE_AUTH_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';

const GoogleAuthService = (() => {
  const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
  const TODO_CLIENT_ID = 'TODO_GOOGLE_CLIENT_ID';
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
    return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== TODO_CLIENT_ID);
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

  function updateToken(response) {
    if (response.error) {
      state.message = `Erreur Google Auth : ${response.error}`;
      console.warn(state.message, response);
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
    state.message = state.accessToken ? 'Connecté à Google.' : 'Réponse Google reçue sans jeton d’accès.';
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
    return getStatus();
  }

  async function signIn() {
    const status = await init();
    if (!status.configured) return status;
    state.tokenClient.requestAccessToken({ prompt: 'consent' });
    return getStatus();
  }

  function signOut() {
    if (state.accessToken && window.google?.accounts?.oauth2) {
      google.accounts.oauth2.revoke(state.accessToken, () => {});
    }
    state.accessToken = null;
    state.tokenExpiresAt = null;
    state.user = null;
    state.message = state.configured ? 'Déconnecté de Google.' : state.message;
    return getStatus();
  }

  return {
    init,
    signIn,
    signOut,
    isSignedIn: () => getStatus().signedIn,
    getUser: () => state.user,
    getAccessToken: () => getStatus().signedIn ? state.accessToken : null,
    getStatus
  };
})();

window.GoogleAuthService = GoogleAuthService;
