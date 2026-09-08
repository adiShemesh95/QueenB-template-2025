const pool = require("../db");

const ALLOWED_EVENT_TYPES = [
  "mentor_profile_viewed",
  "mentoring_request_sent",
  "slot_selected",
  "match_confirmed",
];

const ALLOWED_SOURCES = ["whatsapp", "linkedin", "copy_link", "direct"];

/** Events that occur after a matching exists and therefore require matchingId. */
const EVENTS_REQUIRING_MATCHING_ID = new Set([
  "mentoring_request_sent",
  "slot_selected",
  "match_confirmed",
]);

/**
 * Events the public HTTP track endpoint may accept.
 * Lifecycle conversions must be recorded only from trusted server code.
 */
const CLIENT_TRACKABLE_EVENT_TYPES = ["mentor_profile_viewed"];

const FUNNEL_STAGES = [
  {
    eventType: "mentor_profile_viewed",
    key: "profileViews",
    label: "Profile Views",
  },
  {
    eventType: "mentoring_request_sent",
    key: "mentoringRequests",
    label: "Mentoring Requests",
  },
  {
    eventType: "slot_selected",
    key: "slotsSelected",
    label: "Slots Selected",
  },
  {
    eventType: "match_confirmed",
    key: "successfulMatches",
    label: "Successful Matches",
  },
];

const METADATA_MAX_BYTES = 1024;

const BLOCKED_METADATA_KEYS = new Set([
  "email",
  "username",
  "password",
  "passwordHash",
  "password_hash",
  "bio",
  "background",
  "feedback",
]);

/**
 * Maps an analytics_events row to the public camelCase shape.
 */
function toPublicEvent(row) {
  return {
    id: row.id,
    eventType: row.event_type,
    userId: row.user_id == null ? null : Number(row.user_id),
    mentorUserId: row.mentor_user_id == null ? null : Number(row.mentor_user_id),
    matchingId: row.matching_id == null ? null : Number(row.matching_id),
    source: row.source,
    metadata: row.metadata && typeof row.metadata === "object" ? row.metadata : {},
    createdAt: row.created_at,
  };
}

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === "[object Object]"
  );
}

/**
 * Positive integer for optional/required id fields.
 * null/undefined/"" → omit (value null) unless required.
 */
function parseOptionalPositiveInteger(value, field, { required = false } = {}) {
  if (value === undefined || value === null || value === "") {
    if (required) {
      return {
        error: {
          field,
          message: `${field} is required.`,
        },
      };
    }
    return { value: null };
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return {
      error: {
        field,
        message: `${field} must be a positive integer.`,
      },
    };
  }

  return { value: parsed };
}

function normalizeSource(source) {
  if (source === undefined || source === null || String(source).trim() === "") {
    return { value: "direct" };
  }

  const normalized = String(source).trim();
  if (!ALLOWED_SOURCES.includes(normalized)) {
    return {
      error: {
        field: "source",
        message: "source must be one of: whatsapp, linkedin, copy_link, direct.",
      },
    };
  }

  return { value: normalized };
}

function validateMetadata(metadata) {
  if (metadata === undefined || metadata === null) {
    return { value: {} };
  }

  if (!isPlainObject(metadata)) {
    return {
      error: {
        field: "metadata",
        message: "metadata must be a plain JSON object.",
      },
    };
  }

  for (const key of Object.keys(metadata)) {
    if (BLOCKED_METADATA_KEYS.has(key)) {
      return {
        error: {
          field: "metadata",
          message: `metadata must not include sensitive field "${key}".`,
        },
      };
    }
  }

  let serialized;
  try {
    serialized = JSON.stringify(metadata);
  } catch {
    return {
      error: {
        field: "metadata",
        message: "metadata must be JSON-serializable.",
      },
    };
  }

  if (Buffer.byteLength(serialized, "utf8") > METADATA_MAX_BYTES) {
    return {
      error: {
        field: "metadata",
        message: "metadata must be at most 1 KB when serialized.",
      },
    };
  }

  return { value: metadata };
}

/**
 * Records one analytics event into analytics_events.
 *
 * @returns {Promise<object | { error: string, details?: object[] }>}
 *   Public camelCase event on success, or VALIDATION_ERROR result on domain failure.
 */
async function trackEvent({
  eventType,
  userId,
  mentorUserId,
  matchingId,
  source,
  metadata,
} = {}) {
  const details = [];

  if (eventType === undefined || eventType === null || String(eventType).trim() === "") {
    details.push({ field: "eventType", message: "eventType is required." });
  } else if (!ALLOWED_EVENT_TYPES.includes(String(eventType).trim())) {
    details.push({
      field: "eventType",
      message:
        "eventType must be one of: mentor_profile_viewed, mentoring_request_sent, slot_selected, match_confirmed.",
    });
  }

  const normalizedEventType =
    eventType === undefined || eventType === null
      ? null
      : String(eventType).trim() || null;

  const parsedUserId = parseOptionalPositiveInteger(userId, "userId");
  if (parsedUserId.error) details.push(parsedUserId.error);

  const parsedMentorUserId = parseOptionalPositiveInteger(mentorUserId, "mentorUserId", {
    required: true,
  });
  if (parsedMentorUserId.error) details.push(parsedMentorUserId.error);

  const matchingIdRequired =
    normalizedEventType != null &&
    EVENTS_REQUIRING_MATCHING_ID.has(normalizedEventType);
  const parsedMatchingId = parseOptionalPositiveInteger(matchingId, "matchingId", {
    required: matchingIdRequired,
  });
  if (parsedMatchingId.error) details.push(parsedMatchingId.error);

  const parsedSource = normalizeSource(source);
  if (parsedSource.error) details.push(parsedSource.error);

  const parsedMetadata = validateMetadata(metadata);
  if (parsedMetadata.error) details.push(parsedMetadata.error);

  if (details.length > 0) {
    return { error: "VALIDATION_ERROR", details };
  }

  try {
    const result = await pool.query(
      `INSERT INTO analytics_events (
         event_type,
         user_id,
         mentor_user_id,
         matching_id,
         source,
         metadata
       )
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)
       RETURNING
         id,
         event_type,
         user_id,
         mentor_user_id,
         matching_id,
         source,
         metadata,
         created_at`,
      [
        normalizedEventType,
        parsedUserId.value,
        parsedMentorUserId.value,
        parsedMatchingId.value,
        parsedSource.value,
        JSON.stringify(parsedMetadata.value),
      ]
    );

    return toPublicEvent(result.rows[0]);
  } catch (err) {
    // Foreign key violation on user_id / mentor_user_id.
    if (err && err.code === "23503") {
      const detail = String(err.detail || "");
      const field = /mentor_user_id/i.test(detail)
        ? "mentorUserId"
        : /user_id/i.test(detail)
          ? "userId"
          : "userId";

      return {
        error: "VALIDATION_ERROR",
        details: [
          {
            field,
            message:
              field === "mentorUserId"
                ? "mentorUserId must reference an existing user."
                : "userId must reference an existing user.",
          },
        ],
      };
    }

    throw err;
  }
}

/** Percentage rate; never NaN/Infinity. Rounded to 2 decimal places. */
function safeConversionRate(numerator, denominator) {
  const num = Number(numerator) || 0;
  const den = Number(denominator) || 0;
  if (den <= 0) return 0;
  return Math.round((num / den) * 10000) / 100;
}

/**
 * Aggregates analytics_events for the Admin Analytics dashboard.
 * All figures come from SQL counts — no hardcoded KPI values.
 *
 * @returns {Promise<{
 *   kpis: object,
 *   funnel: object[],
 *   sources: object[],
 *   matchesOverTime: object[]
 * }>}
 */
async function getDashboardAnalytics() {
  const [totalsResult, sourcesResult, trendResult] = await Promise.all([
    pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE event_type = 'mentor_profile_viewed')::int
           AS profile_views,
         COUNT(*) FILTER (WHERE event_type = 'mentoring_request_sent')::int
           AS mentoring_requests,
         COUNT(*) FILTER (WHERE event_type = 'slot_selected')::int
           AS slots_selected,
         COUNT(*) FILTER (WHERE event_type = 'match_confirmed')::int
           AS successful_matches
       FROM analytics_events`
    ),
    pool.query(
      `SELECT
         source,
         COUNT(*) FILTER (WHERE event_type = 'mentor_profile_viewed')::int
           AS profile_views,
         COUNT(*) FILTER (WHERE event_type = 'mentoring_request_sent')::int
           AS mentoring_requests,
         COUNT(*) FILTER (WHERE event_type = 'slot_selected')::int
           AS slots_selected,
         COUNT(*) FILTER (WHERE event_type = 'match_confirmed')::int
           AS successful_matches
       FROM analytics_events
       WHERE source = ANY($1::text[])
       GROUP BY source`,
      [ALLOWED_SOURCES]
    ),
    pool.query(
      `SELECT
         to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS date,
         COUNT(*)::int AS successful_matches
       FROM analytics_events
       WHERE event_type = 'match_confirmed'
       GROUP BY 1
       ORDER BY 1 ASC`
    ),
  ]);

  const totals = totalsResult.rows[0] || {};
  const profileViews = totals.profile_views || 0;
  const mentoringRequests = totals.mentoring_requests || 0;
  const slotsSelected = totals.slots_selected || 0;
  const successfulMatches = totals.successful_matches || 0;

  const countByType = {
    mentor_profile_viewed: profileViews,
    mentoring_request_sent: mentoringRequests,
    slot_selected: slotsSelected,
    match_confirmed: successfulMatches,
  };

  const funnel = FUNNEL_STAGES.map((stage) => {
    const count = countByType[stage.eventType] || 0;
    return {
      eventType: stage.eventType,
      key: stage.key,
      label: stage.label,
      count,
      percentageOfViews: safeConversionRate(count, profileViews),
    };
  });

  const sourceRowsByKey = new Map(
    sourcesResult.rows.map((row) => [row.source, row])
  );

  const sources = ALLOWED_SOURCES.map((source) => {
    const row = sourceRowsByKey.get(source) || {};
    const sourceViews = row.profile_views || 0;
    const sourceRequests = row.mentoring_requests || 0;
    const sourceSlots = row.slots_selected || 0;
    const sourceMatches = row.successful_matches || 0;

    return {
      source,
      profileViews: sourceViews,
      mentoringRequests: sourceRequests,
      slotsSelected: sourceSlots,
      successfulMatches: sourceMatches,
      conversionRate: safeConversionRate(sourceMatches, sourceViews),
    };
  });

  return {
    kpis: {
      profileViews,
      mentoringRequests,
      slotsSelected,
      successfulMatches,
      conversionRate: safeConversionRate(successfulMatches, profileViews),
    },
    funnel,
    funnelConversions: {
      requestRateFromViews: safeConversionRate(mentoringRequests, profileViews),
      slotRateFromRequests: safeConversionRate(slotsSelected, mentoringRequests),
      matchRateFromSlots: safeConversionRate(successfulMatches, slotsSelected),
    },
    sources,
    matchesOverTime: trendResult.rows.map((row) => ({
      date: row.date,
      successfulMatches: row.successful_matches || 0,
    })),
  };
}

/**
 * Original referral source for a matching, from mentoring_request_sent.
 * Falls back to "direct" when missing or invalid.
 */
async function getMatchingAttribution(matchingId) {
  const parsed = Number(matchingId);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return "direct";
  }

  const result = await pool.query(
    `SELECT source
     FROM analytics_events
     WHERE matching_id = $1
       AND event_type = 'mentoring_request_sent'
     ORDER BY created_at ASC, id ASC
     LIMIT 1`,
    [parsed]
  );

  const source = result.rows[0]?.source;
  if (source && ALLOWED_SOURCES.includes(source)) {
    return source;
  }
  return "direct";
}

module.exports = {
  ALLOWED_EVENT_TYPES,
  ALLOWED_SOURCES,
  CLIENT_TRACKABLE_EVENT_TYPES,
  trackEvent,
  getDashboardAnalytics,
  getMatchingAttribution,
};

