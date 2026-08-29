const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

const PORT = process.env.PORT || 5000;

// =========================
// Middleware
// =========================

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// =========================
// MongoDB
// =========================

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI در Environment Variables وجود ندارد");
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
  })
  .catch((err) => {
    console.error("❌ MongoDB Error:", err.message);
    process.exit(1);
  });

// =========================
// User Model
// =========================

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true
    },

    phone: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },

    passwordHash: {
      type: String,
      required: true,
      select: false
    },

    role: {
      type: String,
      enum: ["admin", "staff"],
      default: "admin"
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

const User =
  mongoose.models.User ||
  mongoose.model("User", userSchema);

// =========================
// JWT
// =========================

const JWT_SECRET =
  process.env.JWT_SECRET || "CHANGE_THIS_SECRET_KEY";

// =========================
// Token
// =========================

function createToken(user) {
  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role
    },
    JWT_SECRET,
    {
      expiresIn: "7d"
    }
  );
}

// =========================
// Safe User
// =========================

function safeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email || "",
    phone: user.phone || "",
    role: user.role,
    isActive: user.isActive
  };
}

// =========================
// Auth Middleware
// =========================

function authRequired(req, res, next) {

  try {

    const header =
      req.headers.authorization || "";

    if (!header.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "ابتدا وارد حساب شوید"
      });
    }

    const token =
      header.substring(7);

    const decoded =
      jwt.verify(token, JWT_SECRET);

    req.user = decoded;

    next();

  } catch (error) {

    return res.status(401).json({
      success: false,
      message: "جلسه ورود منقضی شده است"
    });

  }
}

// =========================
// HEALTH
// =========================

app.get("/api/health", (req, res) => {

  res.json({
    success: true,
    server: "online",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected"
  });

});

// =========================
// REGISTER
// =========================

app.post("/api/auth/register", async (req, res) => {

  try {

    const {
      name,
      email,
      phone,
      password
    } = req.body;

    if (!name || !password) {
      return res.status(400).json({
        success: false,
        message: "نام و رمز عبور الزامی است"
      });
    }

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: "ایمیل یا شماره تلفن الزامی است"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "رمز عبور حداقل باید ۶ کاراکتر باشد"
      });
    }

    const normalizedEmail =
      email
        ? String(email).trim().toLowerCase()
        : undefined;

    const normalizedPhone =
      phone
        ? String(phone).trim()
        : undefined;

    // بررسی کاربر قبلی

    const conditions = [];

    if (normalizedEmail) {
      conditions.push({
        email: normalizedEmail
      });
    }

    if (normalizedPhone) {
      conditions.push({
        phone: normalizedPhone
      });
    }

    const existingUser =
      await User.findOne({
        $or: conditions
      });

    if (existingUser) {

      return res.status(409).json({
        success: false,
        message: "این ایمیل یا شماره تلفن قبلاً ثبت شده است"
      });

    }

    // Hash Password

    const passwordHash =
      await bcrypt.hash(password, 12);

    // Create User

    const user =
      await User.create({
        name: String(name).trim(),

        email:
          normalizedEmail,

        phone:
          normalizedPhone,

        passwordHash,

        role: "admin",

        isActive: true
      });

    const token =
      createToken(user);

    return res.status(201).json({

      success: true,

      message: "ثبت‌نام با موفقیت انجام شد",

      data: {
        token,
        user: safeUser(user)
      }

    });

  } catch (error) {

    console.error(
      "REGISTER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "خطا در ثبت‌نام"
    });

  }

});

// =========================
// LOGIN
// =========================

app.post("/api/auth/login", async (req, res) => {

  try {

    const {
      identifier,
      password
    } = req.body;

    if (!identifier || !password) {

      return res.status(400).json({
        success: false,
        message: "ایمیل/شماره تلفن و رمز عبور را وارد کنید"
      });

    }

    const value =
      String(identifier).trim();

    const emailValue =
      value.toLowerCase();

    const user =
      await User.findOne({
        $or: [
          {
            email: emailValue
          },
          {
            phone: value
          }
        ]
      }).select("+passwordHash");

    if (!user) {

      return res.status(401).json({
        success: false,
        message: "کاربر پیدا نشد"
      });

    }

    if (!user.isActive) {

      return res.status(403).json({
        success: false,
        message: "حساب کاربری غیرفعال است"
      });

    }

    const passwordCorrect =
      await bcrypt.compare(
        password,
        user.passwordHash
      );

    if (!passwordCorrect) {

      return res.status(401).json({
        success: false,
        message: "رمز عبور اشتباه است"
      });

    }

    const token =
      createToken(user);

    return res.json({

      success: true,

      message: "ورود موفق بود",

      data: {
        token,
        user: safeUser(user)
      }

    });

  } catch (error) {

    console.error(
      "LOGIN ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "خطا در ورود"
    });

  }

});

// =========================
// ME
// =========================

app.get(
  "/api/auth/me",
  authRequired,
  async (req, res) => {

    try {

      const user =
        await User.findById(
          req.user.id
        );

      if (!user) {

        return res.status(404).json({
          success: false,
          message: "کاربر پیدا نشد"
        });

      }

      res.json({
        success: true,
        data: safeUser(user)
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        success: false,
        message: "خطا در دریافت اطلاعات کاربر"
      });

    }

  }
);

// =========================
// LOGOUT
// =========================

app.post(
  "/api/auth/logout",
  authRequired,
  (req, res) => {

    res.json({
      success: true,
      message: "خروج موفق بود"
    });

  }
);

// =========================
// TEST AUTH
// =========================

app.get(
  "/api/test-auth",
  authRequired,
  (req, res) => {

    res.json({
      success: true,
      message: "احراز هویت صحیح است",
      user: req.user
    });

  }
);

// =========================
// 404
// =========================

app.use((req, res) => {

  res.status(404).json({
    success: false,
    message: "API مورد نظر پیدا نشد"
  });

});

// =========================
// SERVER
// =========================

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `🚀 Khayat-Yar Server running on port ${PORT}`
    );

    console.log(
      `🌐 API: http://localhost:${PORT}`
    );

  }
);
