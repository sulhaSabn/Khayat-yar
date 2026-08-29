const mongoose = require("mongoose");

async function connectDatabase() {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error(
        "MONGODB_URI در Environment Variables تنظیم نشده است"
      );
    }

    // اتصال به MongoDB
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000
    });

    console.log("=================================");
    console.log("✅ MongoDB Connected Successfully");
    console.log("📦 Database:", mongoose.connection.name);
    console.log("=================================");

    // وقتی اتصال قطع شود
    mongoose.connection.on("disconnected", () => {
      console.log("⚠️ MongoDB disconnected");
    });

    // وقتی دوباره وصل شود
    mongoose.connection.on("connected", () => {
      console.log("✅ MongoDB connected");
    });

    // خطای اتصال
    mongoose.connection.on("error", (error) => {
      console.error(
        "❌ MongoDB connection error:",
        error.message
      );
    });

    return mongoose.connection;

  } catch (error) {

    console.error(
      "❌ MongoDB connection failed:"
    );

    console.error(error.message);

    throw error;
  }
}

module.exports = connectDatabase;
