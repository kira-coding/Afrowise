const express = require("express");
const router = express.Router();
const Teacher = require("../../models/users/Teacher");

const auth_teacher = require("../../middlewares/auth_teacher");

const jwt = require("jsonwebtoken");

const config = require("config");

const auth_otp = require("../../middlewares/auth_otp");


{
  /**
 * Handles various operations related to teachers such as creating, logging in, updating, and deleting teachers.
 * Also includes routes for logging in, logging out, and updating teacher information.
 * Uses JWT for authentication and authorization.
 */
  // create Teacher
  router.get("/teacher/otp/", (req, res) => {
    res.render("users/teacher/otp", {})
})
  router.get("/teacher/create", auth_otp, async (req, res) => {
    res.render("users/teacher/create", {})
  })


  router.get("/teacher/login", async (req, res) => {
    try {
      const teacher = await jwt.decode(req.cookies.teacher, config.get("JWT-secret-key"));
      if (!teacher) {
        res.render("users/teacher/login");
      } else {
        res.redirect("/user/teacher/dashboard");
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });


  router.get("/teacher/logout", (req, res) => {
    res.clearCookie("teacher", { httpOnly: true, secure: true });
    res.redirect("/user/teacher/login");
  });
}

// Teacher sites
{
  const fetchTeacherAndCourses = async (req, res, next) => {
    const teacher = await Teacher.findOne({ _id: req.teacher.id }).populate("courses");
    req.teacher = teacher;
    next();
  };

  router.get("/teacher/dashboard", auth_teacher, async (req, res) => {
    try {
      res.render("users/teacher/dashboard");
    } catch {
      res.status(500).send("An error occurred");
    }
  });



  router.get("/teacher/course/create", auth_teacher, fetchTeacherAndCourses, async (req, res) => {
    try {
      res.render("users/teacher/create_course", { author: req.teacher._id });
    } catch {
      res.status(500).send("An error occurred");
    }
  });
}
module.exports = router;
