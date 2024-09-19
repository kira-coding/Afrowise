const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const config = require("config");
const adminSchema = new mongoose.Schema({
  first_name: { type: String, required: true, },
  last_name: { type: String, required: true, },
  user_name: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  permissions:[{type:mongoose.Schema.Types.String}],
  email:{type:mongoose.Schema.Types.String,required:true},
  profile_picture:{type:mongoose.Schema.Types.String}
});

adminSchema.methods.generateJWT= function () {
  return jwt.sign({
    id: this._id,
    user_name: this.user_name,
    first_name: this.first_name,
    last_name: this.last_name,
    permissions:this.permissions,
    profile_picture: this.profile_picture
  },
    config.get("JWT-secret-key"))
}

module.exports = mongoose.model("Admin", adminSchema);