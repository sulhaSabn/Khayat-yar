const mongoose = require("mongoose");

async function connectDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri || !uri.trim()) {
    throw new Error("MONGODB_URI is not configured");
  }

  console.log("🔄 Connecting to MongoDB...");
  console.log("📦 Database: Khayat");

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000
    });

    console.log("=================================");
    console.log("✅ MongoDB Connected Successfully");
    console.log("📦 Database:", mongoose.connection.name);
    console.log("🟢 MongoDB Status: Connected");
    console.log("=================================");

    return mongoose.connection;
  } catch (error) {
    console.error("=================================");
    console.error("❌ MongoDB Connection Failed");
    console.error("❌ Error:", error.message);
    console.error("=================================");

    throw error;
  }
}

module.exports = connectDatabase;
