const pool = require("../db");

const MENTOR_TOPIC_OPTIONS = [
  "Mock Interview",
  "Career Planning",
  "Company Guidance",
  "Resume Review",
  "Tech Skills",
];

/**
 * Maps a mentor_profiles row (+ optional users.username) to the public API shape.
 */
function toPublicMentor(row) {
  if (!row) return null;

  return {
    id: row.id,
    userId: row.user_id,
    username: row.username || null,
    background: row.background || null,
    techStack: Array.isArray(row.tech_stack) ? row.tech_stack : [],
    job: row.job || null,
    company: row.company || null,
    yearsExperience:
      row.years_experience == null ? null : Number(row.years_experience),
    topics: Array.isArray(row.topics) ? row.topics : [],
    maxSessions: row.max_sessions == null ? null : Number(row.max_sessions),
    sessionDuration:
      row.session_duration == null ? null : Number(row.session_duration),
    isActive: Boolean(row.is_active),
    profileImageUrl: row.profile_image_url || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toPublicSlot(row) {
  if (!row) return null;
  return {
    id: row.id,
    matchingId: row.matching_id,
    start: row.start_time,
    end: row.end_time,
    isSelected: Boolean(row.is_selected),
  };
}

function normalizeStringArray(value) {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function parseOptionalInteger(value) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return NaN;
  return parsed;
}

/**
 * Returns all active mentor profiles with usernames.
 */
async function getActiveMentors() {
  const result = await pool.query(
    `SELECT mp.*, u.username
     FROM mentor_profiles mp
     INNER JOIN users u ON u.id = mp.user_id
     WHERE mp.is_active = TRUE
     ORDER BY mp.created_at DESC`
  );

  return result.rows.map(toPublicMentor);
}

/**
 * Returns one mentor profile by mentor_profiles.id (active or not for owner views).
 * Directory detail typically wants active only — pass { activeOnly: true }.
 */
async function getMentorById(mentorProfileId, { activeOnly = false } = {}) {
  const result = await pool.query(
    `SELECT mp.*, u.username
     FROM mentor_profiles mp
     INNER JOIN users u ON u.id = mp.user_id
     WHERE mp.id = $1
       AND ($2::boolean = FALSE OR mp.is_active = TRUE)`,
    [mentorProfileId, activeOnly]
  );

  return toPublicMentor(result.rows[0]);
}

/**
 * Returns the mentor profile for a given user id, if any.
 */
async function getMentorProfileByUserId(userId) {
  const result = await pool.query(
    `SELECT mp.*, u.username
     FROM mentor_profiles mp
     INNER JOIN users u ON u.id = mp.user_id
     WHERE mp.user_id = $1`,
    [userId]
  );

  return toPublicMentor(result.rows[0]);
}

/**
 * Creates or updates the mentor profile for the authenticated user.
 *
 * @returns {Promise<{ mentor: object } | { error: string, details?: object[] }>}
 */
async function upsertMentorProfile(userId, payload = {}) {
  const background =
    payload.background == null ? null : String(payload.background).trim();
  const job = payload.job == null ? null : String(payload.job).trim();
  const company =
    payload.company == null ? null : String(payload.company).trim();
  const profileImageUrl =
    payload.profileImageUrl == null && payload.profile_image_url == null
      ? null
      : String(payload.profileImageUrl || payload.profile_image_url).trim() ||
        null;

  const techStack = normalizeStringArray(
    payload.techStack != null ? payload.techStack : payload.tech_stack
  );
  const topics = normalizeStringArray(payload.topics);

  const yearsExperience = parseOptionalInteger(
    payload.yearsExperience != null
      ? payload.yearsExperience
      : payload.years_experience
  );
  const maxSessions = parseOptionalInteger(
    payload.maxSessions != null ? payload.maxSessions : payload.max_sessions
  );
  const sessionDuration = parseOptionalInteger(
    payload.sessionDuration != null
      ? payload.sessionDuration
      : payload.session_duration
  );

  const details = [];

  if (!job) {
    details.push({ field: "job", message: "Job title is required." });
  }
  if (!company) {
    details.push({ field: "company", message: "Company is required." });
  }
  if (Number.isNaN(yearsExperience)) {
    details.push({
      field: "yearsExperience",
      message: "Years of experience must be a whole number.",
    });
  } else if (yearsExperience != null && yearsExperience < 0) {
    details.push({
      field: "yearsExperience",
      message: "Years of experience cannot be negative.",
    });
  }
  if (Number.isNaN(maxSessions)) {
    details.push({
      field: "maxSessions",
      message: "Max sessions must be a whole number.",
    });
  } else if (maxSessions != null && maxSessions <= 0) {
    details.push({
      field: "maxSessions",
      message: "Max sessions must be greater than zero.",
    });
  }
  if (Number.isNaN(sessionDuration)) {
    details.push({
      field: "sessionDuration",
      message: "Session duration must be a whole number.",
    });
  } else if (sessionDuration != null && sessionDuration <= 0) {
    details.push({
      field: "sessionDuration",
      message: "Session duration must be greater than zero.",
    });
  }
  if (topics.length === 0) {
    details.push({
      field: "topics",
      message: "Select at least one mentoring topic.",
    });
  }

  if (details.length > 0) {
    return { error: "VALIDATION_ERROR", details };
  }

  const isActive =
    payload.isActive == null && payload.is_active == null
      ? true
      : Boolean(
          payload.isActive != null ? payload.isActive : payload.is_active
        );

  const result = await pool.query(
    `INSERT INTO mentor_profiles (
       user_id,
       background,
       tech_stack,
       job,
       company,
       years_experience,
       topics,
       max_sessions,
       session_duration,
       is_active,
       profile_image_url
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     ON CONFLICT (user_id) DO UPDATE SET
       background = EXCLUDED.background,
       tech_stack = EXCLUDED.tech_stack,
       job = EXCLUDED.job,
       company = EXCLUDED.company,
       years_experience = EXCLUDED.years_experience,
       topics = EXCLUDED.topics,
       max_sessions = EXCLUDED.max_sessions,
       session_duration = EXCLUDED.session_duration,
       is_active = EXCLUDED.is_active,
       profile_image_url = EXCLUDED.profile_image_url,
       updated_at = NOW()
     RETURNING *`,
    [
      userId,
      background || null,
      techStack,
      job,
      company,
      yearsExperience,
      topics,
      maxSessions == null ? 5 : maxSessions,
      sessionDuration == null ? 60 : sessionDuration,
      isActive,
      profileImageUrl,
    ]
  );

  const withUsername = await getMentorProfileByUserId(userId);
  return { mentor: withUsername || toPublicMentor(result.rows[0]) };
}

/**
 * Incoming matching requests for the logged-in mentor (by users.id).
 */
async function getMentorRequests(mentorUserId) {
  const result = await pool.query(
    `SELECT m.*,
            mentee.username AS mentee_username
     FROM matching m
     INNER JOIN users mentee ON mentee.id = m.mentee_id
     WHERE m.mentor_id = $1
     ORDER BY m.created_at DESC`,
    [mentorUserId]
  );

  const matchings = result.rows;
  if (matchings.length === 0) return [];

  const ids = matchings.map((row) => row.id);
  const slotsResult = await pool.query(
    `SELECT *
     FROM matching_slots
     WHERE matching_id = ANY($1::int[])
     ORDER BY start_time ASC`,
    [ids]
  );

  const slotsByMatching = new Map();
  for (const slot of slotsResult.rows) {
    const list = slotsByMatching.get(slot.matching_id) || [];
    list.push(toPublicSlot(slot));
    slotsByMatching.set(slot.matching_id, list);
  }

  return matchings.map((row) => {
    const suggestedSlots = slotsByMatching.get(row.id) || [];
    const selectedSlot =
      suggestedSlots.find((slot) => slot.isSelected) ||
      (row.selected_slot_id
        ? suggestedSlots.find((slot) => slot.id === row.selected_slot_id)
        : null) ||
      null;

    return {
      id: row.id,
      status: row.status,
      menteeId: row.mentee_id,
      mentorId: row.mentor_id,
      moreTimesRequested: Boolean(row.more_times_requested),
      selectedSlotId: row.selected_slot_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      mentee: {
        id: row.mentee_id,
        username: row.mentee_username,
      },
      suggestedSlots,
      selectedSlot,
      meetingAt: selectedSlot ? selectedSlot.start : null,
    };
  });
}

async function getMatchingForMentor(matchingId, mentorUserId) {
  const result = await pool.query(
    `SELECT *
     FROM matching
     WHERE id = $1 AND mentor_id = $2`,
    [matchingId, mentorUserId]
  );
  return result.rows[0];
}

/**
 * Mentor proposes time slots for a PENDING_MENTOR request.
 * Inserts slots and moves status to PENDING_MENTEE.
 *
 * Body slots: [{ startTime|start, endTime|end }, ...]
 */
async function addSlotsToRequest(matchingId, mentorUserId, rawSlots) {
  const matching = await getMatchingForMentor(matchingId, mentorUserId);
  if (!matching) {
    return { error: "NOT_FOUND" };
  }

  if (matching.status !== "PENDING_MENTOR") {
    return { error: "INVALID_STATUS" };
  }

  if (!Array.isArray(rawSlots) || rawSlots.length === 0) {
    return {
      error: "VALIDATION_ERROR",
      details: [
        { field: "slots", message: "Provide at least one time slot." },
      ],
    };
  }

  const normalized = [];
  for (let i = 0; i < rawSlots.length; i += 1) {
    const item = rawSlots[i] || {};
    const startRaw = item.startTime || item.start || item.start_time;
    const endRaw = item.endTime || item.end || item.end_time;
    const start = startRaw ? new Date(startRaw) : null;
    const end = endRaw ? new Date(endRaw) : null;

    if (!start || Number.isNaN(start.getTime()) || !end || Number.isNaN(end.getTime())) {
      return {
        error: "VALIDATION_ERROR",
        details: [
          {
            field: "slots",
            message: `Slot ${i + 1} needs valid start and end times.`,
          },
        ],
      };
    }
    if (end <= start) {
      return {
        error: "VALIDATION_ERROR",
        details: [
          {
            field: "slots",
            message: `Slot ${i + 1} end time must be after start time.`,
          },
        ],
      };
    }

    normalized.push({ start: start.toISOString(), end: end.toISOString() });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const inserted = [];
    for (const slot of normalized) {
      const slotResult = await client.query(
        `INSERT INTO matching_slots (matching_id, start_time, end_time)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [matchingId, slot.start, slot.end]
      );
      inserted.push(toPublicSlot(slotResult.rows[0]));
    }

    const updateResult = await client.query(
      `UPDATE matching
       SET status = 'PENDING_MENTEE',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
         AND mentor_id = $2
         AND status = 'PENDING_MENTOR'
       RETURNING *`,
      [matchingId, mentorUserId]
    );

    if (!updateResult.rows[0]) {
      await client.query("ROLLBACK");
      return { error: "INVALID_STATUS" };
    }

    await client.query("COMMIT");

    return {
      matching: updateResult.rows[0],
      slots: inserted,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Mentor rejects a mentorship request.
 */
async function rejectRequest(matchingId, mentorUserId) {
  const matching = await getMatchingForMentor(matchingId, mentorUserId);
  if (!matching) {
    return { error: "NOT_FOUND" };
  }

  if (
    matching.status !== "PENDING_MENTOR" &&
    matching.status !== "PENDING_MENTEE"
  ) {
    return { error: "INVALID_STATUS" };
  }

  const result = await pool.query(
    `UPDATE matching
     SET status = 'REJECTED',
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
       AND mentor_id = $2
       AND status = ANY($3::varchar[])
     RETURNING *`,
    [matchingId, mentorUserId, ["PENDING_MENTOR", "PENDING_MENTEE"]]
  );

  if (!result.rows[0]) {
    return { error: "NOT_FOUND" };
  }

  return { matching: result.rows[0] };
}

module.exports = {
  MENTOR_TOPIC_OPTIONS,
  toPublicMentor,
  toPublicSlot,
  getActiveMentors,
  getMentorById,
  getMentorProfileByUserId,
  upsertMentorProfile,
  getMentorRequests,
  addSlotsToRequest,
  rejectRequest,
};
