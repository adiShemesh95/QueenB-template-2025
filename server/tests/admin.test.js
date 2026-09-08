const request = require("supertest");
const app = require("../app");
const pool = require("../db");
const { COOKIE_NAME } = require("../utils/cookies");

const createdEmails = [];
const createdUsernames = [];
const createdUserIds = [];

function uniqueId() {
  return `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function makeUser(overrides = {}) {
  const id = uniqueId();
  const user = {
    email: `jest_admin_${id}@example.com`,
    username: `jest_admin_${id}`.slice(0, 50),
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
  // Admin privilege is database-controlled only (Stage 1 foundation).
  await pool.query(`UPDATE users SET is_admin = TRUE WHERE id = $1`, [userId]);
}

async function registerAdmin() {
  const registered = await registerUser();
  await promoteToAdmin(registered.user.id);
  return registered;
}

function assertAdminUserSummary(user) {
  expect(user).toEqual(
    expect.objectContaining({
      id: expect.any(Number),
      email: expect.any(String),
      username: expect.any(String),
      createdAt: expect.anything(),
      isAdmin: expect.any(Boolean),
      matchingCountAsMentor: expect.any(Number),
      matchingCountAsMentee: expect.any(Number),
    })
  );
  expect(user).not.toHaveProperty("password_hash");
  expect(user).not.toHaveProperty("password");
  expect(user).not.toHaveProperty("is_admin");
  expect(JSON.stringify(user)).not.toMatch(/password_hash/i);
}

beforeAll(() => {
  require("dotenv").config();
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET must be set in server/.env for tests");
  }
});

afterAll(async () => {
  if (createdUserIds.length) {
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

describe("GET /api/admin/users — authorization", () => {
  test("unauthenticated request is rejected with 401", async () => {
    const res = await request(app).get("/api/admin/users");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  test("authenticated non-admin is rejected with 403", async () => {
    const { cookie } = await registerUser();

    const res = await request(app)
      .get("/api/admin/users")
      .set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  test("authenticated Admin request is allowed", async () => {
    const { cookie } = await registerAdmin();

    const res = await request(app)
      .get("/api/admin/users")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
  });
});

describe("GET /api/admin/users — list data", () => {
  test("Admin receives users from the real database without password_hash", async () => {
    const admin = await registerAdmin();
    const zeroMatchUser = await registerUser();

    const res = await request(app)
      .get("/api/admin/users")
      .set("Cookie", admin.cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.users.length).toBeGreaterThanOrEqual(2);
    expect(JSON.stringify(res.body)).not.toMatch(/password_hash/i);

    const listedAdmin = res.body.users.find((u) => u.id === admin.user.id);
    const listedZero = res.body.users.find(
      (u) => u.id === zeroMatchUser.user.id
    );

    expect(listedAdmin).toBeTruthy();
    assertAdminUserSummary(listedAdmin);
    expect(listedAdmin.isAdmin).toBe(true);

    expect(listedZero).toBeTruthy();
    assertAdminUserSummary(listedZero);
    expect(listedZero.isAdmin).toBe(false);
    expect(listedZero.matchingCountAsMentor).toBe(0);
    expect(listedZero.matchingCountAsMentee).toBe(0);
  });

  test("matching counts reflect mentor and mentee rows without multiplication", async () => {
    const admin = await registerAdmin();
    const mentor = await registerUser();
    const menteeA = await registerUser();
    const menteeB = await registerUser();

    await request(app)
      .post("/api/mentor-profile")
      .set("Cookie", mentor.cookie)
      .send({
        job: "Engineer",
        company: "Admin Test Co",
        topics: ["Career Planning"],
      });

    const match1 = await request(app)
      .post("/api/matching")
      .set("Cookie", menteeA.cookie)
      .send({ mentorId: mentor.user.id });
    expect(match1.status).toBe(201);

    const match2 = await request(app)
      .post("/api/matching")
      .set("Cookie", menteeB.cookie)
      .send({ mentorId: mentor.user.id });
    expect(match2.status).toBe(201);

    // Mentor also acts as mentee once — counts must stay independent.
    const otherMentor = await registerUser();
    await request(app)
      .post("/api/mentor-profile")
      .set("Cookie", otherMentor.cookie)
      .send({
        job: "Lead",
        company: "Other Co",
        topics: ["Tech Skills"],
      });

    const matchAsMentee = await request(app)
      .post("/api/matching")
      .set("Cookie", mentor.cookie)
      .send({ mentorId: otherMentor.user.id });
    expect(matchAsMentee.status).toBe(201);

    const res = await request(app)
      .get("/api/admin/users")
      .set("Cookie", admin.cookie);

    expect(res.status).toBe(200);
    const listedMentor = res.body.users.find((u) => u.id === mentor.user.id);
    expect(listedMentor).toBeTruthy();
    expect(listedMentor.matchingCountAsMentor).toBe(2);
    expect(listedMentor.matchingCountAsMentee).toBe(1);
  });
});

describe("GET /api/admin/users/:id", () => {
  test("Admin can retrieve an existing user with matching counts", async () => {
    const admin = await registerAdmin();
    const target = await registerUser();

    const res = await request(app)
      .get(`/api/admin/users/${target.user.id}`)
      .set("Cookie", admin.cookie);

    expect(res.status).toBe(200);
    assertAdminUserSummary(res.body.user);
    expect(res.body.user.id).toBe(target.user.id);
    expect(res.body.user.email).toBe(target.user.email);
    expect(res.body.user.matchingCountAsMentor).toBe(0);
    expect(res.body.user.matchingCountAsMentee).toBe(0);
    expect(res.body.user.mentorProfile).toBeNull();
    expect(JSON.stringify(res.body)).not.toMatch(/password_hash/i);
  });

  test("mentorProfile is returned when the user has one", async () => {
    const admin = await registerAdmin();
    const mentor = await registerUser();

    const profileRes = await request(app)
      .post("/api/mentor-profile")
      .set("Cookie", mentor.cookie)
      .send({
        job: "Software Engineer",
        company: "QueenB",
        background: "Backend",
        techStack: ["Node.js"],
        yearsExperience: 3,
        topics: ["Mock Interview", "Tech Skills"],
        maxSessions: 4,
        sessionDuration: 45,
      });
    expect(profileRes.status).toBe(200);

    const res = await request(app)
      .get(`/api/admin/users/${mentor.user.id}`)
      .set("Cookie", admin.cookie);

    expect(res.status).toBe(200);
    expect(res.body.user.mentorProfile).toEqual(
      expect.objectContaining({
        userId: mentor.user.id,
        job: "Software Engineer",
        company: "QueenB",
        background: "Backend",
        techStack: ["Node.js"],
        yearsExperience: 3,
        topics: ["Mock Interview", "Tech Skills"],
        maxSessions: 4,
        sessionDuration: 45,
        isActive: true,
      })
    );
  });

  test("mentorProfile is null when the user has none", async () => {
    const admin = await registerAdmin();
    const regular = await registerUser();

    const res = await request(app)
      .get(`/api/admin/users/${regular.user.id}`)
      .set("Cookie", admin.cookie);

    expect(res.status).toBe(200);
    expect(res.body.user.mentorProfile).toBeNull();
  });

  test("both matching counts are returned on detail", async () => {
    const admin = await registerAdmin();
    const mentor = await registerUser();
    const mentee = await registerUser();

    await request(app)
      .post("/api/mentor-profile")
      .set("Cookie", mentor.cookie)
      .send({
        job: "Mentor",
        company: "Count Co",
        topics: ["Resume Review"],
      });

    const matchRes = await request(app)
      .post("/api/matching")
      .set("Cookie", mentee.cookie)
      .send({ mentorId: mentor.user.id });
    expect(matchRes.status).toBe(201);

    const mentorDetail = await request(app)
      .get(`/api/admin/users/${mentor.user.id}`)
      .set("Cookie", admin.cookie);
    expect(mentorDetail.status).toBe(200);
    expect(mentorDetail.body.user.matchingCountAsMentor).toBe(1);
    expect(mentorDetail.body.user.matchingCountAsMentee).toBe(0);

    const menteeDetail = await request(app)
      .get(`/api/admin/users/${mentee.user.id}`)
      .set("Cookie", admin.cookie);
    expect(menteeDetail.status).toBe(200);
    expect(menteeDetail.body.user.matchingCountAsMentor).toBe(0);
    expect(menteeDetail.body.user.matchingCountAsMentee).toBe(1);
  });

  test("unknown user returns 404", async () => {
    const admin = await registerAdmin();
    const missingId = 2_147_483_647;

    const res = await request(app)
      .get(`/api/admin/users/${missingId}`)
      .set("Cookie", admin.cookie);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  test("unauthenticated detail request is rejected", async () => {
    const res = await request(app).get("/api/admin/users/1");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  test("non-admin detail request is rejected with 403", async () => {
    const { cookie, user } = await registerUser();

    const res = await request(app)
      .get(`/api/admin/users/${user.id}`)
      .set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  test("invalid token is rejected with 401", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Cookie", `${COOKIE_NAME}=invalid.token.value`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });
});

function assertAdminMatchingReport(matching) {
  expect(matching).toEqual(
    expect.objectContaining({
      id: expect.any(Number),
      status: expect.any(String),
      createdAt: expect.anything(),
      updatedAt: expect.anything(),
      mentor: expect.objectContaining({
        id: expect.any(Number),
        username: expect.any(String),
        email: expect.any(String),
      }),
      mentee: expect.objectContaining({
        id: expect.any(Number),
        username: expect.any(String),
        email: expect.any(String),
      }),
    })
  );
  expect(matching).toHaveProperty("selectedSlot");
  expect(matching.mentor).not.toHaveProperty("password_hash");
  expect(matching.mentor).not.toHaveProperty("passwordHash");
  expect(matching.mentor).not.toHaveProperty("password");
  expect(matching.mentee).not.toHaveProperty("password_hash");
  expect(matching.mentee).not.toHaveProperty("passwordHash");
  expect(matching.mentee).not.toHaveProperty("password");
}

async function createMentorProfile(cookie, overrides = {}) {
  const res = await request(app)
    .post("/api/mentor-profile")
    .set("Cookie", cookie)
    .send({
      job: "Engineer",
      company: "Admin Matchings Co",
      topics: ["Career Planning"],
      ...overrides,
    });
  expect(res.status).toBe(200);
  return res.body;
}

async function createMatching(menteeCookie, mentorId) {
  const res = await request(app)
    .post("/api/matching")
    .set("Cookie", menteeCookie)
    .send({ mentorId });
  expect(res.status).toBe(201);
  return res.body;
}

async function insertMatchingSlot(matchingId, start, end, isSelected = false) {
  const result = await pool.query(
    `INSERT INTO matching_slots (matching_id, start_time, end_time, is_selected)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [matchingId, start, end, isSelected]
  );
  return result.rows[0];
}

describe("GET /api/admin/matchings — authorization", () => {
  test("unauthenticated request is rejected with 401", async () => {
    const res = await request(app).get("/api/admin/matchings");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  test("authenticated non-admin is rejected with 403", async () => {
    const { cookie } = await registerUser();

    const res = await request(app)
      .get("/api/admin/matchings")
      .set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  test("authenticated Admin request is allowed", async () => {
    const { cookie } = await registerAdmin();

    const res = await request(app)
      .get("/api/admin/matchings")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.matchings)).toBe(true);
  });
});

describe("GET /api/admin/matchings — report data", () => {
  test("Admin receives real matching rows with safe mentor/mentee fields", async () => {
    const admin = await registerAdmin();
    const mentor = await registerUser();
    const mentee = await registerUser();

    await createMentorProfile(mentor.cookie);
    const created = await createMatching(mentee.cookie, mentor.user.id);

    const res = await request(app)
      .get("/api/admin/matchings")
      .set("Cookie", admin.cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.matchings)).toBe(true);
    expect(JSON.stringify(res.body)).not.toMatch(/password_hash/i);
    expect(JSON.stringify(res.body)).not.toMatch(/"password"/i);

    const reported = res.body.matchings.find((m) => m.id === created.id);
    expect(reported).toBeTruthy();
    assertAdminMatchingReport(reported);
    expect(reported.status).toBe("PENDING_MENTOR");
    expect(reported.status).toBe(created.status);
    expect(reported.mentor).toEqual({
      id: mentor.user.id,
      username: mentor.user.username,
      email: mentor.user.email,
    });
    expect(reported.mentee).toEqual({
      id: mentee.user.id,
      username: mentee.user.username,
      email: mentee.user.email,
    });
    expect(reported.selectedSlot).toBeNull();
  });

  test("selectedSlot is null when matching has no selected slot", async () => {
    const admin = await registerAdmin();
    const mentor = await registerUser();
    const mentee = await registerUser();

    await createMentorProfile(mentor.cookie);
    const created = await createMatching(mentee.cookie, mentor.user.id);

    // Slots may exist without a selection — selected_slot_id stays null.
    await insertMatchingSlot(
      created.id,
      new Date("2026-07-01T10:00:00.000Z"),
      new Date("2026-07-01T10:30:00.000Z")
    );

    const res = await request(app)
      .get("/api/admin/matchings")
      .set("Cookie", admin.cookie);

    expect(res.status).toBe(200);
    const reported = res.body.matchings.find((m) => m.id === created.id);
    expect(reported).toBeTruthy();
    expect(reported.selectedSlot).toBeNull();
  });
});

describe("GET /api/admin/matchings — filters", () => {
  test("status filter returns only rows of the requested status", async () => {
    const admin = await registerAdmin();
    const mentor = await registerUser();
    const menteeA = await registerUser();
    const menteeB = await registerUser();

    await createMentorProfile(mentor.cookie);
    const pending = await createMatching(menteeA.cookie, mentor.user.id);
    const toReject = await createMatching(menteeB.cookie, mentor.user.id);

    await pool.query(
      `UPDATE matching SET status = 'REJECTED' WHERE id = $1`,
      [toReject.id]
    );

    const res = await request(app)
      .get("/api/admin/matchings")
      .query({ status: "PENDING_MENTOR" })
      .set("Cookie", admin.cookie);

    expect(res.status).toBe(200);
    expect(res.body.matchings.every((m) => m.status === "PENDING_MENTOR")).toBe(
      true
    );
    expect(res.body.matchings.some((m) => m.id === pending.id)).toBe(true);
    expect(res.body.matchings.some((m) => m.id === toReject.id)).toBe(false);
  });

  test("invalid status returns 400", async () => {
    const admin = await registerAdmin();

    const res = await request(app)
      .get("/api/admin/matchings")
      .query({ status: "ATTENDANCE_CONFIRMED" })
      .set("Cookie", admin.cookie);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("status filter accepts CANCELLED and returns cancelled rows with selectedSlot", async () => {
    const admin = await registerAdmin();
    const mentor = await registerUser();
    const mentee = await registerUser();

    await createMentorProfile(mentor.cookie);
    const matching = await createMatching(mentee.cookie, mentor.user.id);

    const slot = await pool.query(
      `INSERT INTO matching_slots (matching_id, start_time, end_time, is_selected)
       VALUES ($1, $2, $3, true)
       RETURNING id, start_time, end_time`,
      [
        matching.id,
        "2026-09-20T11:30:00.000Z",
        "2026-09-20T12:15:00.000Z",
      ]
    );

    await pool.query(
      `UPDATE matching
       SET selected_slot_id = $1, status = 'CANCELLED', updated_at = NOW()
       WHERE id = $2`,
      [slot.rows[0].id, matching.id]
    );

    const res = await request(app)
      .get("/api/admin/matchings")
      .query({ status: "CANCELLED" })
      .set("Cookie", admin.cookie);

    expect(res.status).toBe(200);
    expect(res.body.matchings.every((m) => m.status === "CANCELLED")).toBe(
      true
    );
    const reported = res.body.matchings.find((m) => m.id === matching.id);
    expect(reported).toBeTruthy();
    expect(reported.selectedSlot).toEqual(
      expect.objectContaining({
        id: slot.rows[0].id,
      })
    );
  });

  test("participantId filter returns matchings where user is mentor or mentee", async () => {
    const admin = await registerAdmin();
    const mentor = await registerUser();
    const mentee = await registerUser();
    const otherMentor = await registerUser();
    const otherMentee = await registerUser();

    await createMentorProfile(mentor.cookie);
    await createMentorProfile(otherMentor.cookie, {
      job: "Lead",
      company: "Other Co",
    });

    const asMentor = await createMatching(mentee.cookie, mentor.user.id);
    const asMentee = await createMatching(mentor.cookie, otherMentor.user.id);
    const unrelated = await createMatching(
      otherMentee.cookie,
      otherMentor.user.id
    );

    const res = await request(app)
      .get("/api/admin/matchings")
      .query({ participantId: mentor.user.id })
      .set("Cookie", admin.cookie);

    expect(res.status).toBe(200);
    const ids = res.body.matchings.map((m) => m.id);
    expect(ids).toContain(asMentor.id);
    expect(ids).toContain(asMentee.id);
    expect(ids).not.toContain(unrelated.id);

    for (const matching of res.body.matchings) {
      expect(
        matching.mentor.id === mentor.user.id ||
          matching.mentee.id === mentor.user.id
      ).toBe(true);
    }
  });

  test("invalid participantId returns 400", async () => {
    const admin = await registerAdmin();
    const cases = ["abc", "0", "-3", "1.5"];

    for (const participantId of cases) {
      const res = await request(app)
        .get("/api/admin/matchings")
        .query({ participantId })
        .set("Cookie", admin.cookie);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    }
  });

  test("combined status + participantId filters apply both conditions", async () => {
    const admin = await registerAdmin();
    const mentor = await registerUser();
    const menteeA = await registerUser();
    const menteeB = await registerUser();

    await createMentorProfile(mentor.cookie);
    const pending = await createMatching(menteeA.cookie, mentor.user.id);
    const matched = await createMatching(menteeB.cookie, mentor.user.id);

    await pool.query(
      `UPDATE matching SET status = 'MATCHED' WHERE id = $1`,
      [matched.id]
    );

    const res = await request(app)
      .get("/api/admin/matchings")
      .query({ status: "MATCHED", participantId: mentor.user.id })
      .set("Cookie", admin.cookie);

    expect(res.status).toBe(200);
    expect(res.body.matchings.every((m) => m.status === "MATCHED")).toBe(true);
    expect(res.body.matchings.some((m) => m.id === matched.id)).toBe(true);
    expect(res.body.matchings.some((m) => m.id === pending.id)).toBe(false);
  });

  test("valid filters with no results return empty matchings array", async () => {
    const admin = await registerAdmin();
    const missingParticipantId = 2_147_483_647;

    const res = await request(app)
      .get("/api/admin/matchings")
      .query({
        status: "MATCHED",
        participantId: missingParticipantId,
      })
      .set("Cookie", admin.cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ matchings: [] });
  });
});

describe("GET /api/admin/matchings — selected slot", () => {
  test("returns authoritative selectedSlot without duplicating matching rows", async () => {
    const admin = await registerAdmin();
    const mentor = await registerUser();
    const mentee = await registerUser();

    await createMentorProfile(mentor.cookie);
    const matching = await createMatching(mentee.cookie, mentor.user.id);

    await pool.query(
      `UPDATE matching SET status = 'PENDING_MENTEE' WHERE id = $1`,
      [matching.id]
    );

    const slotA = await insertMatchingSlot(
      matching.id,
      new Date("2026-08-01T10:00:00.000Z"),
      new Date("2026-08-01T10:30:00.000Z")
    );
    const slotB = await insertMatchingSlot(
      matching.id,
      new Date("2026-08-01T11:00:00.000Z"),
      new Date("2026-08-01T11:30:00.000Z")
    );
    const slotC = await insertMatchingSlot(
      matching.id,
      new Date("2026-08-01T12:00:00.000Z"),
      new Date("2026-08-01T12:30:00.000Z")
    );

    const selectRes = await request(app)
      .post(`/api/matching/${matching.id}/select-slot`)
      .set("Cookie", mentee.cookie)
      .send({ slotId: slotB.id });
    expect(selectRes.status).toBe(200);
    expect(selectRes.body.selected_slot_id).toBe(slotB.id);
    expect(selectRes.body.status).toBe("MATCHED");

    const slotCount = await pool.query(
      `SELECT COUNT(*)::int AS count FROM matching_slots WHERE matching_id = $1`,
      [matching.id]
    );
    expect(slotCount.rows[0].count).toBe(3);

    const res = await request(app)
      .get("/api/admin/matchings")
      .query({ participantId: mentee.user.id })
      .set("Cookie", admin.cookie);

    expect(res.status).toBe(200);

    const rowsForMatching = res.body.matchings.filter(
      (m) => m.id === matching.id
    );
    expect(rowsForMatching).toHaveLength(1);

    const reported = rowsForMatching[0];
    assertAdminMatchingReport(reported);
    expect(reported.status).toBe("MATCHED");
    expect(reported.selectedSlot).toEqual(
      expect.objectContaining({
        id: slotB.id,
      })
    );
    expect(new Date(reported.selectedSlot.start).toISOString()).toBe(
      new Date(slotB.start_time).toISOString()
    );
    expect(new Date(reported.selectedSlot.end).toISOString()).toBe(
      new Date(slotB.end_time).toISOString()
    );
    expect(reported.selectedSlot.id).not.toBe(slotA.id);
    expect(reported.selectedSlot.id).not.toBe(slotC.id);
  });
});

function assertAdminMatchingDetail(matching) {
  assertAdminMatchingReport(matching);
  expect(matching).toEqual(
    expect.objectContaining({
      moreTimesRequested: expect.any(Boolean),
      rescheduleUsed: expect.any(Boolean),
      mentor: expect.objectContaining({
        id: expect.any(Number),
        username: expect.any(String),
        email: expect.any(String),
      }),
      mentee: expect.objectContaining({
        id: expect.any(Number),
        username: expect.any(String),
        email: expect.any(String),
      }),
      slots: expect.any(Array),
      feedback: null,
    })
  );
  expect(matching.mentor).toHaveProperty("mentorProfile");
  expect(matching).not.toHaveProperty("password_hash");
  expect(matching).not.toHaveProperty("password");
  expect(JSON.stringify(matching)).not.toMatch(/password_hash/i);
}

describe("GET /api/admin/matchings/:id — authorization", () => {
  test("unauthenticated request is rejected with 401", async () => {
    const res = await request(app).get("/api/admin/matchings/1");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  test("authenticated non-admin is rejected with 403", async () => {
    const { cookie } = await registerUser();

    const res = await request(app)
      .get("/api/admin/matchings/1")
      .set("Cookie", cookie);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });

  test("authenticated Admin request is allowed", async () => {
    const admin = await registerAdmin();
    const mentor = await registerUser();
    const mentee = await registerUser();

    await createMentorProfile(mentor.cookie);
    const created = await createMatching(mentee.cookie, mentor.user.id);

    const res = await request(app)
      .get(`/api/admin/matchings/${created.id}`)
      .set("Cookie", admin.cookie);

    expect(res.status).toBe(200);
    expect(res.body.matching).toBeTruthy();
    expect(res.body.matching.id).toBe(created.id);
  });
});

describe("GET /api/admin/matchings/:id — validation and not found", () => {
  test("invalid matching id returns 400", async () => {
    const admin = await registerAdmin();
    const cases = ["abc", "0", "-3", "1.5"];

    for (const id of cases) {
      const res = await request(app)
        .get(`/api/admin/matchings/${id}`)
        .set("Cookie", admin.cookie);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    }
  });

  test("valid positive non-existing id returns 404 NOT_FOUND", async () => {
    const admin = await registerAdmin();
    const missingId = 2_147_483_647;

    const res = await request(app)
      .get(`/api/admin/matchings/${missingId}`)
      .set("Cookie", admin.cookie);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});

describe("GET /api/admin/matchings/:id — detail data", () => {
  test("returns matching fields, participants, and null selectedSlot when none", async () => {
    const admin = await registerAdmin();
    const mentor = await registerUser();
    const mentee = await registerUser();

    await createMentorProfile(mentor.cookie, {
      job: "Detail Mentor",
      company: "Detail Co",
      topics: ["Resume Review"],
    });
    const created = await createMatching(mentee.cookie, mentor.user.id);

    const res = await request(app)
      .get(`/api/admin/matchings/${created.id}`)
      .set("Cookie", admin.cookie);

    expect(res.status).toBe(200);
    assertAdminMatchingDetail(res.body.matching);

    const matching = res.body.matching;
    expect(matching.id).toBe(created.id);
    expect(matching.status).toBe(created.status);
    expect(matching.status).toBe("PENDING_MENTOR");
    expect(matching.createdAt).toBeTruthy();
    expect(matching.updatedAt).toBeTruthy();
    expect(matching.moreTimesRequested).toBe(false);
    expect(matching.rescheduleUsed).toBe(false);
    expect(matching.selectedSlot).toBeNull();
    expect(matching.slots).toEqual([]);
    expect(matching.feedback).toBeNull();

    expect(matching.mentor).toEqual(
      expect.objectContaining({
        id: mentor.user.id,
        username: mentor.user.username,
        email: mentor.user.email,
      })
    );
    expect(matching.mentee).toEqual({
      id: mentee.user.id,
      username: mentee.user.username,
      email: mentee.user.email,
    });
    expect(matching.mentor).not.toHaveProperty("password_hash");
    expect(matching.mentor).not.toHaveProperty("password");
    expect(matching.mentee).not.toHaveProperty("password_hash");
    expect(matching.mentee).not.toHaveProperty("password");
    expect(JSON.stringify(res.body)).not.toMatch(/password_hash/i);
  });

  test("returns moreTimesRequested true when matching flag is set", async () => {
    const admin = await registerAdmin();
    const mentor = await registerUser();
    const mentee = await registerUser();

    await createMentorProfile(mentor.cookie);
    const created = await createMatching(mentee.cookie, mentor.user.id);

    await pool.query(
      `UPDATE matching SET more_times_requested = true WHERE id = $1`,
      [created.id]
    );

    const res = await request(app)
      .get(`/api/admin/matchings/${created.id}`)
      .set("Cookie", admin.cookie);

    expect(res.status).toBe(200);
    expect(res.body.matching.moreTimesRequested).toBe(true);
  });

  test("returns rescheduleUsed true when matching flag is set", async () => {
    const admin = await registerAdmin();
    const mentor = await registerUser();
    const mentee = await registerUser();

    await createMentorProfile(mentor.cookie);
    const created = await createMatching(mentee.cookie, mentor.user.id);

    // Historical latch only — status stays whatever production currently has.
    await pool.query(
      `UPDATE matching SET reschedule_used = true WHERE id = $1`,
      [created.id]
    );

    const res = await request(app)
      .get(`/api/admin/matchings/${created.id}`)
      .set("Cookie", admin.cookie);

    expect(res.status).toBe(200);
    expect(res.body.matching.rescheduleUsed).toBe(true);
    expect(res.body.matching.status).toBe("PENDING_MENTOR");
  });

  test("includes mentorProfile when mentor has one; null when none", async () => {
    const admin = await registerAdmin();
    const mentorWithProfile = await registerUser();
    const mentorWithoutProfile = await registerUser();
    const menteeA = await registerUser();
    const menteeB = await registerUser();

    await createMentorProfile(mentorWithProfile.cookie, {
      job: "Software Engineer",
      company: "QueenB",
      background: "Backend",
      techStack: ["Node.js"],
      yearsExperience: 3,
      topics: ["Mock Interview", "Tech Skills"],
      maxSessions: 4,
      sessionDuration: 45,
    });

    // Mentor users normally need a profile for the public create-matching API.
    // Insert a matching directly so we can assert mentorProfile: null safely.
    const withProfile = await createMatching(
      menteeA.cookie,
      mentorWithProfile.user.id
    );

    const inserted = await pool.query(
      `INSERT INTO matching (mentor_id, mentee_id, status)
       VALUES ($1, $2, 'PENDING_MENTOR')
       RETURNING *`,
      [mentorWithoutProfile.user.id, menteeB.user.id]
    );
    const withoutProfileMatching = inserted.rows[0];

    const withRes = await request(app)
      .get(`/api/admin/matchings/${withProfile.id}`)
      .set("Cookie", admin.cookie);

    expect(withRes.status).toBe(200);
    expect(withRes.body.matching.mentor.mentorProfile).toEqual(
      expect.objectContaining({
        userId: mentorWithProfile.user.id,
        job: "Software Engineer",
        company: "QueenB",
        background: "Backend",
        techStack: ["Node.js"],
        yearsExperience: 3,
        topics: ["Mock Interview", "Tech Skills"],
        maxSessions: 4,
        sessionDuration: 45,
        isActive: true,
      })
    );

    const withoutRes = await request(app)
      .get(`/api/admin/matchings/${withoutProfileMatching.id}`)
      .set("Cookie", admin.cookie);

    expect(withoutRes.status).toBe(200);
    expect(withoutRes.body.matching.mentor.mentorProfile).toBeNull();
  });

  test("feedback is explicitly null (no invented feedback data)", async () => {
    const admin = await registerAdmin();
    const mentor = await registerUser();
    const mentee = await registerUser();

    await createMentorProfile(mentor.cookie);
    const created = await createMatching(mentee.cookie, mentor.user.id);

    const res = await request(app)
      .get(`/api/admin/matchings/${created.id}`)
      .set("Cookie", admin.cookie);

    expect(res.status).toBe(200);
    expect(res.body.matching).toHaveProperty("feedback", null);
  });
});

describe("GET /api/admin/matchings/:id — slots", () => {
  test("returns all proposed slots without duplicates or unrelated matchings", async () => {
    const admin = await registerAdmin();
    const mentor = await registerUser();
    const mentee = await registerUser();
    const otherMentee = await registerUser();

    await createMentorProfile(mentor.cookie);
    const matching = await createMatching(mentee.cookie, mentor.user.id);
    const otherMatching = await createMatching(
      otherMentee.cookie,
      mentor.user.id
    );

    await pool.query(
      `UPDATE matching SET status = 'PENDING_MENTEE' WHERE id = $1`,
      [matching.id]
    );

    const slotA = await insertMatchingSlot(
      matching.id,
      new Date("2026-09-01T10:00:00.000Z"),
      new Date("2026-09-01T10:30:00.000Z")
    );
    const slotB = await insertMatchingSlot(
      matching.id,
      new Date("2026-09-01T11:00:00.000Z"),
      new Date("2026-09-01T11:30:00.000Z")
    );
    const slotC = await insertMatchingSlot(
      matching.id,
      new Date("2026-09-01T12:00:00.000Z"),
      new Date("2026-09-01T12:30:00.000Z")
    );
    const unrelatedSlot = await insertMatchingSlot(
      otherMatching.id,
      new Date("2026-09-02T10:00:00.000Z"),
      new Date("2026-09-02T10:30:00.000Z")
    );

    const selectRes = await request(app)
      .post(`/api/matching/${matching.id}/select-slot`)
      .set("Cookie", mentee.cookie)
      .send({ slotId: slotB.id });
    expect(selectRes.status).toBe(200);
    expect(selectRes.body.selected_slot_id).toBe(slotB.id);

    const res = await request(app)
      .get(`/api/admin/matchings/${matching.id}`)
      .set("Cookie", admin.cookie);

    expect(res.status).toBe(200);
    assertAdminMatchingDetail(res.body.matching);

    const { matching: detail } = res.body;
    expect(detail.status).toBe("MATCHED");
    expect(detail.slots).toHaveLength(3);

    const slotIds = detail.slots.map((s) => s.id);
    expect(slotIds).toEqual(
      expect.arrayContaining([slotA.id, slotB.id, slotC.id])
    );
    expect(new Set(slotIds).size).toBe(3);
    expect(slotIds).not.toContain(unrelatedSlot.id);

    // Chronological order by start_time.
    expect(slotIds).toEqual([slotA.id, slotB.id, slotC.id]);

    expect(detail.selectedSlot).toEqual(
      expect.objectContaining({
        id: slotB.id,
      })
    );
    expect(new Date(detail.selectedSlot.start).toISOString()).toBe(
      new Date(slotB.start_time).toISOString()
    );
    expect(new Date(detail.selectedSlot.end).toISOString()).toBe(
      new Date(slotB.end_time).toISOString()
    );

    const selectedFromList = detail.slots.find((s) => s.id === slotB.id);
    expect(selectedFromList.isSelected).toBe(true);
    expect(detail.slots.filter((s) => s.isSelected)).toHaveLength(1);
    expect(detail.selectedSlot.id).toBe(selectRes.body.selected_slot_id);
  });

  test("selectedSlot is null when slots exist but none selected", async () => {
    const admin = await registerAdmin();
    const mentor = await registerUser();
    const mentee = await registerUser();

    await createMentorProfile(mentor.cookie);
    const matching = await createMatching(mentee.cookie, mentor.user.id);

    await insertMatchingSlot(
      matching.id,
      new Date("2026-09-10T10:00:00.000Z"),
      new Date("2026-09-10T10:30:00.000Z")
    );
    await insertMatchingSlot(
      matching.id,
      new Date("2026-09-10T11:00:00.000Z"),
      new Date("2026-09-10T11:30:00.000Z")
    );

    const res = await request(app)
      .get(`/api/admin/matchings/${matching.id}`)
      .set("Cookie", admin.cookie);

    expect(res.status).toBe(200);
    expect(res.body.matching.selectedSlot).toBeNull();
    expect(res.body.matching.slots).toHaveLength(2);
    expect(res.body.matching.slots.every((s) => s.isSelected === false)).toBe(
      true
    );
  });
});
