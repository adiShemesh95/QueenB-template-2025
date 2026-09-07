/**
 * Admin-local matching status display map.
 * Kept under client/src/admin instead of importing matching/constants or
 * StatusChip, which depend on MatchingLanguageContext — avoids refactoring
 * teammate-owned matching UI just to share labels.
 *
 * Only the four CURRENT production statuses. Future lifecycle values
 * (attendance, meeting outcome, feedback completed) are intentionally omitted.
 */
export const ADMIN_MATCHING_STATUSES = [
  "PENDING_MENTOR",
  "PENDING_MENTEE",
  "MATCHED",
  "REJECTED",
];

export const ADMIN_STATUS_LABELS = {
  PENDING_MENTOR: "Waiting for mentor times",
  PENDING_MENTEE: "Waiting for mentee selection",
  MATCHED: "Matched",
  REJECTED: "Rejected",
};

export const ADMIN_STATUS_COLORS = {
  PENDING_MENTOR: {
    bg: "rgba(141, 216, 247, 0.22)",
    color: "#0B6E99",
  },
  PENDING_MENTEE: {
    bg: "rgba(247, 95, 138, 0.12)",
    color: "#D93F68",
  },
  MATCHED: {
    bg: "rgba(72, 187, 120, 0.15)",
    color: "#2F855A",
  },
  REJECTED: {
    bg: "rgba(113, 128, 150, 0.14)",
    color: "#4A5568",
  },
};

/** Filter sentinel: omit status query param when "all" is selected. */
export const ADMIN_STATUS_FILTER_ALL = "";

export const ADMIN_STATUS_FILTER_OPTIONS = [
  { value: ADMIN_STATUS_FILTER_ALL, label: "All statuses" },
  ...ADMIN_MATCHING_STATUSES.map((status) => ({
    value: status,
    label: ADMIN_STATUS_LABELS[status],
  })),
];

export function getAdminStatusLabel(status) {
  return ADMIN_STATUS_LABELS[status] || status;
}
