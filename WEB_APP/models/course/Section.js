const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema({
  name: { type: String, required: true, minlength: 1, maxlength: 255 },
  type: {
    type: String,
    required: true,
    enum: ["Text", "Video", "Image"],
  },
  document: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Document",
    required: true,
  },
  content: {
    type: String,
    required: function () {
      return this.type == "Text";
    },
  },
  address: {
    type: mongoose.Schema.Types.String,
    required: function () {
      return this.type == "Video" || this.type == "Image";
    },
  },
});

const Section = mongoose.model("Section", sectionSchema);

module.exports = Section;
