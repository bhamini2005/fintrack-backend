const adminAuth = (req, res, next) => {
  // console.log("AUTH CHECK:", req.session.admin);

  
  if (!req.session.admin) {
    req.session.redirectTo = req.originalUrl; // 🔥 optional
    console.log("❌ Not logged in → redirect");
    return res.redirect("/admin/login");
  }

   console.log("✅ Allowed");
  next();
};
module.exports = adminAuth;