// ======================================================
// AUTH CONTROLLER
// Handles:
// - Register
// - Login
// - Get Profile
// - Delete Account
// ======================================================

// ================= IMPORTS =================
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const pool = require("../config/db");

// ======================================================
// HELPER → Generate JWT Token
// ======================================================

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },

    process.env.JWT_SECRET,

    {
      expiresIn: "7d",
    }
  );
};

// ======================================================
// REGISTER USER
// ======================================================

const register = async (req, res) => {

  try {

    // ================= GET DATA =================
    const { name, email, password } = req.body;

    // Default role for normal users
    let role = "user";

    // Allow admins to create custom roles
    if (
      req.user &&
      req.user.role === "admin" &&
      req.body.role
    ) {
      role = req.body.role;
    }

    // ================= VALIDATION =================
    if (!name || !email || !password) {

      // Log failed attempt
      await pool.query(
        `
        INSERT INTO logs
        (action, email, ip_address)
        VALUES (?, ?, ?)
        `,
        [
          "REGISTER_FAILED",
          email || "NO_EMAIL",
          req.ip,
        ]
      );

      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // ================= CHECK EXISTING USER =================
    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {

      // Store duplicate email log
      await pool.query(
        `
        INSERT INTO logs
        (action, email, ip_address)
        VALUES (?, ?, ?)
        `,
        [
          "REGISTER_DUPLICATE_EMAIL",
          email,
          req.ip,
        ]
      );

      return res.status(400).json({
        message: "Email already exists",
      });
    }

    // ================= HASH PASSWORD =================
    const hashedPassword = await bcrypt.hash(password, 10);

    // ================= CREATE USER =================
    const [result] = await pool.query(
      `
      INSERT INTO users
      (name, email, password, role)
      VALUES (?, ?, ?, ?)
      `,
      [
        name,
        email,
        hashedPassword,
        role,
      ]
    );

    // ================= GENERATE TOKEN =================
    const token = generateToken({
      id: result.insertId,
      email,
      role,
    });

    // ================= STORE SUCCESS LOG =================
    await pool.query(
      `
      INSERT INTO logs
      (user_id, action, email, ip_address)
      VALUES (?, ?, ?, ?)
      `,
      [
        result.insertId,
        "REGISTER_SUCCESS",
        email,
        req.ip,
      ]
    );

    // ================= TERMINAL LOG =================
    console.log("✅ New User Registered");

    console.log({
      id: result.insertId,
      name,
      email,
      role,
      ip: req.ip,
      time: new Date(),
    });

    // ================= RESPONSE =================
    res.status(201).json({
      message: "User registered successfully",

      token,

      user: {
        id: result.insertId,
        name,
        email,
        role,
      },
    });

  } catch (err) {

    console.error("REGISTER ERROR:", err);

    // Store server error log
    await pool.query(
      `
      INSERT INTO logs
      (action, email, ip_address)
      VALUES (?, ?, ?)
      `,
      [
        "REGISTER_SERVER_ERROR",
        req.body.email || "UNKNOWN",
        req.ip,
      ]
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================================================
// LOGIN USER
// ======================================================

const login = async (req, res) => {

  try {

    // ================= GET DATA =================
    const { email, password } = req.body;

    // ================= VALIDATION =================
    if (!email || !password) {

      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // ================= FIND USER =================
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    // User not found
    if (rows.length === 0) {

      // Log failed login
      await pool.query(
        `
        INSERT INTO logs
        (action, email, ip_address)
        VALUES (?, ?, ?)
        `,
        [
          "LOGIN_FAILED_USER_NOT_FOUND",
          email,
          req.ip,
        ]
      );

      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const user = rows[0];

    // ================= PASSWORD CHECK =================
    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    // Wrong password
    if (!isMatch) {

      await pool.query(
        `
        INSERT INTO logs
        (user_id, action, email, ip_address)
        VALUES (?, ?, ?, ?)
        `,
        [
          user.id,
          "LOGIN_FAILED_WRONG_PASSWORD",
          email,
          req.ip,
        ]
      );

      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    // ================= GENERATE JWT =================
    const token = generateToken(user);

    // ================= STORE LOGIN LOG =================
    await pool.query(
      `
      INSERT INTO logs
      (user_id, action, email, ip_address)
      VALUES (?, ?, ?, ?)
      `,
      [
        user.id,
        "LOGIN_SUCCESS",
        email,
        req.ip,
      ]
    );

    // ================= TERMINAL LOG =================
    console.log("✅ User Logged In");

    console.log({
      id: user.id,
      email,
      role: user.role,
      ip: req.ip,
      time: new Date(),
    });

    // ================= RESPONSE =================
    res.json({
      message: "Login successful",

      token,

      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (err) {

    console.error("LOGIN ERROR:", err.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================================================
// GET CURRENT USER PROFILE
// ======================================================

const getProfile = async (req, res) => {

  try {

    const [rows] = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        role,
        created_at
      FROM users
      WHERE id = ?
      `,
      [req.user.id]
    );

    // User not found
    if (rows.length === 0) {

      return res.status(404).json({
        message: "User not found",
      });
    }

    // Send user data
    res.json({
      user: rows[0],
    });

  } catch (err) {

    console.error(
      "GET PROFILE ERROR:",
      err.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================================================
// DELETE ACCOUNT
// ======================================================

const deleteUser = async (req, res) => {

  try {

    const userId = req.user.id;

    // Delete user
    await pool.query(
      "DELETE FROM users WHERE id = ?",
      [userId]
    );

    // Store delete log
    await pool.query(
      `
      INSERT INTO logs
      (user_id, action, ip_address)
      VALUES (?, ?, ?)
      `,
      [
        userId,
        "ACCOUNT_DELETED",
        req.ip,
      ]
    );

    console.log("❌ Account Deleted:", userId);

    res.json({
      message: "Your account has been deleted",
    });

  } catch (err) {

    console.error(
      "DELETE USER ERROR:",
      err.message
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  register,
  login,
  getProfile,
  deleteUser,
};