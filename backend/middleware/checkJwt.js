import { expressjwt } from "express-jwt";
import jwksRsa from "jwks-rsa";

export default expressjwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: process.env.JWKS_URI,
  }),

  algorithms: ["RS256"],
  issuer: process.env.JWT_ISSUER,
});
