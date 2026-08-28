require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const {
  register,
  login,
  me,
  authRequired
} = require("./auth");

const customerRoutes = require("./customerRoutes");

/* =========================================================
   APP
========================================================= */

const app = express();

/* =========================================================
   CONFIG
========================================================= */

const PORT = process.env.PORT || 10000;

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

/* =========================================================
   SECURITY CHECK
========================================================= */

if (!MONGODB_URI || !MONGODB_URI.trim()) {
  console.error("❌ MONGODB_URI is not configured");
}

if (!JWT_SECRET || !JWT_SECRET.trim()) {
  console.error("❌ JWT_SECRET is not configured");
}

/* =========================================================
   CORS
========================================================= */

app.use(
  cors({
    origin: true,
    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS"
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization"
    ]
  })
);

/* =========================================================
   BODY PARSER
========================================================= */

app.use(
  express.json({
    limit: "2mb"
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "2mb"
  })
);

/* =========================================================
   REQUEST LOGGER
========================================================= */

app.use((req, res, next) => {
  console.log(
    `${new Date().toISOString()} | ${req.method} | ${req.originalUrl}`
  );

  next();
});

/* =========================================================
   ROOT API
========================================================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    name: "Khayat-Yar API",
    message: "خیاط‌یار API با موفقیت فعال است",
    status: "online",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
    time: new Date().toISOString()
  });
});

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/api/health", (req, res) => {
  const connected =
    mongoose.connection.readyState === 1;

  res.json({
    success: true,
    server: "online",

    database: connected
      ? "connected"
      : "disconnected",

    mongoState:
      mongoose.connection.readyState,

    time: new Date().toISOString()
  });
});

/* =========================================================
   API STATUS
========================================================= */

app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "Khayat-Yar API",
    status: "online",

    routes: {
      health: "/api/health",

      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
        me: "GET /api/auth/me"
      },

      customers: "/api/customers"
    }
  });
});

/* =========================================================
   AUTH ROUTES
========================================================= */

/*
POST /api/auth/register
*/

app.post(
  "/api/auth/register",
  register
);

/*
POST /api/auth/login
*/

app.post(
  "/api/auth/login",
  login
);

/*
GET /api/auth/me
*/

app.get(
  "/api/auth/me",
  authRequired,
  me
);

/* =========================================================
   CUSTOMER ROUTES
========================================================= */

app.use(
  "/api/customers",
  customerRoutes
);

/* =========================================================
   404 HANDLER
========================================================= */

app.use((req, res) => {
  console.log(
    `❌ API NOT FOUND: ${req.method} ${req.originalUrl}`
  );

  res.status(404).json({
    success: false,
    message: "API مورد نظر پیدا نشد",
    path: req.originalUrl,
    method: req.method
  });
});

/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

app.use(
  (error, req, res, next) => {
    console.error(
      "================================="
    );

    console.error(
      "❌ SERVER ERROR"
    );

    console.error(
      error
    );

    console.error(
      "================================="
    );

    /* JSON parse error */

    if (
      error instanceof SyntaxError &&
      error.status === 400 &&
      error.type === "entity.parse.failed"
    ) {
      return res.status(400).json({
        success: false,
        message: "JSON ارسالی نامعتبر است"
      });
    }

    /* Mongoose validation */

    if (
      error.name === "ValidationError"
    ) {
      return res.status(400).json({
        success: false,
        message: "اطلاعات ارسال‌شده معتبر نیست",
        errors: Object.values(
          error.errors || {}
        ).map(
          e => e.message
        )
      });
    }

    /* Duplicate key */

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "این اطلاعات قبلاً ثبت شده است",
        fields: Object.keys(
          error.keyPattern || {}
        )
      });
    }

    /* Cast error */

    if (
      error.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message: "شناسه یا اطلاعات ارسالی نامعتبر است"
      });
    }

    return res.status(500).json({
      success: false,
      message: "خطای داخلی سرور"
    });
  }
);

/* =========================================================
   DATABASE CONNECTION
========================================================= */

async function connectDatabase() {
  if (
    !MONGODB_URI ||
    !MONGODB_URI.trim()
  ) {
    throw new Error(
      "MONGODB_URI is not configured"
    );
  }

  console.log(
    "================================="
  );

  console.log(
    "🔄 Connecting to MongoDB..."
  );

  console.log(
    "📦 Database: Khayat-Yar"
  );

  console.log(
    "================================="
  );

  try {
    await mongoose.connect(
      MONGODB_URI,
      {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000
      }
    );

    console.log(
      "================================="
    );

    console.log(
      "✅ MongoDB Connected Successfully"
    );

    console.log(
      "📦 Database:",
      mongoose.connection.name
    );

    console.log(
      "🟢 MongoDB Status: Connected"
    );

    console.log(
      "================================="
    );

    return mongoose.connection;

  } catch (error) {

    console.error(
      "================================="
    );

    console.error(
      "❌ MongoDB Connection Failed"
    );

    console.error(
      "❌ Error:",
      error.message
    );

    console.error(
      "================================="
    );

    throw error;
  }
}

/* =========================================================
   MONGOOSE EVENTS
========================================================= */

mongoose.connection.on(
  "connected",
  () => {
    console.log(
      "🟢 MongoDB connection established"
    );
  }
);

mongoose.connection.on(
  "error",
  error => {
    console.error(
      "🔴 MongoDB error:",
      error.message
    );
  }
);

mongoose.connection.on(
  "disconnected",
  () => {
    console.log(
      "🟠 MongoDB disconnected"
    );
  }
);

/* =========================================================
   START SERVER
========================================================= */

async function startServer() {
  try {

    /* Check environment */

    if (
      !MONGODB_URI ||
      !MONGODB_URI.trim()
    ) {
      throw new Error(
        "MONGODB_URI is not configured"
      );
    }

    if (
      !JWT_SECRET ||
      !JWT_SECRET.trim()
    ) {
      throw new Error(
        "JWT_SECRET is not configured"
      );
    }

    /* Connect MongoDB */

    await connectDatabase();

    /* Start Express */

    const server = app.listen(
      PORT,
      "0.0.0.0",
      () => {

        console.log(
          "================================="
        );

        console.log(
          "🚀 Khayat-Yar Server Started"
        );

        console.log(
          `🚀 Port: ${PORT}`
        );

        console.log(
          "🌐 Host: 0.0.0.0"
        );

        console.log(
          "🟢 Server: ONLINE"
        );

        console.log(
          "🟢 Database: CONNECTED"
        );

        console.log(
          "================================="
        );
      }
    );

    /* Server error */

    server.on(
      "error",
      error => {

        console.error(
          "❌ HTTP SERVER ERROR:",
          error
        );

        if (
          error.code === "EADDRINUSE"
        ) {
          console.error(
            `❌ Port ${PORT} is already in use`
          );
        }
      }
    );

  } catch (error) {

    console.error(
      "================================="
    );

    console.error(
      "❌ SERVER STARTUP FAILED"
    );

    console.error(
      "❌",
      error.message
    );

    console.error(
      "================================="
    );

    process.exit(1);
  }
}

/* =========================================================
   GRACEFUL SHUTDOWN
========================================================= */

async function shutdown(signal) {

  console.log(
    "================================="
  );

  console.log(
    `${signal} received`
  );

  console.log(
    "🛑 Shutting down server..."
  );

  try {

    if (
      mongoose.connection.readyState !== 0
    ) {

      await mongoose.connection.close();

      console.log(
        "🟢 MongoDB connection closed"
      );
    }

    console.log(
      "🟢 Server shutdown completed"
    );

    console.log(
      "================================="
    );

    process.exit(0);

  } catch (error) {

    console.error(
      "❌ Shutdown error:",
      error.message
    );

    process.exit(1);
  }
}

/* =========================================================
   PROCESS SIGNALS
========================================================= */

process.on(
  "SIGTERM",
  () => shutdown("SIGTERM")
);

process.on(
  "SIGINT",
  () => shutdown("SIGINT")
);

/* =========================================================
   UNHANDLED ERRORS
========================================================= */

process.on(
  "unhandledRejection",
  error => {

    console.error(
      "❌ UNHANDLED REJECTION:"
    );

    console.error(
      error
    );
  }
);

process.on(
  "uncaughtException",
  error => {

    console.error(
      "❌ UNCAUGHT EXCEPTION:"
    );

    console.error(
      error
    );

    process.exit(1);
  }
);

/* =========================================================
   START
========================================================= */

startServer();

/* =========================================================
   EXPORT
========================================================= */

module.exports = app;
