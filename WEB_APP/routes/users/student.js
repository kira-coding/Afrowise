const express = require("express");
const router = express.Router();
const Student = require("../../models/users/Student");
const auth_student = require("../../middlewares/auth_student");
const jwt = require("jsonwebtoken");
const path = require("path");
const Enrollment = require("../../models/users/Student_enrollments");
const config = require("config");
const Course = require("../../models/course/Course");
const bcrypt = require('bcrypt');
const salt = 10
const { getCourseStructureByPart } = require("../../Helper/course_partitioning");
const { createPartZip } = require("../../viewsHelper/zip");



router.get("/student/login", (req, res) => {
    let student;

    student = jwt.decode(req.cookies.student, config.get("JWT-secret-key"));

    if (!student) {
        res.render("users/student/login");
    } else {
        res.redirect("/user/student/dashboard");
    }

})
router.post("/student/login/:json?", async (req, res) => {
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

        if (req.params.json) {
            return res.json({
                first_name: student.first_name,
                middle_name: student.middle_name,
                last_name: student.last_name,
                user_name: student.user_name,
                enrollments: await (await student.populate("enrollments")).populate("enrollments.course"),
                jwt: student.generateJWT()
            });
        }
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
        console.log("NOoo" + zipFileName)
        res.download(path.join(rootFolder, zipFileName));
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Error processing course part');
    }
});
module.exports = router