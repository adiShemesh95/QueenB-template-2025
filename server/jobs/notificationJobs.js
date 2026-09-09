const cron = require("node-cron");
const pool = require("../db");
const emailService = require("../services/emailService");
const {
  NOTIFICATION_TYPES,
  hasNotificationOfType,
  notifyAndEmail,
  getUserContact,
} = require("../services/notificationsService");

async function notifyPairReminder(matching, meetingAt) {
  const [mentee, mentor] = await Promise.all([
    getUserContact(matching.mentee_id),
    getUserContact(matching.mentor_id),
  ]);

  const alreadyMentor = await hasNotificationOfType(
    matching.id,
    NOTIFICATION_TYPES.MEETING_REMINDER,
    matching.mentor_id
  );
  const alreadyMentee = await hasNotificationOfType(
    matching.id,
    NOTIFICATION_TYPES.MEETING_REMINDER,
    matching.mentee_id
  );

  if (!alreadyMentor) {
    await notifyAndEmail({
      receiverId: matching.mentor_id,
      senderId: matching.mentee_id,
      matchingId: matching.id,
      type: NOTIFICATION_TYPES.MEETING_REMINDER,
      message: `Reminder: your session with ${mentee?.username || "your mentee"} is in about 24 hours.`,
      sendEmail: () =>
        emailService.sendMeetingReminderEmail({
          to: mentor?.email,
          recipientName: mentor?.username,
          otherPartyName: mentee?.username,
          meetingAt,
          matchingId: matching.id,
          isMentor: true,
        }),
    });
  }

  if (!alreadyMentee) {
    await notifyAndEmail({
      receiverId: matching.mentee_id,
      senderId: matching.mentor_id,
      matchingId: matching.id,
      type: NOTIFICATION_TYPES.MEETING_REMINDER,
      message: `Reminder: your session with ${mentor?.username || "your mentor"} is in about 24 hours.`,
      sendEmail: () =>
        emailService.sendMeetingReminderEmail({
          to: mentee?.email,
          recipientName: mentee?.username,
          otherPartyName: mentor?.username,
          meetingAt,
          matchingId: matching.id,
          isMentor: false,
        }),
    });
  }
}

async function notifyPairFollowup(matching) {
  const [mentee, mentor] = await Promise.all([
    getUserContact(matching.mentee_id),
    getUserContact(matching.mentor_id),
  ]);

  const alreadyMentor = await hasNotificationOfType(
    matching.id,
    NOTIFICATION_TYPES.MEETING_FOLLOWUP,
    matching.mentor_id
  );
  const alreadyMentee = await hasNotificationOfType(
    matching.id,
    NOTIFICATION_TYPES.MEETING_FOLLOWUP,
    matching.mentee_id
  );

  if (!alreadyMentor) {
    await notifyAndEmail({
      receiverId: matching.mentor_id,
      senderId: matching.mentee_id,
      matchingId: matching.id,
      type: NOTIFICATION_TYPES.MEETING_FOLLOWUP,
      message: "How did your mentoring session go? Please share quick feedback.",
      sendEmail: () =>
        emailService.sendMeetingFollowupEmail({
          to: mentor?.email,
          recipientName: mentor?.username,
          matchingId: matching.id,
          isMentor: true,
        }),
    });
  }

  if (!alreadyMentee) {
    await notifyAndEmail({
      receiverId: matching.mentee_id,
      senderId: matching.mentor_id,
      matchingId: matching.id,
      type: NOTIFICATION_TYPES.MEETING_FOLLOWUP,
      message: "How did your mentoring session go? Please share quick feedback.",
      sendEmail: () =>
        emailService.sendMeetingFollowupEmail({
          to: mentee?.email,
          recipientName: mentee?.username,
          matchingId: matching.id,
          isMentor: false,
        }),
    });
  }
}

async function runMeetingReminders() {
  const result = await pool.query(
    `SELECT m.*,
            s.start_time AS meeting_start,
            s.end_time AS meeting_end
     FROM matching m
     INNER JOIN matching_slots s ON s.id = m.selected_slot_id
     WHERE m.status = 'MATCHED'
       AND s.start_time >= NOW() + INTERVAL '23 hours'
       AND s.start_time < NOW() + INTERVAL '25 hours'`
  );

  for (const row of result.rows) {
    try {
      await notifyPairReminder(row, row.meeting_start);
    } catch (err) {
      console.error(
        `[cron] meeting reminder failed for matching ${row.id}:`,
        err.message
      );
    }
  }

  return result.rowCount;
}

async function runMeetingFollowups() {
  const result = await pool.query(
    `SELECT m.*,
            s.start_time AS meeting_start,
            s.end_time AS meeting_end
     FROM matching m
     INNER JOIN matching_slots s ON s.id = m.selected_slot_id
     WHERE m.status = 'MATCHED'
       AND s.end_time <= NOW() - INTERVAL '1 hour'
       AND s.end_time >= NOW() - INTERVAL '3 days'`
  );

  for (const row of result.rows) {
    try {
      await notifyPairFollowup(row);
    } catch (err) {
      console.error(
        `[cron] meeting follow-up failed for matching ${row.id}:`,
        err.message
      );
    }
  }

  return result.rowCount;
}

async function runFeedbackReminders() {
  const result = await pool.query(
    `SELECT m.id,
            m.mentee_id,
            m.mentor_id,
            u.id AS user_id,
            u.email,
            u.username,
            CASE WHEN u.id = m.mentor_id THEN TRUE ELSE FALSE END AS is_mentor
     FROM matching m
     INNER JOIN matching_slots s ON s.id = m.selected_slot_id
     INNER JOIN notifications n
       ON n.matching_id = m.id
      AND n.type = $1
     INNER JOIN users u ON u.id = n.receiver_id
     WHERE m.status = 'MATCHED'
       AND s.end_time <= NOW() - INTERVAL '1 hour'
       AND NOT EXISTS (
         SELECT 1 FROM meeting_feedback mf
         WHERE mf.matching_id = m.id AND mf.user_id = u.id
       )
       AND NOT EXISTS (
         SELECT 1 FROM notifications recent
         WHERE recent.matching_id = m.id
           AND recent.receiver_id = u.id
           AND recent.type = $2
           AND recent.created_at > NOW() - INTERVAL '2 days'
       )
     GROUP BY m.id, m.mentee_id, m.mentor_id, u.id, u.email, u.username`,
    [NOTIFICATION_TYPES.MEETING_FOLLOWUP, NOTIFICATION_TYPES.FEEDBACK_REMINDER]
  );

  for (const row of result.rows) {
    try {
      const senderId =
        Number(row.user_id) === Number(row.mentor_id)
          ? row.mentee_id
          : row.mentor_id;

      await notifyAndEmail({
        receiverId: row.user_id,
        senderId,
        matchingId: row.id,
        type: NOTIFICATION_TYPES.FEEDBACK_REMINDER,
        message:
          "Reminder: please complete feedback for your recent mentoring session.",
        sendEmail: () =>
          emailService.sendFeedbackReminderEmail({
            to: row.email,
            recipientName: row.username,
            matchingId: row.id,
            isMentor: Boolean(row.is_mentor),
          }),
      });
    } catch (err) {
      console.error(
        `[cron] feedback reminder failed for matching ${row.id}:`,
        err.message
      );
    }
  }

  return result.rowCount;
}

function startNotificationJobs() {
  if (process.env.NODE_ENV === "test") {
    return { started: false, reason: "test" };
  }

  if (process.env.ENABLE_NOTIFICATION_CRON === "false") {
    console.log(
      "[cron] notification jobs disabled via ENABLE_NOTIFICATION_CRON"
    );
    return { started: false, reason: "disabled" };
  }

  cron.schedule("5 * * * *", async () => {
    console.log("[cron] running meeting reminders…");
    try {
      const count = await runMeetingReminders();
      console.log(`[cron] meeting reminders processed: ${count}`);
    } catch (err) {
      console.error("[cron] meeting reminders error:", err.message);
    }
  });

  cron.schedule("20 * * * *", async () => {
    console.log("[cron] running meeting follow-ups…");
    try {
      const count = await runMeetingFollowups();
      console.log(`[cron] meeting follow-ups processed: ${count}`);
    } catch (err) {
      console.error("[cron] meeting follow-ups error:", err.message);
    }
  });

  cron.schedule("0 10,22 * * *", async () => {
    console.log("[cron] running feedback reminders…");
    try {
      const count = await runFeedbackReminders();
      console.log(`[cron] feedback reminders processed: ${count}`);
    } catch (err) {
      console.error("[cron] feedback reminders error:", err.message);
    }
  });

  console.log("[cron] notification jobs scheduled");
  return { started: true };
}

module.exports = {
  startNotificationJobs,
  runMeetingReminders,
  runMeetingFollowups,
  runFeedbackReminders,
};
