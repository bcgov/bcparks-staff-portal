// Staff Portal user roles from Keycloak

// Top-level inherited role for all users. Used to allow or deny access to the tool.
export const DOOT_USER = "doot-user";

// Users who should have access to all parks without explicit bundle assignment in the database
export const DOOT_ALL_PARK_ACCESS = "doot-all-park-access";

// Permission to approve submitted dates
export const DOOT_APPROVER = "doot-approver";

// Permission to enter dates and save as draft
export const DOOT_CONTRIBUTOR = "doot-contributor";

// Permission to submit dates for approval
export const DOOT_SUBMITTER = "doot-submitter";

// Full access to all features in DOOT. All permission checks pass for Super Admins
export const SUPER_ADMIN = "doot-super-admin";

// Role for admin/web team to approve submitted public advisories and edit activities/facilities
export const ADVISORY_APPROVER = "advisory-approver";

// Role for staff to submit new public advisories
export const ADVISORY_SUBMITTER = "advisory-submitter";

// Permission to enter new advisories and save draft
export const ADVISORY_CONTRIBUTOR = "advisory-contributor";

// Permission to publish first and get approval later
export const ADVISORY_PUBLISH_WITHOUT_APPROVAL =
  "advisory-publish-without-approval";

// Used by developers to check if a user has any access to public advisory features
export const ADVISORY_USER = "advisory-user";

// Assigned to provide access to all BCP and RST advisories when there are no explicit restrictions in the database
export const ADVISORY_ALL_RESOURCE_ACCESS = "advisory-all-resource-access";

// Used by developers to check if a user has any access to the Staff Portal.
export const STAFF_PORTAL_USER = "staff-portal-user";

// BCP user (may be used in the future to distinguish between BC Parks and RST)
export const BCPARKS_USER = "bcparks-user";

// RST user (may be used in the future to distinguish between BC Parks and RST)
export const RECREATION_USER = "recreation-user";
