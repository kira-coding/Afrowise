/**
 * Initializes the required modules, models, middlewares, and libraries for handling user authentication,
 * authorization, JWT token generation, file system operations, configuration settings, OTP verification,
 * course management, and EJS rendering.
 */
const express = require("express");
const router = express.Router();
const Teacher = require("../models/users/Teacher");
const Student = require("../models/users/Student");
const Admin = require("../models/users/Admin")
const auth_teacher = require("../middlewares/auth_teacher");
const auth_student = require("../middlewares/auth_student");
const auth_admin = require("../middlewares/auth_admin")
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const Enrollment = require("../models/users/Student_enrollments");
const config = require("config");
const OTP = require("../models/users/OTP");
const Course = require("../models/course/Course");
const Comment = require("../models/course/Comment");
const bcrypt = require('bcrypt');
const salt = 10
const auth_otp = require("../middlewares/auth_otp");
const { classifyCourse, getCourseStructureByPart } = require("../Helper/course_partitioning");
const { createPartZip } = require("../Helper/zip");
const { generateOTP, sendOTP, verifyOTP, isEmailRegistered } = require("./helpers")
// Teacher
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
      else{
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
// Student courses
{
  router.get("/student/login", (req, res) => {
    let student;

    student = jwt.decode(req.cookies.student, config.get("JWT-secret-key"));

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
      });
      if (!student) return res.status(404).json({ message: "not found" });
      bcrypt.compare(password, student.password)
      if (req.body.remember === 'true') {
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

    res.render("users/student/register")

  })
  router.post("/student/register", async (req, res) => {
    try {
      let first_name = req.body.first_name
      let middle_name = req.body.middle_name
      let last_name = req.body.last_name
      let gender = req.body.gender
      let email = req.body.email
      let password = req.body.password
      let hashedPassword = await bcrypt.hash(password, salt)
      let user_name = req.body.user_name
      let student = new Student({
        user_name: user_name,
        first_name: first_name,
        middle_name: middle_name,
        last_name: last_name,
        email: email,
        gender: gender,
        password: hashedPassword
      })
      student = await student.save()
      res.redirect('./login')
    } catch (err) {
      res.status(400).send(err.message)
    }
  })
  router.get("/student/courses", auth_student, async (req, res) => {
    try {
      const courses = await Course.find({ state: ["Posted", "OutDated"] },)
      res.render("users/student/courses", { courses: courses })
    } catch (err) {
      res.status(500).send(err.message)
    }
  })
  router.get("/student/course/:course_id/enroll", auth_student, async (req, res) => {
    try {
      const course = await Course.findById(req.params.course_id)
      res.render("users/student/enroll", { course: course })
    } catch (err) {
      res.status(500).send(err)
    }
  })
  router.get("/student/start/:id", auth_student, async (req, res) => {
    // try {
      // TODO: payment method goes here 
      let course = await Course.findById(req.params.id)

      if (!(course.state === "Posted" || course.state === "OutDated")) return res.status(403).send("Not allowed")
      let student = await Student.findById(req.student.id);
      if (student.enrollments.includes(course._id.toString())) return res.redirect("/student/enrollments")
      let enrollment = await Enrollment.create({ student: student._id, course: course._id, })
      student.enrollments.push(enrollment._id)
      student = await student.save()
      res.json({ message: "successfully enrolled " })
    // }
    // catch (err) {
    //   res.status(500).send(err)
    // }
  })
  router.get("/student/enrollments", auth_student, async (req, res) => {
    let student = await Student.findById(req.student.id).populate('enrollments')

    res.cookie("student", student.generateJWT(), {
      maxAge: 2592000000,
      httpOnly: true,
    });

    res.json(student.enrollments)
  })
  router.get("/student/course/:id/:part", auth_student, async (req, res) => {
    // try{
    // TODO: here we must check whether the students subscription has expired or not 
    if (Number(req.params.part) == NaN) return res.status(404).send("part doesn't exist")
    let student = await Student.findById(req.student.id).populate("enrollments")
    let courses = []
    student.enrollments.forEach(enrollment => {
      courses.push(enrollment.course.toString())
    }
    )
    let course = await Course.findById(req.params.id)
    if (!courses.includes(req.params.id)) return res.status(403).send("You didn't subscribed for this course");
    try {
      const courseStructure = await getCourseStructureByPart(
        course.rootFolder,
        req.params.part
      );

      const zipFileName = await createPartZip(
        courseStructure,
        req.params.part
      );

      let rootFolder = path.join(process.cwd(), "uploads", course.rootFolder.toString());
      // Send the ZIP file as an attachment
      console.log("NOoo"+zipFileName)
      res.download(path.join(rootFolder, zipFileName));
    } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Error processing course part');
    }
  });
}

// Admin
{
  router.get("/admin/login", (req, res) => {
    const admin = jwt.decode(req.cookies.admin, config.get("JWT-secret-key"));

    if (!admin) {
      res.render("users/admin/login");
    } else {
      res.redirect("/user/admin/dashboard");
    }
  });

  router.post("/admin/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Both username and password are required" });
    }

    try {
      const admin = await Admin.findOne({ user_name: username, password: password });
      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      if (req.body.remember === "true") {
        console.log("Remember");
        res.cookie("admin", admin.generateJWT(), {
          maxAge: 2592000000,
          httpOnly: true,
        });
      } else {
        res.cookie("admin", admin.generateJWT());
      }
      res.redirect("/user/admin/dashboard");
    } catch (err) {
      res.status(500).json({ message: err.message });
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

  router.post("/admin/create_admin", auth_admin, async (req, res) => {
    if (req.admin.permissions.includes("CREATE_ADMINS")) {
      const { first_name, last_name, user_name, password, email, permissions } = req.body;
      const profile_picture = req.files.profile_picture;
      const destination = `../uploads/admin/${Math.random() * 10000}${profile_picture.name}`;

      profile_picture.mv(destination, async (err) => {
        if (!err) {
          const admin = Admin({ first_name, last_name, user_name, password, permissions, email });
          await admin.save();
          return res.redirect(".");
        }
        return res.status(500).send("Something went wrong");
      });
    }
    res.status(403).send("Forbidden");
  });



  router.get("/admin/create_teacher", (req, res) => {
    res.render("users/admin/registerTeacher", {});
  });

  router.post("/admin/otp", async (req, res) => {
    const email = req.body.email;
    const otp = await generateOTP(email);
    if (!otp) {
      res.send("Something happened");
    }
    res.redirect("/user/admin/dashboard");
  });
  router.get("/admin/courses/submitted", auth_admin, async (req, res) => {
    try {
      const courses = await Course.find({ state: "Submitted" })
      res.render("users/admin/courses", { courses })
    } catch (err) {
      res.status(500).send(err.message);
    }
  })
  router.post("/admin/course/review", async (req, res) => {
    try {
      let comment = await Comment.create({ issue: req.body.issue, description: req.body.description, course: req.body.id });
      await Course.findByIdAndUpdate(req.body.id, {
        $push: {
          comments: comment._id
        },
        $set: {
          state: "Pending"
        }
      })
      res.redirect("/user/admin/courses/submitted");
    } catch (err) {
      res.status(500).send(err.message)
    }
  })
  router.post("/admin/course/post", async (req, res) => {
    // TODO:change the course state to posted
    // try {
    let course = await Course.findByIdAndUpdate(req.body.id, {
      $set: {
        state: "Posted"
      }
    })
    await classifyCourse(course.rootFolder.toString())
    res.redirect("/user/admin/courses/submitted")

    // }catch(err){
    //   res.status(500).send(err.message)
    // }
  })
}
module.exports = router;
