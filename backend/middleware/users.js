import { User } from "../models/index.js";

/**
 * Middleware to add DB user to request object
 * @param {Object} req Express request object
 * @param {Object} res Express response object
 * @param {Function} next Express next middleware function
 * @returns {Promise<void>}
 * @throws {Error} When authentication data is missing or invalid
 */
async function usersMiddleware(req, res, next) {
  try {
    // We need email from keycloak to identify the user
    if (!req.auth?.email) {
      throw new Error("Authentication data missing");
    }

    const { email, name } = req.auth;

    // Find or create user in the database
    const [user] = await User.findOrCreate({
      attributes: ["id", "email", "name"],
      where: { email },
      defaults: { name },
    });

    req.user = user.toJSON();
    return next();
  } catch (error) {
    // Pass error message to error handling middleware
    return next(error);
  }
}

export default usersMiddleware;
