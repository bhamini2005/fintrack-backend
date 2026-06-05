const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {

  try {

    // Get auth header
    const authHeader =
      req.headers.authorization;

    console.log(
      "AUTH HEADER:",
      authHeader
    );

    // No token
    if (!authHeader) {

      return res.status(401).json({
        message: "No token provided",
      });
    }

    // Extract token
    const token =
      authHeader.split(" ")[1];

    console.log("TOKEN:", token);

    // Verify JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    console.log("DECODED:", decoded);

    // Attach user
    req.user = decoded;

    next();

  } catch (err) {

    console.log(
      "JWT ERROR:",
      err.message
    );

    return res.status(401).json({
      message: "Invalid token",
    });
  }
};

module.exports = authMiddleware;