
const express = require("express");
const router = express.Router();

const Admin = require("../../models/users/Admin")

const auth_admin = require("../../middlewares/auth_admin")
const jwt = require("jsonwebtoken");

const config = require("config");

const Course = require("../../models/course/Course");
const Comment = require("../../models/course/Comment");

const { classifyCourse } = require("../../Helper/course_partitioning");

const { generateOTP } = require("../../Helper/OTP")








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
module.exports = router;