const express = require("express");

const router = express.Router();

const authMiddleware =
  require("../middleware/authMiddleware");

const pool = require("../config/db");

// ================= SUMMARY =================

router.get(
  "/summary",
  authMiddleware,
  async (req, res) => {

    try {

      const userId = req.user.id;

      // Income
      const [[incomeResult]] =
        await pool.query(
          `
          SELECT SUM(amount) AS total
          FROM transactions
          WHERE user_id = ?
          AND type = 'income'
          `,
          [userId]
        );

      // Expense
      const [[expenseResult]] =
        await pool.query(
          `
          SELECT SUM(amount) AS total
          FROM transactions
          WHERE user_id = ?
          AND type = 'expense'
          `,
          [userId]
        );

      const income =
        Number(incomeResult.total) || 0;

      const expense =
        Number(expenseResult.total) || 0;

      const balance =
        income - expense;

      res.json({
        income,
        expense,
        balance,
      });

    } catch (err) {

      console.log(
        "SUMMARY ERROR:",
        err
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

// ================= RECENT TRANSACTIONS =================

router.get(
  "/recent",
  authMiddleware,
  async (req, res) => {

    try {

      const [transactions] =
        await pool.query(
          `
          SELECT
            id,
            type,
            amount,
            description,
            payment_method,
            txn_date
          FROM transactions
          WHERE user_id = ?
          ORDER BY txn_date DESC
          LIMIT 5
          `,
          [req.user.id]
        );

      res.json(transactions);

    } catch (err) {

      console.log(
        "TRANSACTION ERROR:",
        err
      );

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

module.exports = router;