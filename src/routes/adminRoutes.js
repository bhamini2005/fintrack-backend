const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const pool = require("../config/db");

// ================= LOGIN =================

// Show login page
router.get("/login", (req, res) => {
  if (req.session.admin) {
    return res.redirect("/admin/dashboard");
  }

  res.render("admin-login", { layout: false });
});

// Handle login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const [users] = await pool.query(
    "SELECT * FROM users WHERE email = ? AND role = 'admin'",
    [email],
  );

  if (users.length === 0) {
    return res.send("Admin not found");
  }

  const admin = users[0];

  const isMatch = await bcrypt.compare(password, admin.password);

  if (!isMatch) {
    return res.send("Invalid password");
  }

  // ✅ Save session
  req.session.admin = {
    id: admin.id,
    email: admin.email,
  };

  req.session.save((err) => {

    if (err) {
      console.error("SESSION SAVE ERROR:", err);

      return res.redirect("/admin/login");
    }

    console.log("✅ Session Saved");

    res.redirect("/admin/dashboard");
  });
});

// ================= REGISTER ADMIN =================

// Show register page
router.get("/register", (req, res) => {

  res.render("admin-register", {
    layout: false,
  });

});

// Handle admin registration
router.post("/register", async (req, res) => {

  try {

    const {
      name,
      email,
      password,
    } = req.body;

    // Validation
    if (
      !name ||
      !email ||
      !password
    ) {
      return res.send(
        "All fields required"
      );
    }

    // Check existing admin
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {

      return res.send(
        "Email already exists"
      );
    }

    // Hash password
    const hashedPassword =
      await bcrypt.hash(password, 10);

    // Create admin
    await pool.query(
      `
      INSERT INTO users
      (name, email, password, role)
      VALUES (?, ?, ?, ?)
      `,
      [
        name,
        email,
        hashedPassword,
        "admin",
      ]
    );

    console.log(
      "✅ Admin Created:",
      email
    );

    res.redirect("/admin/login");

  } catch (err) {

    console.error(
      "ADMIN REGISTER ERROR:",
      err
    );

    res.send(
      "Error creating admin"
    );
  }

});

const adminAuth = require("../middleware/adminAuth");

// Protect everything AFTER login
router.use(adminAuth);

router.get("/", (req, res) => {
  if (req.session.admin) {
    return res.redirect("/admin/dashboard");
  }

  return res.redirect("/admin/login");
});

router.get("/dashboard", async (req, res) => {
  console.log("DASHBOARD ROUTE HIT");
  const [[userCount]] = await pool.query(
    "SELECT COUNT(*) as count FROM users"
  );

  const [[txnCount]] = await pool.query(
    "SELECT COUNT(*) as count FROM transactions"
  );

  res.render("dashboard", {
    users: userCount.count,
    transactions: txnCount.count,
    title: "Dashboard"
  });
});

router.get("/users", async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC",
    );

    res.render("users", { users });
  } catch (err) {
    console.error("Users fetch error:", err.message);
    res.send("Error loading users");
  }
});

router.post("/users/delete/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    await pool.query("DELETE FROM users WHERE id = ?", [userId]);

    res.redirect("/admin/users");
  } catch (err) {
    console.error("Delete user error:", err.message);
    res.send("Error deleting user");
  }
});

router.get("/transactions", async (req, res) => {
  try {
    const [transactions] = await pool.query(`
      SELECT t.*, u.name AS user_name 
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.txn_date DESC
    `);

    res.render("transactions", { transactions });
  } catch (err) {
    console.error("Transactions fetch error:", err.message);
    res.send("Error loading transactions");
  }
});

router.post("/transactions/delete/:id", async (req, res) => {
  await pool.query("DELETE FROM transactions WHERE id = ?", [req.params.id]);
  res.redirect("/admin/transactions");
});


// ================= Analytics =================
router.get("/analytics/summary", async (req, res) => {
  const [rows] = await pool.query(`
    SELECT type, SUM(amount) as total
    FROM transactions
    GROUP BY type
  `);

  res.json(rows);
});

router.get("/analytics/categories", async (req, res) => {
  const [rows] = await pool.query(`
    SELECT category_id, SUM(amount) as total
    FROM transactions
    WHERE type = 'expense'
    GROUP BY category_id
  `);

  res.json(rows);
});
router.get("/analytics/monthly", async (req, res) => {
  const [rows] = await pool.query(`
    SELECT DATE_FORMAT(txn_date, '%Y-%m') as month,
           SUM(amount) as total
    FROM transactions
    GROUP BY month
    ORDER BY month
  `);

  res.json(rows);
});


// ================= LOGOUT =================

router.get("/logout", (req, res) => {

  req.session.destroy((err) => {

    if (err) {
      return res.redirect("/admin/dashboard");
    }

    res.clearCookie("fintrack.sid");

    res.redirect("/admin/login");
  });
});

module.exports = router;
