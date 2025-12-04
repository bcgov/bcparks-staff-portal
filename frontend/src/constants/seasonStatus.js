// Database values for Season status

// "Requested by HQ" - the initial state for all new seasons:
// Dates need to be filled in by submitters and then submitted for approval by approvers.
export const REQUESTED = "requested";

// "Approved" - dates that have been approved by reviewers, but not published yet
export const APPROVED = "approved";

// "Pending HQ review" - dates that have been submitted for review
// but not yet approved or published
export const PENDING_REVIEW = "pending review";

// "Published" - dates that have been sent to the Strapi CMS
export const PUBLISHED = "published";

// "Not provided" - a special status for seasons that were
// not approved before the season finished.
// Normal user flow doesn't allow setting this status,
// but maintenance scripts or admins can set it to avoid confusion.
export const NOT_PROVIDED = "not provided";
