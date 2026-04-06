import getEnv from "./getEnv";
import { WebStorageStateStore } from "oidc-client-ts";

const frontendBaseUrl = getEnv("VITE_FRONTEND_BASE_URL");

export const oidcConfig = {
  authority: getEnv("VITE_OIDC_AUTHORITY"),
  client_id: getEnv("VITE_OIDC_CLIENT_ID"),

  userStore: new WebStorageStateStore({
    store: window.sessionStorage, // use sessionStorage instead of default (memory/local)
  }),

  // Redirect back to the page you were on after logging in
  redirect_uri: new URL(window.location.pathname, frontendBaseUrl).toString(),
  post_logout_redirect_uri: new URL(
    "/login?logged-out",
    frontendBaseUrl,
  ).toString(),

  // Automatically renew the access token before it expires
  automaticSilentRenew: true,
  // Allow cross-tab login/logout detection
  monitorSession: true,
};

// Strips OIDC parameters from the URL after redirecting back to the app
export function onSigninCallback() {
  window.history.replaceState({}, document.title, window.location.pathname);
}
