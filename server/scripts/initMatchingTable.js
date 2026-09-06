/**
 * Initializes the matching table for the Matching feature.
 * Run manually: node scripts/initMatchingTable.js
 * (from the server directory; requires .env with PostgreSQL credentials)
 */
require("dotenv").config();

const pool = require("../db");

const createMatchingTableSQL = `
-- selected_slot_id can reference matching_slots.id after that table exists
-- (see scripts/initMentorTables.js). FKs to users can be added later.
CREATE TABLE IF NOT EXISTS matching (
  id SERIAL PRIMARY KEY,
  mentor_id INTEGER NOT NULL,
  mentee_id INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING_MENTOR',
  selected_slot_id INTEGER NULL,
  more_times_requested BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE matching
ADD COLUMN IF NOT EXISTS more_times_requested BOOLEAN NOT NULL DEFAULT FALSE;`;

async function initMatchingTable() {
  try {
    await pool.query(createMatchingTableSQL);
    console.log("matching table is ready (created if it did not exist).");
  } catch (err) {
    console.error("Failed to initialize matching table:", err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

initMatchingTable();
