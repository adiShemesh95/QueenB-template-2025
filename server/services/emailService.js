const nodemailer = require("nodemailer");

const APP_NAME = "Queens Match";
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";

let transporter = null;

function isEmailConfigured() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter() {
  if (!isEmailConfigured()) return null;
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE || "gmail",
    host: process.env.SMTP_HOST || undefined,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapEmailHtml({ title, bodyHtml, ctaLabel, ctaHref }) {
  const safeTitle = escapeHtml(title);
  const cta =
    ctaLabel && ctaHref
      ? `<p style="margin:28px 0 8px;">
           <a href="${escapeHtml(ctaHref)}"
              style="display:inline-block;padding:12px 22px;border-radius:999px;
                     background:linear-gradient(135deg,#FF6F91,#F75F8A);color:#fff;
                     text-decoration:none;font-weight:600;">
             ${escapeHtml(ctaLabel)}
           </a>
         </p>`
      : "";

  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#F8FBFF;font-family:Helvetica,Arial,sans-serif;color:#07142D;">
    <div style="max-width:560px;margin:32px auto;padding:28px 24px;border-radius:16px;
                background:rgba(255,255,255,0.95);border:1px solid rgba(247,95,138,0.12);
                box-shadow:0 12px 40px rgba(7,20,45,0.08);">
      <div style="font-size:13px;font-weight:700;letter-spacing:0.04em;color:#F75F8A;margin-bottom:16px;">
        ${escapeHtml(APP_NAME)}
      </div>
      <h1 style="font-size:22px;margin:0 0 12px;letter-spacing:-0.02em;">${safeTitle}</h1>
      <div style="font-size:15px;line-height:1.6;color:#4A5568;">
        ${bodyHtml}
      </div>
      ${cta}
      <p style="margin-top:28px;font-size:12px;color:#8A94A6;">
        You’re receiving this because of activity on ${escapeHtml(APP_NAME)}.
      </p>
    </div>
  </body>
</html>`;
}

async function sendMail({ to, subject, html, text }) {
  if (!to) {
    return { sent: false, skipped: true, error: "Missing recipient" };
  }

  const mailer = getTransporter();
  if (!mailer) {
    if (process.env.NODE_ENV !== "test") {
      console.warn(
        "[email] SMTP not configured (SMTP_USER / SMTP_PASS). Skipping send."
      );
    }
    return { sent: false, skipped: true };
  }

  try {
    await mailer.sendMail({
      from: process.env.SMTP_FROM || `"${APP_NAME}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text: text || subject,
    });
    return { sent: true };
  } catch (err) {
    console.error("[email] send failed:", err.message);
    return { sent: false, error: err.message };
  }
}

function menteeRequestsUrl(matchingId) {
  return matchingId
    ? `${CLIENT_ORIGIN}/matching/${matchingId}`
    : `${CLIENT_ORIGIN}/my-requests`;
}

function mentorInboxUrl() {
  return `${CLIENT_ORIGIN}/mentor-inbox`;
}

async function sendMentorshipRequestEmail({ to, menteeName, mentorName }) {
  return sendMail({
    to,
    subject: `${APP_NAME}: New request from ${menteeName || "a mentee"}`,
    html: wrapEmailHtml({
      title: "New mentorship request",
      bodyHtml: `<p>Hi ${escapeHtml(mentorName || "there")},</p>
        <p><strong>${escapeHtml(menteeName || "A mentee")}</strong> requested a mentoring session with you.</p>
        <p>Open your mentor inbox to propose times or decline.</p>`,
      ctaLabel: "Open mentor inbox",
      ctaHref: mentorInboxUrl(),
    }),
  });
}

async function sendSlotsProposedEmail({ to, mentorName, menteeName, matchingId }) {
  return sendMail({
    to,
    subject: `${APP_NAME}: ${mentorName || "Your mentor"} proposed meeting times`,
    html: wrapEmailHtml({
      title: "New time slots proposed",
      bodyHtml: `<p>Hi ${escapeHtml(menteeName || "there")},</p>
        <p><strong>${escapeHtml(mentorName || "Your mentor")}</strong> offered time slots for your mentoring request.</p>
        <p>Pick a time that works for you.</p>`,
      ctaLabel: "Choose a time",
      ctaHref: menteeRequestsUrl(matchingId),
    }),
  });
}

async function sendRequestRejectedEmail({ to, mentorName, menteeName }) {
  return sendMail({
    to,
    subject: `${APP_NAME}: Mentorship request declined`,
    html: wrapEmailHtml({
      title: "Request declined",
      bodyHtml: `<p>Hi ${escapeHtml(menteeName || "there")},</p>
        <p><strong>${escapeHtml(mentorName || "The mentor")}</strong> declined your mentorship request.</p>
        <p>You can browse other mentors anytime.</p>`,
      ctaLabel: "Browse mentors",
      ctaHref: `${CLIENT_ORIGIN}/mentors`,
    }),
  });
}

async function sendMeetingConfirmedEmail({
  to,
  recipientName,
  otherPartyName,
  meetingAt,
  matchingId,
  isMentor,
}) {
  const when = meetingAt ? new Date(meetingAt).toUTCString() : "the agreed time";
  return sendMail({
    to,
    subject: `${APP_NAME}: Meeting confirmed`,
    html: wrapEmailHtml({
      title: "Meeting confirmed",
      bodyHtml: `<p>Hi ${escapeHtml(recipientName || "there")},</p>
        <p>Your mentoring session with <strong>${escapeHtml(otherPartyName || "your match")}</strong> is confirmed.</p>
        <p><strong>When:</strong> ${escapeHtml(when)}</p>`,
      ctaLabel: isMentor ? "Open mentor inbox" : "View request",
      ctaHref: isMentor ? mentorInboxUrl() : menteeRequestsUrl(matchingId),
    }),
  });
}

async function sendMoreTimesRequestedEmail({ to, menteeName, mentorName }) {
  return sendMail({
    to,
    subject: `${APP_NAME}: ${menteeName || "A mentee"} asked for more times`,
    html: wrapEmailHtml({
      title: "More times requested",
      bodyHtml: `<p>Hi ${escapeHtml(mentorName || "there")},</p>
        <p><strong>${escapeHtml(menteeName || "A mentee")}</strong> asked for additional meeting times.</p>
        <p>Please propose new slots from your inbox.</p>`,
      ctaLabel: "Open mentor inbox",
      ctaHref: mentorInboxUrl(),
    }),
  });
}

async function sendMeetingCancelledEmail({
  to,
  recipientName,
  actorName,
  matchingId,
  isMentor,
}) {
  return sendMail({
    to,
    subject: `${APP_NAME}: Meeting cancelled`,
    html: wrapEmailHtml({
      title: "Meeting cancelled",
      bodyHtml: `<p>Hi ${escapeHtml(recipientName || "there")},</p>
        <p><strong>${escapeHtml(actorName || "The other party")}</strong> cancelled the mentoring meeting.</p>`,
      ctaLabel: isMentor ? "Open mentor inbox" : "View requests",
      ctaHref: isMentor ? mentorInboxUrl() : menteeRequestsUrl(matchingId),
    }),
  });
}

async function sendMeetingRescheduleEmail({
  to,
  recipientName,
  actorName,
  matchingId,
  isMentor,
}) {
  return sendMail({
    to,
    subject: `${APP_NAME}: Reschedule requested`,
    html: wrapEmailHtml({
      title: "Reschedule requested",
      bodyHtml: `<p>Hi ${escapeHtml(recipientName || "there")},</p>
        <p><strong>${escapeHtml(actorName || "The other party")}</strong> asked to reschedule your mentoring meeting.</p>
        <p>${isMentor ? "Please propose new time slots." : "Your mentor will offer new times soon."}</p>`,
      ctaLabel: isMentor ? "Open mentor inbox" : "View request",
      ctaHref: isMentor ? mentorInboxUrl() : menteeRequestsUrl(matchingId),
    }),
  });
}

async function sendMeetingReminderEmail({
  to,
  recipientName,
  otherPartyName,
  meetingAt,
  matchingId,
  isMentor,
}) {
  const when = meetingAt ? new Date(meetingAt).toUTCString() : "soon";
  return sendMail({
    to,
    subject: `${APP_NAME}: Reminder — session in 24 hours`,
    html: wrapEmailHtml({
      title: "Session reminder",
      bodyHtml: `<p>Hi ${escapeHtml(recipientName || "there")},</p>
        <p>Your mentoring session with <strong>${escapeHtml(otherPartyName || "your match")}</strong> is in about 24 hours.</p>
        <p><strong>When:</strong> ${escapeHtml(when)}</p>`,
      ctaLabel: isMentor ? "Open mentor inbox" : "View request",
      ctaHref: isMentor ? mentorInboxUrl() : menteeRequestsUrl(matchingId),
    }),
  });
}

async function sendMeetingFollowupEmail({
  to,
  recipientName,
  matchingId,
  isMentor,
}) {
  return sendMail({
    to,
    subject: `${APP_NAME}: How did your session go?`,
    html: wrapEmailHtml({
      title: "Post-meeting follow-up",
      bodyHtml: `<p>Hi ${escapeHtml(recipientName || "there")},</p>
        <p>Did your mentoring session take place? Please take a moment to share quick feedback — it helps the community grow.</p>`,
      ctaLabel: "Share feedback",
      ctaHref: isMentor ? mentorInboxUrl() : menteeRequestsUrl(matchingId),
    }),
  });
}

async function sendFeedbackReminderEmail({
  to,
  recipientName,
  matchingId,
  isMentor,
}) {
  return sendMail({
    to,
    subject: `${APP_NAME}: Reminder — complete your feedback`,
    html: wrapEmailHtml({
      title: "Feedback reminder",
      bodyHtml: `<p>Hi ${escapeHtml(recipientName || "there")},</p>
        <p>We noticed you haven’t completed feedback for a recent mentoring session. A short note goes a long way.</p>`,
      ctaLabel: "Complete feedback",
      ctaHref: isMentor ? mentorInboxUrl() : menteeRequestsUrl(matchingId),
    }),
  });
}

async function sendThankYouEmail({ to, mentorName, menteeName }) {
  return sendMail({
    to,
    subject: `${APP_NAME}: Thank you for mentoring`,
    html: wrapEmailHtml({
      title: "Thank you!",
      bodyHtml: `<p>Hi ${escapeHtml(mentorName || "there")},</p>
        <p><strong>${escapeHtml(menteeName || "Your mentee")}</strong> completed feedback after your session.</p>
        <p>Thank you for supporting the Queens Match community.</p>`,
      ctaLabel: "Open mentor inbox",
      ctaHref: mentorInboxUrl(),
    }),
  });
}

module.exports = {
  isEmailConfigured,
  sendMail,
  sendMentorshipRequestEmail,
  sendSlotsProposedEmail,
  sendRequestRejectedEmail,
  sendMeetingConfirmedEmail,
  sendMoreTimesRequestedEmail,
  sendMeetingCancelledEmail,
  sendMeetingRescheduleEmail,
  sendMeetingReminderEmail,
  sendMeetingFollowupEmail,
  sendFeedbackReminderEmail,
  sendThankYouEmail,
};
