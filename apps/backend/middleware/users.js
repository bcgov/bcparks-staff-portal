import { User, AccessGroup } from "../models/index.js";

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
    // We need the "username" from keycloak to identify the user
    if (!req.auth?.preferred_username) {
      throw new Error("Authentication data missing");
    }

    // Also get the name (for display)
    // and email (shown in the CSV export)
    const { preferred_username: username, email, name } = req.auth;

    // Find or create user in the database
    const [user] = await User.findOrCreate({
      attributes: ["id", "username", "email", "name"],
      where: { username },
      defaults: { email, name },
      include: [
        {
          model: AccessGroup,
          as: "accessGroups",
          attributes: ["id", "name"],
        },
      ],
    });

    req.user = user.toJSON();
    return next();
  } catch (error) {
    // Pass error message to error handling middleware
    return next(error);
  }
}

export default usersMiddleware;
