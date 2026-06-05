const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3307,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

// Optional: small test function to verify
// async function testConnection() {
//   try {
//     const [rows] = await pool.query("SELECT 1 AS result");
//     console.log("MySQL connected ✅", rows[0]);
//   } catch (err) {
//     console.error("MySQL connection error ❌", err.message);
//   }
// }

// testConnection();

module.exports = pool;