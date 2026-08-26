const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("./models");

function createToken(user) {
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

function safeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role
  };
}

async function register(req, res) {
  try {
    const {
      name,
      email,
      phone,
      password,
      role = "admin"
    } = req.body;

    if (!name || !password || (!email && !phone)) {
      return res.status(400).json({
        success: false,
        message: "نام، رمز عبور و ایمیل یا شماره تلفن الزامی است"
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
        email: email.toLowerCase()
      });
    }

    if (phone) {
      conditions.push({
        phone
      });
    }

    const exists = await User.findOne({
      $or: conditions
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        message: "این کاربر قبلاً ثبت شده است"
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email: email ? email.toLowerCase() : undefined,
      phone,
      passwordHash,
      role
    });

    res.status(201).json({
      success: true,
      data: {
        token: createToken(user),
        user: safeUser(user)
      }
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "خطا در ثبت‌نام"
    });
  }
}

async function login(req, res) {
  try {
    const {
      identifier,
      password
    } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "اطلاعات ورود کامل نیست"
      });
    }

    const user = await User.findOne({
      $or: [
        {
          email: identifier.toLowerCase()
        },
        {
          phone: identifier
        }
      ]
    }).select("+passwordHash");

    if (
      !user ||
      !user.isActive ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      return res.status(401).json({
        success: false,
        message: "نام کاربری یا رمز عبور اشتباه است"
      });
    }

    res.json({
      success: true,
      data: {
        token: createToken(user),
        user: safeUser(user)
      }
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "خطا در ورود"
    });
  }
}

async function me(req, res) {
  const user = await User.findById(req.user.id);

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
}

function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || "";

    if (!header.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "ابتدا وارد حساب شوید"
      });
    }

    const token = header.substring(7);

    req.user = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "توکن نامعتبر یا منقضی شده است"
    });
  }
}

function roles(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
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
