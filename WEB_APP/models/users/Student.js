const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const config = require("config");
const studentSchema = new mongoose.Schema({
  first_name: { type: String, required: true, },
  middle_name: { type: String, required: true, },
  last_name: { type: String, required: true, },
  user_name: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  enrollments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Enrollment' }],
  gender: {
    type: String,
    required: true,
    enum: ['M', "F"],
  },
  email: { type: mongoose.Schema.Types.String, required: true }


});

studentSchema.methods.generateJWT = function () {

  return jwt.sign({
    id: this._id,
    user_name: this.user_name,
    first_name: this.first_name,
    enrollments:this.enrollments
  },
    config.get("JWT-secret-key"))
}

module.exports = mongoose.model("Student", studentSchema);