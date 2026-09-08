/**
 * DEVELOPMENT / QA ONLY — remove Admin QA seed data.
 *
 * Deletes ONLY records created/owned by QA identifiers:
 *   usernames matching qa_% AND emails ending with @queenb.test
 *
 * Safety:
 * - Run intentionally from CLI only
 * - Refuses NODE_ENV=production
 * - Does not truncate tables
 * - Does not delete non-QA users or their matchings
 * - Safe to run repeatedly
 *
 * Usage (from server/):
 *   npm run cleanup:admin-qa
 *   node scripts/cleanupAdminQaData.js
 */

require("dotenv").config();

const pool = require("../db");

const QA_EMAIL_DOMAIN = "@queenb.test";

function assertNotProduction() {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Refusing to cleanup Admin QA data: NODE_ENV=production. DEVELOPMENT / QA ONLY."
    );
  }
}

async function cleanup() {
  assertNotProduction();

  console.log("=== Admin QA cleanup (DEVELOPMENT / QA ONLY) ===");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1) Slots for QA-only matchings (also cascaded by matching delete, but
    //    clear selected_slot_id first to satisfy matching_selected_slot_id_fkey).
    await client.query(
      `UPDATE matching m
       SET selected_slot_id = NULL
       FROM users mentor_u, users mentee_u
       WHERE mentor_u.id = m.mentor_id
         AND mentee_u.id = m.mentee_id
         AND mentor_u.username LIKE 'qa\\_%' ESCAPE '\\'
         AND mentee_u.username LIKE 'qa\\_%' ESCAPE '\\'
         AND mentor_u.email LIKE $1
         AND mentee_u.email LIKE $1`,
      [`%${QA_EMAIL_DOMAIN}`]
    );

    const matchings = await client.query(
      `DELETE FROM matching m
       USING users mentor_u, users mentee_u
       WHERE mentor_u.id = m.mentor_id
         AND mentee_u.id = m.mentee_id
         AND mentor_u.username LIKE 'qa\\_%' ESCAPE '\\'
         AND mentee_u.username LIKE 'qa\\_%' ESCAPE '\\'
         AND mentor_u.email LIKE $1
         AND mentee_u.email LIKE $1
       RETURNING m.id`,
      [`%${QA_EMAIL_DOMAIN}`]
    );

    const profiles = await client.query(
      `DELETE FROM mentor_profiles mp
       USING users u
       WHERE u.id = mp.user_id
         AND u.username LIKE 'qa\\_%' ESCAPE '\\'
         AND u.email LIKE $1
       RETURNING mp.id`,
      [`%${QA_EMAIL_DOMAIN}`]
    );

    const users = await client.query(
      `DELETE FROM users
       WHERE username LIKE 'qa\\_%' ESCAPE '\\'
         AND email LIKE $1
       RETURNING id, username`,
      [`%${QA_EMAIL_DOMAIN}`]
    );

    await client.query("COMMIT");

    console.log(`Deleted QA matchings: ${matchings.rowCount}`);
    console.log(`Deleted QA mentor profiles: ${profiles.rowCount}`);
    console.log(`Deleted QA users: ${users.rowCount}`);
    if (users.rows.length) {
      console.log(
        "Removed usernames:",
        users.rows.map((r) => r.username).join(", ")
      );
    }
    console.log("Admin QA cleanup complete.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Admin QA cleanup failed:", err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

cleanup();
