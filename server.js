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

const customerRoutes =
  require("./customerRoutes");


/* =========================================================
   APP
========================================================= */

const app = express();


/* =========================================================
   PORT
========================================================= */

const PORT =
  process.env.PORT || 10000;


/* =========================================================
   MIDDLEWARE
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


app.use(
  express.json({
    limit: "2mb"
  })
);


app.use(
  express.urlencoded({
    extended: true
  })
);


/* =========================================================
   REQUEST LOG
========================================================= */

app.use(
  (req, res, next) => {

    console.log(
      `${new Date().toISOString()} ${req.method} ${req.originalUrl}`
    );

    next();

  }
);


/* =========================================================
   ROOT
========================================================= */

app.get(
  "/",
  (req, res) => {

    res.json({

      success: true,

      name: "Khayat-Yar API",

      message:
        "خیاط‌یار API با موفقیت فعال است",

      status: "online",

      database:
        mongoose.connection.readyState === 1
          ? "connected"
          : "disconnected",

      time:
        new Date().toISOString()

    });

  }
);


/* =========================================================
   HEALTH
========================================================= */

app.get(
  "/api/health",
  (req, res) => {

    const connected =
      mongoose.connection.readyState === 1;


    res.json({

      success: true,

      server: "online",

      database:
        connected
          ? "connected"
          : "disconnected",

      mongoState:
        mongoose.connection.readyState,

      time:
        new Date().toISOString()

    });

  }
);


/* =========================================================
   AUTH
========================================================= */

app.post(
  "/api/auth/register",
  register
);


app.post(
  "/api/auth/login",
  login
);


app.get(
  "/api/auth/me",
  authRequired,
  me
);


/* =========================================================
   CUSTOMER
========================================================= */

app.use(
  "/api/customers",
  customerRoutes
);


/* =========================================================
   404
========================================================= */

app.use(
  (req, res) => {

    res.status(404).json({

      success: false,

      message:
        "API مورد نظر پیدا نشد",

      path:
        req.originalUrl

    });

  }
);


/* =========================================================
   ERROR HANDLER
========================================================= */

app.use(
  (error, req, res, next) => {

    console.error(
      "SERVER ERROR:",
      error
    );


    if (
      error instanceof SyntaxError &&
      error.status === 400 &&
      error.type === "entity.parse.failed"
    ) {

      return res.status(400).json({

        success: false,

        message:
          "JSON ارسالی نامعتبر است"

      });

    }


    return res.status(500).json({

      success: false,

      message:
        "خطای داخلی سرور"

    });

  }
);


/* =========================================================
   DATABASE
========================================================= */

async function connectDatabase() {

  const uri =
    process.env.MONGODB_URI;


  if (!uri || !uri.trim()) {

    throw new Error(
      "MONGODB_URI is not configured"
    );

  }


  console.log(
    "🔄 Connecting to MongoDB..."
  );


  await mongoose.connect(
    uri,
    {

      serverSelectionTimeoutMS:
        10000,

      connectTimeoutMS:
        10000,

      socketTimeoutMS:
        45000

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
  (error) => {

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

    await connectDatabase();


    app.listen(
      PORT,
      "0.0.0.0",
      () => {

        console.log(
          "================================="
        );

        console.log(
          `🚀 Khayat-Yar Server running on port ${PORT}`
        );

        console.log(
          `🌐 API: http://localhost:${PORT}`
        );

        console.log(
          "================================="
        );

      }
    );

  } catch (error) {

    console.error(
      "================================="
    );

    console.error(
      "❌ Server startup failed"
    );

    console.error(
      error.message
    );

    console.error(
      "================================="
    );

    process.exit(1);

  }

}


startServer();


/* =========================================================
   GRACEFUL SHUTDOWN
========================================================= */

async function shutdown(signal) {

  console.log(
    `${signal} received. Shutting down...`
  );


  try {

    await mongoose.connection.close();

    console.log(
      "MongoDB connection closed"
    );

    process.exit(0);

  } catch (error) {

    console.error(
      "Shutdown error:",
      error
    );

    process.exit(1);

  }

}


process.on(
  "SIGTERM",
  () => shutdown("SIGTERM")
);


process.on(
  "SIGINT",
  () => shutdown("SIGINT")
);
