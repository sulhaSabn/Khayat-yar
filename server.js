const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const {
  Customer,
  Measurement,
  Order,
  Payment,
  Expense,
  Inventory,
  Invoice,
  Employee,
  Notification,
  Setting
} = require("./models");

const app = express();

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_THIS_SECRET";

// ======================================================
// MIDDLEWARE
// ======================================================

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ======================================================
// USER MODEL
// ======================================================

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

// ======================================================
// DATABASE
// ======================================================

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI در Environment Variables تنظیم نشده است");
  process.exit(1);
}

// ======================================================
// JWT
// ======================================================

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

// ======================================================
// AUTH MIDDLEWARE
// ======================================================

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

    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "توکن نامعتبر یا منقضی شده است"
    });
  }
}

function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "دسترسی فقط برای مدیر مجاز است"
    });
  }

  next();
}

// ======================================================
// HEALTH
// ======================================================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    server: "online",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
    time: new Date().toISOString()
  });
});

// ======================================================
// ROOT
// ======================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "خیاط‌یار API فعال است",
    version: "1.0.0",
    api: "/api/health"
  });
});

// ======================================================
// AUTH - REGISTER
// ======================================================

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

    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message: "رمز عبور حداقل ۶ کاراکتر باشد"
      });
    }

    const normalizedEmail = email
      ? String(email).trim().toLowerCase()
      : undefined;

    const normalizedPhone = phone
      ? String(phone).trim()
      : undefined;

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

    const existing = await User.findOne({
      $or: conditions
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "این ایمیل یا شماره تلفن قبلاً ثبت شده است"
      });
    }

    const passwordHash = await bcrypt.hash(
      String(password),
      12
    );

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      passwordHash,
      role: "admin",
      isActive: true
    });

    const token = createToken(user);

    res.status(201).json({
      success: true,
      message: "ثبت‌نام با موفقیت انجام شد",
      data: {
        token,
        user: safeUser(user)
      }
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "ایمیل یا شماره تلفن قبلاً استفاده شده است"
      });
    }

    res.status(500).json({
      success: false,
      message: "خطا در ثبت‌نام"
    });
  }
});

// ======================================================
// AUTH - LOGIN
// ======================================================

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

    const value = String(identifier).trim();

    const user = await User.findOne({
      $or: [
        {
          email: value.toLowerCase()
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

    const correct = await bcrypt.compare(
      String(password),
      user.passwordHash
    );

    if (!correct) {
      return res.status(401).json({
        success: false,
        message: "رمز عبور اشتباه است"
      });
    }

    const token = createToken(user);

    res.json({
      success: true,
      message: "ورود موفق بود",
      data: {
        token,
        user: safeUser(user)
      }
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    res.status(500).json({
      success: false,
      message: "خطا در ورود"
    });
  }
});

// ======================================================
// AUTH - ME
// ======================================================

app.get(
  "/api/auth/me",
  authRequired,
  async (req, res) => {
    try {
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
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "خطا در دریافت اطلاعات"
      });
    }
  }
);

// ======================================================
// LOGOUT
// ======================================================

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

// ======================================================
// CUSTOMERS - LIST
// ======================================================

app.get(
  "/api/customers",
  authRequired,
  async (req, res) => {
    try {
      const search = String(
        req.query.search || ""
      ).trim();

      const gender = req.query.gender;

      const filter = {};

      if (search) {
        filter.$or = [
          {
            name: {
              $regex: search,
              $options: "i"
            }
          },
          {
            phone: {
              $regex: search,
              $options: "i"
            }
          }
        ];
      }

      if (
        gender === "male" ||
        gender === "female"
      ) {
        filter.gender = gender;
      }

      const customers =
        await Customer.find(filter)
          .sort({ createdAt: -1 });

      res.json({
        success: true,
        count: customers.length,
        data: customers
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: "خطا در دریافت مشتریان"
      });
    }
  }
);

// ======================================================
// CUSTOMER - GET ONE
// ======================================================

app.get(
  "/api/customers/:id",
  authRequired,
  async (req, res) => {
    try {
      const customer =
        await Customer.findById(req.params.id);

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "مشتری پیدا نشد"
        });
      }

      const measurements =
        await Measurement.find({
          customerId: customer._id
        }).sort({ createdAt: -1 });

      const orders =
        await Order.find({
          customerId: customer._id
        }).sort({ createdAt: -1 });

      res.json({
        success: true,
        data: {
          customer,
          measurements,
          orders
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "خطا در دریافت مشتری"
      });
    }
  }
);

// ======================================================
// CUSTOMER - CREATE
// ======================================================

app.post(
  "/api/customers",
  authRequired,
  async (req, res) => {
    try {
      const {
        name,
        phone,
        address,
        gender,
        notes
      } = req.body;

      if (!name || !phone || !gender) {
        return res.status(400).json({
          success: false,
          message:
            "نام، شماره تلفن و جنسیت الزامی است"
        });
      }

      if (
        gender !== "male" &&
        gender !== "female"
      ) {
        return res.status(400).json({
          success: false,
          message: "جنسیت نامعتبر است"
        });
      }

      const customer =
        await Customer.create({
          name: String(name).trim(),
          phone: String(phone).trim(),
          address: address || "",
          gender,
          notes: notes || ""
        });

      res.status(201).json({
        success: true,
        message: "مشتری با موفقیت ثبت شد",
        data: customer
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: "خطا در ثبت مشتری"
      });
    }
  }
);

// ======================================================
// CUSTOMER - UPDATE
// ======================================================

app.put(
  "/api/customers/:id",
  authRequired,
  async (req, res) => {
    try {
      const allowed = [
        "name",
        "phone",
        "address",
        "gender",
        "notes"
      ];

      const update = {};

      for (const key of allowed) {
        if (req.body[key] !== undefined) {
          update[key] = req.body[key];
        }
      }

      if (
        update.gender &&
        !["male", "female"].includes(
          update.gender
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "جنسیت نامعتبر است"
        });
      }

      const customer =
        await Customer.findByIdAndUpdate(
          req.params.id,
          update,
          {
            new: true,
            runValidators: true
          }
        );

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "مشتری پیدا نشد"
        });
      }

      res.json({
        success: true,
        message: "اطلاعات مشتری بروزرسانی شد",
        data: customer
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "خطا در بروزرسانی مشتری"
      });
    }
  }
);

// ======================================================
// CUSTOMER - DELETE
// ======================================================

app.delete(
  "/api/customers/:id",
  authRequired,
  async (req, res) => {
    try {
      const customer =
        await Customer.findByIdAndDelete(
          req.params.id
        );

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "مشتری پیدا نشد"
        });
      }

      await Measurement.deleteMany({
        customerId: customer._id
      });

      res.json({
        success: true,
        message: "مشتری حذف شد"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "خطا در حذف مشتری"
      });
    }
  }
);

// ======================================================
// MEASUREMENTS - LIST CUSTOMER
// ======================================================

app.get(
  "/api/customers/:customerId/measurements",
  authRequired,
  async (req, res) => {
    try {
      const customer =
        await Customer.findById(
          req.params.customerId
        );

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "مشتری پیدا نشد"
        });
      }

      const measurements =
        await Measurement.find({
          customerId: customer._id
        }).sort({ createdAt: -1 });

      res.json({
        success: true,
        customerGender: customer.gender,
        data: measurements
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "خطا در دریافت اندازه‌ها"
      });
    }
  }
);

// ======================================================
// MEASUREMENT - CREATE
// ======================================================

app.post(
  "/api/customers/:customerId/measurements",
  authRequired,
  async (req, res) => {
    try {
      const customer =
        await Customer.findById(
          req.params.customerId
        );

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "مشتری پیدا نشد"
        });
      }

      /*
        جنسیت همیشه از مشتری گرفته می‌شود.
        بنابراین نمی‌توان برای مشتری مرد
        اندازه زنانه ثبت کرد و برعکس.
      */

      const gender = customer.gender;

      const {
        unit = "cm",
        notes = ""
      } = req.body;

      let measurementData = {};

      if (gender === "male") {
        measurementData.male =
          req.body.male || {};
      }

      if (gender === "female") {
        measurementData.female =
          req.body.female || {};
      }

      const measurement =
        await Measurement.create({
          customerId: customer._id,
          gender,
          unit,
          ...measurementData,
          notes
        });

      res.status(201).json({
        success: true,
        message:
          gender === "male"
            ? "اندازه‌های مردانه ثبت شد"
            : "اندازه‌های زنانه ثبت شد",
        data: measurement
      });
    } catch (error) {
      console.error(
        "MEASUREMENT CREATE ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message: "خطا در ثبت اندازه‌ها",
        error: error.message
      });
    }
  }
);

// ======================================================
// MEASUREMENT - GET
// ======================================================

app.get(
  "/api/measurements/:id",
  authRequired,
  async (req, res) => {
    try {
      const measurement =
        await Measurement.findById(
          req.params.id
        );

      if (!measurement) {
        return res.status(404).json({
          success: false,
          message: "اندازه پیدا نشد"
        });
      }

      res.json({
        success: true,
        data: measurement
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "خطا در دریافت اندازه"
      });
    }
  }
);

// ======================================================
// MEASUREMENT - UPDATE
// ======================================================

app.put(
  "/api/measurements/:id",
  authRequired,
  async (req, res) => {
    try {
      const old =
        await Measurement.findById(
          req.params.id
        );

      if (!old) {
        return res.status(404).json({
          success: false,
          message: "اندازه پیدا نشد"
        });
      }

      const update = {
        unit:
          req.body.unit || old.unit,
        notes:
          req.body.notes !== undefined
            ? req.body.notes
            : old.notes
      };

      if (old.gender === "male") {
        update.male =
          req.body.male || {};
      }

      if (old.gender === "female") {
        update.female =
          req.body.female || {};
      }

      const measurement =
        await Measurement.findByIdAndUpdate(
          req.params.id,
          update,
          {
            new: true,
            runValidators: true
          }
        );

      res.json({
        success: true,
        message: "اندازه‌ها بروزرسانی شد",
        data: measurement
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "خطا در بروزرسانی اندازه"
      });
    }
  }
);

// ======================================================
// MEASUREMENT - DELETE
// ======================================================

app.delete(
  "/api/measurements/:id",
  authRequired,
  async (req, res) => {
    try {
      const result =
        await Measurement.findByIdAndDelete(
          req.params.id
        );

      if (!result) {
        return res.status(404).json({
          success: false,
          message: "اندازه پیدا نشد"
        });
      }

      res.json({
        success: true,
        message: "اندازه حذف شد"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "خطا در حذف اندازه"
      });
    }
  }
);

// ======================================================
// ORDERS - LIST
// ======================================================

app.get(
  "/api/orders",
  authRequired,
  async (req, res) => {
    try {
      const filter = {};

      if (req.query.status) {
        filter.status = req.query.status;
      }

      if (req.query.customerId) {
        filter.customerId =
          req.query.customerId;
      }

      const orders =
        await Order.find(filter)
          .populate(
            "customerId",
            "name phone gender"
          )
          .populate(
            "measurementId"
          )
          .sort({
            createdAt: -1
          });

      res.json({
        success: true,
        count: orders.length,
        data: orders
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "خطا در دریافت سفارش‌ها"
      });
    }
  }
);

// ======================================================
// ORDER - CREATE
// ======================================================

app.post(
  "/api/orders",
  authRequired,
  async (req, res) => {
    try {
      const {
        customerId,
        measurementId,
        description = "",
        status = "registered",
        price = 0,
        discount = 0,
        paidAmount = 0,
        deliveryDate,
        notes = ""
      } = req.body;

      if (!customerId) {
        return res.status(400).json({
          success: false,
          message: "مشتری را انتخاب کنید"
        });
      }

      const customer =
        await Customer.findById(customerId);

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "مشتری پیدا نشد"
        });
      }

      const finalPrice =
        Math.max(
          0,
          Number(price) - Number(discount)
        );

      const remainingAmount =
        Math.max(
          0,
          finalPrice - Number(paidAmount)
        );

      const orderNumber =
        "ORD-" +
        Date.now().toString();

      const order =
        await Order.create({
          orderNumber,
          customerId,
          measurementId:
            measurementId || undefined,
          description,
          status,
          price: Number(price),
          discount: Number(discount),
          finalPrice,
          paidAmount: Number(paidAmount),
          remainingAmount,
          deliveryDate:
            deliveryDate || undefined,
          notes
        });

      res.status(201).json({
        success: true,
        message: "سفارش ثبت شد",
        data: order
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: "خطا در ثبت سفارش"
      });
    }
  }
);

// ======================================================
// ORDER - GET ONE
// ======================================================

app.get(
  "/api/orders/:id",
  authRequired,
  async (req, res) => {
    try {
      const order =
        await Order.findById(
          req.params.id
        )
          .populate("customerId")
          .populate("measurementId");

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "سفارش پیدا نشد"
        });
      }

      const payments =
        await Payment.find({
          orderId: order._id
        }).sort({
          createdAt: -1
        });

      res.json({
        success: true,
        data: {
          order,
          payments
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "خطا در دریافت سفارش"
      });
    }
  }
);

// ======================================================
// ORDER - UPDATE
// ======================================================

app.put(
  "/api/orders/:id",
  authRequired,
  async (req, res) => {
    try {
      const order =
        await Order.findById(
          req.params.id
        );

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "سفارش پیدا نشد"
        });
      }

      const price =
        req.body.price !== undefined
          ? Number(req.body.price)
          : order.price;

      const discount =
        req.body.discount !== undefined
          ? Number(req.body.discount)
          : order.discount;

      const paidAmount =
        req.body.paidAmount !== undefined
          ? Number(req.body.paidAmount)
          : order.paidAmount;

      const finalPrice =
        Math.max(
          0,
          price - discount
        );

      const remainingAmount =
        Math.max(
          0,
          finalPrice - paidAmount
        );

      const update = {
        ...req.body,
        price,
        discount,
        paidAmount,
        finalPrice,
        remainingAmount
      };

      delete update._id;

      const updated =
        await Order.findByIdAndUpdate(
          req.params.id,
          update,
          {
            new: true,
            runValidators: true
          }
        );

      res.json({
        success: true,
        message: "سفارش بروزرسانی شد",
        data: updated
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: "خطا در بروزرسانی سفارش"
      });
    }
  }
);

// ======================================================
// ORDER - DELETE
// ======================================================

app.delete(
  "/api/orders/:id",
  authRequired,
  async (req, res) => {
    try {
      const order =
        await Order.findByIdAndDelete(
          req.params.id
        );

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "سفارش پیدا نشد"
        });
      }

      await Payment.deleteMany({
        orderId: order._id
      });

      res.json({
        success: true,
        message: "سفارش حذف شد"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "خطا در حذف سفارش"
      });
    }
  }
);

// ======================================================
// PAYMENTS - LIST
// ======================================================

app.get(
  "/api/payments",
  authRequired,
  async (req, res) => {
    try {
      const filter = {};

      if (req.query.customerId) {
        filter.customerId =
          req.query.customerId;
      }

      if (req.query.orderId) {
        filter.orderId =
          req.query.orderId;
      }

      const payments =
        await Payment.find(filter)
          .populate(
            "customerId",
            "name phone"
          )
          .populate(
            "orderId",
            "orderNumber finalPrice"
          )
          .sort({
            createdAt: -1
          });

      res.json({
        success: true,
        data: payments
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "خطا در دریافت پرداخت‌ها"
      });
    }
  }
);

// ======================================================
// PAYMENT - CREATE
// ======================================================

app.post(
  "/api/payments",
  authRequired,
  async (req, res) => {
    try {
      const {
        customerId,
        orderId,
        amount,
        method = "cash",
        note = ""
      } = req.body;

      if (
        !customerId ||
        !orderId ||
        amount === undefined
      ) {
        return res.status(400).json({
          success: false,
          message:
            "مشتری، سفارش و مبلغ الزامی است"
        });
      }

      const order =
        await Order.findById(orderId);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "سفارش پیدا نشد"
        });
      }

      const payment =
        await Payment.create({
          customerId,
          orderId,
          amount: Number(amount),
          method,
          note,
          createdBy: req.user.id
        });

      const totalPayments =
        await Payment.aggregate([
          {
            $match: {
              orderId:
                new mongoose.Types.ObjectId(
                  orderId
                )
            }
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: "$amount"
              }
            }
          }
        ]);

      const totalPaid =
        totalPayments[0]?.total || 0;

      order.paidAmount = totalPaid;

      order.remainingAmount =
        Math.max(
          0,
          order.finalPrice - totalPaid
        );

      await order.save();

      res.status(201).json({
        success: true,
        message: "پرداخت ثبت شد",
        data: payment,
        order: {
          paidAmount:
            order.paidAmount,
          remainingAmount:
            order.remainingAmount
        }
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: "خطا در ثبت پرداخت"
      });
    }
  }
);

// ======================================================
// EXPENSES
// ======================================================

app.get(
  "/api/expenses",
  authRequired,
  async (req, res) => {
    try {
      const expenses =
        await Expense.find()
          .sort({
            createdAt: -1
          });

      res.json({
        success: true,
        data: expenses
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "خطا در دریافت هزینه‌ها"
      });
    }
  }
);

app.post(
  "/api/expenses",
  authRequired,
  async (req, res) => {
    try {
      const expense =
        await Expense.create({
          title: req.body.title,
          amount: Number(
            req.body.amount || 0
          ),
          category:
            req.body.category || "other",
          description:
            req.body.description || "",
          createdBy: req.user.id
        });

      res.status(201).json({
        success: true,
        message: "هزینه ثبت شد",
        data: expense
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "خطا در ثبت هزینه"
      });
    }
  }
);

// ======================================================
// INVENTORY
// ======================================================

app.get(
  "/api/inventory",
  authRequired,
  async (req, res) => {
    try {
      const items =
        await Inventory.find()
          .sort({
            createdAt: -1
          });

      res.json({
        success: true,
        data: items
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "خطا در دریافت انبار"
      });
    }
  }
);

app.post(
  "/api/inventory",
  authRequired,
  async (req, res) => {
    try {
      const item =
        await Inventory.create({
          name: req.body.name,
          category:
            req.body.category || "other",
          quantity:
            Number(req.body.quantity || 0),
          unit:
            req.body.unit || "عدد",
          minimumStock:
            Number(
              req.body.minimumStock || 0
            ),
          price:
            Number(req.body.price || 0),
          notes:
            req.body.notes || ""
        });

      res.status(201).json({
        success: true,
        message: "مورد انبار ثبت شد",
        data: item
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "خطا در ثبت انبار"
      });
    }
  }
);

app.put(
  "/api/inventory/:id",
  authRequired,
  async (req, res) => {
    try {
      const item =
        await Inventory.findByIdAndUpdate(
          req.params.id,
          req.body,
          {
            new: true,
            runValidators: true
          }
        );

      if (!item) {
        return res.status(404).json({
          success: false,
          message: "مورد انبار پیدا نشد"
        });
      }

      res.json({
        success: true,
        message: "انبار بروزرسانی شد",
        data: item
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "خطا در بروزرسانی انبار"
      });
    }
  }
);

app.delete(
  "/api/inventory/:id",
  authRequired,
  async (req, res) => {
    try {
      const item =
        await Inventory.findByIdAndDelete(
          req.params.id
        );

      if (!item) {
        return res.status(404).json({
          success: false,
          message: "مورد انبار پیدا نشد"
        });
      }

      res.json({
        success: true,
        message: "مورد انبار حذف شد"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "خطا در حذف انبار"
      });
    }
  }
);

// ======================================================
// INVOICES
// ======================================================

app.get(
  "/api/invoices",
  authRequired,
  async (req, res) => {
    try {
      const invoices =
        await Invoice.find()
          .populate(
            "customerId",
            "name phone"
          )
          .populate(
            "orderId",
            "orderNumber"
          )
          .sort({
            createdAt: -1
          });

      res.json({
        success: true,
        data: invoices
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "خطا در دریافت فاکتورها"
      });
    }
  }
);

// ======================================================
// INVOICE - CREATE
// ======================================================

app.post(
  "/api/invoices",
  authRequired,
  async (req, res) => {
    try {
      const {
        orderId,
        customerId,
        subtotal = 0,
        discount = 0,
        paid = 0,
        notes = ""
      } = req.body;

      const total =
        Math.max(
          0,
          Number(subtotal) -
            Number(discount)
        );

      const remaining =
        Math.max(
          0,
          total - Number(paid)
        );

      const invoiceNumber =
        "INV-" +
        Date.now().toString();

      const invoice =
        await Invoice.create({
          invoiceNumber,
          orderId,
          customerId,
          subtotal:
            Number(subtotal),
          discount:
            Number(discount),
          total,
          paid:
            Number(paid),
          remaining,
          notes
        });

      res.status(201).json({
        success: true,
        message: "فاکتور ایجاد شد",
        data: invoice
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: "خطا در ایجاد فاکتور"
      });
    }
  }
);

// ======================================================
// EMPLOYEES
// ======================================================

app.get(
  "/api/employees",
  authRequired,
  async (req, res) => {
    try {
      const employees =
        await Employee.find()
          .sort({
            createdAt: -1
          });

      res.json({
        success: true,
        data: employees
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "خطا در دریافت کارمندان"
      });
    }
  }
);

app.post(
  "/api/employees",
  authRequired,
  async (req, res) => {
    try {
      const employee =
        await Employee.create({
          name: req.body.name,
          phone:
            req.body.phone || "",
          position:
            req.body.position || "",
          salary:
            Number(req.body.salary || 0),
          status:
            req.body.status || "active",
          notes:
            req.body.notes || ""
        });

      res.status(201).json({
        success: true,
        message: "کارمند ثبت شد",
        data: employee
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "خطا در ثبت کارمند"
      });
    }
  }
);

app.put(
  "/api/employees/:id",
  authRequired,
  async (req, res) => {
    try {
      const employee =
        await Employee.findByIdAndUpdate(
          req.params.id,
          req.body,
          {
            new: true,
            runValidators: true
          }
        );

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "کارمند پیدا نشد"
        });
      }

      res.json({
        success: true,
        message: "اطلاعات کارمند بروزرسانی شد",
        data: employee
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "خطا در بروزرسانی کارمند"
      });
    }
  }
);

app.delete(
  "/api/employees/:id",
  authRequired,
  async (req, res) => {
    try {
      const employee =
        await Employee.findByIdAndDelete(
          req.params.id
        );

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: "کارمند پیدا نشد"
        });
      }

      res.json({
        success: true,
        message: "کارمند حذف شد"
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "خطا در حذف کارمند"
      });
    }
  }
);

// ======================================================
// NOTIFICATIONS
// ======================================================

app.get(
  "/api/notifications",
  authRequired,
  async (req, res) => {
    try {
      const notifications =
        await Notification.find({
          userId: req.user.id
        })
          .sort({
            createdAt: -1
          })
          .limit(100);

      res.json({
        success: true,
        data: notifications
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "خطا در دریافت اعلان‌ها"
      });
    }
  }
);

// ======================================================
// NOTIFICATION READ
// ======================================================

app.put(
  "/api/notifications/:id/read",
  authRequired,
  async (req, res) => {
    try {
      const notification =
        await Notification.findOneAndUpdate(
          {
            _id: req.params.id,
            userId: req.user.id
          },
          {
            read: true
          },
          {
            new: true
          }
        );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "اعلان پیدا نشد"
        });
      }

      res.json({
        success: true,
        data: notification
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "خطا در بروزرسانی اعلان"
      });
    }
  }
);

// ======================================================
// SETTINGS - GET
// ======================================================

app.get(
  "/api/settings",
  authRequired,
  async (req, res) => {
    try {
      let setting =
        await Setting.findOne();

      if (!setting) {
        setting =
          await Setting.create({
            shopName: "خیاط‌یار",
            currency: "AFN"
          });
      }

      res.json({
        success: true,
        data: setting
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "خطا در دریافت تنظیمات"
      });
    }
  }
);

// ======================================================
// SETTINGS - UPDATE
// ======================================================

app.put(
  "/api/settings",
  authRequired,
  async (req, res) => {
    try {
      let setting =
        await Setting.findOne();

      if (!setting) {
        setting =
          await Setting.create(req.body);
      } else {
        setting =
          await Setting.findByIdAndUpdate(
            setting._id,
            req.body,
            {
              new: true,
              runValidators: true
            }
          );
      }

      res.json({
        success: true,
        message: "تنظیمات ذخیره شد",
        data: setting
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "خطا در ذخیره تنظیمات"
      });
    }
  }
);

// ======================================================
// DASHBOARD REPORT
// ======================================================

app.get(
  "/api/reports/dashboard",
  authRequired,
  async (req, res) => {
    try {
      const [
        customers,
        orders,
        expenses,
        inventory
      ] = await Promise.all([
        Customer.countDocuments(),

        Order.countDocuments(),

        Expense.aggregate([
          {
            $group: {
              _id: null,
              total: {
                $sum: "$amount"
              }
            }
          }
        ]),

        Inventory.countDocuments()
      ]);

      const orderMoney =
        await Order.aggregate([
          {
            $group: {
              _id: null,
              totalSales: {
                $sum: "$finalPrice"
              },
              totalPaid: {
                $sum: "$paidAmount"
              },
              totalRemaining: {
                $sum: "$remainingAmount"
              }
            }
          }
        ]);

      const money =
        orderMoney[0] || {
          totalSales: 0,
          totalPaid: 0,
          totalRemaining: 0
        };

      const totalExpenses =
        expenses[0]?.total || 0;

      res.json({
        success: true,
        data: {
          customers,
          orders,
          inventory,
          totalSales:
            money.totalSales,
          totalPaid:
            money.totalPaid,
          totalRemaining:
            money.totalRemaining,
          totalExpenses,
          profit:
            money.totalPaid -
            totalExpenses
        }
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: "خطا در دریافت گزارش"
      });
    }
  }
);

// ======================================================
// 404 API
// ======================================================

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API مورد نظر پیدا نشد",
    path: req.originalUrl
  });
});

// ======================================================
// GLOBAL ERROR
// ======================================================

app.use((error, req, res, next) => {
  console.error(
    "GLOBAL ERROR:",
    error
  );

  res.status(500).json({
    success: false,
    message: "خطای داخلی سرور"
  });
});

// ======================================================
// START DATABASE + SERVER
// ======================================================

async function startServer() {
  try {
    console.log("=================================");
    console.log("🚀 KHAYAT-YAR SERVER");
    console.log("=================================");

    console.log("🔄 Connecting MongoDB...");

    await mongoose.connect(
      MONGODB_URI,
      {
        serverSelectionTimeoutMS: 15000
      }
    );

    console.log("✅ MongoDB Connected");

    app.listen(
      PORT,
      "0.0.0.0",
      () => {
        console.log(
          `🚀 Server running on port ${PORT}`
        );

        console.log(
          `🌐 http://localhost:${PORT}`
        );

        console.log(
          `❤️ Health: /api/health`
        );
      }
    );
  } catch (error) {
    console.error(
      "❌ DATABASE CONNECTION FAILED"
    );

    console.error(
      error.message
    );

    process.exit(1);
  }
}

startServer();
