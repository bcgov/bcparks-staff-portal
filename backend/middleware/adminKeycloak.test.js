/* eslint-disable camelcase -- mirrors Keycloak's payload and OAuth parameter names */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminJS, { BaseProperty, BaseResource } from "adminjs";
import {
  ADMINJS_DEVELOPER,
  ADMINJS_EDITOR,
  DOOT_APPROVER,
  SUPER_ADMIN,
} from "../constants/userRoles.js";

const post = vi.fn();
let tokenClaims;

vi.mock("axios", () => ({ default: { post } }));

// Stand in for the JWKS-backed verifier: set req.auth like express-jwt does
vi.mock("./checkJwt.js", () => ({
  checkJwtFromToken(req, res, next) {
    if (!tokenClaims) return next(new Error("invalid token"));

    req.auth = tokenClaims;
    return next();
  },
}));

const { addKeycloakLoginRoutes, applyRolePermissions, getAdminUserFromAuth } =
  await import("./adminKeycloak.js");

/**
 * Builds Keycloak token claims with the given staff-portal roles.
 * @param {Array<string>} roles staff-portal client roles
 * @returns {Object} Token claims
 */
function claimsWithRoles(roles) {
  return {
    email: "jane.doe@gov.bc.ca",
    name: "Jane Doe",
    preferred_username: "jdoe@idir",
    resource_access: { "staff-portal": { roles } },
  };
}

const developerClaims = claimsWithRoles([ADMINJS_DEVELOPER]);

const admin = {
  options: { rootPath: "/admin", loginPath: "/admin/login" },
  renderLogin: vi.fn(async ({ errorMessage }) => `login page: ${errorMessage}`),
};

/**
 * Registers the Keycloak routes on a fake router and returns their handlers.
 * @returns {Object} Route handlers keyed by path
 */
function getRoutes() {
  const routes = {};

  addKeycloakLoginRoutes(
    {
      get(path, handler) {
        routes[path] = handler;
      },
    },
    admin,
  );
  return routes;
}

/**
 * Builds a fake Express request with a session.
 * @param {Object} query Query string values
 * @param {Object} [keycloakLogin] Pending login stored in the session
 * @returns {Object} Fake request
 */
function makeRequest(query, keycloakLogin) {
  const session = {
    keycloakLogin,
    save: vi.fn((callback) => callback()),
    regenerate: vi.fn((callback) => callback()),
  };

  return {
    query,
    session,
    protocol: "https",
    get: () => "admin.example.com",
  };
}

/**
 * Builds a fake Express response that records the outcome.
 * @returns {Object} Fake response
 */
function makeResponse() {
  const res = {
    status: vi.fn((code) => {
      res.statusCode = code;
      return res;
    }),
    send: vi.fn((body) => {
      res.body = body;
    }),
    redirect: vi.fn((url) => {
      res.redirectUrl = url;
    }),
  };

  return res;
}

describe("getAdminUserFromAuth", () => {
  it("returns an AdminJS user for a developer", () => {
    expect(getAdminUserFromAuth(developerClaims)).toEqual({
      email: "jane.doe@gov.bc.ca",
      title: "Jane Doe",
      username: "jdoe@idir",
      authMethod: "keycloak",
      role: ADMINJS_DEVELOPER,
    });
  });

  it("gives editors their role", () => {
    expect(getAdminUserFromAuth(claimsWithRoles([ADMINJS_EDITOR])).role).toBe(
      ADMINJS_EDITOR,
    );
  });

  it("uses the developer role when a user has both roles", () => {
    expect(
      getAdminUserFromAuth(claimsWithRoles([ADMINJS_EDITOR, ADMINJS_DEVELOPER]))
        .role,
    ).toBe(ADMINJS_DEVELOPER);
  });

  it("returns null for a super admin without an AdminJS role", () => {
    expect(getAdminUserFromAuth(claimsWithRoles([SUPER_ADMIN]))).toBeNull();
  });

  it("returns null for a user without an AdminJS role", () => {
    expect(
      getAdminUserFromAuth({
        ...developerClaims,
        resource_access: { "staff-portal": { roles: [DOOT_APPROVER] } },
      }),
    ).toBeNull();
  });

  it("returns null when the token has no staff-portal roles", () => {
    expect(
      getAdminUserFromAuth({ ...developerClaims, resource_access: {} }),
    ).toBeNull();
  });
});

describe("Keycloak login routes", () => {
  beforeEach(() => {
    process.env.JWT_ISSUER = "https://sso.example.com/realms/test";
    post.mockReset();
    post.mockResolvedValue({ data: { access_token: "token" } });
    tokenClaims = developerClaims;
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("redirects to Keycloak with PKCE and the IDIR hint", () => {
    const req = makeRequest({});
    const res = makeResponse();

    getRoutes()["/keycloak/login"](req, res, vi.fn());

    const url = new URL(res.redirectUrl);

    expect(url.origin + url.pathname).toBe(
      "https://sso.example.com/realms/test/protocol/openid-connect/auth",
    );
    expect(url.searchParams.get("client_id")).toBe("staff-portal");
    expect(url.searchParams.get("kc_idp_hint")).toBe("idir");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "https://admin.example.com/admin/keycloak/callback",
    );
    expect(url.searchParams.get("state")).toBe(req.session.keycloakLogin.state);
  });

  it("rejects a callback whose state doesn't match the session", async () => {
    const req = makeRequest(
      { code: "code", state: "wrong" },
      { state: "expected", codeVerifier: "verifier" },
    );
    const res = makeResponse();

    await getRoutes()["/keycloak/callback"](req, res, vi.fn());

    expect(res.statusCode).toBe(401);
    expect(post).not.toHaveBeenCalled();
    expect(req.session.adminUser).toBeUndefined();
  });

  it("rejects a token that fails verification", async () => {
    tokenClaims = null;
    const req = makeRequest(
      { code: "code", state: "expected" },
      { state: "expected", codeVerifier: "verifier" },
    );
    const res = makeResponse();

    await getRoutes()["/keycloak/callback"](req, res, vi.fn());

    expect(res.statusCode).toBe(401);
    expect(req.session.adminUser).toBeUndefined();
  });

  it("rejects a user without an AdminJS role", async () => {
    tokenClaims = {
      ...developerClaims,
      resource_access: { "staff-portal": { roles: [DOOT_APPROVER] } },
    };
    const req = makeRequest(
      { code: "code", state: "expected" },
      { state: "expected", codeVerifier: "verifier" },
    );
    const res = makeResponse();

    await getRoutes()["/keycloak/callback"](req, res, vi.fn());

    expect(res.statusCode).toBe(403);
    expect(admin.renderLogin).toHaveBeenLastCalledWith(
      expect.objectContaining({ errorMessage: "keycloakNoAdminRole" }),
    );
    expect(req.session.adminUser).toBeUndefined();
  });

  it("logs in a super admin and sends the PKCE verifier", async () => {
    const req = makeRequest(
      { code: "code", state: "expected" },
      { state: "expected", codeVerifier: "verifier" },
    );
    const res = makeResponse();

    await getRoutes()["/keycloak/callback"](req, res, vi.fn());

    const body = post.mock.calls[0][1];

    expect(body.get("code_verifier")).toBe("verifier");
    expect(body.get("grant_type")).toBe("authorization_code");
    expect(req.session.regenerate).toHaveBeenCalled();
    expect(req.session.adminUser.username).toBe("jdoe@idir");
    expect(res.redirectUrl).toBe("/admin");
  });
});

// Minimal in-memory resource, so the tests use real AdminJS decorators
class MemoryResource extends BaseResource {
  constructor(resourceId) {
    super();
    this.resourceId = resourceId;
    this.idProperty = new BaseProperty({ path: "id", isId: true });
  }

  id() {
    return this.resourceId;
  }

  databaseName() {
    return `memory-${this.resourceId}`;
  }

  properties() {
    return [this.idProperty];
  }
}

describe("applyRolePermissions", () => {
  const handler = vi.fn();
  const relationActions = {
    addManyToManyRelation: { actionType: "record", handler },
    deleteRelation: { actionType: "record", handler },
  };
  const permissionsAdmin = new AdminJS({
    resources: [
      { resource: new MemoryResource("AccessGroups") },
      { resource: new MemoryResource("AppSettings") },
      { resource: new MemoryResource("UserAccessGroups") },
      {
        resource: new MemoryResource("Parks"),
        options: { actions: relationActions },
      },
      {
        resource: new MemoryResource("Seasons"),
        options: {
          actions: {
            updateOldStatus: { actionType: "resource", handler },
          },
        },
      },
      {
        resource: new MemoryResource("Dateables"),
        options: { actions: { edit: { isAccessible: false } } },
      },
    ],
  });

  applyRolePermissions(permissionsAdmin);

  /**
   * Checks an action the same way AdminJS does before running it.
   * @param {Object} currentAdmin AdminJS user
   * @param {string} resourceId Resource ID
   * @param {string} actionName Action name
   * @returns {boolean} Whether the user can use the action
   */
  function can(currentAdmin, resourceId, actionName) {
    return permissionsAdmin
      .findResource(resourceId)
      .decorate()
      .actions[actionName].isAccessible(currentAdmin);
  }

  const developer = { role: ADMINJS_DEVELOPER };
  const editor = { role: ADMINJS_EDITOR };

  it("lets editors use every access group action", () => {
    for (const action of ["new", "edit", "delete", "bulkDelete"]) {
      expect(can(editor, "AccessGroups", action)).toBe(true);
    }
  });

  it("limits editors elsewhere to their listed actions", () => {
    expect(can(editor, "Parks", "addManyToManyRelation")).toBe(true);
    expect(can(editor, "Parks", "deleteRelation")).toBe(true);
    expect(can(editor, "AppSettings", "edit")).toBe(true);
    expect(can(editor, "UserAccessGroups", "new")).toBe(true);

    expect(can(editor, "AppSettings", "new")).toBe(false);
    expect(can(editor, "AppSettings", "delete")).toBe(false);
    expect(can(editor, "Parks", "edit")).toBe(false);
    expect(can(editor, "Seasons", "updateOldStatus")).toBe(false);
    expect(can(editor, "Seasons", "bulkDelete")).toBe(false);
  });

  it("keeps read actions open to editors", () => {
    expect(can(editor, "Seasons", "list")).toBe(true);
    expect(can(editor, "Seasons", "show")).toBe(true);
  });

  it("lets developers use every action, including custom ones", () => {
    expect(can(developer, "Seasons", "updateOldStatus")).toBe(true);
    expect(can(developer, "Parks", "edit")).toBe(true);
    expect(can(developer, "AppSettings", "delete")).toBe(true);
  });

  it("gives a user with both roles developer rights", () => {
    const user = getAdminUserFromAuth(
      claimsWithRoles([ADMINJS_EDITOR, ADMINJS_DEVELOPER]),
    );

    expect(can(user, "Seasons", "updateOldStatus")).toBe(true);
  });

  it("keeps an action's own isAccessible rule", () => {
    expect(can(developer, "Dateables", "edit")).toBe(false);
  });

  it("gives a session without a role only editor rights", () => {
    expect(can({}, "Parks", "edit")).toBe(false);
    expect(can({}, "AccessGroups", "delete")).toBe(true);
  });
});
/* eslint-enable camelcase -- end of file */
