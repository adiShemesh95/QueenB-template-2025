const app = require("./app");
const pool = require("./db");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/api/health`);

  pool
    .query("SELECT NOW()")
    .then((result) => {
      console.log("PostgreSQL connected:", result.rows[0].now);
    })
    .catch((err) => {
      console.error("PostgreSQL connection error:", err.message);
    });
});