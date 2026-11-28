import { expressjwt } from "express-jwt";
import jwksRsa from "jwks-rsa";

const jwtOptions = {
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 10,
    // Keycloak's JSON Web Key Set endpoint for the realm
    jwksUri: `${process.env.JWT_ISSUER}/protocol/openid-connect/certs`,

    // Log JWKS fetching errors for debugging
    handleSigningKeyError(err, cb) {
      console.error("JWKS signing key error:", err);
      cb(err);
    },
  }),

  algorithms: ["RS256", "ES256"],
  issuer: process.env.JWT_ISSUER,

  // Log expired tokens, then reject them. express-jwt accepts an expired
  // token if onExpired returns without throwing.
  onExpired(req, err) {
    console.error("JWT expired:", err.message);
    throw err;
  },
};

const jwtMiddleware = expressjwt(jwtOptions);

// Validates a token the server fetched itself (e.g. during the AdminJS
// Keycloak login) instead of one from the Authorization header
export const checkJwtFromToken = expressjwt({
  ...jwtOptions,
  getToken: (req) => req.keycloakAccessToken,
});

// Wrapper to handle JWT validation errors and return 401 status
export default function checkJwt(req, res, next) {
  jwtMiddleware(req, res, (err) => {
    if (err) {
      console.error("JWT validation error:", {
        message: err.message,
        name: err.name,
        status: err.status,
        url: req.url,
        method: req.method,
      });

      // Set status to 401 if not already set and pass to global error handler
      if (!err.status) {
        err.status = 401;
      }
      return next(err);
    }

    // Only continue if JWT validation succeeded
    return next();
  });
}
