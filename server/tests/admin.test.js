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
