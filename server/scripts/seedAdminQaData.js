/**
 * DEVELOPMENT / QA ONLY — Admin manual-inspection seed data.
 *
 * Creates recognizable QA users, mentor profiles, matchings, and slots so
 * Admin pages can be inspected without hand-building the full matching lifecycle.
 *
 * Safety:
 * - Run intentionally from CLI only (never from server startup)
 * - Refuses NODE_ENV=production
 * - Does not drop/truncate tables
 * - Does not delete or overwrite non-QA users
 * - Idempotent: re-running upserts QA users/profiles and rebuilds QA matchings only
 *
 * Usage (from server/):
 *   npm run seed:admin-qa
 *   node scripts/seedAdminQaData.js
 */

require("dotenv").config();

const pool = require("../db");
const { hashPassword } = require("../utils/password");

const QA_PASSWORD = "QaDevPass1!";
const QA_EMAIL_DOMAIN = "@queenb.test";

/** Stable QA usernames — cleanup/seed identify rows via these + @queenb.test emails. */
const QA_USERS = {
  admin: {
    username: "qa_admin",
    email: `qa_admin${QA_EMAIL_DOMAIN}`,
    isAdmin: true,
  },
  userZero: {
    username: "qa_user_zero",
    email: `qa_user_zero${QA_EMAIL_DOMAIN}`,
    isAdmin: false,
  },
  mentorA: {
    username: "qa_mentor_a",
    email: `qa_mentor_a${QA_EMAIL_DOMAIN}`,
    isAdmin: false,
  },
  mentorB: {
    username: "qa_mentor_b",
    email: `qa_mentor_b${QA_EMAIL_DOMAIN}`,
    isAdmin: false,
  },
  mentorInactive: {
    username: "qa_mentor_inactive",
    email: `qa_mentor_inactive${QA_EMAIL_DOMAIN}`,
    isAdmin: false,
  },
  mentee1: {
    username: "qa_mentee_1",
    email: `qa_mentee_1${QA_EMAIL_DOMAIN}`,
    isAdmin: false,
  },
  mentee2: {
    username: "qa_mentee_2",
    email: `qa_mentee_2${QA_EMAIL_DOMAIN}`,
    isAdmin: false,
  },
  mentee3: {
    username: "qa_mentee_3",
    email: `qa_mentee_3${QA_EMAIL_DOMAIN}`,
    isAdmin: false,
  },
  mentee4: {
    username: "qa_mentee_4",
    email: `qa_mentee_4${QA_EMAIL_DOMAIN}`,
    isAdmin: false,
  },
  mentee5: {
    username: "qa_mentee_5",
    email: `qa_mentee_5${QA_EMAIL_DOMAIN}`,
    isAdmin: false,
  },
  mentee6: {
    username: "qa_mentee_6",
    email: `qa_mentee_6${QA_EMAIL_DOMAIN}`,
    isAdmin: false,
  },
  both: {
    username: "qa_both_roles",
    email: `qa_both_roles${QA_EMAIL_DOMAIN}`,
    isAdmin: false,
  },
  adminMentor: {
    username: "qa_admin_mentor",
    email: `qa_admin_mentor${QA_EMAIL_DOMAIN}`,
    isAdmin: true,
  },
  // Dedicated Admin visual QA for rescheduleUsed (historical latch vs status).
  rescheduleMentor: {
    username: "qa_reschedule_mentor",
    email: `qa_reschedule_mentor${QA_EMAIL_DOMAIN}`,
    isAdmin: false,
  },
  rescheduleMentee: {
    username: "qa_reschedule_mentee",
    email: `qa_reschedule_mentee${QA_EMAIL_DOMAIN}`,
    isAdmin: false,
  },
  rescheduleFresh: {
    username: "qa_reschedule_fresh",
    email: `qa_reschedule_fresh${QA_EMAIL_DOMAIN}`,
    isAdmin: false,
  },
};

function assertNotProduction() {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Refusing to seed Admin QA data: NODE_ENV=production. DEVELOPMENT / QA ONLY."
    );
  }
}

/**
 * Runtime-relative calendar anchors (avoid hardcoding a calendar month).
 * Uses midday UTC with local Y/M/D so Admin Calendar day cells (local) stay correct.
 */
function calendarAnchors(now = new Date()) {
  // Local components — Calendar UI groups by local date, not UTC date.
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-based
  const todayDay = now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const atUtc = (y, m, day, hour, minute = 0) =>
    new Date(Date.UTC(y, m, day, hour, minute, 0));

  // Prefer day 2 for "near beginning"; bump if that is today.
  let beginDay = 2;
  if (beginDay === todayDay) beginDay = 3;

  // Prefer last day for "near end"; bump down if that is today.
  let endDay = daysInMonth;
  if (endDay === todayDay) endDay = Math.max(daysInMonth - 1, 1);
  if (endDay === beginDay) endDay = Math.min(daysInMonth, beginDay + 1);

  // Same-date pair: mid-month day that is not today / begin / end.
  const sameDayCandidates = [
    15,
    12,
    18,
    10,
    20,
    Math.max(4, Math.floor(daysInMonth / 2)),
  ];
  const sameDay =
    sameDayCandidates.find(
      (d) => d >= 1 && d <= daysInMonth && d !== todayDay && d !== beginDay && d !== endDay
    ) || Math.min(Math.max(4, daysInMonth - 3), daysInMonth);

  return {
    currentMonthBegin: atUtc(year, month, beginDay, 11, 0),
    currentMonthSameDayMorning: atUtc(year, month, sameDay, 10, 0),
    currentMonthSameDayAfternoon: atUtc(year, month, sameDay, 14, 0),
    currentMonthToday: atUtc(year, month, todayDay, 13, 0),
    currentMonthEnd: atUtc(year, month, endDay, 16, 0),
    nextMonth: atUtc(year, month + 1, 10, 13, 0),
    previousMonth: atUtc(year, month - 1, 12, 9, 0),
    pendingSlot1: atUtc(year, month, beginDay, 9, 0),
    pendingSlot2: atUtc(year, month, beginDay, 12, 0),
    pendingSlot3: atUtc(year, month, beginDay, 15, 0),
    moreTimesSlot1: atUtc(year, month, sameDay, 9, 0),
    moreTimesSlot2: atUtc(year, month, sameDay, 11, 0),
    beginDay,
    sameDay,
    todayDay,
    endDay,
  };
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

async function upsertQaUser(client, def, passwordHash) {
  const existing = await client.query(
    `SELECT id FROM users WHERE username = $1 OR email = $2`,
    [def.username, def.email]
  );

  if (existing.rows[0]) {
    const id = existing.rows[0].id;
    await client.query(
      `UPDATE users
       SET email = $1,
           username = $2,
           password_hash = $3,
           is_admin = $4,
           updated_at = NOW()
       WHERE id = $5`,
      [def.email, def.username, passwordHash, def.isAdmin, id]
    );
    return id;
  }

  const inserted = await client.query(
    `INSERT INTO users (email, username, password_hash, is_admin)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [def.email, def.username, passwordHash, def.isAdmin]
  );
  return inserted.rows[0].id;
}

async function upsertMentorProfile(client, userId, profile) {
  await client.query(
    `INSERT INTO mentor_profiles (
       user_id, background, tech_stack, job, company, years_experience,
       topics, max_sessions, session_duration, is_active, profile_image_url
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
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
       updated_at = NOW()`,
    [
      userId,
      profile.background,
      profile.techStack,
      profile.job,
      profile.company,
      profile.yearsExperience,
      profile.topics,
      profile.maxSessions,
      profile.sessionDuration,
      profile.isActive,
      profile.profileImageUrl,
    ]
  );
}

/**
 * Deletes matchings (and cascaded slots) that involve ONLY QA participants.
 * Never touches matchings where either side is a non-QA user.
 */
async function deleteQaOnlyMatchings(client) {
  // Clear selected_slot_id first: matching ↔ matching_slots is a circular FK.
  await client.query(
    `UPDATE matching m
     SET selected_slot_id = NULL
     FROM users mentor_u, users mentee_u
     WHERE mentor_u.id = m.mentor_id
       AND mentee_u.id = m.mentee_id
       AND mentor_u.username LIKE 'qa\\_%' ESCAPE '\\'
       AND mentee_u.username LIKE 'qa\\_%' ESCAPE '\\'
       AND mentor_u.email LIKE $1
       AND mentee_u.email LIKE $1`,
    [`%${QA_EMAIL_DOMAIN}`]
  );

  await client.query(
    `DELETE FROM matching m
     USING users mentor_u, users mentee_u
     WHERE mentor_u.id = m.mentor_id
       AND mentee_u.id = m.mentee_id
       AND mentor_u.username LIKE 'qa\\_%' ESCAPE '\\'
       AND mentee_u.username LIKE 'qa\\_%' ESCAPE '\\'
       AND mentor_u.email LIKE $1
       AND mentee_u.email LIKE $1`,
    [`%${QA_EMAIL_DOMAIN}`]
  );
}

async function insertMatching(client, { mentorId, menteeId, status, moreTimesRequested, rescheduleUsed }) {
  const result = await client.query(
    `INSERT INTO matching (
       mentor_id, mentee_id, status, more_times_requested, reschedule_used
     ) VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [
      mentorId,
      menteeId,
      status,
      Boolean(moreTimesRequested),
      Boolean(rescheduleUsed),
    ]
  );
  return result.rows[0].id;
}

async function insertSlot(client, matchingId, start, end, isSelected = false) {
  const result = await client.query(
    `INSERT INTO matching_slots (matching_id, start_time, end_time, is_selected)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [matchingId, start.toISOString(), end.toISOString(), isSelected]
  );
  return result.rows[0].id;
}

async function selectSlot(client, matchingId, slotId) {
  await client.query(
    `UPDATE matching_slots SET is_selected = FALSE WHERE matching_id = $1`,
    [matchingId]
  );
  await client.query(
    `UPDATE matching_slots SET is_selected = TRUE WHERE id = $1 AND matching_id = $2`,
    [slotId, matchingId]
  );
  await client.query(
    `UPDATE matching SET selected_slot_id = $1, status = 'MATCHED', updated_at = NOW()
     WHERE id = $2`,
    [slotId, matchingId]
  );
}

async function verifySeed(client, ids) {
  const admin = await client.query(
    `SELECT username, is_admin FROM users WHERE id = $1`,
    [ids.admin]
  );
  const users = await client.query(
    `SELECT COUNT(*)::int AS c FROM users
     WHERE username LIKE 'qa\\_%' ESCAPE '\\' AND email LIKE $1`,
    [`%${QA_EMAIL_DOMAIN}`]
  );
  const admins = await client.query(
    `SELECT COUNT(*)::int AS c FROM users
     WHERE username LIKE 'qa\\_%' ESCAPE '\\'
       AND email LIKE $1
       AND is_admin = TRUE`,
    [`%${QA_EMAIL_DOMAIN}`]
  );
  const profiles = await client.query(
    `SELECT COUNT(*)::int AS c FROM mentor_profiles mp
     JOIN users u ON u.id = mp.user_id
     WHERE u.username LIKE 'qa\\_%' ESCAPE '\\' AND u.email LIKE $1`,
    [`%${QA_EMAIL_DOMAIN}`]
  );
  const byStatus = await client.query(
    `SELECT m.status, COUNT(*)::int AS c
     FROM matching m
     JOIN users mentor_u ON mentor_u.id = m.mentor_id
     JOIN users mentee_u ON mentee_u.id = m.mentee_id
     WHERE mentor_u.username LIKE 'qa\\_%' ESCAPE '\\'
       AND mentee_u.username LIKE 'qa\\_%' ESCAPE '\\'
       AND mentor_u.email LIKE $1
       AND mentee_u.email LIKE $1
     GROUP BY m.status
     ORDER BY m.status`,
    [`%${QA_EMAIL_DOMAIN}`]
  );
  const slots = await client.query(
    `SELECT COUNT(*)::int AS c
     FROM matching_slots ms
     JOIN matching m ON m.id = ms.matching_id
     JOIN users mentor_u ON mentor_u.id = m.mentor_id
     JOIN users mentee_u ON mentee_u.id = m.mentee_id
     WHERE mentor_u.username LIKE 'qa\\_%' ESCAPE '\\'
       AND mentee_u.username LIKE 'qa\\_%' ESCAPE '\\'`
  );
  const selected = await client.query(
    `SELECT COUNT(*)::int AS c
     FROM matching m
     JOIN users mentor_u ON mentor_u.id = m.mentor_id
     JOIN users mentee_u ON mentee_u.id = m.mentee_id
     WHERE mentor_u.username LIKE 'qa\\_%' ESCAPE '\\'
       AND mentee_u.username LIKE 'qa\\_%' ESCAPE '\\'
       AND m.selected_slot_id IS NOT NULL`
  );
  const consistency = await client.query(
    `SELECT COUNT(*)::int AS bad
     FROM matching m
     JOIN matching_slots ms ON ms.id = m.selected_slot_id
     JOIN users mentor_u ON mentor_u.id = m.mentor_id
     WHERE mentor_u.username LIKE 'qa\\_%' ESCAPE '\\'
       AND (ms.matching_id <> m.id OR ms.is_selected IS NOT TRUE)`
  );

  return {
    adminOk: admin.rows[0]?.is_admin === true,
    userCount: users.rows[0].c,
    adminCount: admins.rows[0].c,
    profileCount: profiles.rows[0].c,
    byStatus: Object.fromEntries(byStatus.rows.map((r) => [r.status, r.c])),
    slotCount: slots.rows[0].c,
    selectedCount: selected.rows[0].c,
    inconsistentSelected: consistency.rows[0].bad,
  };
}

async function seed() {
  assertNotProduction();

  console.log("=== Admin QA seed (DEVELOPMENT / QA ONLY) ===");

  const passwordHash = await hashPassword(QA_PASSWORD);
  const anchors = calendarAnchors();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const ids = {};
    for (const [key, def] of Object.entries(QA_USERS)) {
      ids[key] = await upsertQaUser(client, def, passwordHash);
    }

    await upsertMentorProfile(client, ids.mentorA, {
      background:
        "Senior engineer mentoring juniors on interviews and career planning.",
      techStack: ["JavaScript", "React", "Node.js"],
      job: "Senior Software Engineer",
      company: "TechCorp",
      yearsExperience: 8,
      topics: ["mock interview", "career planning", "specific company"],
      maxSessions: 6,
      sessionDuration: 60,
      isActive: true,
      profileImageUrl: null,
    });

    await upsertMentorProfile(client, ids.mentorB, {
      background: "Product-minded mentor focused on system design basics.",
      techStack: ["Python", "SQL"],
      job: "Backend Engineer",
      company: "DataWorks",
      yearsExperience: 5,
      topics: ["career planning", "other mentoring topics"],
      maxSessions: 3,
      sessionDuration: 45,
      isActive: true,
      profileImageUrl: null,
    });

    await upsertMentorProfile(client, ids.mentorInactive, {
      background: "Paused mentoring for the semester.",
      techStack: ["Java"],
      job: "Software Engineer",
      company: "Quiet Labs",
      yearsExperience: 4,
      topics: ["mock interview"],
      maxSessions: 2,
      sessionDuration: 30,
      isActive: false,
      profileImageUrl: null,
    });

    await upsertMentorProfile(client, ids.both, {
      background: "Both mentors and seeks mentorship on leadership topics.",
      techStack: ["TypeScript", "Go"],
      job: "Tech Lead",
      company: "BothWays Inc",
      yearsExperience: 7,
      topics: ["career planning", "mock interview"],
      maxSessions: 4,
      sessionDuration: 60,
      isActive: true,
      profileImageUrl: null,
    });

    await upsertMentorProfile(client, ids.adminMentor, {
      background: "Community manager who also mentors occasionally.",
      techStack: ["React"],
      job: "Community Engineer",
      company: "QueenB",
      yearsExperience: 6,
      topics: ["career planning"],
      maxSessions: 2,
      sessionDuration: 45,
      isActive: true,
      profileImageUrl: null,
    });

    await upsertMentorProfile(client, ids.rescheduleMentor, {
      background:
        "QA mentor dedicated to Admin rescheduleUsed visual testing.",
      techStack: ["JavaScript"],
      job: "QA Mentor",
      company: "QueenB Test Lab",
      yearsExperience: 3,
      topics: ["mock interview", "career planning"],
      maxSessions: 4,
      sessionDuration: 60,
      isActive: true,
      profileImageUrl: null,
    });

    // Rebuild QA-only matchings for a deterministic Admin dataset.
    await deleteQaOnlyMatchings(client);

    const calendarMatchingIds = {
      begin: null,
      sameMorning: null,
      sameAfternoon: null,
      today: null,
      end: null,
      next: null,
      prev: null,
      matchedRescheduled: null,
    };

    // 1) PENDING_MENTOR — Mentor A / mentee1 (no slots) — Matchings Report only
    const pendingMentorFreshId = await insertMatching(client, {
      mentorId: ids.mentorA,
      menteeId: ids.mentee1,
      status: "PENDING_MENTOR",
    });

    // 2) PENDING_MENTEE — Mentor A / mentee2 — 3 proposed slots, none selected
    const pendingMenteeId = await insertMatching(client, {
      mentorId: ids.mentorA,
      menteeId: ids.mentee2,
      status: "PENDING_MENTEE",
    });
    await insertSlot(
      client,
      pendingMenteeId,
      anchors.pendingSlot1,
      addMinutes(anchors.pendingSlot1, 60)
    );
    await insertSlot(
      client,
      pendingMenteeId,
      anchors.pendingSlot2,
      addMinutes(anchors.pendingSlot2, 60)
    );
    await insertSlot(
      client,
      pendingMenteeId,
      anchors.pendingSlot3,
      addMinutes(anchors.pendingSlot3, 60)
    );

    // 3) MATCHED — near beginning of current month
    calendarMatchingIds.begin = await insertMatching(client, {
      mentorId: ids.mentorA,
      menteeId: ids.mentee3,
      status: "PENDING_MENTEE",
    });
    {
      const slotId = await insertSlot(
        client,
        calendarMatchingIds.begin,
        anchors.currentMonthBegin,
        addMinutes(anchors.currentMonthBegin, 60)
      );
      await insertSlot(
        client,
        calendarMatchingIds.begin,
        addMinutes(anchors.currentMonthBegin, 120),
        addMinutes(anchors.currentMonthBegin, 180)
      );
      await selectSlot(client, calendarMatchingIds.begin, slotId);
    }

    // 4–5) MATCHED — two meetings on the same current-month date
    calendarMatchingIds.sameMorning = await insertMatching(client, {
      mentorId: ids.mentorA,
      menteeId: ids.mentee4,
      status: "PENDING_MENTEE",
    });
    {
      const slotId = await insertSlot(
        client,
        calendarMatchingIds.sameMorning,
        anchors.currentMonthSameDayMorning,
        addMinutes(anchors.currentMonthSameDayMorning, 60)
      );
      await selectSlot(client, calendarMatchingIds.sameMorning, slotId);
    }

    calendarMatchingIds.sameAfternoon = await insertMatching(client, {
      mentorId: ids.mentorA,
      menteeId: ids.mentee5,
      status: "PENDING_MENTEE",
    });
    {
      const slotId = await insertSlot(
        client,
        calendarMatchingIds.sameAfternoon,
        anchors.currentMonthSameDayAfternoon,
        addMinutes(anchors.currentMonthSameDayAfternoon, 60)
      );
      await selectSlot(client, calendarMatchingIds.sameAfternoon, slotId);
    }

    // 6) REJECTED — Mentor A / mentee6 — Matchings Report only (no selected slot)
    const rejectedId = await insertMatching(client, {
      mentorId: ids.mentorA,
      menteeId: ids.mentee6,
      status: "REJECTED",
    });

    // 7) MATCHED next month — Mentor B / mentee1
    calendarMatchingIds.next = await insertMatching(client, {
      mentorId: ids.mentorB,
      menteeId: ids.mentee1,
      status: "PENDING_MENTEE",
    });
    {
      const slotId = await insertSlot(
        client,
        calendarMatchingIds.next,
        anchors.nextMonth,
        addMinutes(anchors.nextMonth, 45)
      );
      await selectSlot(client, calendarMatchingIds.next, slotId);
    }

    // 8) MATCHED previous month — Mentor B / qa_both_roles (mentee side)
    calendarMatchingIds.prev = await insertMatching(client, {
      mentorId: ids.mentorB,
      menteeId: ids.both,
      status: "PENDING_MENTEE",
    });
    {
      const slotId = await insertSlot(
        client,
        calendarMatchingIds.prev,
        anchors.previousMonth,
        addMinutes(anchors.previousMonth, 45)
      );
      await selectSlot(client, calendarMatchingIds.prev, slotId);
    }

    // 9) PENDING_MENTEE + more_times_requested — Matchings Report only
    const moreTimesMatching = await insertMatching(client, {
      mentorId: ids.both,
      menteeId: ids.mentee6,
      status: "PENDING_MENTEE",
      moreTimesRequested: true,
    });
    await insertSlot(
      client,
      moreTimesMatching,
      anchors.moreTimesSlot1,
      addMinutes(anchors.moreTimesSlot1, 60)
    );
    await insertSlot(
      client,
      moreTimesMatching,
      anchors.moreTimesSlot2,
      addMinutes(anchors.moreTimesSlot2, 60)
    );

    // 10) MATCHED today + reschedule_used=true (was rescheduled once, then rematched)
    //     SHOULD appear on Calendar.
    calendarMatchingIds.matchedRescheduled = await insertMatching(client, {
      mentorId: ids.adminMentor,
      menteeId: ids.mentee2,
      status: "PENDING_MENTEE",
      rescheduleUsed: true,
    });
    {
      const slotId = await insertSlot(
        client,
        calendarMatchingIds.matchedRescheduled,
        anchors.currentMonthToday,
        addMinutes(anchors.currentMonthToday, 45)
      );
      await insertSlot(
        client,
        calendarMatchingIds.matchedRescheduled,
        addMinutes(anchors.currentMonthToday, 90),
        addMinutes(anchors.currentMonthToday, 135)
      );
      await selectSlot(client, calendarMatchingIds.matchedRescheduled, slotId);
    }
    calendarMatchingIds.today = calendarMatchingIds.matchedRescheduled;

    // 11) MATCHED near end of current month — Mentor B / mentee3
    calendarMatchingIds.end = await insertMatching(client, {
      mentorId: ids.mentorB,
      menteeId: ids.mentee3,
      status: "PENDING_MENTEE",
    });
    {
      const slotId = await insertSlot(
        client,
        calendarMatchingIds.end,
        anchors.currentMonthEnd,
        addMinutes(anchors.currentMonthEnd, 45)
      );
      await selectSlot(client, calendarMatchingIds.end, slotId);
    }

    // 12) PENDING_MENTOR after conceptual reschedule — both as mentor / mentee3
    const pendingMentorRescheduleBothId = await insertMatching(client, {
      mentorId: ids.both,
      menteeId: ids.mentee3,
      status: "PENDING_MENTOR",
      rescheduleUsed: true,
      moreTimesRequested: false,
    });

    // 13) CLEAR rescheduleUsed = Yes demo (matches production requestReschedule result):
    //     was MATCHED → reschedule once → PENDING_MENTOR, slots cleared, selected_slot_id NULL.
    const rescheduleUsedMatchingId = await insertMatching(client, {
      mentorId: ids.rescheduleMentor,
      menteeId: ids.rescheduleMentee,
      status: "PENDING_MENTOR",
      rescheduleUsed: true,
      moreTimesRequested: false,
    });

    // 14) Comparison: fresh request still awaiting mentor times — reschedule never used.
    const rescheduleFreshMatchingId = await insertMatching(client, {
      mentorId: ids.rescheduleMentor,
      menteeId: ids.rescheduleFresh,
      status: "PENDING_MENTOR",
      rescheduleUsed: false,
      moreTimesRequested: false,
    });

    await client.query("COMMIT");

    const summary = await verifySeed(client, ids);

    // Confirm the dedicated reschedule QA rows for Admin Matching Details.
    const rescheduleRows = await client.query(
      `SELECT m.id, m.status, m.reschedule_used, m.more_times_requested,
              m.selected_slot_id,
              mentor_u.username AS mentor, mentee_u.username AS mentee,
              (SELECT COUNT(*)::int FROM matching_slots ms WHERE ms.matching_id = m.id) AS slot_count
       FROM matching m
       JOIN users mentor_u ON mentor_u.id = m.mentor_id
       JOIN users mentee_u ON mentee_u.id = m.mentee_id
       WHERE m.id = ANY($1::int[])
       ORDER BY m.id`,
      [[rescheduleUsedMatchingId, rescheduleFreshMatchingId]]
    );

    // Calendar event inventory (MATCHED + selected_slot_id only).
    const calendarRows = await client.query(
      `SELECT m.id, m.status, m.reschedule_used, m.selected_slot_id,
              mentor_u.username AS mentor, mentee_u.username AS mentee,
              ms.start_time, ms.end_time, ms.is_selected
       FROM matching m
       JOIN users mentor_u ON mentor_u.id = m.mentor_id
       JOIN users mentee_u ON mentee_u.id = m.mentee_id
       JOIN matching_slots ms ON ms.id = m.selected_slot_id
       WHERE m.id = ANY($1::int[])
       ORDER BY ms.start_time`,
      [
        [
          calendarMatchingIds.begin,
          calendarMatchingIds.sameMorning,
          calendarMatchingIds.sameAfternoon,
          calendarMatchingIds.today,
          calendarMatchingIds.end,
          calendarMatchingIds.next,
          calendarMatchingIds.prev,
        ],
      ]
    );

    console.log("");
    console.log("QA seed complete.");
    console.log(`QA users: ${summary.userCount}`);
    console.log(`QA admins: ${summary.adminCount}`);
    console.log(`QA mentor profiles: ${summary.profileCount}`);
    console.log("QA matchings by status:", summary.byStatus);
    console.log(`QA slots: ${summary.slotCount}`);
    console.log(`QA selected slots (MATCHED with selected_slot_id): ${summary.selectedCount}`);
    console.log(
      `Selected-slot consistency issues: ${summary.inconsistentSelected}`
    );
    console.log(`qa_admin is_admin: ${summary.adminOk}`);
    console.log("");
    console.log("========================================");
    console.log("CALENDAR QA (MATCHED + selected_slot_id)");
    console.log(
      `  Anchors (local month): begin=day ${anchors.beginDay}, same-day=${anchors.sameDay}, today=day ${anchors.todayDay}, end=day ${anchors.endDay}`
    );
    for (const row of calendarRows.rows) {
      console.log(
        `  id=${row.id} ${row.mentor} ↔ ${row.mentee} | ${row.status} | reschedule_used=${row.reschedule_used} | start=${row.start_time.toISOString()} | is_selected=${row.is_selected}`
      );
    }
    console.log(
      `  Same-date pair IDs: ${calendarMatchingIds.sameMorning} + ${calendarMatchingIds.sameAfternoon}`
    );
    console.log(`  Today ID: ${calendarMatchingIds.today}`);
    console.log(`  Previous month ID: ${calendarMatchingIds.prev}`);
    console.log(`  Next month ID: ${calendarMatchingIds.next}`);
    console.log(
      `  MATCHED + reschedule_used=true (on Calendar): id=${calendarMatchingIds.matchedRescheduled}`
    );
    console.log("========================================");
    console.log("NON-CALENDAR QA (Matchings Report only)");
    console.log(
      `  PENDING_MENTOR fresh: id=${pendingMentorFreshId} (no selected_slot)`
    );
    console.log(
      `  PENDING_MENTEE proposed slots: id=${pendingMenteeId} (no selected_slot)`
    );
    console.log(`  REJECTED: id=${rejectedId} (no selected_slot)`);
    console.log(
      `  PENDING_MENTEE more_times: id=${moreTimesMatching} (no selected_slot)`
    );
    console.log(
      `  PENDING_MENTOR reschedule_used: id=${pendingMentorRescheduleBothId} (no selected_slot)`
    );
    console.log("========================================");
    console.log("RESCHEDULE USED — Admin Matching Details QA");
    for (const row of rescheduleRows.rows) {
      console.log(
        `  id=${row.id} ${row.mentor} ↔ ${row.mentee} | status=${row.status} | reschedule_used=${row.reschedule_used} | more_times=${row.more_times_requested} | selected_slot_id=${row.selected_slot_id} | slots=${row.slot_count}`
      );
      console.log(`  URL: /admin/matchings/${row.id}`);
    }
    console.log("========================================");
    console.log("QA ADMIN LOGIN (DEVELOPMENT-ONLY)");
    console.log(`Email:    ${QA_USERS.admin.email}`);
    console.log(`Username: ${QA_USERS.admin.username}`);
    console.log(`Password: ${QA_PASSWORD}`);
    console.log("========================================");
    console.log("Useful non-admin accounts (same password):");
    console.log(`  ${QA_USERS.userZero.email}  — zero activity`);
    console.log(`  ${QA_USERS.mentorA.email}   — mentor with many matchings`);
    console.log(`  ${QA_USERS.mentorB.email}   — mentor with fewer matchings`);
    console.log(`  ${QA_USERS.both.email} — mentor + mentee`);
    console.log(`  ${QA_USERS.adminMentor.email} — Admin + mentor`);
    console.log(
      `  ${QA_USERS.rescheduleMentor.email} — rescheduleUsed visual QA mentor`
    );
    console.log("========================================");

    const usedOk = rescheduleRows.rows.find(
      (r) =>
        r.id === rescheduleUsedMatchingId &&
        r.status === "PENDING_MENTOR" &&
        r.reschedule_used === true &&
        r.more_times_requested === false &&
        r.selected_slot_id == null &&
        r.slot_count === 0
    );
    const freshOk = rescheduleRows.rows.find(
      (r) =>
        r.id === rescheduleFreshMatchingId &&
        r.status === "PENDING_MENTOR" &&
        r.reschedule_used === false &&
        r.more_times_requested === false &&
        r.selected_slot_id == null &&
        r.slot_count === 0
    );

    const calendarOk =
      calendarRows.rows.length === 7 &&
      calendarRows.rows.every(
        (r) =>
          r.status === "MATCHED" &&
          r.selected_slot_id != null &&
          r.is_selected === true
      );

    if (
      !summary.adminOk ||
      summary.inconsistentSelected > 0 ||
      !usedOk ||
      !freshOk ||
      !calendarOk
    ) {
      process.exitCode = 1;
      console.error("Verification failed.");
    }
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Admin QA seed failed:", err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
