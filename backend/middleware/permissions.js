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

/**
 * Middleware to sanitize the request payload based on user roles.
 * @param {Object} req The request object.
 * @param {Object} res The response object.
 * @param {Function} next The next middleware function.
 * @returns {Function} The next middleware function.
 */
export function sanitizePayload(req, res, next) {
  try {
    if (
      !req.auth?.resource_access ||
      !req.auth.resource_access["staff-portal"]
    ) {
      throw new Error("Authentication data missing");
    }

    const userRoles = req.auth.resource_access["staff-portal"].roles;

    // If the user does NOT have permission, remove `readyToPublish`
    if (!adminsAndApprovers.some((role) => userRoles.includes(role))) {
      // check if readyToPublish is in the payload
      if (req.body) {
        delete req.body.readyToPublish;
        delete req.body.status;
      }
    }

    return next();
  } catch (error) {
    return next(error);
  }
}

// * adjust subareas (doesn't exist yet - can be done in admin console)
// * types of associated dates (doesn't exist yet - can be done in admin console)
