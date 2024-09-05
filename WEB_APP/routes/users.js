const express = require("express");
const router = express.Router();
const Teacher = require("../models/users/Teacher");
const Student = require("../models/users/Student");
const Admin = require("../models/users/Admin")
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
      let teacher = await Teacher.findOne({
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
      const updatedTeacher = await Teacher.findByIdAndUpdate(
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
// Student 
{router.get("/student/login",(req,res)=>{
   let student;

    student = jwt.decode(req.cookies.teacher, config.get("JWT-secret-key"));

    if (!student) {
      res.render("users/student/login");
    } else {
      res.redirect("/user/student/dashboard");
    }
  
})
 router.post("/student/login", async (req, res) => {
    /* authorizes the teacher and sends auth token for easier and more secure management*/

    const { username, password } = req.body;
    if (!username || !password)
      return res
        .status(404)
        .json({ message: "both username and password is required" });
    try {
      let student = await Student.findOne({
        user_name: username,
        password: password,
      });
      if (!student) return res.status(404).json({ message: "not found" });

      if ((req.body.remember = "true")) {
        console.log("remember");
        res.cookie("student", student.generateJWT(), {
          maxAge: 2592000000,
          httpOnly: true,
        });
      } else {
        res.cookie("student", student.generateJWT());
      }
      res.redirect("/user/student/login");
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  router.get("/student/register", (req, res) => {

    res.render("/users/student/register")

  })
  router.post("/student/register", async (req, res) => {
    try {
      let first_name = req.body.first_name
      let middle_name = req.body.middle_name
      let last_name = req.body.last_name
      let gender = req.body.gender
      let email = req.body.email
      let password = req.body.password
      let user_name = req.body.user_name
      let student = new Student({
        user_name: user_name,
        first_name: first_name,
        middle_name: middle_name,
        last_name: last_name,
        email: email,
        gender: gender,
        password: password
      })
     student = await student.save()
     res.redirect('../login')
    } catch (err) {
      res.status(400).send(err.message)
    }
  })
}
// Admin
{
  router.get("/admin/login",(req,res)=>{   
    let admin;

    admin = jwt.decode(req.cookies.teacher, config.get("JWT-secret-key"));

    if (!admin) {
      res.render("users/admin/login");
    } else {
      res.redirect("/user/admin/dashboard");
    }
  })
  router.post("/admin/login",async (req,res)=>{
    const { username, password } = req.body;
    if (!username || !password)
      return res
        .status(404)
        .json({ message: "both username and password is required" });
    try {
      let admin = await Admin.findOne({
        user_name: username,
        password: password,
      });
      if (!admin) return res.status(404).json({ message: "not found" });

      if ((req.body.remember = "true")) {
        console.log("remember");
        res.cookie("admin", admin.generateJWT(), {
          maxAge: 2592000000,
          httpOnly: true,
        });
      } else {
        res.cookie("admin", admin.generateJWT());
      }
      res.redirect("/user/admin/login");
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  })
  router.get("/admin/dashboard")
}
module.exports = router;
