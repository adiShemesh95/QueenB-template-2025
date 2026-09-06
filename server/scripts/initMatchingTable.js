/**
 * Initializes the matching table for the Matching feature.
 * Run manually: node scripts/initMatchingTable.js
 * (from the server directory; requires .env with PostgreSQL credentials)
 */
require("dotenv").config();

const pool = require("../db");

const createMatchingTableSQL = `
-- TODO: Add foreign key once related table exists locally:
--   selected_slot_id -> matching_slots.id
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
ADD COLUMN IF NOT EXISTS more_times_requested BOOLEAN NOT NULL DEFAULT FALSE;
`;

const addForeignKeyIfMissingSQL = `
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'matching_mentor_id_fkey'
      AND conrelid = 'matching'::regclass
  ) THEN
    ALTER TABLE matching
      ADD CONSTRAINT matching_mentor_id_fkey
      FOREIGN KEY (mentor_id) REFERENCES users (id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'matching_mentee_id_fkey'
      AND conrelid = 'matching'::regclass
  ) THEN
    ALTER TABLE matching
      ADD CONSTRAINT matching_mentee_id_fkey
      FOREIGN KEY (mentee_id) REFERENCES users (id);
  END IF;
END $$;
`;

async function initMatchingTable() {
  try {
    await pool.query(createMatchingTableSQL);
    await pool.query(addForeignKeyIfMissingSQL);
    console.log("matching table is ready (created if it did not exist).");
  } catch (err) {
    console.error("Failed to initialize matching table:", err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

initMatchingTable();
