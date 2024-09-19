const mongoose = require('mongoose');
const jwt = require("jsonwebtoken")
const config = require("config")
const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    otp: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '3h' // OTP expires after 3 hour
    }
});

otpSchema.methods.generateJWT = function () {
    return jwt.sign({
      id: this._id,
      email:this.email
    },
      config.get("JWT-secret-key"))
  }
const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;