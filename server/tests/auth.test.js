const request = require("supertest");
const app = require("../app");
const pool = require("../db");
const { COOKIE_NAME } = require("../utils/cookies");

const createdEmails = [];
const createdUsernames = [];

function uniqueId() {
  return `${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

function makeUser(overrides = {}) {
  const id = uniqueId();
  const user = {
    email: `jest_auth_${id}@example.com`,
    username: `jest_auth_${id}`.slice(0, 50),
    password: "Password1!",
    confirmPassword: "Password1!",
    ...overrides,
  };
  createdEmails.push(user.email.toLowerCase().trim());
  createdUsernames.push(user.username.trim());
  return user;
}

function getCookieValue(res, name) {
  const raw = res.headers["set-cookie"];
  if (!raw) return null;
  const cookies = Array.isArray(raw) ? raw : [raw];
  const match = cookies.find((c) => c.startsWith(`${name}=`));
  if (!match) return null;
  return match.split(";")[0].split("=").slice(1).join("=");
}

function cookieWasCleared(res, name) {
  const raw = res.headers["set-cookie"];
  if (!raw) return false;
  const cookies = Array.isArray(raw) ? raw : [raw];
  const match = cookies.find((c) => c.startsWith(`${name}=`));
  if (!match) return false;
  return (
    /Max-Age=0/i.test(match) ||
    /Expires=Thu, 01 Jan 1970/i.test(match) ||
    new RegExp(`^${name}=;`).test(match)
  );
}

function assertSafeUser(user) {
  expect(user).toEqual(
    expect.objectContaining({
      id: expect.any(Number),
      email: expect.any(String),
      username: expect.any(String),
      createdAt: expect.anything(),
    })
  );
  expect(user).not.toHaveProperty("password_hash");
  expect(user).not.toHaveProperty("password");
  expect(JSON.stringify(user)).not.toMatch(/password_hash/i);
}

beforeAll(() => {
  require("dotenv").config();
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET must be set in server/.env for tests");
  }
});

afterAll(async () => {
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

describe("POST /api/auth/register", () => {
  test("valid registration returns 201 and safe user", async () => {
    const payload = makeUser();
    const res = await request(app).post("/api/auth/register").send(payload);

    expect(res.status).toBe(201);
    assertSafeUser(res.body.user);
    expect(res.body.user.email).toBe(payload.email.toLowerCase());
    expect(getCookieValue(res, COOKIE_NAME)).toBeTruthy();
    expect(JSON.stringify(res.body)).not.toMatch(/password_hash/i);
  });

  test("duplicate email returns 409 EMAIL_TAKEN", async () => {
    const first = makeUser();
    await request(app).post("/api/auth/register").send(first);

    const second = makeUser({
      email: first.email,
      username: `jest_auth_u_${uniqueId()}`.slice(0, 50),
    });
    const res = await request(app).post("/api/auth/register").send(second);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("EMAIL_TAKEN");
  });

  test("duplicate username returns 409 USERNAME_TAKEN", async () => {
    const first = makeUser();
    await request(app).post("/api/auth/register").send(first);

    const second = makeUser({
      email: `jest_auth_other_${uniqueId()}@example.com`,
      username: first.username,
    });
    const res = await request(app).post("/api/auth/register").send(second);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("USERNAME_TAKEN");
  });

  test("invalid email returns 400 VALIDATION_ERROR", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(makeUser({ email: "not-an-email" }));

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("invalid username returns 400", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(makeUser({ username: "bad name!" }));

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("short password returns 400", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(makeUser({ password: "short", confirmPassword: "short" }));

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("password longer than 72 UTF-8 bytes returns 400", async () => {
    const longPassword = "é".repeat(40); // 80 bytes in UTF-8
    const res = await request(app)
      .post("/api/auth/register")
      .send(
        makeUser({
          password: longPassword,
          confirmPassword: longPassword,
        })
      );

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  test("mismatched confirmation returns 400", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(makeUser({ confirmPassword: "Different1!" }));

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("POST /api/auth/login", () => {
  test("valid credentials return 200 and set cookie", async () => {
    const payload = makeUser();
    await request(app).post("/api/auth/register").send(payload);

    const res = await request(app).post("/api/auth/login").send({
      email: payload.email,
      password: payload.password,
    });

    expect(res.status).toBe(200);
    assertSafeUser(res.body.user);
    expect(getCookieValue(res, COOKIE_NAME)).toBeTruthy();
  });

  test("trimmed/case-normalized email works", async () => {
    const payload = makeUser({ email: `Jest_Auth_Case_${uniqueId()}@Example.COM` });
    createdEmails.push(payload.email.trim().toLowerCase());
    await request(app).post("/api/auth/register").send(payload);

    const res = await request(app).post("/api/auth/login").send({
      email: `  ${payload.email.toUpperCase()}  `,
      password: payload.password,
    });

    expect(res.status).toBe(200);
    assertSafeUser(res.body.user);
  });

  test("wrong password and unknown email return identical INVALID_CREDENTIALS", async () => {
    const payload = makeUser();
    await request(app).post("/api/auth/register").send(payload);

    const wrongPassword = await request(app).post("/api/auth/login").send({
      email: payload.email,
      password: "WrongPass999!",
    });
    const unknownEmail = await request(app).post("/api/auth/login").send({
      email: `unknown_${uniqueId()}@example.com`,
      password: payload.password,
    });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.error.code).toBe("INVALID_CREDENTIALS");
    expect(unknownEmail.body.error.code).toBe("INVALID_CREDENTIALS");
    expect(wrongPassword.body).toEqual(unknownEmail.body);
  });
});

describe("GET /api/users/me", () => {
  test("valid cookie returns 200 safe user", async () => {
    const payload = makeUser();
    const registerRes = await request(app)
      .post("/api/auth/register")
      .send(payload);
    const cookie = registerRes.headers["set-cookie"];

    const res = await request(app).get("/api/users/me").set("Cookie", cookie);

    expect(res.status).toBe(200);
    assertSafeUser(res.body.user);
  });

  test("missing cookie returns 401 UNAUTHORIZED", async () => {
    const res = await request(app).get("/api/users/me");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  test("invalid token returns 401 UNAUTHORIZED", async () => {
    const res = await request(app)
      .get("/api/users/me")
      .set("Cookie", `${COOKIE_NAME}=invalid.token.value`);

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });
});

describe("POST /api/auth/logout", () => {
  test("logged-in logout returns 200 and clears cookie", async () => {
    const payload = makeUser();
    const registerRes = await request(app)
      .post("/api/auth/register")
      .send(payload);
    const cookie = registerRes.headers["set-cookie"];

    const res = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", cookie);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Logged out" });
    expect(cookieWasCleared(res, COOKIE_NAME)).toBe(true);
  });

  test("second logout still returns 200", async () => {
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ message: "Logged out" });
  });
});

describe("Security and error handling", () => {
  test("malformed JSON returns safe 400 VALIDATION_ERROR", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send('{"email":');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(JSON.stringify(res.body)).not.toMatch(/JWT_SECRET|password_hash|stack/i);
  });

  test("error responses never include secrets or hashes", async () => {
    const res = await request(app).post("/api/auth/register").send({});
    expect(res.status).toBe(400);
    const body = JSON.stringify(res.body);
    expect(body).not.toMatch(/JWT_SECRET/i);
    expect(body).not.toMatch(/password_hash/i);
    expect(body).not.toMatch(/Bearer /i);
  });
});
