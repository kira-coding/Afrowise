const express = require("express");
const router = express.Router();
const Folder = require("../models/course/Folder");
const Document = require("../models/course/document");
const escape = require("escape-html");
const Section = require("../models/course/Section");
const Course = require("../models/course/Course");
const Teacher = require("../models/users/Teacher");
const fs = require("fs");
const auth_teacher = require("../middlewares/auth_teacher");
const { render } = require("ejs");
const { default: mongoose } = require("mongoose");
async function deleteDocument(document) {
  let sections = document.sections;
  for (i in sections) {
    await Section.deleteOne({ _id: sections[i] });
  }

  await Document.findByIdAndDelete(document._id);

  let documentId = new mongoose.Types.ObjectId(document._id);
  const elementToRemove = documentId.toString() + "D";
}
async function deleteFolderRecursively(folderId) {
  const folder = await Folder.findById(folderId).populate("documents");

  if (!folder) {
    return; // Folder not found, nothing to delete
  }

  // Delete all subfolders recursively
  for (const subfolderId of folder.subdirs) {
    await deleteFolderRecursively(subfolderId);
  }
  // Delete all documents associated with this folder
  // Efficiently deletes documents and folder
  let documents = folder.documents;
  documents.forEach(async (e) => {
    deleteDocument(e);
  });
  await Folder.deleteOne({ _id: folderId });
  // Remove this folder from parent's subdirs (optional, if maintaining parent integrity)
  if (folder.parent) {
    console.log("routes/course.js::40::folder has paretn");

    folderId = new mongoose.Types.ObjectId(folderId);
    const elementToRemove = folderId.toString() + "F";
    let parent = await Folder.findByIdAndUpdate(
      folder.parent,
      {
        $pull: { subdirs: folderId, order: elementToRemove },
      },
      { new: true },
    );
    return parent._id.toString();
  }
}
// Folder
{
  // create folder
  router.post("/folders", auth_teacher, async (req, res) => {
    const { name, parent } = req.body;
    try {
      if (parent && name) {
        const newFolder = new Folder({
          name: name,
          parent: parent,
          type: "Folder",
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
        console.log(parent);
        res.redirect(`./folders/${parent}`);
      } else {
        res.json({ message: "both name and parent required" });
      }
    } catch (err) {
      console.error("err", err);
      res.status(500).json({ message: err.message });
    }
  });
  // Get all folders
  router.get("/folders", async (req, res) => {
    try {
      const folders = await Folder.find()
        .populate("subdirs")
        .populate("documents");
      res.json(folders);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  // Get a specific folder
  router.get("/folders/:id", async (req, res) => {
    try {
      let folder = await Folder.findById(req.params.id)
        .populate("subdirs", ["name", "_id", "type"])
        .populate("documents", ["name", "_id", "type"]);

      let content = {};
      let folderindex = 0;
      let documentindex = 0;
      content.length = 0;
      for (let i = 0; i < folder.order.length; i++) {
        let lastelement = folder.order[i].slice(-1);
        console.log("routes/course.js::144::" + lastelement);

        if (lastelement == "F") {
          let objId = folder.order[i].slice(0, -1);
          content[i] = folder.subdirs.filter((item) => {
            return item._id.toString() == objId;
          })[0];
          folderindex++;
        } else if (lastelement == "D") {
          let objId = folder.order[i].slice(0, -1);
          content[i] = folder.documents.filter((item) => {
            return item._id.toString() == objId;
          })[0];
          documentindex++;
        }
        if (
          folderindex > folder.subdirs.length ||
          documentindex > folder.documents.length
        ) {
          console.log("err " + folderindex + " " + documentindex);
          break;
        }
        content.length++;
      }
      console.log(content);
      res.render("courses/folder.ejs", { folder: folder, content: content });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  // Update a folder
  router.put("/folder/:id", async (req, res) => {
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
        return res.status(404).json({ message: "Folder not found" });
      res.json(updatedFolder);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  // Delete a folder
  router.post("/folders/delete/:id", async (req, res) => {
    try {
      const parent = await deleteFolderRecursively(req.params.id);
      res.redirect("/api/courses/folders/" + parent);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
}
// Document
{
  // Create Document
  router.post("/document", auth_teacher, async (req, res) => {
    try {
      const { name, parent } = req.body;
      const newDocument = new Document({ name, parent, type: "Document" });
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
      res.redirect(`./folders/${parent}`);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  // Get all Documents
  router.get("/document", auth_teacher, async (req, res) => {
    try {
      const documents = await Document.find().populate("sections");
      res.json(documents);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  // Get a specific document
  router.get("/document/:id", auth_teacher, async (req, res) => {
    try {
      const document = await Document.findById(req.params.id).populate(
        "sections",
      );
      res.render("courses/document", { document: document });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  // Update a document
  router.put("/document/:id", auth_teacher, async (req, res) => {
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
  router.post("/document/delete/:id", auth_teacher, async (req, res) => {
    try {
      const document = await Document.findById(req.params.id);
      if (!document)
        return res.status(404).json({ message: "document not found" });
      deleteDocument(document);
      if (req.body.isAjax) {
        return res.json(document);
      }
      res.redirect("/api/courses/folders/" + document.parent);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
}
// Text
{
  //create a text object

  // Get a specific text object :: is not required here since the section route handles this part

  // Update a text object
  router.post("/text", async (req, res) => {
    const { id, content, name } = req.body;
    if (!content)
      return res.status(400).json({ message: "content field is required" });
    try {
      const updatedSection = await Section.findByIdAndUpdate(
        id,
        { $set: { content: content, name: name } },
        { new: true },
      ); //{new:true}--for it too return the updated document.
      if (!updatedSection)
        return res.status(404).json({ message: "document not found" });
      if (req.body.isAjax) {
        return res.json({ saved: true });
      }
      return res.redirect(
        `/api/courses/document/${updatedSection.document}/text/${updatedSection._id}`,
      );
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: err.message });
    }
  });
  router.get("/document/:id/text/:id2", auth_teacher, async (req, res) => {
    try {
      const document = await Document.findById(req.params.id);
      res.render("courses/edit_text", { document: document });
    } catch (err) {
      res.json({ message: err.message });
    }
  });
}

// Section
{
  // get a specific section
  router.get("/section/:id", auth_teacher, async (req, res) => {
    try {
      const section = await Section.findById(req.params.id).populate(
        "document",
      );
      if (!section)
        return res.status(404).json({ message: "message not found" });
      if (section.type == "Text") {
        section.content = escape(section.content);
        return res.render("courses/text", { section: section });
      } else if (section.type == "Image") {
        res.redirect("/api/courses/image/" + req.params.id);
      } else if (section.type == "Video") {
        res.redirect("/api/courses/video/" + req.params.id);
      }
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  router.post("/section", async (req, res) => {
    try {
      const { type } = req.body;

      const { documentId } = req.body;
      if (type == "Text") {
        const newSection = new Section({
          content: "Edit",
          document: documentId,
          type: "Text",
          name: "untitled",
        });
        const savedSection = await newSection.save();

        // save the new section in the documents list to stay organized and to save query performance later on
        const document = await Document.findByIdAndUpdate(documentId, {
          $push: { sections: savedSection._id },
        });
        res.render("courses/edit_text", {
          document: document,
          section: savedSection,
        });
      } else if (type == "Image") {
        let image;
        if (!req.files || Object.keys(req.files).length === 0) {
          return res.status(400).send("No files were uploaded.");
        }
        image = req.files.buffer;
        uploadPath =
          process.cwd() + "/uploads/" + Math.random() * 10000 + image.name;
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
          res.redirect("/api/courses/image/" + savedSection._id);
        });
      } else if (type == "Video") {
        let image;
        if (!req.files || Object.keys(req.files).length === 0) {
          return res.status(400).send("No files were uploaded.");
        }
        video = req.files.buffer;
        uploadPath =
          process.cwd() + "/uploads/" + Math.random() * 10000 + video.name;
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
          res.redirect("/api/courses/video/" + savedSection._id);
        });
      }
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  router.get("/image/:id", async (req, res) => {
    const section = await Section.findById(req.params.id).populate("document");
    fs.readFile(section.address, (err, data) => {
      if (err) return res.status(500).send("not found");
      res.render("courses/image", {
        section: section,
        data: new Buffer(data).toString("base64"),
        document: section.document,
      });
    });
  });

  router.get("/video/:id", async (req, res) => {
    const section = await Section.findById(req.params.id).populate("document");
    fs.readFile(section.address, (err, data) => {
      if (err) return res.status(500).send("not found");
      res.render("courses/video", {
        section: section,
        data: new Buffer(data).toString("base64"),
        document: section.document,
      });
    });
  });
}

//Course
{
  router.post("/course", auth_teacher, async (req, res) => {
    const { title, discription } = req.body;
    const author = req.teacher.id;
    try {
      const newFolder = new Folder({ name: title, type: "Folder" });
      const savedFolder = await newFolder.save();
      const newCourse = new Course({
        title: title,
        discription: discription,

        owner: author,
        rootFolder: savedFolder._id,
        state: "Pending",
      });

      const savedCourse = await newCourse.save();
      const updateTeacher = await Teacher.findByIdAndUpdate(author, {
        $push: { courses: savedCourse._id },
      });
      res.redirect(`/api/courses/folders/${savedFolder._id}`);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
}

module.exports = router;
// TODO:delete the folder with their sub documents
