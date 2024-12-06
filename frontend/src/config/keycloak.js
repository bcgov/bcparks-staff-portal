import getEnv from "./getEnv";

export default {
  authority: getEnv("VITE_OIDC_AUTHORITY"),
  client_id: getEnv("VITE_OIDC_CLIENT_ID"),

  // Redirect back to the page you were on after logging in
  redirect_uri: `${window.location.origin}${window.location.pathname}`,
  post_logout_redirect_uri: window.location.origin,

  // Automatically renew the access token before it expires
  automaticSilentRenew: true,

  // Strips OIDC parameters from the URL after redirecting back to the app
  onSigninCallback() {
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};
