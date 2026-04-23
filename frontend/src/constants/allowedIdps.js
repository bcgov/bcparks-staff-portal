// List of allowed IDP (Identity Provider) hints for authentication flows for Keycloak.
// Used to validate IDP hints in login and protected route logic.

export default new Set(["idir", "bceid", "bcsc"]);
