import getEnv from "./getEnv";

export const oidcConfig = {
  authority: getEnv("VITE_OIDC_AUTHORITY"),
  client_id: getEnv("VITE_OIDC_CLIENT_ID"),

  // Redirect back to the page you were on after logging in
  redirect_uri: `${window.location.origin}${window.location.pathname}`,
  post_logout_redirect_uri: `${window.location.origin}/v2/?logged-out`,

  // Automatically renew the access token before it expires
  automaticSilentRenew: true,
  // Allow cross-tab login/logout detection
  monitorSession: true,
};

// Strips OIDC parameters from the URL after redirecting back to the app
export function onSigninCallback() {
  window.history.replaceState({}, document.title, window.location.pathname);
}
