const pool = require("../db");
const emailService = require("./emailService");

const NOTIFICATION_TYPES = {
  MENTORSHIP_REQUEST: "MENTORSHIP_REQUEST",
  SLOTS_PROPOSED: "SLOTS_PROPOSED",
  REQUEST_REJECTED: "REQUEST_REJECTED",
  MEETING_CONFIRMED: "MEETING_CONFIRMED",
  MORE_TIMES_REQUESTED: "MORE_TIMES_REQUESTED",
  MEETING_CANCELLED: "MEETING_CANCELLED",
  MEETING_RESCHEDULE: "MEETING_RESCHEDULE",
  MEETING_REMINDER: "MEETING_REMINDER",
  MEETING_FOLLOWUP: "MEETING_FOLLOWUP",
  FEEDBACK_REMINDER: "FEEDBACK_REMINDER",
  THANK_YOU: "THANK_YOU",
};

const MENTOR_BADGE_TYPES = [
  NOTIFICATION_TYPES.MENTORSHIP_REQUEST,
  NOTIFICATION_TYPES.MORE_TIMES_REQUESTED,
  NOTIFICATION_TYPES.MEETING_CONFIRMED,
  NOTIFICATION_TYPES.MEETING_CANCELLED,
  NOTIFICATION_TYPES.MEETING_RESCHEDULE,
  NOTIFICATION_TYPES.MEETING_REMINDER,
  NOTIFICATION_TYPES.MEETING_FOLLOWUP,
  NOTIFICATION_TYPES.FEEDBACK_REMINDER,
  NOTIFICATION_TYPES.THANK_YOU,
];

const MENTEE_BADGE_TYPES = [
  NOTIFICATION_TYPES.SLOTS_PROPOSED,
  NOTIFICATION_TYPES.REQUEST_REJECTED,
  NOTIFICATION_TYPES.MEETING_CONFIRMED,
  NOTIFICATION_TYPES.MEETING_CANCELLED,
  NOTIFICATION_TYPES.MEETING_RESCHEDULE,
  NOTIFICATION_TYPES.MEETING_REMINDER,
  NOTIFICATION_TYPES.MEETING_FOLLOWUP,
  NOTIFICATION_TYPES.FEEDBACK_REMINDER,
];

function toPublicNotification(row) {
  if (!row) return null;
  return {
    id: row.id,
    receiverId: row.receiver_id,
    senderId: row.sender_id,
    matchingId: row.matching_id,
    message: row.message,
    type: row.type,
    isRead: Boolean(row.is_read),
    createdAt: row.created_at,
  };
}

async function getUserContact(userId) {
  const result = await pool.query(
    `SELECT id, email, username
     FROM users
     WHERE id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

async function createNotification({
  receiverId,
  senderId,
  matchingId = null,
  message,
  type,
}) {
  const result = await pool.query(
    `INSERT INTO notifications (
       receiver_id, sender_id, matching_id, message, type
     )
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [receiverId, senderId, matchingId, message, type]
  );
  return toPublicNotification(result.rows[0]);
}

async function hasNotificationOfType(matchingId, type, receiverId = null) {
  const params = [matchingId, type];
  let sql = `
    SELECT 1
    FROM notifications
    WHERE matching_id = $1
      AND type = $2
  `;
  if (receiverId != null) {
    params.push(receiverId);
    sql += ` AND receiver_id = $${params.length}`;
  }
  sql += " LIMIT 1";

  const result = await pool.query(sql, params);
  return result.rowCount > 0;
}

async function notifyAndEmail({
  receiverId,
  senderId,
  matchingId,
  message,
  type,
  sendEmail,
}) {
  try {
    const notification = await createNotification({
      receiverId,
      senderId,
      matchingId,
      message,
      type,
    });

    if (typeof sendEmail === "function") {
      try {
        await sendEmail();
      } catch (err) {
        console.error(`[notify] email failed for ${type}:`, err.message);
      }
    }

    return notification;
  } catch (err) {
    console.error(`[notify] failed for ${type}:`, err.message);
    return null;
  }
}

async function notifyMentorshipRequest({ matchingId, menteeId, mentorId }) {
  const [mentee, mentor] = await Promise.all([
    getUserContact(menteeId),
    getUserContact(mentorId),
  ]);

  return notifyAndEmail({
    receiverId: mentorId,
    senderId: menteeId,
    matchingId,
    type: NOTIFICATION_TYPES.MENTORSHIP_REQUEST,
    message: `${mentee?.username || "A mentee"} requested a mentoring session with you.`,
    sendEmail: () =>
      emailService.sendMentorshipRequestEmail({
        to: mentor?.email,
        menteeName: mentee?.username,
        mentorName: mentor?.username,
      }),
  });
}

async function notifySlotsProposed({ matchingId, menteeId, mentorId }) {
  const [mentee, mentor] = await Promise.all([
    getUserContact(menteeId),
    getUserContact(mentorId),
  ]);

  return notifyAndEmail({
    receiverId: menteeId,
    senderId: mentorId,
    matchingId,
    type: NOTIFICATION_TYPES.SLOTS_PROPOSED,
    message: `${mentor?.username || "Your mentor"} proposed new meeting times.`,
    sendEmail: () =>
      emailService.sendSlotsProposedEmail({
        to: mentee?.email,
        mentorName: mentor?.username,
        menteeName: mentee?.username,
        matchingId,
      }),
  });
}

async function notifyRequestRejected({ matchingId, menteeId, mentorId }) {
  const [mentee, mentor] = await Promise.all([
    getUserContact(menteeId),
    getUserContact(mentorId),
  ]);

  return notifyAndEmail({
    receiverId: menteeId,
    senderId: mentorId,
    matchingId,
    type: NOTIFICATION_TYPES.REQUEST_REJECTED,
    message: `${mentor?.username || "The mentor"} declined your mentorship request.`,
    sendEmail: () =>
      emailService.sendRequestRejectedEmail({
        to: mentee?.email,
        mentorName: mentor?.username,
        menteeName: mentee?.username,
      }),
  });
}

async function notifyMeetingConfirmed({
  matchingId,
  menteeId,
  mentorId,
  meetingAt,
}) {
  const [mentee, mentor] = await Promise.all([
    getUserContact(menteeId),
    getUserContact(mentorId),
  ]);

  await notifyAndEmail({
    receiverId: mentorId,
    senderId: menteeId,
    matchingId,
    type: NOTIFICATION_TYPES.MEETING_CONFIRMED,
    message: `${mentee?.username || "Your mentee"} confirmed a meeting time.`,
    sendEmail: () =>
      emailService.sendMeetingConfirmedEmail({
        to: mentor?.email,
        recipientName: mentor?.username,
        otherPartyName: mentee?.username,
        meetingAt,
        matchingId,
        isMentor: true,
      }),
  });

  return notifyAndEmail({
    receiverId: menteeId,
    senderId: mentorId,
    matchingId,
    type: NOTIFICATION_TYPES.MEETING_CONFIRMED,
    message: `Your meeting with ${mentor?.username || "your mentor"} is confirmed.`,
    sendEmail: () =>
      emailService.sendMeetingConfirmedEmail({
        to: mentee?.email,
        recipientName: mentee?.username,
        otherPartyName: mentor?.username,
        meetingAt,
        matchingId,
        isMentor: false,
      }),
  });
}

async function notifyMoreTimesRequested({ matchingId, menteeId, mentorId }) {
  const [mentee, mentor] = await Promise.all([
    getUserContact(menteeId),
    getUserContact(mentorId),
  ]);

  return notifyAndEmail({
    receiverId: mentorId,
    senderId: menteeId,
    matchingId,
    type: NOTIFICATION_TYPES.MORE_TIMES_REQUESTED,
    message: `${mentee?.username || "A mentee"} asked for additional meeting times.`,
    sendEmail: () =>
      emailService.sendMoreTimesRequestedEmail({
        to: mentor?.email,
        menteeName: mentee?.username,
        mentorName: mentor?.username,
      }),
  });
}

async function notifyMeetingCancelled({
  matchingId,
  menteeId,
  mentorId,
  actorId,
}) {
  const receiverId = actorId === menteeId ? mentorId : menteeId;
  const isMentorReceiver = receiverId === mentorId;
  const [actor, receiver] = await Promise.all([
    getUserContact(actorId),
    getUserContact(receiverId),
  ]);

  return notifyAndEmail({
    receiverId,
    senderId: actorId,
    matchingId,
    type: NOTIFICATION_TYPES.MEETING_CANCELLED,
    message: `${actor?.username || "The other party"} cancelled the mentoring meeting.`,
    sendEmail: () =>
      emailService.sendMeetingCancelledEmail({
        to: receiver?.email,
        recipientName: receiver?.username,
        actorName: actor?.username,
        matchingId,
        isMentor: isMentorReceiver,
      }),
  });
}

async function notifyMeetingReschedule({
  matchingId,
  menteeId,
  mentorId,
  actorId,
}) {
  const receiverId = actorId === menteeId ? mentorId : menteeId;
  const isMentorReceiver = receiverId === mentorId;
  const [actor, receiver] = await Promise.all([
    getUserContact(actorId),
    getUserContact(receiverId),
  ]);

  return notifyAndEmail({
    receiverId,
    senderId: actorId,
    matchingId,
    type: NOTIFICATION_TYPES.MEETING_RESCHEDULE,
    message: `${actor?.username || "The other party"} requested a reschedule.`,
    sendEmail: () =>
      emailService.sendMeetingRescheduleEmail({
        to: receiver?.email,
        recipientName: receiver?.username,
        actorName: actor?.username,
        matchingId,
        isMentor: isMentorReceiver,
      }),
  });
}

async function notifyThankYouToMentor({ matchingId, menteeId, mentorId }) {
  const [mentee, mentor] = await Promise.all([
    getUserContact(menteeId),
    getUserContact(mentorId),
  ]);

  return notifyAndEmail({
    receiverId: mentorId,
    senderId: menteeId,
    matchingId,
    type: NOTIFICATION_TYPES.THANK_YOU,
    message: `${mentee?.username || "Your mentee"} completed feedback — thank you for mentoring!`,
    sendEmail: () =>
      emailService.sendThankYouEmail({
        to: mentor?.email,
        mentorName: mentor?.username,
        menteeName: mentee?.username,
      }),
  });
}

async function getUnreadCounts(userId) {
  const result = await pool.query(
    `SELECT
       COUNT(*) FILTER (
         WHERE m.mentor_id = $1
            OR (m.id IS NULL AND n.type = ANY($2::varchar[]))
       )::int AS mentor,
       COUNT(*) FILTER (
         WHERE m.mentee_id = $1
            OR (m.id IS NULL AND n.type = ANY($3::varchar[]))
       )::int AS mentee
     FROM notifications n
     LEFT JOIN matching m ON m.id = n.matching_id
     WHERE n.receiver_id = $1
       AND n.is_read = FALSE`,
    [userId, MENTOR_BADGE_TYPES, MENTEE_BADGE_TYPES]
  );

  const mentor = Number(result.rows[0]?.mentor) || 0;
  const mentee = Number(result.rows[0]?.mentee) || 0;

  return {
    total: mentor + mentee,
    mentor,
    mentee,
  };
}

async function markNotificationsRead(userId, options = {}) {
  const { all = false, audience = "all", ids } = options;

  if (Array.isArray(ids) && ids.length > 0) {
    const validIds = ids
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0);

    if (validIds.length === 0) {
      return { updated: 0 };
    }

    const result = await pool.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE receiver_id = $1
         AND id = ANY($2::int[])
         AND is_read = FALSE
       RETURNING id`,
      [userId, validIds]
    );
    return { updated: result.rowCount };
  }

  if (audience === "mentor" || audience === "mentee") {
    const roleColumn = audience === "mentor" ? "mentor_id" : "mentee_id";
    const result = await pool.query(
      `UPDATE notifications n
       SET is_read = TRUE
       FROM matching m
       WHERE n.matching_id = m.id
         AND n.receiver_id = $1
         AND m.${roleColumn} = $1
         AND n.is_read = FALSE
       RETURNING n.id`,
      [userId]
    );
    return { updated: result.rowCount };
  }

  if (!all && audience === "all") {
    return { updated: 0 };
  }

  const result = await pool.query(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE receiver_id = $1
       AND is_read = FALSE
     RETURNING id`,
    [userId]
  );
  return { updated: result.rowCount };
}

async function submitMeetingFeedback({
  matchingId,
  userId,
  attended = null,
  rating = null,
  comment = null,
}) {
  const matchingResult = await pool.query(
    `SELECT *
     FROM matching
     WHERE id = $1
       AND (mentee_id = $2 OR mentor_id = $2)`,
    [matchingId, userId]
  );
  const matching = matchingResult.rows[0];
  if (!matching) {
    return { error: "NOT_FOUND" };
  }

  if (!["MATCHED", "CANCELLED"].includes(matching.status)) {
    return { error: "INVALID_STATUS" };
  }

  const result = await pool.query(
    `INSERT INTO meeting_feedback (matching_id, user_id, attended, rating, comment)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (matching_id, user_id) DO UPDATE SET
       attended = EXCLUDED.attended,
       rating = EXCLUDED.rating,
       comment = EXCLUDED.comment
     RETURNING *`,
    [
      matchingId,
      userId,
      attended,
      rating,
      comment == null ? null : String(comment).trim() || null,
    ]
  );

  if (Number(userId) === Number(matching.mentee_id)) {
    await notifyThankYouToMentor({
      matchingId,
      menteeId: matching.mentee_id,
      mentorId: matching.mentor_id,
    });
  }

  return {
    feedback: {
      id: result.rows[0].id,
      matchingId: result.rows[0].matching_id,
      userId: result.rows[0].user_id,
      attended: result.rows[0].attended,
      rating: result.rows[0].rating,
      comment: result.rows[0].comment,
      createdAt: result.rows[0].created_at,
    },
  };
}

module.exports = {
  NOTIFICATION_TYPES,
  MENTOR_BADGE_TYPES,
  MENTEE_BADGE_TYPES,
  createNotification,
  hasNotificationOfType,
  notifyMentorshipRequest,
  notifySlotsProposed,
  notifyRequestRejected,
  notifyMeetingConfirmed,
  notifyMoreTimesRequested,
  notifyMeetingCancelled,
  notifyMeetingReschedule,
  notifyThankYouToMentor,
  getUnreadCounts,
  markNotificationsRead,
  submitMeetingFeedback,
  getUserContact,
  notifyAndEmail,
};
