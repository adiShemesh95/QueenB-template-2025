const request = require("supertest");
const app = require("../app");
const pool = require("../db");
const { trackEvent, getDashboardAnalytics, ALLOWED_SOURCES } =
  require("../services/analyticsService");

const createdEmails = [];
const createdUsernames = [];
const createdUserIds = [];
const createdAnalyticsIds = [];

function uniqueId() {
  return `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function makeUser(overrides = {}) {
  const id = uniqueId();
  const user = {
    email: `jest_analytics_${id}@example.com`,
    username: `jest_analytics_${id}`.slice(0, 50),
    password: "Password1!",
    confirmPassword: "Password1!",
    ...overrides,
  };
  createdEmails.push(user.email.toLowerCase().trim());
  createdUsernames.push(user.username.trim());
  return user;
}

function getCookieHeader(res) {
  return res.headers["set-cookie"];
}

async function registerUser(overrides = {}) {
  const payload = makeUser(overrides);
  const res = await request(app).post("/api/auth/register").send(payload);
  expect(res.status).toBe(201);
  createdUserIds.push(res.body.user.id);
  return {
    payload,
    user: res.body.user,
    cookie: getCookieHeader(res),
  };
}

async function promoteToAdmin(userId) {
  await pool.query(`UPDATE users SET is_admin = TRUE WHERE id = $1`, [userId]);
}

async function registerAdmin() {
  const registered = await registerUser();
  await promoteToAdmin(registered.user.id);
  // Re-login so the cookie JWT / session user reflects isAdmin for middleware
  // authMiddleware loads user from DB each request, so cookie from register is fine.
  return registered;
}

function trackCreatedEvent(event) {
  if (event && event.id != null) {
    createdAnalyticsIds.push(event.id);
  }
  return event;
}

beforeAll(() => {
  require("dotenv").config();
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET must be set in server/.env for tests");
  }
});

afterAll(async () => {
  if (createdAnalyticsIds.length) {
    await pool.query(
      `DELETE FROM analytics_events WHERE id = ANY($1::int[])`,
      [createdAnalyticsIds]
    );
  }

  if (createdUserIds.length) {
    await pool.query(
      `DELETE FROM analytics_events
       WHERE user_id = ANY($1::int[])
          OR mentor_user_id = ANY($1::int[])`,
      [createdUserIds]
    );
    await pool.query(
      `DELETE FROM matching
       WHERE mentee_id = ANY($1::int[])
          OR mentor_id = ANY($1::int[])`,
      [createdUserIds]
    );
  }

  if (createdEmails.length || createdUsernames.length) {
    await pool.query(
      `DELETE FROM users
       WHERE email = ANY($1::text[])
          OR username = ANY($2::text[])`,
      [createdEmails, createdUsernames]
    );
  }

  await pool.end();
});

describe("POST /api/analytics/events", () => {
  test("unauthenticated user cannot POST analytics event", async () => {
    const res = await request(app).post("/api/analytics/events").send({
      eventType: "mentor_profile_viewed",
      mentorUserId: 1,
    });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  test("authenticated user can record mentor_profile_viewed", async () => {
    const actor = await registerUser();
    const mentor = await registerUser();

    const res = await request(app)
      .post("/api/analytics/events")
      .set("Cookie", actor.cookie)
      .send({
        eventType: "mentor_profile_viewed",
        mentorUserId: mentor.user.id,
        source: "whatsapp",
      });

    expect(res.status).toBe(201);
    expect(res.body.event).toEqual(
      expect.objectContaining({
        eventType: "mentor_profile_viewed",
        userId: actor.user.id,
        mentorUserId: mentor.user.id,
        source: "whatsapp",
        matchingId: null,
      })
    );
    trackCreatedEvent(res.body.event);
  });

  test("request body cannot impersonate another user via userId", async () => {
    const actor = await registerUser();
    const other = await registerUser();
    const mentor = await registerUser();

    const res = await request(app)
      .post("/api/analytics/events")
      .set("Cookie", actor.cookie)
      .send({
        eventType: "mentor_profile_viewed",
        userId: other.user.id,
        mentorUserId: mentor.user.id,
      });

    expect(res.status).toBe(201);
    expect(res.body.event.userId).toBe(actor.user.id);
    expect(res.body.event.userId).not.toBe(other.user.id);
    trackCreatedEvent(res.body.event);
  });

  test("invalid event type is rejected", async () => {
    const actor = await registerUser();
    const mentor = await registerUser();

    const res = await request(app)
      .post("/api/analytics/events")
      .set("Cookie", actor.cookie)
      .send({
        eventType: "not_a_real_event",
        mentorUserId: mentor.user.id,
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("unsupported source is rejected", async () => {
    const actor = await registerUser();
    const mentor = await registerUser();

    const res = await request(app)
      .post("/api/analytics/events")
      .set("Cookie", actor.cookie)
      .send({
        eventType: "mentor_profile_viewed",
        mentorUserId: mentor.user.id,
        source: "twitter",
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "source" }),
      ])
    );
  });

  test("blank/missing source becomes direct", async () => {
    const actor = await registerUser();
    const mentor = await registerUser();

    const resMissing = await request(app)
      .post("/api/analytics/events")
      .set("Cookie", actor.cookie)
      .send({
        eventType: "mentor_profile_viewed",
        mentorUserId: mentor.user.id,
      });

    expect(resMissing.status).toBe(201);
    expect(resMissing.body.event.source).toBe("direct");
    trackCreatedEvent(resMissing.body.event);

    const resBlank = await request(app)
      .post("/api/analytics/events")
      .set("Cookie", actor.cookie)
      .send({
        eventType: "mentor_profile_viewed",
        mentorUserId: mentor.user.id,
        source: "   ",
      });

    expect(resBlank.status).toBe(201);
    expect(resBlank.body.event.source).toBe("direct");
    trackCreatedEvent(resBlank.body.event);
  });

  test.each([
    "mentoring_request_sent",
    "slot_selected",
    "match_confirmed",
  ])("client cannot POST lifecycle event %s", async (eventType) => {
    const actor = await registerUser();
    const mentor = await registerUser();

    const res = await request(app)
      .post("/api/analytics/events")
      .set("Cookie", actor.cookie)
      .send({
        eventType,
        mentorUserId: mentor.user.id,
        matchingId: 1,
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "eventType" }),
      ])
    );
  });

  test("invalid mentorUserId is handled cleanly", async () => {
    const actor = await registerUser();

    const resShape = await request(app)
      .post("/api/analytics/events")
      .set("Cookie", actor.cookie)
      .send({
        eventType: "mentor_profile_viewed",
        mentorUserId: -5,
      });

    expect(resShape.status).toBe(400);
    expect(resShape.body.error.code).toBe("VALIDATION_ERROR");

    const resMissing = await request(app)
      .post("/api/analytics/events")
      .set("Cookie", actor.cookie)
      .send({
        eventType: "mentor_profile_viewed",
        mentorUserId: 999999999,
      });

    expect(resMissing.status).toBe(400);
    expect(resMissing.body.error.code).toBe("VALIDATION_ERROR");
    expect(resMissing.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "mentorUserId" }),
      ])
    );
  });
});

describe("GET /api/admin/analytics", () => {
  test("regular user cannot read Admin analytics", async () => {
    const { cookie } = await registerUser();

    const res = await request(app)
      .get("/api/admin/analytics")
      .set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  test("Admin can read Analytics dashboard with expected structure", async () => {
    const admin = await registerAdmin();

    const res = await request(app)
      .get("/api/admin/analytics")
      .set("Cookie", admin.cookie);

    expect(res.status).toBe(200);
    expect(res.body.analytics).toEqual(
      expect.objectContaining({
        kpis: expect.objectContaining({
          profileViews: expect.any(Number),
          mentoringRequests: expect.any(Number),
          slotsSelected: expect.any(Number),
          successfulMatches: expect.any(Number),
          conversionRate: expect.any(Number),
        }),
        funnel: expect.any(Array),
        funnelConversions: expect.objectContaining({
          requestRateFromViews: expect.any(Number),
          slotRateFromRequests: expect.any(Number),
          matchRateFromSlots: expect.any(Number),
        }),
        sources: expect.any(Array),
        matchesOverTime: expect.any(Array),
      })
    );

    expect(res.body.analytics.funnel).toHaveLength(4);
    expect(res.body.analytics.sources).toHaveLength(4);
    expect(res.body.analytics.sources.map((s) => s.source).sort()).toEqual(
      [...ALLOWED_SOURCES].sort()
    );

    const { conversionRate, profileViews } = res.body.analytics.kpis;
    expect(Number.isFinite(conversionRate)).toBe(true);
    expect(conversionRate).not.toBe(Infinity);
    if (profileViews === 0) {
      expect(conversionRate).toBe(0);
    }
  });

  test("zero-view conversion returns 0, not NaN/Infinity", async () => {
    const admin = await registerAdmin();
    const before = await getDashboardAnalytics();

    // If the platform currently has zero profile views, conversion must be 0.
    // Also assert rates never become non-finite regardless of baseline.
    expect(Number.isFinite(before.kpis.conversionRate)).toBe(true);
    expect(before.kpis.conversionRate).not.toBe(Infinity);
    expect(Number.isFinite(before.funnelConversions.requestRateFromViews)).toBe(
      true
    );
    expect(Number.isFinite(before.funnelConversions.slotRateFromRequests)).toBe(
      true
    );
    expect(Number.isFinite(before.funnelConversions.matchRateFromSlots)).toBe(
      true
    );

    if (before.kpis.profileViews === 0) {
      expect(before.kpis.conversionRate).toBe(0);
    }

    const res = await request(app)
      .get("/api/admin/analytics")
      .set("Cookie", admin.cookie);

    expect(res.status).toBe(200);
    expect(Number.isFinite(res.body.analytics.kpis.conversionRate)).toBe(true);
  });

  test("known fixture events produce correct KPI / source / funnel deltas", async () => {
    const admin = await registerAdmin();
    const mentee = await registerUser();
    const mentor = await registerUser();

    const before = await getDashboardAnalytics();

    const fixtures = [
      await trackEvent({
        eventType: "mentor_profile_viewed",
        userId: mentee.user.id,
        mentorUserId: mentor.user.id,
        source: "whatsapp",
      }),
      await trackEvent({
        eventType: "mentor_profile_viewed",
        userId: mentee.user.id,
        mentorUserId: mentor.user.id,
        source: "whatsapp",
      }),
      await trackEvent({
        eventType: "mentor_profile_viewed",
        userId: mentee.user.id,
        mentorUserId: mentor.user.id,
        source: "linkedin",
      }),
      await trackEvent({
        eventType: "mentor_profile_viewed",
        userId: mentee.user.id,
        mentorUserId: mentor.user.id,
        source: "direct",
      }),
      await trackEvent({
        eventType: "mentoring_request_sent",
        userId: mentee.user.id,
        mentorUserId: mentor.user.id,
        matchingId: 900001,
        source: "whatsapp",
      }),
      await trackEvent({
        eventType: "mentoring_request_sent",
        userId: mentee.user.id,
        mentorUserId: mentor.user.id,
        matchingId: 900002,
        source: "linkedin",
      }),
      await trackEvent({
        eventType: "slot_selected",
        userId: mentee.user.id,
        mentorUserId: mentor.user.id,
        matchingId: 900001,
        source: "whatsapp",
      }),
      await trackEvent({
        eventType: "match_confirmed",
        userId: mentee.user.id,
        mentorUserId: mentor.user.id,
        matchingId: 900001,
        source: "whatsapp",
      }),
    ];

    for (const event of fixtures) {
      expect(event.error).toBeUndefined();
      trackCreatedEvent(event);
    }

    const res = await request(app)
      .get("/api/admin/analytics")
      .set("Cookie", admin.cookie);

    expect(res.status).toBe(200);
    const { kpis, funnel, sources, matchesOverTime, funnelConversions } =
      res.body.analytics;

    expect(kpis.profileViews).toBe(before.kpis.profileViews + 4);
    expect(kpis.mentoringRequests).toBe(before.kpis.mentoringRequests + 2);
    expect(kpis.slotsSelected).toBe(before.kpis.slotsSelected + 1);
    expect(kpis.successfulMatches).toBe(before.kpis.successfulMatches + 1);

    const expectedConversion =
      kpis.profileViews === 0
        ? 0
        : Math.round((kpis.successfulMatches / kpis.profileViews) * 10000) / 100;
    expect(kpis.conversionRate).toBe(expectedConversion);

    expect(funnel.map((s) => s.eventType)).toEqual([
      "mentor_profile_viewed",
      "mentoring_request_sent",
      "slot_selected",
      "match_confirmed",
    ]);
    expect(funnel[0].count).toBe(kpis.profileViews);
    expect(funnel[3].count).toBe(kpis.successfulMatches);

    expect(funnelConversions.requestRateFromViews).toBe(
      kpis.profileViews === 0
        ? 0
        : Math.round((kpis.mentoringRequests / kpis.profileViews) * 10000) / 100
    );

    const bySource = Object.fromEntries(sources.map((s) => [s.source, s]));
    expect(Object.keys(bySource).sort()).toEqual([...ALLOWED_SOURCES].sort());

    expect(bySource.whatsapp.profileViews).toBe(
      (before.sources.find((s) => s.source === "whatsapp")?.profileViews || 0) + 2
    );
    expect(bySource.whatsapp.mentoringRequests).toBe(
      (before.sources.find((s) => s.source === "whatsapp")?.mentoringRequests ||
        0) + 1
    );
    expect(bySource.whatsapp.successfulMatches).toBe(
      (before.sources.find((s) => s.source === "whatsapp")?.successfulMatches ||
        0) + 1
    );
    expect(bySource.copy_link.profileViews).toBe(
      before.sources.find((s) => s.source === "copy_link")?.profileViews || 0
    );

    const whatsappViews = bySource.whatsapp.profileViews;
    const whatsappMatches = bySource.whatsapp.successfulMatches;
    expect(bySource.whatsapp.conversionRate).toBe(
      whatsappViews === 0
        ? 0
        : Math.round((whatsappMatches / whatsappViews) * 10000) / 100
    );

    expect(matchesOverTime.length).toBeGreaterThanOrEqual(1);
    const trendTotal = matchesOverTime.reduce(
      (sum, row) => sum + row.successfulMatches,
      0
    );
    expect(trendTotal).toBe(kpis.successfulMatches);
  });
});

describe("Matching lifecycle analytics (server-side)", () => {
  async function registerActiveMentor() {
    const mentor = await registerUser();
    await pool.query(
      `INSERT INTO mentor_profiles (user_id, job, company, topics, is_active)
       VALUES ($1, 'Engineer', 'Test Co', ARRAY['Career Planning'], TRUE)
       ON CONFLICT (user_id) DO UPDATE SET is_active = TRUE`,
      [mentor.user.id]
    );
    return mentor;
  }

  test("successful matching creation emits mentoring_request_sent with source", async () => {
    const mentee = await registerUser();
    const mentor = await registerActiveMentor();

    const res = await request(app)
      .post("/api/matching")
      .set("Cookie", mentee.cookie)
      .send({ mentorId: mentor.user.id, source: "whatsapp" });

    expect(res.status).toBe(201);
    const matchingId = res.body.id;
    expect(matchingId).toEqual(expect.any(Number));

    const events = await pool.query(
      `SELECT event_type, matching_id, source, mentor_user_id, user_id
       FROM analytics_events
       WHERE matching_id = $1 AND event_type = 'mentoring_request_sent'`,
      [matchingId]
    );
    expect(events.rowCount).toBe(1);
    expect(events.rows[0].source).toBe("whatsapp");
    expect(Number(events.rows[0].mentor_user_id)).toBe(mentor.user.id);
    expect(Number(events.rows[0].user_id)).toBe(mentee.user.id);
    createdAnalyticsIds.push(events.rows[0].id);
  });

  test("failed matching creation does not emit mentoring_request_sent", async () => {
    const mentee = await registerUser();
    const before = await pool.query(
      `SELECT COUNT(*)::int AS c FROM analytics_events WHERE event_type = 'mentoring_request_sent'`
    );

    const res = await request(app)
      .post("/api/matching")
      .set("Cookie", mentee.cookie)
      .send({ mentorId: 999999999, source: "whatsapp" });

    expect(res.status).toBe(404);
    const after = await pool.query(
      `SELECT COUNT(*)::int AS c FROM analytics_events WHERE event_type = 'mentoring_request_sent'`
    );
    expect(after.rows[0].c).toBe(before.rows[0].c);
  });

  test("invalid matching source is rejected", async () => {
    const mentee = await registerUser();
    const mentor = await registerActiveMentor();

    const res = await request(app)
      .post("/api/matching")
      .set("Cookie", mentee.cookie)
      .send({ mentorId: mentor.user.id, source: "twitter" });

    expect(res.status).toBe(400);
  });

  test("slot selection emits slot_selected and match_confirmed with recovered source", async () => {
    const mentee = await registerUser();
    const mentor = await registerActiveMentor();

    const createRes = await request(app)
      .post("/api/matching")
      .set("Cookie", mentee.cookie)
      .send({ mentorId: mentor.user.id, source: "linkedin" });
    expect(createRes.status).toBe(201);
    const matchingId = createRes.body.id;

    await pool.query(
      `UPDATE matching SET status = 'PENDING_MENTEE' WHERE id = $1`,
      [matchingId]
    );
    const slot = await pool.query(
      `INSERT INTO matching_slots (matching_id, start_time, end_time)
       VALUES ($1, NOW() + interval '1 day', NOW() + interval '1 day 1 hour')
       RETURNING id`,
      [matchingId]
    );

    const selectRes = await request(app)
      .post(`/api/matching/${matchingId}/select-slot`)
      .set("Cookie", mentee.cookie)
      .send({ slotId: slot.rows[0].id });

    expect(selectRes.status).toBe(200);
    expect(selectRes.body.status).toBe("MATCHED");

    const events = await pool.query(
      `SELECT id, event_type, source, metadata
       FROM analytics_events
       WHERE matching_id = $1
         AND event_type = ANY($2::text[])
       ORDER BY created_at ASC, id ASC`,
      [matchingId, ["mentoring_request_sent", "slot_selected", "match_confirmed"]]
    );

    expect(events.rows.map((r) => r.event_type)).toEqual([
      "mentoring_request_sent",
      "slot_selected",
      "match_confirmed",
    ]);
    expect(events.rows.every((r) => r.source === "linkedin")).toBe(true);
    expect(events.rows[1].metadata).toEqual(
      expect.objectContaining({ slotId: slot.rows[0].id })
    );
    events.rows.forEach((row) => createdAnalyticsIds.push(row.id));
  });

  test("failed slot selection emits neither slot_selected nor match_confirmed", async () => {
    const mentee = await registerUser();
    const mentor = await registerActiveMentor();

    const createRes = await request(app)
      .post("/api/matching")
      .set("Cookie", mentee.cookie)
      .send({ mentorId: mentor.user.id, source: "direct" });
    const matchingId = createRes.body.id;

    const reqEvent = await pool.query(
      `SELECT id FROM analytics_events
       WHERE matching_id = $1 AND event_type = 'mentoring_request_sent'`,
      [matchingId]
    );
    createdAnalyticsIds.push(reqEvent.rows[0].id);

    const before = await pool.query(
      `SELECT COUNT(*)::int AS c FROM analytics_events
       WHERE matching_id = $1
         AND event_type = ANY($2::text[])`,
      [matchingId, ["slot_selected", "match_confirmed"]]
    );

    const res = await request(app)
      .post(`/api/matching/${matchingId}/select-slot`)
      .set("Cookie", mentee.cookie)
      .send({ slotId: 1 });

    expect(res.status).toBeGreaterThanOrEqual(400);

    const after = await pool.query(
      `SELECT COUNT(*)::int AS c FROM analytics_events
       WHERE matching_id = $1
         AND event_type = ANY($2::text[])`,
      [matchingId, ["slot_selected", "match_confirmed"]]
    );
    expect(after.rows[0].c).toBe(before.rows[0].c);
  });

  test("missing attribution falls back to direct for later lifecycle events", async () => {
    const { getMatchingAttribution } = require("../services/analyticsService");
    const source = await getMatchingAttribution(999999999);
    expect(source).toBe("direct");
  });
});
