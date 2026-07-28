// Dates of Operation Tool user roles from Keycloak

// Top-level inherited role for all users. Used to allow or deny access to the tool.
export const DOOT_USER = "doot-user";

// Users who should have access to all parks without explicit bundle assignment in the database
export const ALL_PARK_ACCESS = "doot-all-park-access";

// Permission to approve submitted dates
export const APPROVER = "doot-approver";

// IS team approvers: HQ Staff that can approve DOOT submissions on behalf of the Information Services team
export const INFORMATION_SVC_APPROVER = "doot-information-svc-approver";

// RS team approvers: HQ Staff that can approve DOOT submissions on behalf of the Reservation Services team
export const RESERVATION_SVC_APPROVER = "doot-reservation-svc-approver";

// Permission to enter dates and save as draft
export const CONTRIBUTOR = "doot-contributor";

// Permission to submit dates for approval
export const SUBMITTER = "doot-submitter";

// Full access to all features in DOOT. All permission checks pass for Super Admins
export const SUPER_ADMIN = "doot-super-admin";
