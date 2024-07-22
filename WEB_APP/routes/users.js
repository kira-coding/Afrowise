const express = require("express");
const router = express.Router();
const Teacher = require("../models/users/Teacher");
const auth_teacher = require("../middlewares/auth_teacher");
const jwt = require("jsonwebtoken");

const config = require("config");
const Course = require("../models/course/Course");
// Teacher
{
  // create Teacher
  router.post("/teacher", async (req, res) => {
    const { first_name, middle_name, last_name, user_name, password } =
      req.body;
    if (!(first_name || middle_name || last_name || user_name || password))
      return res.status(404).send("missing fields");
    try {
      const newTeacher = new Teacher({
        first_name: first_name,
        middle_name: middle_name,
        last_name: last_name,
        user_name: user_name,
        password: password,
      });
      const savedTeacher = await newTeacher.save();
      res.json(savedTeacher);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  // login a teacher
  router.post("/teacher/login", async (req, res) => {
    /* authorizes the teacher and sends auth token for easier and more secure management*/

    const { username, password } = req.body;
    if (!username || !password)
      return res
        .status(404)
        .json({ message: "both username and password is required" });
    try {
      teacher = await Teacher.findOne({
        user_name: username,
        password: password,
      });
      if (!teacher) return res.status(404).json({ message: "not found" });

      if ((req.body.remember = "true")) {
        console.log("remember");
        res.cookie("teacher", teacher.generatejwt(), {
          maxAge: 2592000000,
          httpOnly: true,
        });
      } else {
        res.cookie("teacher", teacher.generatejwt());
      }
      res.redirect("/user/teacher/login");
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  // Update a Teacher
  router.put("/teacher/:id", async (req, res) => {
    const { first_name, middle_name, last_name, user_name, password } =
      req.body;
    if (!first_name || !middle_name || !last_name || !user_name || !password)
      return res
        .status(404)
        .send("there is a missing field please check back.");

    try {
      const updatedTeacher = await teacher.findByIdAndUpdate(
        req.params.id,
        { $set: { first_name, middle_name, last_name, user_name, password } },
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
  router.delete("/teacher/:id", async (req, res) => {
    try {
      const deletedTeacher = await Teacher.findByIdAndDelete(req.params.id);
      if (!deletedTeacher)
        return res.status(404).json({ message: "teacher not found" });
      res.json(deletedTeacher);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  router.get("/teacher/login", (req, res) => {
    let teacher;

    teacher = jwt.decode(req.cookies.teacher, config.get("JWT-secret-key"));

    if (!teacher) {
      res.render("users/teacher/login");
    } else {
      res.redirect("/user/teacher/dashboard");
    }
  });
  router.get("/teacher/logout", (req, res) => {
    res.clearCookie("teacher");
    res.redirect("/user/teacher/login");
  });
}

// Teacher sites
{
  router.get("/teacher/dashboard", auth_teacher, async (req, res) => {
    res.render("users/teacher/dashboard");
  });
  router.get("/teacher/courses", auth_teacher, async (req, res) => {
    const teacher = await Teacher.findById(req.teacher.id).populate("courses");
    res.render("users/teacher/courses", { courses: teacher.courses });
  });
  router.get("/teacher/course/create", auth_teacher, async (req, res) => {
    const teacher = await Teacher.findById(req.teacher.id).populate("courses");

    res.render("users/teacher/create_course", { author: teacher._id });
  });
}

module.exports = router;
