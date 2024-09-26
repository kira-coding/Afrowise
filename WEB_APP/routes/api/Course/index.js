const express = require("express");
const router = express.Router();
const Folder = require("../../../models/course/Folder");
const Teacher = require("../../../models/users/Teacher");
const Course = require("../../../models/course/Course");
const auth_teacher = require("../../../middlewares/auth_teacher");
const { deleteFolderRecursively } = require("../../../Helper/Course");


router.post("", auth_teacher, async (req, res) => {
    const { title, description } = req.body;
    const author = req.teacher.id;
    try {
        const newFolder = new Folder({ name: title, type: "Folder" });
        const savedFolder = await newFolder.save();
        const newCourse = new Course({
            title: title,
            description: description,
            owner: author,
            rootFolder: savedFolder._id,
            state: "Pending",
        });

        const savedCourse = await newCourse.save();
        await Teacher.findByIdAndUpdate(author, {
            $push: { courses: savedCourse._id },
        });
        savedFolder.course = savedCourse._id.toString();
        await savedFolder.save();
        res.json({ savedCourse });
    } catch {
        res.status(500).json({ err: true });
    }
});
router.post("/post/:id", auth_teacher, async (req, res) => {
    try {
        const course = await Course.findByIdAndUpdate(req.params.id, { state: "Submitted" }, { new: true });
        res.json(course);
    } catch {
        res.status(500).json({ err: true });
    }
});
router.get("/delete/:id", auth_teacher, async (req, res) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.id);
        await deleteFolderRecursively(course.rootFolder);
        res.redirect("/user/teacher/courses");
    } catch {
        res.status(500).json({ err: true });
    }
});

router.get("/search/:query?", async (req, res) => {
    try {
        const results = await Course.find({
            $text: { $search: req.params.query?.toString() },
            state: ["Posted", "OutDated"]

        })
            .limit(5);
        res.json(results);
    } catch {
        res.status(500).json({ err: true });
    }
});

module.exports = router;