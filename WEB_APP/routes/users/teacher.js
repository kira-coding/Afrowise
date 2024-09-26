const express = require("express");
const router = express.Router();
const Teacher = require("../models/users/Teacher");


const auth_teacher = require("../middlewares/auth_teacher");

const jwt = require("jsonwebtoken");

const config = require("config");
const OTP = require("../models/users/OTP");

const bcrypt = require('bcrypt');
const salt = 10
const auth_otp = require("../middlewares/auth_otp");
const { createPartZip } = require("../Helper/zip");
const { sendOTP } = require("../../Helper/OTP")


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
  router.post("/teacher/otp", async (req, res) => {
    try {
      const otp = await OTP.findOne({ email: req.body.email })
      if (otp.otp === req.body.otp) {

        const cookieOptions = {
          httpOnly: true,
          sameSite: "strict",
          maxAge: 500000
        };
        res.cookie("otp", otp.generateJWT(), cookieOptions);
        await sendOTP(req.body.email, otp.otp)
        res.redirect("/user/teacher/create")
      }
      else {
        res.redirect("./otp")
      }
    } catch (err) {
      res.status(500).send("Something happened")
    }
  })
  router.get("/teacher/create", auth_otp, async (req, res) => {
    res.render("users/teacher/create", {})
  })
  router.post("/teacher", auth_otp, async (req, res) => {
    // Handles the POST request to create a new teacher, validate required fields, and save to the database
    const { first_name, middle_name, last_name, user_name, password } = req.body;

    if (!first_name || !middle_name || !last_name || !user_name || !password) {
      return res.status(400).send("Missing fields");
    }

    try {
      const hashedPassword = await bcrypt.hash(password, salt);
      const newTeacher = new Teacher({
        first_name,
        middle_name,
        last_name,
        user_name,
        password: hashedPassword,
        email: req.otp.email,
      });
      const savedTeacher = await newTeacher.save();
      res.json(savedTeacher);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  // login a teacher
  router.post("/teacher/login", async (req, res) => {
    const { username, password, remember } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Both username and password are required" });
    }

    try {
      let teacher = await Teacher.findOne({ user_name: username });

      if (!teacher || !(await bcrypt.compare(password, teacher.password))) {
        return res.status(404).json({ message: "Invalid username or password" });
      }

      const cookieOptions = {
        httpOnly: true,
        sameSite: "strict",
        maxAge: remember === "true" ? 2592000000 : undefined
      };

      res.cookie("teacher", teacher.generateJWT(), cookieOptions);
      res.redirect("/user/teacher/login");
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  // Update a Teacher
  router.put("/teacher/:id", auth_teacher, async (req, res) => {
    const { first_name, middle_name, last_name, user_name, password } =
      req.body;
    if (!first_name || !middle_name || !last_name || !user_name || !password)
      return res
        .status(400)
        .send(`Missing field(s): ${!first_name ? 'first_name, ' : ''}${!middle_name ? 'middle_name, ' : ''}${!last_name ? 'last_name, ' : ''}${!user_name ? 'user_name, ' : ''}${!password ? 'password' : ''}`);
    try {
      const hashedPassword = await bcrypt.hash(password, salt); // Hash the password
      const updatedTeacher = await Teacher.findByIdAndUpdate(
        req.params.id,
        { $set: { first_name, middle_name, last_name, user_name, password: hashedPassword } },
        { new: true },
      ); //{new:true}--for it too return the updated document.
      if (!updatedTeacher)
        return res.status(404).json({ message: "teacher not found" });
      res.json(updatedTeacher);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  // Delete a Teacher
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

  router.delete("/teacher/:id", async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ message: "Invalid teacher ID" });
      }
      const deletedTeacher = await Teacher.findByIdAndDelete(req.params.id);
      if (!deletedTeacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }
      res.json(deletedTeacher);
    } catch (err) {
      res.status(500).json({ message: err.message });
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
    } catch (error) {
      res.status(500).send("An error occurred");
    }
  });

  router.get("/teacher/courses", auth_teacher, fetchTeacherAndCourses, async (req, res) => {
    try {
      res.render("users/teacher/courses", { courses: req.teacher.courses || [] });
    } catch (error) {
      res.status(500).send("An error occurred");
    }
  });

  router.get("/teacher/course/create", auth_teacher, fetchTeacherAndCourses, async (req, res) => {
    try {
      res.render("users/teacher/create_course", { author: req.teacher._id });
    } catch (error) {
      res.status(500).send("An error occurred");
    }
  });
}
module.exports = router;
