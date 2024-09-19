const jwt = require("jsonwebtoken");
const config = require("config");
module.exports = function (req, res, next) {
    try{  let otp;

  otp = jwt.verify(req.cookies.otp, config.get("JWT-secret-key"));

  if(!otp) return res.status(403).send("Email is not registered");
  req.otp=otp
  next()
    }catch(err){
        return res.status(403).send("something happened")
    }
  
};