export default {
  authority: import.meta.env.VITE_OIDC_AUTHORITY,
  client_id: import.meta.env.VITE_OIDC_CLIENT_ID,
  redirect_uri: import.meta.env.VITE_OIDC_LOGIN_REDIRECT,
  post_logout_redirect_uri: import.meta.env.VITE_OIDC_LOGOUT_REDIRECT,

  // Automatically renew the access token before it expires
  automaticSilentRenew: true,

  onSigninCallback() {
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};
