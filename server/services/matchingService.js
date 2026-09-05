const pool = require("../db");

/**
 * Creates a new matching request between a mentee and a mentor.
 * Status defaults to PENDING_MENTOR via the database column default.
 *
 * @param {number} menteeId - Authenticated mentee user id
 * @param {number} mentorId - Mentor user id from the request body
 * @returns {Promise<object>} The created matching row
 */
async function createMatching(menteeId, mentorId) {
  const result = await pool.query(
    `INSERT INTO matching (mentee_id, mentor_id)
     VALUES ($1, $2)
     RETURNING *`,
    [menteeId, mentorId]
  );

  return result.rows[0];
}

const ACTIVE_STATUSES = ["PENDING_MENTOR", "PENDING_MENTEE", "MATCHED"];

/**
 * Finds an active matching request between a mentee and mentor, if any.
 * Active statuses: PENDING_MENTOR, PENDING_MENTEE, MATCHED (not REJECTED).
 *
 * @param {number} menteeId
 * @param {number} mentorId
 * @returns {Promise<object|undefined>} Existing active matching row, or undefined
 */
async function findActiveMatching(menteeId, mentorId) {
  const result = await pool.query(
    `SELECT *
     FROM matching
     WHERE mentee_id = $1
       AND mentor_id = $2
       AND status = ANY($3::varchar[])`,
    [menteeId, mentorId, ACTIVE_STATUSES]
  );

  return result.rows[0];
}

/**
 * Returns matching requests for a mentee, newest first.
 *
 * @param {number} menteeId - Authenticated mentee user id
 * @returns {Promise<object[]>} Matching rows for that mentee
 */
async function getMatchingsByMentee(menteeId) {
  const result = await pool.query(
    `SELECT *
     FROM matching
     WHERE mentee_id = $1
     ORDER BY created_at DESC`,
    [menteeId]
  );

  return result.rows;
}

/**
 * Returns a single matching request if it belongs to the given mentee.
 *
 * @param {number} matchingId - Matching row id
 * @param {number} menteeId - Authenticated mentee user id
 * @returns {Promise<object|undefined>} The matching row, or undefined if not found / not owned
 */
async function getMatchingByIdForMentee(matchingId, menteeId) {
  const result = await pool.query(
    `SELECT *
     FROM matching
     WHERE id = $1 AND mentee_id = $2`,
    [matchingId, menteeId]
  );

  return result.rows[0];
}

module.exports = {
  createMatching,
  findActiveMatching,
  getMatchingsByMentee,
  getMatchingByIdForMentee,
};
