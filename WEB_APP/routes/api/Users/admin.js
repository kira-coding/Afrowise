const express = require("express");
const router = express.Router();
const Admin = require("../../models/users/Admin")
const { generateOTP } = require("../../../Helper/OTP")
const Course = require("../../../models/course")
const classifyCourse = require("../../../Helper/course_partitioning")
const auth_admin = require("../../../middlewares/auth_admin")
router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: "Both username and password are required" });
    }

    try {
        const admin = await Admin.findOne({ user_name: username });
        if (!admin || admin.password == password) {
            return res.status(404).json({ message: "username or password is not correct" });
        }
        const authToken = admin.generateJWT()

        res.json({ admin: admin, authToken: authToken });
    } catch {
        res.status(500).json({err:true});
    }
});

router.post("/create_admin", auth_admin, async (req, res) => {
    if (req.admin.permissions.includes("CREATE_ADMINS")) {
        const { first_name, last_name, user_name, password, email, permissions } = req.body;
        const profile_picture = req.files.profile_picture;
        const destination = `../uploads/admin/${Math.random() * 10000}${profile_picture.name}`;

        profile_picture.mv(destination, async (err) => {
            if (!err) {
                let admin = Admin({ first_name, last_name, user_name, password, permissions, email });
                admin = await admin.save();
                return res.json(admin);
            }
            return res.status(500).json({err:true});
        });
    }
    res.status(403).json({ err:true});
});
router.post("/otp", async (req, res) => {
    const email = req.body.email;
    const otp = await generateOTP(email);
    if (!otp) {
        res.send("Something happened");
    }
    res.json({ success: true });
});

router.get("/courses/submitted", auth_admin, async (req, res) => {
    try {
        const courses = await Course.find({ state: "Submitted" })
        res.json(courses)
    } catch  {
        res.status(500).json({err:true});
    }
})
router.post("/course/review", async (req, res) => {
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
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({err:true});
    }
})
router.post("/course/post", async (req, res) => {

    try {
        let course = await Course.findByIdAndUpdate(req.body.id, {
            $set: {
                state: "Posted"
            },
        }, { new: true })
        course = await classifyCourse(course.rootFolder.toString())
        res.json(course)

    } catch {
        res.status(500).json({ err: true })
    }
})
module.exports = router