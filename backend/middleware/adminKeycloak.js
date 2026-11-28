// Keycloak (IDIR) login for AdminJS, using the same Keycloak realm and client
// as the staff portal. Only AdminJS developers and editors can log in.

import crypto from "node:crypto";
import axios from "axios";
import asyncHandler from "express-async-handler";
import { checkJwtFromToken } from "./checkJwt.js";
import { getRolesFromAuth } from "../utils/checkUserRoles.js";
import { ADMINJS_DEVELOPER, ADMINJS_EDITOR } from "../constants/userRoles.js";

// Keycloak client shared with the staff portal frontend and API
const CLIENT_ID = "staff-portal";

/**
 * Returns the base URL for the realm's OpenID Connect endpoints.
 * @returns {string} OpenID Connect base URL
 */
function getOidcBaseUrl() {
  return `${process.env.JWT_ISSUER}/protocol/openid-connect`;
}

/**
 * Returns the URL Keycloak redirects back to after login.
 * @param {Object} req Express request object
 * @param {AdminJS} admin AdminJS instance
 * @returns {string} Absolute callback URL
 */
function getRedirectUri(req, admin) {
  return `${req.protocol}://${req.get("host")}${admin.options.rootPath}/keycloak/callback`;
}

/**
 * Generates a random URL-safe string for the OAuth state and PKCE verifier.
 * @returns {string} Random base64url string
 */
function randomToken() {
  return crypto.randomBytes(32).toString("base64url");
}

/**
 * Runs an Express middleware and resolves when it calls next().
 * @param {Function} middleware Express middleware
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @returns {Promise<void>} Rejects with the error the middleware passed to next()
 */
function runMiddleware(middleware, req, res) {
  return new Promise((resolve, reject) => {
    middleware(req, res, (err) => (err ? reject(err) : resolve()));
  });
}

/**
 * Builds the AdminJS user from verified Keycloak token claims.
 * @param {Object} auth Decoded access token claims (from checkJwtFromToken)
 * @returns {Object|null} AdminJS user, or null if the user has no AdminJS role
 */
export function getAdminUserFromAuth(auth) {
  if (!auth?.resource_access?.[CLIENT_ID]) return null;

  // Developer wins when a user has both roles
  const roles = getRolesFromAuth(auth);
  const role = [ADMINJS_DEVELOPER, ADMINJS_EDITOR].find((r) =>
    roles.includes(r),
  );

  if (!role) return null;

  return {
    email: auth.email ?? auth.preferred_username,
    title: auth.name,
    username: auth.preferred_username,
    authMethod: "keycloak",
    role,
  };
}

/**
 * Adds the Keycloak login routes to the AdminJS router.
 * The router must already have the AdminJS session middleware.
 * @param {Object} router Express router mounted at the AdminJS root path
 * @param {AdminJS} admin AdminJS instance
 * @returns {void}
 */
export function addKeycloakLoginRoutes(router, admin) {
  /**
   * Shows the AdminJS login page with an error.
   * AdminJS embeds login props in a single-quoted script without escaping,
   * so pass an error code (no quotes) that AdminJS translates to the text.
   * @param {Object} res Express response object
   * @param {number} status HTTP status code
   * @param {string} errorCode Message key from the AdminJS locale in adminJs.js
   * @returns {Promise<void>}
   */
  async function renderLoginError(res, status, errorCode) {
    const loginPage = await admin.renderLogin({
      action: admin.options.loginPath,
      errorMessage: errorCode,
    });

    res.status(status).send(loginPage);
  }

  // Start the login: redirect to Keycloak, skipping its IDP chooser for IDIR
  router.get("/keycloak/login", (req, res, next) => {
    const state = randomToken();
    const codeVerifier = randomToken();
    const codeChallenge = crypto
      .createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");

    req.session.keycloakLogin = { state, codeVerifier };

    /* eslint-disable camelcase -- OAuth/Keycloak parameter names */
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: "code",
      scope: "openid",
      redirect_uri: getRedirectUri(req, admin),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      kc_idp_hint: "idir",
    });
    /* eslint-enable camelcase -- end of OAuth parameters */

    req.session.save((err) => {
      if (err) return next(err);

      return res.redirect(`${getOidcBaseUrl()}/auth?${params}`);
    });
  });

  // Finish the login: exchange the code, verify the token, and check the role
  router.get(
    "/keycloak/callback",
    asyncHandler(async (req, res) => {
      const pendingLogin = req.session.keycloakLogin;
      const { code, state, error } = req.query;

      delete req.session.keycloakLogin;

      if (error) {
        console.error("AdminJS Keycloak login error:", error);
        return renderLoginError(res, 401, "keycloakLoginFailed");
      }

      if (!pendingLogin || !code || state !== pendingLogin.state) {
        return renderLoginError(res, 401, "keycloakLoginExpired");
      }

      try {
        /* eslint-disable camelcase -- OAuth parameter names */
        const { data } = await axios.post(
          `${getOidcBaseUrl()}/token`,
          new URLSearchParams({
            grant_type: "authorization_code",
            client_id: CLIENT_ID,
            code,
            redirect_uri: getRedirectUri(req, admin),
            code_verifier: pendingLogin.codeVerifier,
          }),
        );
        /* eslint-enable camelcase -- end of OAuth parameters */

        req.keycloakAccessToken = data.access_token;
        await runMiddleware(checkJwtFromToken, req, res);
      } catch (err) {
        // Log the reason only; never log tokens or codes
        console.error("AdminJS Keycloak token verification failed:", {
          message: err.message,
          reason: err.response?.data?.error,
        });
        return renderLoginError(res, 401, "keycloakTokenInvalid");
      }

      const adminUser = getAdminUserFromAuth(req.auth);

      if (!adminUser) {
        return renderLoginError(res, 403, "keycloakNoAdminRole");
      }

      // Start a fresh session for the logged-in user
      await new Promise((resolve, reject) => {
        req.session.regenerate((err) => (err ? reject(err) : resolve()));
      });
      req.session.adminUser = adminUser;
      await new Promise((resolve, reject) => {
        req.session.save((err) => (err ? reject(err) : resolve()));
      });

      return res.redirect(admin.options.rootPath);
    }),
  );
}

// Actions editors can use besides reading (true = every action);
// developers can use every action
const EDITOR_ACTIONS = {
  AccessGroups: true,
  Users: ["addManyToManyRelation", "deleteRelation"],
  Parks: ["addManyToManyRelation", "deleteRelation"],
  AppSettings: ["edit"],
  // Junction tables: lets editors use "Add" on the access group relation tabs
  UserAccessGroups: ["new"],
  AccessGroupParks: ["new"],
};
const READ_ACTIONS = new Set(["list", "show", "search", "findRelation"]);

/**
 * Limits AdminJS actions by the user's AdminJS role. It wraps each decorated
 * action's access check after AdminJS is built, so it also covers custom and
 * plugin actions, and keeps each action's own isAccessible rule.
 * @param {AdminJS} admin AdminJS instance
 * @returns {void}
 */
export function applyRolePermissions(admin) {
  admin.resources.forEach((resource) => {
    const editorActions = EDITOR_ACTIONS[resource.id()];

    Object.entries(resource.decorate().actions).forEach(([name, decorated]) => {
      if (READ_ACTIONS.has(name)) return;

      const { isAccessible = true } = decorated.action;

      decorated.action = {
        ...decorated.action,
        isAccessible: (context) =>
          (context.currentAdmin?.role === ADMINJS_DEVELOPER ||
            editorActions === true ||
            Boolean(editorActions?.includes(name))) &&
          (typeof isAccessible === "function"
            ? isAccessible(context)
            : isAccessible),
      };
    });
  });
}
