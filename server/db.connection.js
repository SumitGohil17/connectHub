
const mongoose = require("mongoose");

require("dotenv").config({path: 'config.env'});

const url = process.env.DB_URL;
const connectToMongo = () => {
  mongoose
    .connect(url )
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((error) => {
      console.log("Error connecting to MongoDB", error);
    });
};

module.exports = connectToMongo;
