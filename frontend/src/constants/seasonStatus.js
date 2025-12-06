// Database values and display names for Season status

export const PUBLISHED = {
  label: "Published",
  value: "published",
};

export const APPROVED = {
  label: "Approved",
  value: "approved",
};

export const REQUESTED = {
  label: "Requested by HQ",
  value: "requested",
};

export const PENDING_REVIEW = {
  label: "Pending HQ review",
  value: "pending review",
};

export const NOT_PROVIDED = {
  label: "Not provided",
  value: "not provided",
};

export const labelByValue = {
  [PUBLISHED.value]: PUBLISHED.label,
  [APPROVED.value]: APPROVED.label,
  [REQUESTED.value]: REQUESTED.label,
  [PENDING_REVIEW.value]: PENDING_REVIEW.label,
  [NOT_PROVIDED.value]: NOT_PROVIDED.label,
};
