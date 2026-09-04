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

module.exports = {
  createMatching,
};
