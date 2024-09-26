const express = require("express");
const router = express.Router();

const jwt = require("jsonwebtoken");
const config = require("config");





router.get("/student/login", (req, res) => {
    let student;

    student = jwt.decode(req.cookies.student, config.get("JWT-secret-key"));
    if (!student) {
        res.render("users/student/login");
    } else {
        res.redirect("/user/student/dashboard");
    }

})

router.get("/student/register", (req, res) => {

    res.render("users/student/register")

})

module.exports = router