const express = require("express");
const router = express.Router();
const courseRoute = require("./Course");
const folderRoute = require("./Course/Folder");
const documentRoute = require("./Course/Document");
const sectionRoute = require("./Course/Section");
const { adminRoutes, studentRoutes, teacherRoutes } = require("./Users");

router.use("/course", courseRoute);
router.use("/document", documentRoute);
router.use("/section", sectionRoute);
router.use("/folder", folderRoute);
router.use("/admin", adminRoutes);
router.use("/student", studentRoutes);
router.use("/teacher", teacherRoutes);
module.exports = router;
