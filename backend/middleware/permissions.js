// TODO: include checks when we have list of POs and AccessGroups

export const adminsAndApprovers = ["doot-super-admin", "doot-approver"];

/**
 * Checks if the user has the required roles to access the route
 * @param {Array<string>} requiredRoles List of roles that are allowed to access the route
 * @returns {Function} - Express middleware function
 */
export function checkPermissions(requiredRoles) {
  return (req, res, next) => {
    try {
      if (!req.auth?.resource_access?.["staff-portal"]) {
        throw new Error("Authentication data missing");
      }

      const userRoles = req.auth.resource_access["staff-portal"].roles;

      // Check if user has at least one required role
      const hasPermission = requiredRoles.some((role) =>
        userRoles.includes(role),
      );

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
