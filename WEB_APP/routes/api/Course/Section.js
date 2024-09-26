const express = require("express");
const router = express.Router();
const Document = require("../../../models/course/document");
const escape = require("escape-html");
const Section = require("../../../models/course/Section");
const Course = require("../../../models/course/Course");
const fs = require("fs");
const path = require("path");
const auth_teacher = require("../../../middlewares/auth_teacher");

router.post('/question/:id/multipleChoice', auth_teacher, async (req, res) => {
    try {
        let question = {
            type: "multipleChoice",
            multipleChoice: {
                instruction: req.body.instruction,
                correctAnswer: req.body.correct_answer,
                options: req.body.options
            }
        };
        let document = await Document.findById(req.params.id);
        let section = new Section({
            name: "Quiz",
            type: "Question",
            question: question,
            document: document._id
        });
        section = await section.save();
        document.sections.push(section._id);
        await document.save();
        res.json(section);
    } catch  {
        res.status(400).json({ err: true });
    }

});
router.post("/question/:id/multipleAnswer", auth_teacher, async (req, res) => {
    try {
        let document = await Document.findById(req.params.id);
        let multipleAnswer = {
            instruction: req.body.instruction,
            options: req.body.options,
            correctAnswers: req.body.answers
        };
        let question = {
            type: "multipleAnswer",
            multipleAnswer: multipleAnswer
        };
        let section = new Section({
            name: "Quiz",
            type: "Question",
            question: question
        });
        section = await section.save();
        document.sections.push(section._id);
        await document.save();
        res.json(section);
    } catch  {
        res.status(400).json({err: true});
    }
});
router.post("/question/:id/order", auth_teacher, async (req, res) => {
    try {
        let document = await Document.findById(req.params.id);
        let order = {
            instruction: req.body.instruction,
            correctlyOrdered: req.body.ordered,
        };
        let question = {
            type: "order",
            order: order
        };
        let section = new Section({
            name: "Quiz",
            type: "Question",
            question: question,
            document: document._id
        });
        section = await section.save();
        document.sections.push(section._id);
        await document.save();
        res.json(section);
    } catch  {
        res.status(400).json({err:true});
    }

});
router.post("/question/:id/matching", auth_teacher, async (req, res) => {
    try {
        let document = await Document.findById(req.params.id);
        let matching = {
            instruction: req.body.instruction,
            firstColumn: req.body.one,
            secondColumn: req.body.two

        };

        let question = {
            type: "matching",
            matching: matching
        };
        let section = new Section({
            name: "Quiz",
            type: "Question",
            question: question,
            document: document._id
        });
        section = await section.save();
        document.sections.push(section._id);
        await document.save();
        res.json(section);
    } catch{
        res.status(500).json({err:true});
    }
}
);


// get a specific section
router.get("/:id", async (req, res) => {
    try {
        let teacher = req.cookies.teacher;
        let admin = req.cookies.admin;
        if (!admin && !teacher) {
            return res.status(403).send("not allowed");
            // TODO verify either tokens
        }
        const section = await Section.findById(req.params.id).populate(
            "document",
        );
        if (!section)
            return res.status(404).json({ message: "message not found" });
        if (section.type == "Text") {
            section.content = escape(section.content);
            return res.json( { section: section });
        } else if (section.type == "Image") {
            res.redirect("/api/courses/image/" + req.params.id);
        } else if (section.type == "Video") {
            res.redirect("/api/courses/video/" + req.params.id);
        } else if (section.type == "Question") {
            res.redirect("/api/courses/question" + req.params.id);
        }
    } catch  {
        res.status(500).json({ err:true});
    }
});
router.post("/:course", auth_teacher, async (req, res) => {
    try {
        const course = await Course.findById(req.params.course);
        if (!(req.teacher.id === course.owner.toString())) return res.status(403).json({ err:true });
        const { type, name } = req.body;

        const { documentId } = req.body;
        if (type == "Text") {
            const newSection = new Section({
                content: "Edit",
                document: documentId,
                type: "Text",
                name: name,
            });
            const savedSection = await newSection.save();

            // save the new section in the documents list to stay organized and to save query performance later on
            const document = await Document.findByIdAndUpdate(documentId, {
                $push: { sections: savedSection._id },
            });
            res.json({
                document: document,
                section: savedSection,
            });
        }
        else if (type == "Image") {
            let image;
            if (!req.files || Object.keys(req.files).length === 0) {
                return res.status(400).send("No files were uploaded.");
            }
            image = req.files.buffer;
            console.log(image.name);
            let rootFolder = path.join(process.cwd(), "uploads", course.rootFolder.toString());
            fs.access(rootFolder, fs.constants.F_OK, async (err) => {
                if (err) {
                    console.log('Directory already exists:', rootFolder);
                    if (err.code === 'ENOENT') {
                        fs.mkdir(rootFolder, { recursive: true }, (error) => {
                            if (error) return res.send(error);
                            console.log('Directory created:', rootFolder);
                        });

                    } else {
                        throw err; // Handle other errors
                    }
                }
            });


            const timestamp = Date.now();
            const randomNumber = Math.floor(Math.random() * 10000);
            const uploadPath = rootFolder + '/' + timestamp + image.name;
            image.mv(uploadPath, async function (err) {
                if (err) return res.status(500).send(err);
                const newSection = new Section({
                    address: uploadPath,
                    document: documentId,
                    type: "Image",
                    name: image.name,
                });
                const savedSection = await newSection.save();

                // save the new section in the documents list to stay organized and to save query performance later on
                const document = await Document.findByIdAndUpdate(documentId, {
                    $push: { sections: savedSection._id },
                });
                res.json({savedSection})
            });
        }
        else if (type == "Video") {
            let video;
            if (!req.files || Object.keys(req.files).length === 0) {
                return res.status(400).send("No files were uploaded.");
            }
            video = req.files.buffer;
            let rootFolder = path.join(process.cwd(), "uploads", course.rootFolder.toString());

            fs.access(rootFolder, fs.constants.F_OK, async (err) => {
                if (err) {
                    console.log('Directory already exists:', rootFolder);
                    if (err.code === 'ENOENT') {
                        fs.mkdir(rootFolder, { recursive: true }, (error) => {
                            if (error) return res.send(error);
                            console.log('Directory created:', rootFolder);
                        });

                    } else {
                        throw err; // Handle other errors
                    }
                }
            });
            const timestamp = Date.now();
            const randomNumber = Math.floor(Math.random() * 10000);
            const uploadPath = rootFolder + '/' + timestamp + video.name;
            video.mv(uploadPath, async function (err) {
                if (err) return res.status(500).send(err);
                const newSection = new Section({
                    address: uploadPath,
                    document: documentId,
                    type: "Video",
                    name: video.name,
                });
                const savedSection = await newSection.save();

                // save the new section in the documents list to stay organized and to save query performance later on
                const document = await Document.findByIdAndUpdate(documentId, {
                    $push: { sections: savedSection._id },
                });
                res.json({savedSection});
            });
        }else return res.status(404).json({err:true})
    } catch   {
        console.log("error");
        res.status(500).json({err:true });
    }
});
router.get("/delete/:id", auth_teacher, async (req, res) => {
    try {
        let section = await Section.findByIdAndDelete(req.params.id);
        let parent = await Document.findByIdAndUpdate(section.document, { $pull: { sections: section._id } });
        if (section.type == "Video" || section.type == "Image") {
            fs.unlink(section.address, (err) => {
                if (err) {
                    console.log("failed to remove  " + section.type + " at " + section.address);
                }
            });
        }
        res.redirect('/api/courses/document/' + parent._id);

    } catch (error) {
        res.status(400).send(error.message);

    }
});
router.get("/image/:id", async (req, res) => {
    const section = await Section.findById(req.params.id).populate("document");
    fs.readFile(section.address, (err, data) => {
        if (err) return res.status(500).send("not found");
        res.json({
            section: section,
            data: new Buffer(data).toString("base64"),
            document: section.document,
        });
    });
});

router.get("/video/:id", async (req, res) => {
    let teacher = req.cookies.teacher;
    let admin = req.cookies.admin;
    if (!admin && !teacher) {
        return res.status(403).send("not allowed");
        // TODO verify either tokens
    }
    const section = await Section.findById(req.params.id).populate("document");
    fs.readFile(section.address, (err, data) => {
        if (err) return res.status(500).send("not found");
        res.json("courses/video", {
            section: section,
            data: new Buffer(data).toString("base64"),
            document: section.document,
        });
    });
});
router.get('/question/:id', async (req, res) => {
    try {
        let teacher = req.cookies.teacher;
        let admin = req.cookies.admin;
        if (!admin && !teacher) {
            return res.status(403).send("not allowed");
            // TODO verify either tokens
        }
        let section = await Section.findById(req.params.id);
        res.json({ section: section });
    } catch  {
        res.status(400).json({err:true});
    }
});

module.exports = router;

