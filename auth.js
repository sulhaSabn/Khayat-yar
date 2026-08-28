const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("./models");


/* =========================================================
   JWT
========================================================= */

function createToken(user) {

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d"
    }
  );
}


/* =========================================================
   SAFE USER
========================================================= */

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


/* =========================================================
   REGISTER
========================================================= */

async function register(req, res) {

  try {

    let {
      name,
      email,
      phone,
      password,
      role = "admin"
    } = req.body || {};

    name = String(name || "").trim();
    email = String(email || "").trim().toLowerCase();
    phone = String(phone || "").trim();
    password = String(password || "");

    if (!name || !password || (!email && !phone)) {

      return res.status(400).json({
        success: false,
        message:
          "نام، رمز عبور و ایمیل یا شماره تلفن الزامی است"
      });

    }

    if (password.length < 8) {

      return res.status(400).json({
        success: false,
        message:
          "رمز عبور باید حداقل ۸ کاراکتر باشد"
      });

    }

    if (!["admin", "manager", "employee"].includes(role)) {
      role = "admin";
    }


    /* بررسی کاربر تکراری */

    const conditions = [];

    if (email) {
      conditions.push({
        email
      });
    }

    if (phone) {
      conditions.push({
        phone
      });
    }

    const exists = conditions.length
      ? await User.findOne({ $or: conditions })
      : null;


    if (exists) {

      return res.status(409).json({
        success: false,
        message:
          "این کاربر قبلاً ثبت شده است"
      });

    }


    /* رمزگذاری */

    const passwordHash =
      await bcrypt.hash(password, 12);


    /* ساخت کاربر */

    const user = await User.create({

      name,

      email: email || undefined,

      phone: phone || undefined,

      passwordHash,

      role,

      isActive: true

    });


    const token = createToken(user);


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

    if (error.code === 11000) {

      return res.status(409).json({
        success: false,
        message:
          "ایمیل یا شماره تلفن قبلاً ثبت شده است"
      });

    }

    return res.status(500).json({
      success: false,
      message: "خطا در ثبت‌نام"
    });

  }

}


/* =========================================================
   LOGIN
========================================================= */

async function login(req, res) {

  try {

    const body = req.body || {};

    /*
      فرانت‌اند فعلی شما phone می‌فرستد.
      نسخه جدید identifier، phone و email را قبول می‌کند.
    */

    const identifier = String(
      body.identifier ||
      body.phone ||
      body.email ||
      ""
    ).trim();

    const password = String(
      body.password || ""
    );


    if (!identifier || !password) {

      return res.status(400).json({
        success: false,
        message:
          "اطلاعات ورود کامل نیست"
      });

    }


    const normalized =
      identifier.toLowerCase();


    const user = await User.findOne({

      $or: [
        {
          email: normalized
        },
        {
          phone: identifier
        }
      ]

    }).select("+passwordHash");


    if (
      !user ||
      !user.isActive ||
      !user.passwordHash
    ) {

      return res.status(401).json({
        success: false,
        message:
          "نام کاربری یا رمز عبور اشتباه است"
      });

    }


    const passwordOK =
      await bcrypt.compare(
        password,
        user.passwordHash
      );


    if (!passwordOK) {

      return res.status(401).json({
        success: false,
        message:
          "نام کاربری یا رمز عبور اشتباه است"
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

}


/* =========================================================
   ME
========================================================= */

async function me(req, res) {

  try {

    const user =
      await User.findById(req.user.id);


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

    console.error(
      "ME ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "خطا در دریافت اطلاعات کاربر"
    });

  }

}


/* =========================================================
   AUTH MIDDLEWARE
========================================================= */

function authRequired(req, res, next) {

  try {

    const header =
      req.headers.authorization || "";


    if (!header.startsWith("Bearer ")) {

      return res.status(401).json({
        success: false,
        message:
          "ابتدا وارد حساب شوید"
      });

    }


    const token =
      header.substring(7).trim();


    if (!token) {

      return res.status(401).json({
        success: false,
        message:
          "توکن ارسال نشده است"
      });

    }


    if (!process.env.JWT_SECRET) {

      console.error(
        "JWT_SECRET is missing"
      );

      return res.status(500).json({
        success: false,
        message:
          "JWT_SECRET در سرور تنظیم نشده است"
      });

    }


    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );


    req.user = decoded;

    next();

  } catch (error) {

    return res.status(401).json({
      success: false,
      message:
        "توکن نامعتبر یا منقضی شده است"
    });

  }

}


/* =========================================================
   ROLES
========================================================= */

function roles(...allowedRoles) {

  return (req, res, next) => {

    if (
      !req.user ||
      !allowedRoles.includes(req.user.role)
    ) {

      return res.status(403).json({
        success: false,
        message:
          "شما اجازه انجام این کار را ندارید"
      });

    }

    next();

  };

}


/* =========================================================
   EXPORT
========================================================= */

module.exports = {

  register,
  login,
  me,
  authRequired,
  roles,
  createToken

};
