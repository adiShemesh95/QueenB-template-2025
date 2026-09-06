const pool = require("../db");
const { hashPassword, comparePassword } = require("../utils/password");
const { signToken } = require("../utils/token");
const {
  validationError,
  invalidCredentialsError,
  emailTakenError,
  usernameTakenError,
} = require("../utils/errors");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_BYTES = 72;

function toPublicUser(row) {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    createdAt: row.created_at,
  };
}

function isBlank(value) {
  return value === undefined || value === null || String(value).trim() === "";
}

function validateEmailFormat(email) {
  return EMAIL_REGEX.test(email);
}

function validateRegisterInput(body) {
  const details = [];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return validationError("Invalid request body.", [
      { field: "body", message: "Request body must be a JSON object." },
    ]);
  }

  const rawEmail = body.email;
  const rawUsername = body.username;
  const password = body.password;
  const confirmPassword = body.confirmPassword;

  if (isBlank(rawEmail)) {
    details.push({ field: "email", message: "Email is required." });
  }
  if (isBlank(rawUsername)) {
    details.push({ field: "username", message: "Username is required." });
  }
  if (password === undefined || password === null || password === "") {
    details.push({ field: "password", message: "Password is required." });
  }
  if (
    confirmPassword === undefined ||
    confirmPassword === null ||
    confirmPassword === ""
  ) {
    details.push({
      field: "confirmPassword",
      message: "Password confirmation is required.",
    });
  }

  if (details.length > 0) {
    return validationError("Please fix the highlighted fields.", details);
  }

  const email = String(rawEmail).trim().toLowerCase();
  const username = String(rawUsername).trim();

  if (!validateEmailFormat(email)) {
    details.push({ field: "email", message: "Invalid email address." });
  }

  if (username.length < 3 || username.length > 50) {
    details.push({
      field: "username",
      message: "Username must be between 3 and 50 characters.",
    });
  } else if (!USERNAME_REGEX.test(username)) {
    details.push({
      field: "username",
      message: "Username may only contain letters, numbers, and underscores.",
    });
  }

  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    details.push({
      field: "password",
      message: "Password must be at least 8 characters.",
    });
  } else if (Buffer.byteLength(password, "utf8") > MAX_PASSWORD_BYTES) {
    details.push({
      field: "password",
      message: "Password is too long.",
    });
  }

  if (password !== confirmPassword) {
    details.push({
      field: "confirmPassword",
      message: "Passwords do not match.",
    });
  }

  if (details.length > 0) {
    return validationError("Please fix the highlighted fields.", details);
  }

  return { email, username, password };
}

function validateLoginInput(body) {
  const details = [];

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return validationError("Invalid request body.", [
      { field: "body", message: "Request body must be a JSON object." },
    ]);
  }

  const rawEmail = body.email;
  const password = body.password;

  if (isBlank(rawEmail)) {
    details.push({ field: "email", message: "Email is required." });
  }
  if (password === undefined || password === null || password === "") {
    details.push({ field: "password", message: "Password is required." });
  }

  if (details.length > 0) {
    return validationError("Please fix the highlighted fields.", details);
  }

  const email = String(rawEmail).trim().toLowerCase();

  if (!validateEmailFormat(email)) {
    details.push({ field: "email", message: "Invalid email address." });
  }

  if (details.length > 0) {
    return validationError("Please fix the highlighted fields.", details);
  }

  return { email, password };
}

async function findUserByEmail(email) {
  const result = await pool.query(
    `SELECT id, email, username, password_hash, created_at
     FROM users
     WHERE email = $1`,
    [email]
  );
  return result.rows[0] || null;
}

async function findUserByUsername(username) {
  const result = await pool.query(
    `SELECT id FROM users WHERE username = $1`,
    [username]
  );
  return result.rows[0] || null;
}

async function register(body) {
  const validated = validateRegisterInput(body);
  if (validated.error) {
    return { status: 400, body: validated };
  }

  const { email, username, password } = validated;

  const existingEmail = await findUserByEmail(email);
  if (existingEmail) {
    return { status: 409, body: emailTakenError() };
  }

  const existingUsername = await findUserByUsername(username);
  if (existingUsername) {
    return { status: 409, body: usernameTakenError() };
  }

  const passwordHash = await hashPassword(password);

  let result;
  try {
    result = await pool.query(
      `INSERT INTO users (email, username, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, email, username, created_at`,
      [email, username, passwordHash]
    );
  } catch (err) {
    if (err.code === "23505") {
      if (err.constraint === "users_email_unique" || /email/i.test(err.detail || "")) {
        return { status: 409, body: emailTakenError() };
      }
      if (
        err.constraint === "users_username_unique" ||
        /username/i.test(err.detail || "")
      ) {
        return { status: 409, body: usernameTakenError() };
      }
      return { status: 409, body: emailTakenError() };
    }
    throw err;
  }

  const user = toPublicUser(result.rows[0]);
  const token = signToken(user.id);

  return { status: 201, user, token };
}

async function login(body) {
  const validated = validateLoginInput(body);
  if (validated.error) {
    return { status: 400, body: validated };
  }

  const { email, password } = validated;
  const credentialsError = {
    status: 401,
    body: invalidCredentialsError(),
  };

  const userRow = await findUserByEmail(email);
  if (!userRow) {
    return credentialsError;
  }

  const passwordMatches = await comparePassword(password, userRow.password_hash);
  if (!passwordMatches) {
    return credentialsError;
  }

  const user = toPublicUser(userRow);
  const token = signToken(user.id);

  return { status: 200, user, token };
}

module.exports = {
  register,
  login,
  toPublicUser,
};
