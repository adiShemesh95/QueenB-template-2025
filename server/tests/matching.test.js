const request = require("supertest");
const app = require("../app");
const pool = require("../db");

const createdEmails = [];
const createdUsernames = [];
const createdUserIds = [];

function uniqueId() {
  return `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function makeUser(overrides = {}) {
  const id = uniqueId();
  const user = {
    email: `jest_matching_${id}@example.com`,
    username: `jest_match_${id}`.slice(0, 50),
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

async function registerAuthenticatedUser() {
  const payload = makeUser();
  const res = await request(app).post("/api/auth/register").send(payload);
  expect(res.status).toBe(201);
  createdUserIds.push(res.body.user.id);
  return {
    payload,
    user: res.body.user,
    cookie: getCookieHeader(res),
  };
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

describe("POST /api/matching", () => {
  test("returns 401 without authentication", async () => {
    const res = await request(app)
      .post("/api/matching")
      .send({ mentorId: 1 });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  test("returns 400 for missing or invalid mentorId", async () => {
    const { cookie } = await registerAuthenticatedUser();

    const cases = [
      {},
      { mentorId: null },
      { mentorId: "abc" },
      { mentorId: 1.5 },
      { mentorId: 0 },
      { mentorId: -3 },
    ];

    for (const body of cases) {
      const res = await request(app)
        .post("/api/matching")
        .set("Cookie", cookie)
        .send(body);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Valid mentorId is required");
    }
  });

  test("returns 400 when mentee tries to match with themselves", async () => {
    const { user, cookie } = await registerAuthenticatedUser();

    const res = await request(app)
      .post("/api/matching")
      .set("Cookie", cookie)
      .send({ mentorId: user.id });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("You cannot request mentoring from yourself");
  });

  test("returns 404 when mentorId does not exist in users", async () => {
    const { cookie } = await registerAuthenticatedUser();
    const missingMentorId = 2_147_483_647;

    const res = await request(app)
      .post("/api/matching")
      .set("Cookie", cookie)
      .send({ mentorId: missingMentorId });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Mentor not found");
  });

  test("returns 201 and creates matching for authenticated mentee", async () => {
    const mentee = await registerAuthenticatedUser();
    const mentor = await registerAuthenticatedUser();

    const res = await request(app)
      .post("/api/matching")
      .set("Cookie", mentee.cookie)
      .send({ mentorId: mentor.user.id });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        mentee_id: mentee.user.id,
        mentor_id: mentor.user.id,
        status: "PENDING_MENTOR",
      })
    );
  });

  test("ignores menteeId in the request body", async () => {
    const mentee = await registerAuthenticatedUser();
    const mentor = await registerAuthenticatedUser();
    const other = await registerAuthenticatedUser();

    const res = await request(app)
      .post("/api/matching")
      .set("Cookie", mentee.cookie)
      .send({
        mentorId: mentor.user.id,
        menteeId: other.user.id,
      });

    expect(res.status).toBe(201);
    expect(res.body.mentee_id).toBe(mentee.user.id);
    expect(res.body.mentee_id).not.toBe(other.user.id);
    expect(res.body.mentor_id).toBe(mentor.user.id);
  });

  test("returns 409 when an active matching already exists", async () => {
    const mentee = await registerAuthenticatedUser();
    const mentor = await registerAuthenticatedUser();

    const first = await request(app)
      .post("/api/matching")
      .set("Cookie", mentee.cookie)
      .send({ mentorId: mentor.user.id });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post("/api/matching")
      .set("Cookie", mentee.cookie)
      .send({ mentorId: mentor.user.id });

    expect(second.status).toBe(409);
    expect(second.body.error).toBe(
      "An active matching request with this mentor already exists"
    );
  });

  test("returns 409 when an existing matching is PENDING_MENTEE", async () => {
    const mentee = await registerAuthenticatedUser();
    const mentor = await registerAuthenticatedUser();

    const first = await request(app)
      .post("/api/matching")
      .set("Cookie", mentee.cookie)
      .send({ mentorId: mentor.user.id });
    expect(first.status).toBe(201);

    await pool.query(
      `UPDATE matching
       SET status = 'PENDING_MENTEE'
       WHERE id = $1`,
      [first.body.id]
    );

    const second = await request(app)
      .post("/api/matching")
      .set("Cookie", mentee.cookie)
      .send({ mentorId: mentor.user.id });

    expect(second.status).toBe(409);
    expect(second.body.error).toBe(
      "An active matching request with this mentor already exists"
    );
  });

  test("returns 409 when an existing matching is MATCHED", async () => {
    const mentee = await registerAuthenticatedUser();
    const mentor = await registerAuthenticatedUser();

    const first = await request(app)
      .post("/api/matching")
      .set("Cookie", mentee.cookie)
      .send({ mentorId: mentor.user.id });
    expect(first.status).toBe(201);

    await pool.query(
      `UPDATE matching
       SET status = 'MATCHED'
       WHERE id = $1`,
      [first.body.id]
    );

    const second = await request(app)
      .post("/api/matching")
      .set("Cookie", mentee.cookie)
      .send({ mentorId: mentor.user.id });

    expect(second.status).toBe(409);
    expect(second.body.error).toBe(
      "An active matching request with this mentor already exists"
    );
  });

  test("allows a new request when the previous matching is REJECTED", async () => {
    const mentee = await registerAuthenticatedUser();
    const mentor = await registerAuthenticatedUser();

    const first = await request(app)
      .post("/api/matching")
      .set("Cookie", mentee.cookie)
      .send({ mentorId: mentor.user.id });
    expect(first.status).toBe(201);

    await pool.query(
      `UPDATE matching
       SET status = 'REJECTED',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [first.body.id]
    );

    const second = await request(app)
      .post("/api/matching")
      .set("Cookie", mentee.cookie)
      .send({ mentorId: mentor.user.id });

    expect(second.status).toBe(201);
    expect(second.body.id).not.toBe(first.body.id);
    expect(second.body).toEqual(
      expect.objectContaining({
        mentee_id: mentee.user.id,
        mentor_id: mentor.user.id,
        status: "PENDING_MENTOR",
      })
    );
  });
});

describe("GET /api/matching", () => {
  test("returns 401 without authentication", async () => {
    const res = await request(app).get("/api/matching");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  test("returns 200 with an empty array when mentee has no requests", async () => {
    const { cookie } = await registerAuthenticatedUser();

    const res = await request(app)
      .get("/api/matching")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("returns only the authenticated mentee's rows", async () => {
    const mentee = await registerAuthenticatedUser();
    const otherMentee = await registerAuthenticatedUser();
    const mentorA = await registerAuthenticatedUser();
    const mentorB = await registerAuthenticatedUser();

    const own = await request(app)
      .post("/api/matching")
      .set("Cookie", mentee.cookie)
      .send({ mentorId: mentorA.user.id });
    expect(own.status).toBe(201);

    const other = await request(app)
      .post("/api/matching")
      .set("Cookie", otherMentee.cookie)
      .send({ mentorId: mentorB.user.id });
    expect(other.status).toBe(201);

    const res = await request(app)
      .get("/api/matching")
      .set("Cookie", mentee.cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].id).toBe(own.body.id);
    expect(res.body[0].mentee_id).toBe(mentee.user.id);
    expect(res.body.every((row) => row.mentee_id === mentee.user.id)).toBe(
      true
    );
    expect(res.body.some((row) => row.id === other.body.id)).toBe(false);
    expect(
      res.body.some((row) => row.mentee_id === otherMentee.user.id)
    ).toBe(false);
  });

  test("returns rows ordered by created_at DESC", async () => {
    const mentee = await registerAuthenticatedUser();
    const mentorOldest = await registerAuthenticatedUser();
    const mentorMiddle = await registerAuthenticatedUser();
    const mentorNewest = await registerAuthenticatedUser();

    const oldest = await request(app)
      .post("/api/matching")
      .set("Cookie", mentee.cookie)
      .send({ mentorId: mentorOldest.user.id });
    const middle = await request(app)
      .post("/api/matching")
      .set("Cookie", mentee.cookie)
      .send({ mentorId: mentorMiddle.user.id });
    const newest = await request(app)
      .post("/api/matching")
      .set("Cookie", mentee.cookie)
      .send({ mentorId: mentorNewest.user.id });

    expect(oldest.status).toBe(201);
    expect(middle.status).toBe(201);
    expect(newest.status).toBe(201);

    await pool.query(
      `UPDATE matching SET created_at = $2 WHERE id = $1`,
      [oldest.body.id, new Date("2026-01-01T10:00:00.000Z")]
    );
    await pool.query(
      `UPDATE matching SET created_at = $2 WHERE id = $1`,
      [middle.body.id, new Date("2026-01-02T10:00:00.000Z")]
    );
    await pool.query(
      `UPDATE matching SET created_at = $2 WHERE id = $1`,
      [newest.body.id, new Date("2026-01-03T10:00:00.000Z")]
    );

    const res = await request(app)
      .get("/api/matching")
      .set("Cookie", mentee.cookie);

    expect(res.status).toBe(200);
    expect(res.body.map((row) => row.id)).toEqual([
      newest.body.id,
      middle.body.id,
      oldest.body.id,
    ]);
  });
});

describe("GET /api/matching/:id", () => {
  test("returns 401 without authentication", async () => {
    const res = await request(app).get("/api/matching/1");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  test("returns 400 for invalid matching id", async () => {
    const { cookie } = await registerAuthenticatedUser();

    const cases = ["abc", "1.5", "0", "-3"];

    for (const id of cases) {
      const res = await request(app)
        .get(`/api/matching/${id}`)
        .set("Cookie", cookie);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Valid matching id is required");
    }
  });

  test("returns 200 when the matching belongs to the authenticated mentee", async () => {
    const mentee = await registerAuthenticatedUser();
    const mentor = await registerAuthenticatedUser();

    const created = await request(app)
      .post("/api/matching")
      .set("Cookie", mentee.cookie)
      .send({ mentorId: mentor.user.id });
    expect(created.status).toBe(201);

    const res = await request(app)
      .get(`/api/matching/${created.body.id}`)
      .set("Cookie", mentee.cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        id: created.body.id,
        mentee_id: mentee.user.id,
        mentor_id: mentor.user.id,
        status: "PENDING_MENTOR",
      })
    );
  });

  test("returns 404 when the matching does not exist", async () => {
    const { cookie } = await registerAuthenticatedUser();
    const missingId = 2_147_483_647;

    const res = await request(app)
      .get(`/api/matching/${missingId}`)
      .set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Matching not found");
  });

  test("returns 404 when the matching belongs to another mentee", async () => {
    const owner = await registerAuthenticatedUser();
    const otherMentee = await registerAuthenticatedUser();
    const mentor = await registerAuthenticatedUser();

    const created = await request(app)
      .post("/api/matching")
      .set("Cookie", owner.cookie)
      .send({ mentorId: mentor.user.id });
    expect(created.status).toBe(201);

    const res = await request(app)
      .get(`/api/matching/${created.body.id}`)
      .set("Cookie", otherMentee.cookie);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Matching not found");
  });
});

describe("POST /api/matching/:id/request-more-times", () => {
  async function createMatchingFor(mentee, mentorId) {
    const created = await request(app)
      .post("/api/matching")
      .set("Cookie", mentee.cookie)
      .send({ mentorId });
    expect(created.status).toBe(201);
    return created.body;
  }

  test("returns 401 without authentication", async () => {
    const res = await request(app).post("/api/matching/1/request-more-times");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  test("returns 400 for invalid matching id", async () => {
    const { cookie } = await registerAuthenticatedUser();
    const cases = ["abc", "1.5", "0", "-3"];

    for (const id of cases) {
      const res = await request(app)
        .post(`/api/matching/${id}/request-more-times`)
        .set("Cookie", cookie);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Valid matching id is required");
    }
  });

  test("returns 404 when the matching does not exist", async () => {
    const { cookie } = await registerAuthenticatedUser();
    const missingId = 2_147_483_647;

    const res = await request(app)
      .post(`/api/matching/${missingId}/request-more-times`)
      .set("Cookie", cookie);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Matching not found");
  });

  test("returns 404 when the matching belongs to another mentee", async () => {
    const owner = await registerAuthenticatedUser();
    const otherMentee = await registerAuthenticatedUser();
    const mentor = await registerAuthenticatedUser();
    const matching = await createMatchingFor(owner, mentor.user.id);

    await pool.query(
      `UPDATE matching
       SET status = 'PENDING_MENTEE',
           more_times_requested = false
       WHERE id = $1`,
      [matching.id]
    );

    const res = await request(app)
      .post(`/api/matching/${matching.id}/request-more-times`)
      .set("Cookie", otherMentee.cookie);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Matching not found");
  });

  test("returns 400 when status is not PENDING_MENTEE", async () => {
    const mentee = await registerAuthenticatedUser();
    const mentor = await registerAuthenticatedUser();
    const matching = await createMatchingFor(mentee, mentor.user.id);

    expect(matching.status).toBe("PENDING_MENTOR");

    const res = await request(app)
      .post(`/api/matching/${matching.id}/request-more-times`)
      .set("Cookie", mentee.cookie);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe(
      "Additional times can only be requested while status is PENDING_MENTEE"
    );
  });

  test("returns 409 when more_times_requested is already true", async () => {
    const mentee = await registerAuthenticatedUser();
    const mentor = await registerAuthenticatedUser();
    const matching = await createMatchingFor(mentee, mentor.user.id);

    await pool.query(
      `UPDATE matching
       SET status = 'PENDING_MENTEE',
           more_times_requested = true
       WHERE id = $1`,
      [matching.id]
    );

    const res = await request(app)
      .post(`/api/matching/${matching.id}/request-more-times`)
      .set("Cookie", mentee.cookie);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe(
      "Additional times were already requested for this matching"
    );
  });

  test("returns 200 and updates matching when status is PENDING_MENTEE", async () => {
    const mentee = await registerAuthenticatedUser();
    const mentor = await registerAuthenticatedUser();
    const matching = await createMatchingFor(mentee, mentor.user.id);

    await pool.query(
      `UPDATE matching
       SET status = 'PENDING_MENTEE',
           more_times_requested = false
       WHERE id = $1`,
      [matching.id]
    );

    const res = await request(app)
      .post(`/api/matching/${matching.id}/request-more-times`)
      .set("Cookie", mentee.cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        id: matching.id,
        mentee_id: mentee.user.id,
        mentor_id: mentor.user.id,
        more_times_requested: true,
        status: "PENDING_MENTOR",
      })
    );
  });
});
