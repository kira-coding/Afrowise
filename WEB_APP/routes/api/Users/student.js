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
const { createPartZip } = require("../../Helper/zip");

router.post("/login", async (req, res) => {
    /* authorizes the teacher and sends auth token for easier and more secure management*/

    const { username, password } = req.body;
    if (!username || !password)
        return res
            .status(404)
            .json({err:true });
    try {
        let student = await Student.findOne({
            user_name: username,
        });
        if (!student) return res.status(404).json({ err:true });
        bcrypt.compare(password, student.password)


        return res.json({
            first_name: student.first_name,
            middle_name: student.middle_name,
            last_name: student.last_name,
            user_name: student.user_name,
            enrollments: await (await student.populate("enrollments")).populate("enrollments.course"),
            jwt: student.generateJWT()
        });

    } catch {
        res.status(500).json({ err: true });
    }
}
);
router.post("/register", async (req, res) => {
    try {
        const { first_name, middle_name, last_name, gender, email, password, user_name } = req.body;
        let hashedPassword = await bcrypt.hash(password, salt)
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
        res.json(student)
    } catch {
        res.status(400).json({ err: true })
    }
})
router.get("/courses", auth_student, async (req, res) => {
    try {
        const courses = await Course.find({ state: ["Posted", "OutDated"] },)
        res.json(courses)
    } catch {
        res.status(500).json({ err: true })
    }
})
router.get("/course/:course_id/enroll", auth_student, async (req, res) => {
    try {
        const course = await Course.findById(req.params.course_id)
        res.json({ course: course })
    } catch {
        res.status(500).json({ err: true }
        )
    }
})
router.get("/start/:id", auth_student, async (req, res) => {
    try {
        // TODO: payment method goes here 
        let course = await Course.findById(req.params.id)

        if (!(course.state === "Posted" || course.state === "OutDated")) return res.status(403).send("Not allowed")
        let student = await Student.findById(req.student.id);
        if (student.enrollments.includes(course._id.toString())) return res.redirect("/student/enrollments")
        let enrollment = await Enrollment.create({ student: student._id, course: course._id, })
        student.enrollments.push(enrollment._id)
        student = await student.save()
        res.json({ success: true, student: student })
    }
    catch {
        res.status(500).json({ err: true })
    }
})
router.get("/enrollments", auth_student, async (req, res) => {
    try{
    let student = await Student.findById(req.student.id).populate('enrollments')


    res.json(student.enrollments)}catch{
        res.json({err:true})
    }
})
router.get("/course/:id/:part", auth_student, async (req, res) => {
    try{
    // TODO: here we must check whether the students subscription has expired or not 
    if (isNaN(Number(req.params.part))) return res.status(404).json({err:true})
    let student = await Student.findById(req.student.id).populate("enrollments")
    let courses = []
    student.enrollments.forEach(enrollment => {
        courses.push(enrollment.course.toString())
    }
    )
    let course = await Course.findById(req.params.id)
    if (!courses.includes(req.params.id)) return res.status(403).json({ err: true })

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

        res.download(path.join(rootFolder, zipFileName));
    }
    catch{
        res.status(500).json({err:true})
    }
});