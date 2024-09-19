const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String, default: "Folder"
  }, parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Folder",
    required: true,
  }, //reference to the parent folder to allow backward navigation

  sections: [{ type: mongoose.Schema.Types.ObjectId, ref: "Section" }],
  part:Number,
  course:{type: mongoose.Schema.Types.ObjectId, ref:"Course",required:true}
});

module.exports = mongoose.model("Document", documentSchema);
