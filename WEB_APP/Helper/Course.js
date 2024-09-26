const Section = require("../models/course/Section");
const Folder = require("../models/course/Folder");
const Document = require("../models/course/document");
const mongoose = require("mongoose");
const fs = require('fs')
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
    const deletedFolder = await Folder.deleteOne({ _id: folderId });
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
        
    }
    return deletedFolder;
}


exports.deleteFolderRecursively = deleteFolderRecursively;
exports.deleteDocument = deleteDocument;