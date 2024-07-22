const mongoose = require("mongoose");
module.exports = async () => {
  mongoose
    .connect("mongodb://127.0.0.1:27017/Afrowise")
    .then((value) => {
      console.log(`Connected to db  `);
    })
    .catch((value) => {
      console.log("There was an error when trying to connect to the database");
      process.exit(1);
    });
};
