const Folder = require('../models/course/Folder')
const Section = require("../models/course/Section")

async function classifyCourse(rootFolderId) {

    const totalDocuments = await countDocuments(rootFolderId);
    const partSize = Math.ceil(totalDocuments / 4);

    await assignParts(rootFolderId, 1, partSize);
}

async function countDocuments(rootFolderId) {

    const folder = await Folder.findById(rootFolderId)
    let count = folder.documents.length;

    for (let i = 0; i < folder.subdirs; i++) {
        count += await countDocuments(folder.subdirs[i]);
    }
    return count;
}

async function assignParts(folderId, currentPart, partSize) {
    const folder = await Folder.findById(folderId)
        .populate('subdirs')
        .populate('documents');

    let partCounter = 0;

    for (const document of folder.documents) {
        if (!document.part) {
            document.part = currentPart;
            await document.save();
        }

        partCounter++;
        if (partCounter >= partSize) {
            currentPart++;
            partCounter = 0;
        }
    }

    for (const subdir of folder.subdirs) {
        await assignParts(subdir._id, currentPart, partSize);
    }
}

async function getCoursePart(rootFolderId, partNumber) {
    const courseStructure = await getCourseStructureByPart(rootFolderId, partNumber);
    return courseStructure;
}

async function getCourseStructureByPart(rootFolderId, partNumber) {
    const rootFolder = await Folder.findById(rootFolderId)
      .populate('subdirs')
      .populate('documents')
  
    // Filter documents based on part number
    const filteredDocuments = rootFolder.documents.filter(document => document.part == partNumber);

    // Create the course structure object
    let  courseStructure = {
      _id: rootFolder._id,
      name: rootFolder.name,
      documents: filteredDocuments,
      subdirs:[],
    };
  
    // Populate sections for each filtered document
    const populatedDocumentsPromises = filteredDocuments.map(async (document) => {
      const documentWithSections = await document.populate('sections');
      return documentWithSections;
    });
  
    // Wait for all document population promises to resolve
    const populatedDocuments = await Promise.all(populatedDocumentsPromises);
    // Add populated documents to course structure
    courseStructure.documents = populatedDocuments;
  
    // Recursively process subdirectories
    for (const subdir of rootFolder.subdirs) {
      const subdirStructure = await getCourseStructureByPart(subdir._id, partNumber);
      courseStructure.subdirs.push(subdirStructure);
    }
    return courseStructure;
    
  }
exports.classifyCourse = classifyCourse;
exports.getCourseStructureByPart = getCourseStructureByPart;