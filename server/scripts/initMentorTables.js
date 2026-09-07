/**
 * Initializes mentor_profiles and matching_slots tables.
 * Run manually: node scripts/initMentorTables.js
 * (from the server directory; requires .env with PostgreSQL credentials)
 *
 * Prerequisites: users + matching tables must already exist.
 */
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const pool = require("../db");

const migrationsDir = path.join(__dirname, "../db/migrations");
const migrationFiles = [
  "002_create_mentor_profiles.sql",
  "003_create_matching_slots.sql",
];

async function initMentorTables() {
  try {
    for (const file of migrationFiles) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      await pool.query(sql);
      console.log(`${file} applied.`);
    }
    console.log("mentor_profiles and matching_slots tables are ready.");
  } catch (err) {
    console.error("Failed to initialize mentor tables:", err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

initMentorTables();
