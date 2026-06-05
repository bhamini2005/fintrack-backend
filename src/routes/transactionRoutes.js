const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
} = require("../controllers/transactionController");

// All routes protected
router.use(authMiddleware);

router.post("/", createTransaction);
router.get("/", getTransactions);
router.put("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);

router.get(
  "/recent",
  authMiddleware,
  async (req, res) => {

    try {

      const [transactions] = await pool.query(
        `
  SELECT
    id,
    type,
    amount,
    description,
    payment_method,
    txn_date,
    created_at
  FROM transactions
  WHERE user_id = ?
  ORDER BY created_at DESC
  LIMIT 5
  `,
        [req.user.id]
      );

      res.json({
        transactions,
      });

    } catch (err) {

      console.log(err);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);

module.exports = router;
