const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const config = require("config");
const teacherSchema = new mongoose.Schema({
  first_name: { type: String, required: true, },
  middle_name: { type: String, required: true, },
  last_name: { type: String, required: true, },

  user_name: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required:true},
  courses:[{type:mongoose.Schema.Types.ObjectId,ref:'Course'}]
});
teacherSchema.methods.generateJWT = function () {
  return jwt.sign({
    id: this._id,
    user_name: this.user_name,
    first_name: this.first_name,
    middle_name: this.middle_name
  },
    config.get("JWT-secret-key"))
}

module.exports = mongoose.model("Teacher", teacherSchema);