// ================= IMPORTS =================
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const session = require("express-session");
const expressLayouts = require("express-ejs-layouts");

const pool = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const adminRoutes = require("./routes/adminRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

// ================= CONFIG =================
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ================= MIDDLEWARE =================

// Core middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://fintrack-app-expense.vercel.app",
      ],
    credentials: true,
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session middleware
app.set("trust proxy", 1);

app.use(
  session({
    name: "fintrack.sid",

    secret: process.env.SESSION_SECRET || "fintrack_secret",

    resave: false,

    saveUninitialized: false,

    rolling: true,

    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 24 hours

      httpOnly: true,

      secure: false,

      sameSite: "lax",
    },
  })
);

// debugging middleware

app.use((req, res, next) => {

  console.log("━━━━━━━━━━━━━━━━━━━");

  console.log("SESSION ID:", req.sessionID);

  console.log("SESSION DATA:", req.session);

  console.log("ADMIN:", req.session.admin);

  console.log("URL:", req.originalUrl);

  console.log("━━━━━━━━━━━━━━━━━━━");

  next();
});

// Make session available in EJS
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// ================= VIEW ENGINE =================
app.set("view engine", "ejs");
app.set("views", "./src/views");

app.use(expressLayouts);
app.set("layout", "layout");

// Static files
app.use(express.static("public"));

// ================= ROUTES =================

// Health routes
app.get("/", (req, res) => {
  res.json({ message: "FinTrack API is running ✅" });
});

app.get("/db", (req, res) => {
  res.json({ message: "DB Connected ✅" });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/users",require("./routes/userRoutes"));

// Admin panel
app.use("/admin", adminRoutes);

// ================= SERVER =================
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
  
// ================= DATABASE CHECK =================
(async () => {
  try {
    await pool.query("SELECT 1");
    console.log("MySQL Connected ✅");
  } catch (err) {
    console.error("Startup Error:", err);
  }
})();

console.log("Auth Routes Loaded");


