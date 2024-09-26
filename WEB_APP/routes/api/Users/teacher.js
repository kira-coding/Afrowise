const express = require("express");
const router = express.Router();
const Teacher = require("../../../models/users/Teacher");
const mongoose = require("mongoose");
const auth_teacher = require("../../../middlewares/auth_teacher");
const OTP = require("../../../models/users/OTP");
const bcrypt = require('bcrypt');
const salt = 10;
const auth_otp = require("../../../middlewares/auth_otp");
const { sendOTP } = require("../../../Helper/OTP");


router.post("/otp", async (req, res) => {
    try {
        const otp = await OTP.findOne({ email: req.body.email });
        if (otp.value === req.body.otp) {
            //  todo set otp as cookie from the client side
            res.json({ otp: otp.generateJWT() });
        }
        else {
            res.json({ err: true });
        }
    } catch {
        res.status(500).json({ err: true });
    }
});

router.post("", auth_otp, async (req, res) => {
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
    } catch {
        res.status(500).json({ err: true });
    }
});
// login a teacher
router.post("/login", async (req, res) => {
    const { username, password, remember } = req.body;

    if (!username || !password) {
        return res.status(400).json({ err: true });
    }

    try {
        let teacher = await Teacher.findOne({ user_name: username });

        if (!teacher || !(await bcrypt.compare(password, teacher.password))) {
            return res.status(404).json({ err: true });
        }



        res.json({ teacher: teacher, jwt: teacher.generateJWT() });
    } catch {
        res.status(500).json({ err: true });
    }
});
// Update a Teacher
router.put("/:id", auth_teacher, async (req, res) => {
    const { first_name, middle_name, last_name, user_name, password } =
        req.body;
    if (!first_name || !middle_name || !last_name || !user_name || !password)
        return res
            .status(400).json({ err: true });
    try {
        const hashedPassword = await bcrypt.hash(password, salt); // Hash the password
        const updatedTeacher = await Teacher.findByIdAndUpdate(
            req.params.id,
            { $set: { first_name, middle_name, last_name, user_name, password: hashedPassword } },
            { new: true },
        );
        if (!updatedTeacher)
            return res.status(404).json({ err: true });
        res.json(updatedTeacher);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.delete("/:id", async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ err: true });
        }
        const deletedTeacher = await Teacher.findByIdAndDelete(req.params.id);
        if (!deletedTeacher) {
            return res.status(404).json({ err: true });
        }
        res.json(deletedTeacher);
    } catch (err) {
        res.status(500).json({ err: true });
    }
});

router.get("/courses", auth_teacher, async (req, res) => {
    try {
        const teacher = await Teacher.findOne({ _id: req.teacher.id }).populate("courses");
        req.teacher = teacher;
        res.json({ courses: req.teacher.courses || [] });
    } catch {
        res.status(500).json({ err: true });
    }
});

module.exports = router;