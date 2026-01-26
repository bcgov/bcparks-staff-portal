import checkUserRoles, { getRolesFromAuth } from "../utils/checkUserRoles.js";

/**
 * Checks if the user has the required roles to access the route. Always allows Super Admin users.
 * @param {Array<string>} requiredRoles List of roles that are allowed to access the route
 * @returns {Function} - Express middleware function
 */
export function checkPermissions(requiredRoles) {
  return (req, res, next) => {
    try {
      if (!req.auth?.resource_access?.["staff-portal"]) {
        throw new Error("Authentication data missing");
      }

      const userRoles = getRolesFromAuth(req.auth);

      // Check if user has at least one required role (or is a Super Admin)
      const hasPermission = checkUserRoles(userRoles, requiredRoles);

      if (!hasPermission) {
        return res.status(403).json({
          error:
            "Permission denied: You don't have permission to perform this action",
        });
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
}
