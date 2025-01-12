
const mongoose = require("mongoose");

require("dotenv").config({path: 'config.env'});

const url = 'mongodb+srv://Matrix:200417@cluster-videostream.yrvdp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster-VideoStream';
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
