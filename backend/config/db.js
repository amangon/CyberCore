const mongoose = require("mongoose");
const winston = require("../utils/logger");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    winston.info(`MongoDB Host: ${conn.connection.host}`);
    winston.info(`MongoDB Database: ${conn.connection.name}`);
    winston.info(`MongoDB URI: ${process.env.MONGO_URI}`);
  } catch (error) {
    winston.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;