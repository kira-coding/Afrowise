/**
 * Initializes the required modules, models, middlewares, and libraries for handling user authentication,
 * authorization, JWT token generation, file system operations, configuration settings, OTP verification,
 * course management, and EJS rendering.
 */
const express = require("express");
const router = express.Router();
const teacherRoute = require("./users/teacher")
const studentRoute = require("./users/student");
const adminRoute = require("./users/admin");

router.use(teacherRoute);
router.use(studentRoute);
router.use(adminRoute);

module.exports = router;
