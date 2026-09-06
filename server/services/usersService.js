const pool = require("../db");
const { users } = require("../data/usersData");

function getAllUsers() {
  // In a real application, this would fetch data from a database
  return users;
}

async function findById(id) {
  const result = await pool.query(
    `SELECT id, email, username, created_at
     FROM users
     WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

module.exports = {
  getAllUsers,
  findById,
};
