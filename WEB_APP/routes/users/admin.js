const express = require("express");
const router = express.Router();
const Admin = require("../../models/users/Admin")
const auth_admin = require("../../middlewares/auth_admin")
const jwt = require("jsonwebtoken");
const config = require("config");
const Course = require("../../models/course/Course");
const Comment = require("../../models/course/Comment");
const { classifyCourse } = require("../../Helper/course_partitioning");

router.get("/admin/login", (req, res) => {
  const admin = jwt.decode(req.cookies.admin, config.get("JWT-secret-key"));

  if (!admin) {
    res.render("users/admin/login");
  } else {
    res.redirect("/user/admin/dashboard");
  }
});


router.get("/admin/dashboard", auth_admin, async (req, res) => {
  res.render("users/admin/dashboard", { admin: req.admin });
});

router.get("/admin/create_admin", auth_admin, async (req, res) => {
  if (req.admin.permissions.includes("CREATE_ADMINS")) {
    return res.render('users/admin/create_admin');
  }
  res.status(403).send("Forbidden");
});





router.get("/admin/create_teacher", (req, res) => {
  res.render("users/admin/registerTeacher", {});
});





module.exports = router;