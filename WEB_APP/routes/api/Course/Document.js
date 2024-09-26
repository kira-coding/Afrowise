const express = require("express");
const router = express.Router();
const Folder = require("../../../models/course/Folder");
const Document = require("../../../models/course/document");
const Course = require("../../../models/course/Course");
const auth_teacher = require("../../../middlewares/auth_teacher");
const { deleteDocument } = require("../../../Helper/Course");


// Create Document
router.post("/:course", auth_teacher, async (req, res) => {
    try {
        const course = await Course.findById(req.params.course);
        if (!(req.teacher.id === course.owner.toString())) return res.status(403).json({ message: "Not allowed" });

        const { name, parent } = req.body;
        const newDocument = new Document({ name, parent, type: "Document", course: req.params.course });
        const savedDocument = await newDocument.save();
        // should be added to a Folder
        let parentObj = await Folder.findByIdAndUpdate(
            parent,
            {
                $push: { documents: savedDocument._id },
            },
            { new: true },
        );

        parentObj.order.push(`${savedDocument._id}D`);
        await parentObj.save();
        res.json({ document: savedDocument });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// Get a specific document
router.get("/:id/:course", async (req, res) => {
    try {
        let teacher = req.cookies.teacher;
        let admin = req.cookies.admin;
        if (!admin && !teacher) {
            return res.status(403).send("not allowed");
            // TODO verify either tokens
        }
        const document = await Document.findById(req.params.id).populate(
            "sections",
        );
        console.log(document);
        if (!(document.course.toString() === req.params.course)) return res.status(404).send("Course is not for this document");

        res.json(document);
    } catch (err) {
        res.status(500).json({ message: "Something went wrong" });
    }
});
// Update a document
router.put("/:id", auth_teacher, async (req, res) => {
    const { name } = req.body;
    if (!name)
        return res.status(400).json({ message: "name field is required" });
    try {
        const updateDocument = await Document.findByIdAndUpdate(
            req.params.id,
            { $set: { name } },
            { new: true },
        ); //{new:true}--for it too return the updated document.
        if (!updateDocument)
            return res.status(404).json({ message: "document not found" });
        res.json(updateDocument);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// Delete a document
router.post("/delete/:id", auth_teacher, async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        if (!document)
            return res.status(404).json({ message: "document not found" });
        deleteDocument(document);
        if (req.body.isAjax) {
            return res.json(document);
        }
        res.json(document);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
router.post("/moveUp/:id", auth_teacher, async (req, res) => {
    try {
        let document = await Document.findById(req.params.id);
        let parent = await Folder.findById(document.parent);
        let element = document._id + "D";
        let pos = parent.order.indexOf(element);
        if (pos - 1 < 0);
        else {
            let temp = parent.order[pos - 1];
            parent.order[pos - 1] = element;
            parent.order[pos] = temp;
            parent = await parent.save();
        }
        res.json(parent);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});
module.exports = router;
