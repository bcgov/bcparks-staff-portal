/**
 * Checks if a user has any of the desired roles or is a super admin.
 * @param {Object} userAuth The user authentication object containing roles (from checkJwt middleware)
 * @param {Array} desiredRoles List of roles to check against the user's roles
 * @param {boolean} [orSuperAdmin=true] If true, the function will return true if the user is a super admin
 * @returns {boolean} - Returns true if the user has any of the desired roles or is a super admin
 */
export default function checkUserRoles(
  userAuth,
  desiredRoles,
  orSuperAdmin = true,
) {
  const userRoles = userAuth.resource_access["staff-portal"].roles;

  if (orSuperAdmin && userRoles.includes("doot-super-admin")) {
    return true;
  }

  // Return true if the user has any of the desired roles
  return desiredRoles.some((role) => userRoles.includes(role));
}
