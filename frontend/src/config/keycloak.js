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

/**
 * Strips OIDC callback params from the URL after sign-in,
 * preserving any other query params and hash that were on the redirect_uri.
 * Removes: code, state, session_state, iss, error, error_description, error_uri (per OIDC spec and RFC 9207).
 * @returns {void}
 */
export function onSigninCallback() {
  const url = new URL(window.location.href);

  // Standard OIDC authorization response params
  for (const param of [
    "code",
    "state",
    "session_state",
    "iss",
    "error",
    "error_description",
    "error_uri",
  ]) {
    url.searchParams.delete(param);
  }

  window.history.replaceState(
    {},
    document.title,
    `${url.pathname}${url.search}${url.hash}`,
  );
}
