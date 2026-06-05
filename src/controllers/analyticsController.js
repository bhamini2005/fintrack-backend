const pool = require("../config/db");

const getAnalytics = async (req, res) => {
    try {
        const userId = req.user.id;

        // ================= SUMMARY =================

        const [[incomeRow]] = await pool.query(
            `
      SELECT COALESCE(SUM(amount),0) as total
      FROM transactions
      WHERE user_id = ?
      AND type = 'income'
    `,
            [userId]
        );

        const [[expenseRow]] = await pool.query(
            `
      SELECT COALESCE(SUM(amount),0) as total
      FROM transactions
      WHERE user_id = ?
      AND type = 'expense'
    `,
            [userId]
        );

        const [[txnCount]] = await pool.query(
            `
      SELECT COUNT(*) as total
      FROM transactions
      WHERE user_id = ?
    `,
            [userId]
        );

        const income = Number(incomeRow.total);
        const expense = Number(expenseRow.total);

        // ================= MONTHLY =================

        const [monthly] = await pool.query(
            `
 SELECT
  YEAR(txn_date) as year,
  MONTH(txn_date) as month,

  SUM(
    CASE
      WHEN type='income'
      THEN amount
      ELSE 0
    END
  ) as income,

  SUM(
    CASE
      WHEN type='expense'
      THEN amount
      ELSE 0
    END
  ) as expense

FROM transactions

WHERE user_id = ?
AND txn_date >= DATE_SUB(
  CURDATE(),
  INTERVAL 6 MONTH
)

GROUP BY
YEAR(txn_date),
MONTH(txn_date)

ORDER BY
YEAR(txn_date),
MONTH(txn_date)
`,
            [userId]
        );

        // ================= CATEGORY =================

       const [categories] = await pool.query(
`
SELECT
  COALESCE(c.name,'Other') as category,
  SUM(t.amount) as amount

FROM transactions t

LEFT JOIN categories c
ON c.id = t.category_id

WHERE t.user_id = ?
AND t.type = 'expense'

GROUP BY c.name

ORDER BY amount DESC
`,
[userId]
);

        // ================= RESPONSE =================

        res.json({
            income,
            expense,
            balance: income - expense,
            totalTransactions: txnCount.total,
            monthly,
            categories,
        });
    } catch (err) {
        console.error("Analytics Error:", err);

        res.status(500).json({
            message: "Server Error",
        });
    }
};

module.exports = {
    getAnalytics,
};