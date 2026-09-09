const pool = require("../db");
const {
  trackEvent,
  getMatchingAttribution,
} = require("./analyticsService");
const {
  notifyMentorshipRequest,
  notifyMoreTimesRequested,
  notifyMeetingConfirmed,
  notifyMeetingCancelled,
  notifyMeetingReschedule,
} = require("./notificationsService");

/**
 * Creates a new matching request between a mentee and a mentor.
 * Status defaults to PENDING_MENTOR via the database column default.
 *
 * @param {number} menteeId - Authenticated mentee user id
 * @param {number} mentorId - Mentor user id from the request body
 * @param {string} [source='direct'] - Referral attribution source
 * @returns {Promise<object>} The created matching row
 */
async function createMatching(menteeId, mentorId, source = "direct") {
  const result = await pool.query(
    `INSERT INTO matching (mentee_id, mentor_id)
     VALUES ($1, $2)
     RETURNING *`,
    [menteeId, mentorId]
  );

  const matching = result.rows[0];

  // Observability only — never roll back a successful product create.
  try {
    const analyticsResult = await trackEvent({
      eventType: "mentoring_request_sent",
      userId: menteeId,
      mentorUserId: mentorId,
      matchingId: matching.id,
      source,
    });
    if (analyticsResult?.error) {
      console.error(
        "analytics mentoring_request_sent validation failed:",
        analyticsResult
      );
    }
  } catch (err) {
    console.error("analytics mentoring_request_sent failed:", err.message);
  }

  try {
    await notifyMentorshipRequest({
      matchingId: matching.id,
      menteeId,
      mentorId,
    });
  } catch (err) {
    console.error("notify mentorship request failed:", err.message);
  }

  return enrichMatching(matching);
}

/**
 * Returns true if a user with the given id exists.
 *
 * @param {number} userId
 * @returns {Promise<boolean>}
 */
async function userExists(userId) {
  const result = await pool.query(
    `SELECT 1
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId]
  );

  return result.rowCount > 0;
}

// CANCELLED and REJECTED are terminal and must not block a new request.
const ACTIVE_STATUSES = ["PENDING_MENTOR", "PENDING_MENTEE", "MATCHED"];

/**
 * Finds an active matching request between a mentee and mentor, if any.
 * Active statuses: PENDING_MENTOR, PENDING_MENTEE, MATCHED
 * (not REJECTED or CANCELLED).
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
    more_times_requested: Boolean(matching.more_times_requested),
    reschedule_used: Boolean(matching.reschedule_used),
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

  const enrichedMoreTimes = await enrichMatching(result.rows[0]);

  try {
    await notifyMoreTimesRequested({
      matchingId,
      menteeId,
      mentorId: result.rows[0].mentor_id,
    });
  } catch (err) {
    console.error("notify more times failed:", err.message);
  }

  return { matching: enrichedMoreTimes };
}

/**
 * Mentee cancels a request after additional times were already requested
 * and the mentor proposed a second set of slots.
 * Allowed only when status is PENDING_MENTEE and more_times_requested is true.
 *
 * @param {number} matchingId
 * @param {number} menteeId
 * @returns {Promise<{ matching: object } | { error: string }>}
 */
async function cancelMatching(matchingId, menteeId) {
  const matching = await getMatchingByIdForMentee(matchingId, menteeId);

  if (!matching) {
    return { error: "NOT_FOUND" };
  }

  if (matching.status !== "PENDING_MENTEE") {
    return { error: "INVALID_STATUS" };
  }

  if (!matching.more_times_requested) {
    return { error: "CANCEL_NOT_ALLOWED" };
  }

  const result = await pool.query(
    `UPDATE matching
     SET status = 'REJECTED',
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
       AND mentee_id = $2
       AND status = 'PENDING_MENTEE'
       AND more_times_requested = true
     RETURNING *`,
    [matchingId, menteeId]
  );

  if (!result.rows[0]) {
    return { error: "NOT_FOUND" };
  }

  const enrichedCancel = await enrichMatching(result.rows[0]);

  try {
    await notifyMeetingCancelled({
      matchingId,
      menteeId,
      mentorId: result.rows[0].mentor_id,
      actorId: menteeId,
    });
  } catch (err) {
    console.error("notify mentee cancel (pending) failed:", err.message);
  }

  return { matching: enrichedCancel };
}

/**
 * Mentee selects a suggested time slot and completes the match.
 * Allowed only when status is PENDING_MENTEE and the slot belongs to this matching.
 *
 * @param {number} matchingId
 * @param {number} menteeId
 * @param {number} slotId
 * @returns {Promise<{ matching: object } | { error: string }>}
 */
async function selectSlot(matchingId, menteeId, slotId) {
  const matchingResult = await pool.query(
    `SELECT *
     FROM matching
     WHERE id = $1 AND mentee_id = $2`,
    [matchingId, menteeId]
  );
  const matching = matchingResult.rows[0];

  if (!matching) {
    return { error: "NOT_FOUND" };
  }

  if (matching.status !== "PENDING_MENTEE") {
    return { error: "INVALID_STATUS" };
  }

  const slotResult = await pool.query(
    `SELECT id
     FROM matching_slots
     WHERE id = $1 AND matching_id = $2`,
    [slotId, matchingId]
  );

  if (!slotResult.rows[0]) {
    return { error: "SLOT_NOT_FOUND" };
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Ensure only one slot is selected for this matching
    await client.query(
      `UPDATE matching_slots
       SET is_selected = false
       WHERE matching_id = $1`,
      [matchingId]
    );

    const selectedSlot = await client.query(
      `UPDATE matching_slots
       SET is_selected = true
       WHERE id = $1 AND matching_id = $2
       RETURNING id`,
      [slotId, matchingId]
    );

    if (!selectedSlot.rows[0]) {
      await client.query("ROLLBACK");
      return { error: "SLOT_NOT_FOUND" };
    }

    const updatedMatching = await client.query(
      `UPDATE matching
       SET selected_slot_id = $1,
           status = 'MATCHED',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
         AND mentee_id = $3
         AND status = 'PENDING_MENTEE'
       RETURNING *`,
      [slotId, matchingId, menteeId]
    );

    if (!updatedMatching.rows[0]) {
      await client.query("ROLLBACK");
      return { error: "INVALID_STATUS" };
    }

    await client.query("COMMIT");
    const enriched = await enrichMatching(updatedMatching.rows[0]);

    // Observability only — product transition already committed.
    try {
      const source = await getMatchingAttribution(matchingId);
      const mentorUserId = updatedMatching.rows[0].mentor_id;

      const slotAnalytics = await trackEvent({
        eventType: "slot_selected",
        userId: menteeId,
        mentorUserId,
        matchingId,
        source,
        metadata: { slotId },
      });
      if (slotAnalytics?.error) {
        console.error("analytics slot_selected validation failed:", slotAnalytics);
      }

      if (updatedMatching.rows[0].status === "MATCHED") {
        const matchAnalytics = await trackEvent({
          eventType: "match_confirmed",
          userId: menteeId,
          mentorUserId,
          matchingId,
          source,
        });
        if (matchAnalytics?.error) {
          console.error(
            "analytics match_confirmed validation failed:",
            matchAnalytics
          );
        }
      }
    } catch (err) {
      console.error("analytics slot/match tracking failed:", err.message);
    }

    try {
      const meetingAt = enriched.selected_slot?.start || null;
      await notifyMeetingConfirmed({
        matchingId,
        menteeId,
        mentorId: updatedMatching.rows[0].mentor_id,
        meetingAt,
      });
    } catch (err) {
      console.error("notify meeting confirmed failed:", err.message);
    }

    return { matching: enriched };
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {
      // ignore rollback errors
    }
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Start a one-time post-MATCHED reschedule.
 * Caller must be the mentee or the mentor for this matching.
 *
 * @param {number} matchingId
 * @param {{ menteeId?: number, mentorId?: number }} actor
 * @returns {Promise<{ matching: object } | { error: string }>}
 */
async function requestReschedule(matchingId, actor = {}) {
  const menteeId = actor.menteeId != null ? Number(actor.menteeId) : null;
  const mentorId = actor.mentorId != null ? Number(actor.mentorId) : null;

  if (
    (menteeId == null && mentorId == null) ||
    (menteeId != null && mentorId != null)
  ) {
    return { error: "NOT_FOUND" };
  }

  const ownershipSql =
    menteeId != null
      ? `id = $1 AND mentee_id = $2`
      : `id = $1 AND mentor_id = $2`;
  const actorId = menteeId != null ? menteeId : mentorId;

  const matchingResult = await pool.query(
    `SELECT *
     FROM matching
     WHERE ${ownershipSql}`,
    [matchingId, actorId]
  );
  const matching = matchingResult.rows[0];

  if (!matching) {
    return { error: "NOT_FOUND" };
  }

  if (matching.status !== "MATCHED") {
    return { error: "INVALID_STATUS" };
  }

  if (matching.reschedule_used) {
    return { error: "ALREADY_USED" };
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const cleared = await client.query(
      `UPDATE matching
       SET selected_slot_id = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
         AND status = 'MATCHED'
         AND reschedule_used = false
       RETURNING id`,
      [matchingId]
    );

    if (!cleared.rows[0]) {
      await client.query("ROLLBACK");
      return { error: "INVALID_STATUS" };
    }

    await client.query(
      `DELETE FROM matching_slots
       WHERE matching_id = $1`,
      [matchingId]
    );

    const updated = await client.query(
      `UPDATE matching
       SET status = 'PENDING_MENTOR',
           reschedule_used = true,
           more_times_requested = false,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [matchingId]
    );

    if (!updated.rows[0]) {
      await client.query("ROLLBACK");
      return { error: "NOT_FOUND" };
    }

    await client.query("COMMIT");
    const enrichedReschedule = await enrichMatching(updated.rows[0]);

    try {
      await notifyMeetingReschedule({
        matchingId,
        menteeId: updated.rows[0].mentee_id,
        mentorId: updated.rows[0].mentor_id,
        actorId,
      });
    } catch (err) {
      console.error("notify reschedule failed:", err.message);
    }

    return { matching: enrichedReschedule };
  } catch (err) {
    try {
      await client.query("ROLLBACK");
    } catch (_) {
      // ignore rollback errors
    }
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Fully cancel a MATCHED meeting (mentee or mentor).
 * Keeps selected_slot_id, is_selected, and slot rows for history.
 * Does not restart scheduling (unlike requestReschedule).
 *
 * @param {number} matchingId
 * @param {{ menteeId?: number, mentorId?: number }} actor
 * @returns {Promise<{ matching: object } | { error: string }>}
 */
async function cancelMatchedMeeting(matchingId, actor = {}) {
  const menteeId = actor.menteeId != null ? Number(actor.menteeId) : null;
  const mentorId = actor.mentorId != null ? Number(actor.mentorId) : null;

  if (
    (menteeId == null && mentorId == null) ||
    (menteeId != null && mentorId != null)
  ) {
    return { error: "NOT_FOUND" };
  }

  const ownershipSql =
    menteeId != null
      ? `id = $1 AND mentee_id = $2`
      : `id = $1 AND mentor_id = $2`;
  const actorId = menteeId != null ? menteeId : mentorId;

  const matchingResult = await pool.query(
    `SELECT *
     FROM matching
     WHERE ${ownershipSql}`,
    [matchingId, actorId]
  );
  const matching = matchingResult.rows[0];

  if (!matching) {
    return { error: "NOT_FOUND" };
  }

  if (matching.status !== "MATCHED") {
    return { error: "INVALID_STATUS" };
  }

  const result = await pool.query(
    `UPDATE matching
     SET status = 'CANCELLED',
         updated_at = CURRENT_TIMESTAMP
     WHERE ${ownershipSql}
       AND status = 'MATCHED'
     RETURNING *`,
    [matchingId, actorId]
  );

  if (!result.rows[0]) {
    return { error: "INVALID_STATUS" };
  }

  const enrichedMatchedCancel = await enrichMatching(result.rows[0]);

  try {
    await notifyMeetingCancelled({
      matchingId,
      menteeId: result.rows[0].mentee_id,
      mentorId: result.rows[0].mentor_id,
      actorId,
    });
  } catch (err) {
    console.error("notify matched cancel failed:", err.message);
  }

  return { matching: enrichedMatchedCancel };
}

module.exports = {
  createMatching,
  userExists,
  findActiveMatching,
  getMatchingsByMentee,
  getMatchingByIdForMentee,
  requestMoreTimes,
  cancelMatching,
  selectSlot,
  requestReschedule,
  cancelMatchedMeeting,
};
