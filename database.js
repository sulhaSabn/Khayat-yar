const mongoose = require("mongoose");

async function connectDatabase() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI در فایل .env تنظیم نشده است");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  console.log("✅ MongoDB Connected");
}

module.exports = connectDatabase;
