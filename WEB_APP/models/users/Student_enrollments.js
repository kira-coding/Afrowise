const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema({
  student: { type:mongoose.Schema.Types.ObjectId, ref:"Student", required: true, },
  course:{type:mongoose.Schema.Types.ObjectId,ref:"Course",required:true},
  completed_folders:[{type:mongoose.Schema.Types.ObjectId,ref:"Folder"}],
  completed_documents:[{type:mongoose.Schema.Types.ObjectId,ref:"Document"}],
   experience :Number
});



module.exports = mongoose.model("Enrollment", enrollmentSchema);