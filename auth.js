const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("./models");

const JWT_SECRET =
  "KHAYAT_YAR_SECRET_2026_CHANGE_THIS_TO_A_LONG_RANDOM_SECRET";


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


// =====================================================
// REGISTER
// =====================================================

async function register(req, res) {
  try {

    const {
      name,
      email,
      phone,
      password,
      role = "admin"
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

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "رمز عبور باید حداقل ۸ کاراکتر باشد"
      });
    }

    const conditions = [];

    if (email) {
      conditions.push({
        email: email.toLowerCase().trim()
      });
    }

    if (phone) {
      conditions.push({
        phone: phone.trim()
      });
    }

    const exists =
      await User.findOne({
        $or: conditions
      });

    if (exists) {
      return res.status(409).json({
        success: false,
        message: "این ایمیل یا شماره تلفن قبلاً ثبت شده است"
      });
    }

    const passwordHash =
      await bcrypt.hash(password, 12);

    const user =
      await User.create({
        name: name.trim(),

        email: email
          ? email.toLowerCase().trim()
          : undefined,

        phone: phone
          ? phone.trim()
          : undefined,

        passwordHash,

        role: [
          "admin",
          "manager",
          "employee"
        ].includes(role)
          ? role
          : "admin"
      });

    const token =
      createToken(user);

    return res.status(201).json({
      success: true,
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

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "ایمیل یا شماره تلفن قبلاً ثبت شده است"
      });
    }

    return res.status(500).json({
      success: false,
      message: "خطا در ثبت‌نام"
    });
  }
}


// =====================================================
// LOGIN
// =====================================================

async function login(req, res) {
  try {

    const {
      identifier,
      password
    } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "ایمیل/شماره تلفن و رمز عبور الزامی است"
      });
    }

    const value =
      identifier.trim();

    const conditions = [
      {
        email: value.toLowerCase()
      },
      {
        phone: value
      }
    ];

    const user =
      await User.findOne({
        $or: conditions
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

    const correct =
      await bcrypt.compare(
        password,
        user.passwordHash
      );

    if (!correct) {
      return res.status(401).json({
        success: false,
        message: "رمز عبور اشتباه است"
      });
    }

    return res.json({
      success: true,
      data: {
        token: createToken(user),
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
}


// =====================================================
// ME
// =====================================================

async function me(req, res) {

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

    return res.json({
      success: true,
      data: safeUser(user)
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "خطا در دریافت حساب"
    });
  }
}


// =====================================================
// AUTH MIDDLEWARE
// =====================================================

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
      jwt.verify(
        token,
        JWT_SECRET
      );

    req.user = decoded;

    next();

  } catch (error) {

    return res.status(401).json({
      success: false,
      message: "توکن نامعتبر یا منقضی شده است"
    });
  }
}


// =====================================================
// ROLES
// =====================================================

function roles(...allowedRoles) {

  return (req, res, next) => {

    if (
      !req.user ||
      !allowedRoles.includes(
        req.user.role
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "شما اجازه انجام این کار را ندارید"
      });
    }

    next();
  };
}


module.exports = {
  register,
  login,
  me,
  authRequired,
  roles
};
