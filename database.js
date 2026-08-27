const mongoose = require("mongoose");

async function connectDatabase() {

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "❌ MONGODB_URI در Render پیدا نشد"
    );
  }

  console.log("🔄 Connecting to MongoDB...");

  // نمایش آدرس بدون نمایش رمز عبور
  const safeUri = uri.replace(
    /mongodb(\+srv)?:\/\/([^:]+):([^@]+)@/,
    "mongodb$1://$2:****@"
  );

  console.log("🔗 MongoDB:", safeUri);

  try {

    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000
    });

    console.log(
      "✅ MongoDB Connected Successfully"
    );

    console.log(
      "📦 Database:",
      mongoose.connection.name
    );

    console.log(
      "🌐 Host:",
      mongoose.connection.host
    );

  } catch (error) {

    console.error(
      "❌ MongoDB Connection Failed:"
    );

    console.error(error.message);

    throw error;
  }
}

module.exports = connectDatabase;
