import { SUPER_ADMIN } from "../constants/userRoles.js";

/**
 * Checks if a user has any of the desired roles or is a super admin.
 * @param {Array} userRoles The user's roles array (from getRolesFromAuth)
 * @param {Array} desiredRoles List of roles to check against the user's roles
 * @param {boolean} [orSuperAdmin=true] If true, the function will return true if the user is a super admin
 * @returns {boolean} - Returns true if the user has any of the desired roles or is a super admin
 */
export default function checkUserRoles(
  userRoles,
  desiredRoles,
  orSuperAdmin = true,
) {
  if (orSuperAdmin && userRoles.includes(SUPER_ADMIN)) {
    return true;
  }

  // Return true if the user has any of the desired roles
  return desiredRoles.some((role) => userRoles.includes(role));
}

/**
 * Returns the list of roles from the user authentication object.
 * @param {Object} userAuth The user authentication object containing roles (from checkJwt middleware)
 * @returns {Array} List of roles from the user authentication object
 */
export function getRolesFromAuth(userAuth) {
  return userAuth.resource_access["staff-portal"].roles;
}
