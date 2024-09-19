const mongoose = require("mongoose");

const folderSchema = new mongoose.Schema({
  name: { type: String, unique: false },
  type: String,
  parent: { type: mongoose.Schema.Types.ObjectId, ref: "Folder" }, //reference to the parent folder to allow forward and backward navigation
  subdirs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Folder" }], // reference to subdir
  documents: [{ type: mongoose.Schema.Types.ObjectId, ref: "Document" }], // reference to documents
  order: [String],
  course:{type: mongoose.Schema.Types.ObjectId, ref:"Course",}
});

module.exports = mongoose.model("Folder", folderSchema);
