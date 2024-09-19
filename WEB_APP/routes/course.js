const express = require("express");
const router = express.Router();
const Folder = require("../models/course/Folder");
const Document = require("../models/course/document");
const escape = require("escape-html");
const Section = require("../models/course/Section");
const Course = require("../models/course/Course");
const Teacher = require("../models/users/Teacher");
const fs = require("fs");
const path = require("path");
const auth_teacher = require("../middlewares/auth_teacher");
const { render } = require("ejs");
const { default: mongoose } = require("mongoose");

async function deleteDocument(document) {
  let sections = document.sections;
  await Promise.all(sections.map(async (sectionId) => {
    try {
      let section = await Section.findByIdAndDelete({ _id: sectionId });
      if (section.type == "Video" || section.type == "Image") {
        fs.unlink(section.address, (err) => {
          if (err) {
            console.log("failed to remove  " + section.type + " at " + section.address)
          }
        })
      }
    } catch (error) {
      console.error(`Error deleting section: ${error}`);
    }
  }));

  try {
    await Document.findByIdAndDelete(document._id);
  } catch (error) {
    console.error(`Error deleting document: ${error}`);
  }

  let documentId = document._id;
  const elementToRemove = documentId.toString() + "D";
  console.log("routes/course.js::40::folder has parent");
  let parent;
  try {
    parent = await Folder.findByIdAndUpdate(
      document.parent,
      {
        $pull: { documents: documentId, order: elementToRemove },
      },
      { new: true },
    );
  } catch (error) {
    console.error(`Error updating parent folder: ${error}`);
  }
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
    console.log("routes/course.js::40::folder has parent");

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
  router.post("/folders/:course", auth_teacher, async (req, res) => {
    const { name, parent } = req.body;
    try {

      const course = await Course.findById( req.params.course);
      
      if (!(req.teacher.id === course.owner.toString())) return res.status(403).json({ message: "Not allowed" });
        
      if (parent && name) {
        const newFolder = new Folder({
          name: name,
          parent: parent,
          type: "Folder",
          course:course._id.toString(),
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
        res.redirect(`../folders/${parent}/${req.params.course}`);
      } else {
        res.json({ message: "both name and parent required" });
      }
    } catch (err) {
      console.error("err", err);
      res.status(500).json({ message: err.message });
    }
  });
  // Get a specific folder
  router.get("/folders/:id/:course", async (req, res) => {

    try {
      let teacher = req.cookies.teacher
      let admin = req.cookies.admin
      if (!admin && !teacher) {
        return res.status(403).send("not allowed");
        // TODO verify either tokens
      }

      // TODO: verify each token
      let folder = await Folder.findById(req.params.id)
        .populate("subdirs", ["name", "_id", "type"])
        .populate("documents", ["name", "_id", "type"]);
      if (!(folder.course.toString() ===req.params.course)) return res.status(404).send("Course is not for this folder");
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
      res.render("courses/folder.ejs", { folder: folder, content: content,course:req.params.course });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  // Update a folder
  router.put("/folder/:id", auth_teacher, async (req, res) => {
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
  router.post("/folders/delete/:id", auth_teacher, async (req, res) => {
    try {
      const parent = await deleteFolderRecursively(req.params.id);
      res.redirect("/api/courses/folders/" + parent);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  router.post("/folders/moveup/:id", auth_teacher, async (req, res) => {
    try {
      let folder = await Folder.findById(req.params.id)
      let parent = await Folder.findById(folder.parent)
      let element = folder._id + "F"
      let pos = parent.order.indexOf(element)
      if (pos <= 0);
      else {
        let temp = parent.order[pos - 1]
        parent.order[pos - 1] = element
        parent.order[pos] = temp
        console.log(parent.order.toLocaleString())
        await parent.save()

      }

      res.redirect(`../${parent._id}/${parent.course.toString()}`)
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  })

}

// Document
{
  // Create Document
  router.post("/document/:course", auth_teacher, async (req, res) => {
    try {
      const course = await Course.findById( req.params.course);
      if (!(req.teacher.id=== course.owner.toString())) return res.status(403).json({ message: "Not allowed" })
    
      const { name, parent } = req.body;
      const newDocument = new Document({ name, parent, type: "Document",course:req.params.course });
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
      res.redirect(`../folders/${parent}/${req.params.course}`);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  // Get a specific document
  router.get("/document/:id/:course", async (req, res) => {
    // try {
    let teacher = req.cookies.teacher
    let admin = req.cookies.admin
    if (!admin && !teacher) {
      return res.status(403).send("not allowed");
      // TODO verify either tokens
    }
    const document = await Document.findById(req.params.id).populate(
      "sections",
    );
    console.log(document);
    if (!(document.course.toString() ===req.params.course)) return res.status(404).send("Course is not for this document");
       
    res.render("courses/document", { document: document,course:req.params.course });
    // } catch (err) {
    //   res.status(500).json({ message: err.message });
    // }
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
  router.post("/document/moveup/:id", auth_teacher, async (req, res) => {
    try {
      let document = await Document.findById(req.params.id)
      let parent = await Folder.findById(document.parent)
      let element = document._id + "D"
      let pos = parent.order.indexOf(element)
      if (pos - 1 < 0);
      else {
        let temp = parent.order[pos - 1]
        parent.order[pos - 1] = element
        parent.order[pos] = temp
        await parent.save()
      }
      res.redirect(`/api/courses/folders/${parent._id}/${parent.course.toString()}`)
    } catch (err) {
      res.status(400).json({ message: err.message })
    }
  })
}
// Text
{
  //create a text object

  // Get a specific text object :: is not required here since the section route handles this part

  // Update a text object
  router.post("/text", auth_teacher, async (req, res) => {
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

// question {multiple choice , multiple answer ,matching , order,}

{
  router.get("/question/:id", auth_teacher, async (req, res) => {
    // The Id of the document that a question is going to be created on.
    try {
      const document = await Document.findById(req.params.id);
      res.render("courses/question", { document: document })
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  })
  router.post('/question/:id/multiplechoice', auth_teacher, async (req, res) => {
    try {
      let question = {
        type: "multipleChoice",
        multipleChoice: {
          instruction: req.body.instruction,
          correctAnswer: req.body.correct_answer,
          options: req.body.options
        }
      }
      let document = await Document.findById(req.params.id)
      let section = new Section({
        name: "Quize",
        type: "Question",
        question: question,
        document: document._id
      })
      section = await section.save()
      document.sections.push(section._id);
      await document.save()
      res.json(section)
    } catch (err) {
      res.status(400).json({ message: err.message })
    }

  })
  router.post("/question/:id/multipleanswer", auth_teacher, async (req, res) => {
    try {
      let document = await Document.findById(req.params.id)
      let multipleAnswer = {
        instruction: req.body.instruction,
        options: req.body.options,
        correctAnswers: req.body.answers
      }
      let question = {
        type: "multipleAnswer",
        multipleAnswer: multipleAnswer
      }
      let section = new Section({
        name: "Quize",
        type: "Question",
        question: question
      })
      section = await section.save()
      document.sections.push(section._id)
      await document.save()
      res.json(section)
    } catch (err) {
      res.status(400).send(err.message)
    }
  })
  router.post("/question/:id/order", auth_teacher, async (req, res) => {
    try {
      let document = await Document.findById(req.params.id)
      let order = {
        instruction: req.body.instruction,
        correctlyOrdered: req.body.ordered,
      }
      let question = {
        type: "order",
        order: order
      }
      let section = new Section({
        name: "Quize",
        type: "Question",
        question: question,
        document: document._id
      })
      section = await section.save()
      document.sections.push(section._id)
      await document.save()
      res.json(section)
    } catch (err) {
      res.status(400).send(err.message)
    }

  })
  router.post("/question/:id/matching", auth_teacher, async (req, res) => {
    try {
      let document = await Document.findById(req.params.id)
      let matching = {
        instruction: req.body.instruction,
        firstColumn: req.body.one,
        secondColumn: req.body.two

      }

      let question = {
        type: "matching",
        matching: matching
      }
      let section = new Section({
        name: "Quize",
        type: "Question",
        question: question,
        document: document._id
      })
      section = await section.save()
      document.sections.push(section._id)
      await document.save()
      res.json(section)
    } catch (err) {
      res.json(err.message)
    }
  }
  )

}
// Section

{

  // get a specific section
  router.get("/section/:id", async (req, res) => {
    try {
      let teacher = req.cookies.teacher
      let admin = req.cookies.admin
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
        return res.render("courses/text", { section: section });
      } else if (section.type == "Image") {
        res.redirect("/api/courses/image/" + req.params.id);
      } else if (section.type == "Video") {
        res.redirect("/api/courses/video/" + req.params.id);
      } else if (section.type == "Question") {
        res.redirect("/api/courses/question" + req.params.id)
      }
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  router.post("/section/:course", auth_teacher, async (req, res) => {
    // try {
    const course = await Course.findById(req.params.course)
    if (!(req.teacher.id  === course.owner.toString())) return res.status(403).json({ message: "Not allowed" })
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
      res.render("courses/edit_text", {
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
      console.log(image.name)
      let rootFolder = path.join(process.cwd(), "uploads", course.rootFolder.toString());
       fs.access(rootFolder, fs.constants.F_OK,async (err)=>{
        if (err) {
          console.log('Directory already exists:', rootFolder);
          if (err.code === 'ENOENT') {
            fs.mkdir(rootFolder, { recursive: true },(error)=>{
              if(error) return res.send(error);
              console.log('Directory created:', rootFolder);
            });
            
          } else {
            throw err; // Handle other errors
          }
        }
       })
       
      
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
          res.redirect("/api/courses/image/" + savedSection._id);
        });
    }
    else if (type == "Video") {
      let video;
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send("No files were uploaded.");
      }
      video = req.files.buffer;
      let rootFolder = path.join(process.cwd(), "uploads", course.rootFolder.toString());
      
      fs.access(rootFolder, fs.constants.F_OK,async (err)=>{
        if (err) {
          console.log('Directory already exists:', rootFolder);
          if (err.code === 'ENOENT') {
            fs.mkdir(rootFolder, { recursive: true },(error)=>{
              if(error) return res.send(error);
              console.log('Directory created:', rootFolder);
            });
            
          } else {
            throw err; // Handle other errors
          }
        }
       })
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
        res.redirect("/api/courses/video/" + savedSection._id);
      });
    }
    // } catch (err) {
    //   console.log("error")
    //   res.status(500).json({ message: err});
    // }
  });
  router.get("/section/delete/:id", auth_teacher, async (req, res) => {
    try {
      let section = await Section.findByIdAndDelete(req.params.id)
      let parent = await Document.findByIdAndUpdate(section.document, { $pull: { sections: section._id } })
      if (section.type == "Video" || section.type == "Image") {
        fs.unlink(section.address, (err) => {
          if (err) {
            console.log("failed to remove  " + section.type + " at " + section.address)
          }
        })
      }
      res.redirect('/api/courses/document/' + parent._id)

    } catch (error) {
      res.status(400).send(error.message)

    }
  })
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
    let teacher = req.cookies.teacher
    let admin = req.cookies.admin
    if (!admin && !teacher) {
      return res.status(403).send("not allowed");
      // TODO verify either tokens
    }
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
  router.get('/question/:id', async (req, res) => {
    try {
      let teacher = req.cookies.teacher
      let admin = req.cookies.admin
      if (!admin && !teacher) {
        return res.status(403).send("not allowed");
        // TODO verify either tokens
      }
      let section = await Section.findById(req.params.id)
      res.render('courses/question_preview', { section: section })
    } catch (err) {
      res.status(400).send(err.message)
    }
  })
}

//Course
{
  router.post("/course", auth_teacher, async (req, res) => {
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
      const updateTeacher = await Teacher.findByIdAndUpdate(author, {
        $push: { courses: savedCourse._id },
      });
     savedFolder.course = savedCourse._id.toString()
     await savedFolder.save()
      res.redirect(`/api/courses/folders/${savedFolder._id}/${savedCourse._id.toString()}`);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  router.post("/course/post/:id", auth_teacher, async (req, res) => {
    try {
      const course = await Course.findByIdAndUpdate(req.params.id, { state: "Submitted" })
      res.redirect("/user/teacher/courses");
    } catch (err) {
      res.send(err.message);
    }
  })
  router.get("/course/delete/:id", auth_teacher, async (req, res) => {
    try {
      const course = await Course.findByIdAndDelete(req.params.id)
      await deleteFolderRecursively(course.rootFolder)
      res.redirect("/user/teacher/courses");
    } catch (err) {
      res.send(err.message);
    }
  })

  router.get("/search/:query", async (req, res) => {
    try {
      let teacher = req.teacher
      let admin = req.admin
      if (!admin && !teacher) {
        return res.status(403).send("not allowed");
        // TODO verify either tokens
      }
      const results = await Course.find({
        $text: { $search: req.params.query }
      })
        .limit(5);
      res.json(results);
    } catch (err) {
      res.send(err.message);
    }
  })
}

module.exports = router;