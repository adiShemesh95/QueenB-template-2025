const pool = require("../db");
const { toPublicUser } = require("./authService");
const { getMentorProfileByUserId } = require("./mentorsService");

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

module.exports = {
  listUsersForAdmin,
  getUserForAdmin,
};
