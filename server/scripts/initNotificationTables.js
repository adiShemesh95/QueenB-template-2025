/**
 * Initializes notifications + meeting_feedback tables.
 * Run: npm run db:init-notifications  (from server/)
 */
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const pool = require("../db");

const migrationsDir = path.join(__dirname, "../db/migrations");
const migrationFiles = [
  "006_create_notifications.sql",
  "007_create_meeting_feedback.sql",
];

async function initNotificationTables() {
  try {
    for (const file of migrationFiles) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      await pool.query(sql);
      console.log(`${file} applied.`);
    }
    console.log("notifications and meeting_feedback tables are ready.");
  } catch (err) {
    console.error("Failed to initialize notification tables:", err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

initNotificationTables();
