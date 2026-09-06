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

  return enrichMatching(result.rows[0]);
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
 * Attaches mentor display fields and suggested slots for mentee UI.
 */
async function enrichMatching(matching) {
  if (!matching) return matching;

  const mentorResult = await pool.query(
    `SELECT u.username,
            mp.profile_image_url
     FROM users u
     LEFT JOIN mentor_profiles mp ON mp.user_id = u.id
     WHERE u.id = $1`,
    [matching.mentor_id]
  );
  const mentorRow = mentorResult.rows[0] || {};

  const slotsResult = await pool.query(
    `SELECT id, matching_id, start_time, end_time, is_selected
     FROM matching_slots
     WHERE matching_id = $1
     ORDER BY start_time ASC`,
    [matching.id]
  );

  const suggestedSlots = slotsResult.rows.map((slot) => ({
    id: slot.id,
    start: slot.start_time,
    end: slot.end_time,
    isSelected: Boolean(slot.is_selected),
  }));

  const selectedSlot =
    suggestedSlots.find((slot) => slot.isSelected) ||
    (matching.selected_slot_id
      ? suggestedSlots.find((slot) => slot.id === matching.selected_slot_id)
      : null) ||
    null;

  return {
    ...matching,
    mentor_username: mentorRow.username || null,
    mentor_profile_image_url: mentorRow.profile_image_url || null,
    suggested_slots: suggestedSlots,
    selected_slot: selectedSlot,
  };
}

async function enrichMatchings(matchings) {
  return Promise.all(matchings.map((row) => enrichMatching(row)));
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

  return enrichMatchings(result.rows);
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

  if (!result.rows[0]) return undefined;
  return enrichMatching(result.rows[0]);
}

/**
 * Mentee requests additional time slots from the mentor (once per matching).
 * Allowed only when status is PENDING_MENTEE and more_times_requested is false.
 *
 * @param {number} matchingId
 * @param {number} menteeId
 * @returns {Promise<{ matching: object } | { error: string }>}
 */
async function requestMoreTimes(matchingId, menteeId) {
  const matching = await getMatchingByIdForMentee(matchingId, menteeId);

  if (!matching) {
    return { error: "NOT_FOUND" };
  }

  if (matching.more_times_requested) {
    return { error: "ALREADY_REQUESTED" };
  }

  if (matching.status !== "PENDING_MENTEE") {
    return { error: "INVALID_STATUS" };
  }

  const result = await pool.query(
    `UPDATE matching
     SET more_times_requested = true,
         status = 'PENDING_MENTOR',
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
       AND mentee_id = $2
       AND status = 'PENDING_MENTEE'
       AND more_times_requested = false
     RETURNING *`,
    [matchingId, menteeId]
  );

  if (!result.rows[0]) {
    return { error: "NOT_FOUND" };
  }

  return { matching: await enrichMatching(result.rows[0]) };
}

module.exports = {
  createMatching,
  findActiveMatching,
  getMatchingsByMentee,
  getMatchingByIdForMentee,
  requestMoreTimes,
};
