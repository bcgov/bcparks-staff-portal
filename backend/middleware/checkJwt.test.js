import crypto from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ISSUER = "https://sso.example.com/realms/test";

const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
});

// Stand in for the Keycloak JWKS endpoint: always return the test public key.
// checkJwt.js is imported below, after the keys exist.
vi.mock("jwks-rsa", () => ({
  default: {
    expressJwtSecret: () => async () => publicKey,
  },
}));

process.env.JWT_ISSUER = ISSUER;
const { default: checkJwt } = await import("./checkJwt.js");

/**
 * Encodes a JWT header or payload.
 * @param {Object} value Header or payload
 * @returns {string} base64url JSON
 */
function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

/**
 * Signs an RS256 token with the test private key.
 * @param {Object} claims Extra token claims
 * @returns {string} Signed JWT
 */
function signToken(claims) {
  const now = Math.floor(Date.now() / 1000);
  const data = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({
    iss: ISSUER,
    sub: "user",
    iat: now,
    exp: now + 300,
    ...claims,
  })}`;
  const signature = crypto
    .sign("sha256", Buffer.from(data), privateKey)
    .toString("base64url");

  return `${data}.${signature}`;
}

/**
 * Runs checkJwt with a token and resolves with what it passed to next().
 * @param {string} token Bearer token
 * @returns {Promise<Object>} The request and any error
 */
function runCheckJwt(token) {
  const req = {
    method: "GET",
    url: "/api/test",
    headers: { authorization: `Bearer ${token}` },
  };

  return new Promise((resolve) => {
    checkJwt(req, {}, (err) => resolve({ req, err }));
  });
}

describe("checkJwt", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("accepts a valid token", async () => {
    const { req, err } = await runCheckJwt(signToken({}));

    expect(err).toBeUndefined();
    expect(req.auth.sub).toBe("user");
  });

  it("rejects an expired token with a 401", async () => {
    const expired = Math.floor(Date.now() / 1000) - 3600;
    const { req, err } = await runCheckJwt(signToken({ exp: expired }));

    expect(err.status).toBe(401);
    expect(req.auth).toBeUndefined();
  });

  it("rejects a token from another issuer", async () => {
    const { err } = await runCheckJwt(
      signToken({ iss: "https://evil.example.com" }),
    );

    expect(err.status).toBe(401);
  });
});
