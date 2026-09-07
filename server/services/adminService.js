const pool = require("../db");
const { toPublicUser } = require("./authService");
const { getMentorProfileByUserId } = require("./mentorsService");

/**
 * Current production matching statuses only.
 * matchingService keeps ACTIVE_STATUSES private (and omits REJECTED); there is
 * no exported full list — kept Admin-local to avoid teammate-owned refactoring.
 *
 * Intentionally excludes future lifecycle values (attendance confirmed, meeting
 * happened / did not happen, feedback completed) until matching implements them.
 * Stage 3 must report real statuses, not invent unfinished meeting states.
 */
const MATCHING_REPORT_STATUSES = [
  "PENDING_MENTOR",
  "PENDING_MENTEE",
  "MATCHED",
  "REJECTED",
];

/**
 * Admin user list/detail metrics use matching row counts (any status), not
 * "completed meetings". The matching lifecycle does not yet reliably prove
 * a completed session, so these names stay intentionally provisional.
 */
function toAdminUserSummary(row) {
  return {
    ...toPublicUser(row),
    matchingCountAsMentor: Number(row.matching_count_as_mentor) || 0,
    matchingCountAsMentee: Number(row.matching_count_as_mentee) || 0,
  };
}

/** Minimal safe participant fields for Admin matching report (no password/auth). */
function toAdminMatchingParticipant(id, username, email) {
  return { id, username, email };
}

/**
 * Map the joined selected slot, or null when none was selected.
 * Never invent a time from an unselected / first / arbitrary slot.
 */
function toAdminSelectedSlot(row) {
  if (row.slot_id == null) {
    return null;
  }

  return {
    id: row.slot_id,
    start: row.slot_start,
    end: row.slot_end,
  };
}

function toAdminMatchingReport(row) {
  return {
    id: row.id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    mentor: toAdminMatchingParticipant(
      row.mentor_id,
      row.mentor_username,
      row.mentor_email
    ),
    mentee: toAdminMatchingParticipant(
      row.mentee_id,
      row.mentee_username,
      row.mentee_email
    ),
    selectedSlot: toAdminSelectedSlot(row),
  };
}

// Pre-aggregated LEFT JOINs keep users with zero matchings and avoid
// multiplying counts when a user appears as both mentor and mentee.
const MATCHING_COUNT_JOINS = `
  LEFT JOIN (
    SELECT mentor_id, COUNT(*)::int AS matching_count_as_mentor
    FROM matching
    GROUP BY mentor_id
  ) mentor_counts ON mentor_counts.mentor_id = u.id
  LEFT JOIN (
    SELECT mentee_id, COUNT(*)::int AS matching_count_as_mentee
    FROM matching
    GROUP BY mentee_id
  ) mentee_counts ON mentee_counts.mentee_id = u.id
`;

/**
 * Returns every user with provisional mentor/mentee matching counts.
 * Never selects password_hash.
 */
async function listUsersForAdmin() {
  const result = await pool.query(
    `SELECT
       u.id,
       u.email,
       u.username,
       u.created_at,
       u.is_admin,
       COALESCE(mentor_counts.matching_count_as_mentor, 0) AS matching_count_as_mentor,
       COALESCE(mentee_counts.matching_count_as_mentee, 0) AS matching_count_as_mentee
     FROM users u
     ${MATCHING_COUNT_JOINS}
     ORDER BY u.created_at DESC, u.id DESC`
  );

  return result.rows.map(toAdminUserSummary);
}

/**
 * Returns one user for Admin detail, including mentorProfile (or null).
 * @returns {Promise<object|null>}
 */
async function getUserForAdmin(userId) {
  const result = await pool.query(
    `SELECT
       u.id,
       u.email,
       u.username,
       u.created_at,
       u.is_admin,
       COALESCE(mentor_counts.matching_count_as_mentor, 0) AS matching_count_as_mentor,
       COALESCE(mentee_counts.matching_count_as_mentee, 0) AS matching_count_as_mentee
     FROM users u
     ${MATCHING_COUNT_JOINS}
     WHERE u.id = $1`,
    [userId]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  // Reuse mentorsService mapping; returns null when no mentor_profiles row exists.
  const mentorProfile = await getMentorProfileByUserId(userId);

  return {
    ...toAdminUserSummary(row),
    mentorProfile: mentorProfile || null,
  };
}

/**
 * Admin matchings report: one row per matching, with mentor/mentee and the
 * authoritative selected slot (matching.selected_slot_id) when present.
 * Filters are optional and must already be validated by the route.
 *
 * @param {{ status?: string, participantId?: number }} filters
 * @returns {Promise<object[]>}
 */
async function listMatchingsForAdmin(filters = {}) {
  const { status, participantId } = filters;
  const conditions = [];
  const params = [];

  // User-controlled filters use $n placeholders — never string-concatenate
  // status or participantId into SQL (injection safety).
  if (status != null) {
    params.push(status);
    conditions.push(`m.status = $${params.length}`);
  }

  // A participant is either side of the relationship.
  if (participantId != null) {
    params.push(participantId);
    conditions.push(
      `(m.mentor_id = $${params.length} OR m.mentee_id = $${params.length})`
    );
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Join only via selected_slot_id (set by matchingService.selectSlot).
  // Do not join matching_slots on matching_id alone: multiple proposed slots
  // would multiply one matching into several report rows.
  // LEFT JOIN keeps matchings with no selection visible; selectedSlot → null.
  const result = await pool.query(
    `SELECT
       m.id,
       m.status,
       m.created_at,
       m.updated_at,
       mentor_user.id AS mentor_id,
       mentor_user.username AS mentor_username,
       mentor_user.email AS mentor_email,
       mentee_user.id AS mentee_id,
       mentee_user.username AS mentee_username,
       mentee_user.email AS mentee_email,
       selected_slot.id AS slot_id,
       selected_slot.start_time AS slot_start,
       selected_slot.end_time AS slot_end
     FROM matching m
     INNER JOIN users mentor_user ON mentor_user.id = m.mentor_id
     INNER JOIN users mentee_user ON mentee_user.id = m.mentee_id
     LEFT JOIN matching_slots selected_slot
       ON selected_slot.id = m.selected_slot_id
     ${whereClause}
     ORDER BY m.created_at DESC, m.id DESC`,
    params
  );

  return result.rows.map(toAdminMatchingReport);
}

module.exports = {
  MATCHING_REPORT_STATUSES,
  listUsersForAdmin,
  getUserForAdmin,
  listMatchingsForAdmin,
};
