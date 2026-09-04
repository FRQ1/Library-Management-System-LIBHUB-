const mongoose = require("mongoose");

const dbConnect = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME,
    });

    console.log("Database connection successfully");
  } catch (error) {
    console.log(`Database connection failed: ${error.message}`);
  }
};

module.exports = dbConnect;
