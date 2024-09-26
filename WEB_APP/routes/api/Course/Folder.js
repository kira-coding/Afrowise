const express = require("express");
const router = express.Router();
const Folder = require("../../../models/course/Folder");
const Course = require("../../../models/course/Course");
const auth_teacher = require("../../../middlewares/auth_teacher");
const { deleteFolderRecursively } = require("../../../Helper/Course");

router.post("/:course", auth_teacher, async (req, res) => {
    const { name, parent } = req.body;
    try {

        const course = await Course.findById(req.params.course);

        if (!(req.teacher.id === course.owner.toString())) return res.status(403).json({ message: "Not allowed" });

        if (parent && name) {
            const newFolder = new Folder({
                name: name,
                parent: parent,
                type: "Folder",
                course: course._id.toString(),
            });
            let savedFolder = await newFolder.save();
            let parentObj = await Folder.findByIdAndUpdate(
                parent,
                {
                    $push: { subdirs: savedFolder._id },
                },
                { new: true },
            );

            parentObj.order.push(`${savedFolder._id}F`);
            await parentObj.save();

            res.json({savedFolder});
        } else {
            res.json({err:true});
        }
    } catch (err) {
        console.error("err", err);
        res.status(500).json({ message: err.message });
    }
});
// Get a specific folder
router.get("/:id/:course", async (req, res) => {

    try {
        let teacher = req.cookies.teacher;
        let admin = req.cookies.admin;
        if (!admin && !teacher) {
            return res.status(403).send("not allowed");
            // TODO verify either tokens
        }

        // TODO: verify each token
        let folder = await Folder.findById(req.params.id)
            .populate("subdirs", ["name", "_id", "type"])
            .populate("documents", ["name", "_id", "type"]);
        if (!(folder.course.toString() === req.params.course)) return res.status(404).send("Course is not for this folder");
        let content = {};
        let folderIndex = 0;
        let documentIndex = 0;
        content.length = 0;
        for (let i = 0; i < folder.order.length; i++) {
            let lastElement = folder.order[i].slice(-1);
            console.log("routes/course.js::144::" + lastElement);

            if (lastElement == "F") {
                let objId = folder.order[i].slice(0, -1);
                content[i] = folder.subdirs.filter((item) => {
                    return item._id.toString() == objId;
                })[0];
                folderIndex++;
            } else if (lastElement == "D") {
                let objId = folder.order[i].slice(0, -1);
                content[i] = folder.documents.filter((item) => {
                    return item._id.toString() == objId;
                })[0];
                documentIndex++;
            }
            if (
                folderIndex > folder.subdirs.length ||
                documentIndex > folder.documents.length
            ) {
                console.log("err " + folderIndex + " " + documentIndex);
                break;
            }
            content.length++;
        }
        console.log(content);
        res.json({ folder: folder, content: content, });
    } catch {
        res.status(500).json({ err:true});
    }
});
// Update a folder
router.put("/:id", auth_teacher, async (req, res) => {
    const { name } = req.body;
    if (!name)
        return res.status(400).json({ message: "name field is required" });
    try {
        const updatedFolder = await Folder.findByIdAndUpdate(
            req.params.id,
            { $set: { name } },
            { new: true },
        ); //{new:true}--for it too return the updated document.
        if (!updatedFolder)
            return res.status(404).json({ err:true });
        res.json(updatedFolder);
    } catch  {
        res.status(500).json({err:true});
    }
});
// Delete a folder
router.post("/delete/:id", auth_teacher, async (req, res) => {
    try {
        const deletedFolder = await deleteFolderRecursively(req.params.id);
        res.json({deletedFolder});
    } catch{
        res.status(500).json({err:true});
    }
});
router.post("/moveUp/:id", auth_teacher, async (req, res) => {
    try {
        let folder = await Folder.findById(req.params.id);
        let parent = await Folder.findById(folder.parent);
        let element = folder._id + "F";
        let pos = parent.order.indexOf(element);
        if (pos <= 0);
        else {
            let temp = parent.order[pos - 1];
            parent.order[pos - 1] = element;
            parent.order[pos] = temp;
            console.log(parent.order.toLocaleString());
            await parent.save();

        }

        res.json({parent});
    } catch{
        res.status(400).json({err:true});
    }
});

module.exports = router;
