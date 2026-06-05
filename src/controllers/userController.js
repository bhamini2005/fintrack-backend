const pool = require("../config/db");

const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

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
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(rows[0]);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

const updateProfile = async (req, res) => {
  try {

    const userId = req.user.id;

    const { name, email } = req.body;

    await pool.query(
      `
      UPDATE users
      SET name = ?, email = ?
      WHERE id = ?
      `,
      [name, email, userId]
    );

    res.json({
      message: "Profile updated successfully",
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

const bcrypt = require("bcrypt");

const changePassword = async (req, res) => {
  try {

    const userId = req.user.id;

    const {
      currentPassword,
      newPassword,
    } = req.body;

    const [rows] = await pool.query(
      `
      SELECT password
      FROM users
      WHERE id = ?
      `,
      [userId]
    );

    const user = rows[0];

    const match =
      await bcrypt.compare(
        currentPassword,
        user.password
      );

    if (!match) {
      return res.status(400).json({
        message:
          "Current password is incorrect",
      });
    }

    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        10
      );

    await pool.query(
      `
      UPDATE users
      SET password = ?
      WHERE id = ?
      `,
      [hashedPassword, userId]
    );

    res.json({
      message:
        "Password updated successfully",
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
};