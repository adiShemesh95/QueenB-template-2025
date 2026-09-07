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

/**
 * Admin-local status visuals (chips + calendar events).
 * Isolated under client/src/admin so we do not refactor teammate-owned
 * matching constants just to share colors. Calendar reuses this map so
 * status styling stays centralized — not scattered as inline hex values.
 *
 * Only the four CURRENT production statuses; Stage 7 lifecycle colors
 * (attendance / outcome / feedback) are intentionally omitted.
 */
export const ADMIN_STATUS_COLORS = {
  PENDING_MENTOR: {
    bg: "rgba(141, 216, 247, 0.28)",
    color: "#0B6E99",
    border: "#3BAAD8",
    dot: "#3BAAD8",
  },
  PENDING_MENTEE: {
    bg: "rgba(246, 173, 85, 0.22)",
    color: "#B7791F",
    border: "#ED8936",
    dot: "#ED8936",
  },
  MATCHED: {
    bg: "rgba(72, 187, 120, 0.18)",
    color: "#276749",
    border: "#38A169",
    dot: "#38A169",
  },
  REJECTED: {
    bg: "rgba(247, 95, 138, 0.16)",
    color: "#C53030",
    border: "#F75F8A",
    dot: "#E53E3E",
  },
};

/** Resolve Admin calendar/chip colors for a matching status. */
export function getAdminStatusColors(status) {
  return ADMIN_STATUS_COLORS[status] || ADMIN_STATUS_COLORS.REJECTED;
}

/**
 * Build calendar events from Admin matchings report rows.
 *
 * WHY selectedSlot only:
 * - selectedSlot is the chosen scheduled meeting time (matching.selected_slot_id).
 * - Proposed slots are intentionally NOT rendered as separate meetings.
 * - Matchings without selectedSlot stay visible on /admin/matchings but do
 *   not appear on the Calendar (Calendar = scheduled times only).
 *
 * Does not invent attendance, completion, or feedback — presentation only.
 */
export function toAdminCalendarEvents(matchings) {
  if (!Array.isArray(matchings)) return [];

  return matchings
    .filter(
      (matching) =>
        matching?.selectedSlot?.start != null &&
        matching.selectedSlot.start !== ""
    )
    .map((matching) => {
      const mentorName = matching.mentor?.username || "Mentor";
      const menteeName = matching.mentee?.username || "Mentee";
      return {
        id: matching.id,
        status: matching.status,
        title: `${mentorName} ↔ ${menteeName}`,
        start: matching.selectedSlot.start,
        end: matching.selectedSlot.end ?? null,
        // Keep report participants for the calendar summary panel
        // (no extra GET /matchings/:id on event click).
        mentor: matching.mentor ?? null,
        mentee: matching.mentee ?? null,
      };
    });
}

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
