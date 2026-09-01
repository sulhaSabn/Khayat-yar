require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

/* =========================================================
   CONFIG
========================================================= */

const PORT = process.env.PORT || 10000;

const MONGODB_URI =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI;

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "CHANGE_THIS_SECRET_KEY";

/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "2mb" }));

app.use(express.urlencoded({
  extended: true
}));

/* =========================================================
   DATABASE
========================================================= */

mongoose.set("strictQuery", false);

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

/* =========================================================
   USER MODEL
========================================================= */

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      sparse: true
    },

    phone: {
      type: String,
      trim: true,
      unique: true,
      sparse: true
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      default: "admin"
    }
  },
  {
    timestamps: true
  }
);

const User =
  mongoose.models.User ||
  mongoose.model("User", UserSchema);


/* =========================================================
   CUSTOMER MODEL
========================================================= */

const CustomerSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    phone: {
      type: String,
      required: true,
      trim: true
    },

    address: {
      type: String,
      default: ""
    },

    gender: {
      type: String,
      enum: ["male", "female"],
      required: true
    },

    notes: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

const Customer =
  mongoose.models.Customer ||
  mongoose.model("Customer", CustomerSchema);


/* =========================================================
   MEASUREMENT MODEL
========================================================= */

const MeasurementSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true
    },

    gender: {
      type: String,
      enum: ["male", "female"],
      required: true
    },

    unit: {
      type: String,
      enum: ["cm", "inch"],
      default: "cm"
    },

    male: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },

    female: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },

    notes: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

const Measurement =
  mongoose.models.Measurement ||
  mongoose.model("Measurement", MeasurementSchema);


/* =========================================================
   ORDER MODEL
========================================================= */

const OrderSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true
    },

    orderNumber: {
      type: String,
      required: true
    },

    description: {
      type: String,
      default: ""
    },

    price: {
      type: Number,
      default: 0
    },

    discount: {
      type: Number,
      default: 0
    },

    finalPrice: {
      type: Number,
      default: 0
    },

    paidAmount: {
      type: Number,
      default: 0
    },

    remainingAmount: {
      type: Number,
      default: 0
    },

    status: {
      type: String,
      enum: [
        "registered",
        "cutting",
        "sewing",
        "fitting",
        "ready",
        "delivered",
        "cancelled"
      ],
      default: "registered"
    }
  },
  {
    timestamps: true
  }
);

const Order =
  mongoose.models.Order ||
  mongoose.model("Order", OrderSchema);


/* =========================================================
   PAYMENT MODEL
========================================================= */

const PaymentSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer"
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    method: {
      type: String,
      enum: [
        "cash",
        "card",
        "transfer",
        "other"
      ],
      default: "cash"
    },

    note: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

const Payment =
  mongoose.models.Payment ||
  mongoose.model("Payment", PaymentSchema);


/* =========================================================
   EXPENSE MODEL
========================================================= */

const ExpenseSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    title: {
      type: String,
      required: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    category: {
      type: String,
      default: ""
    },

    description: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

const Expense =
  mongoose.models.Expense ||
  mongoose.model("Expense", ExpenseSchema);


/* =========================================================
   INVENTORY MODEL
========================================================= */

const InventorySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    name: {
      type: String,
      required: true
    },

    category: {
      type: String,
      default: ""
    },

    quantity: {
      type: Number,
      default: 0
    },

    unit: {
      type: String,
      default: "عدد"
    },

    minimumStock: {
      type: Number,
      default: 0
    },

    price: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

const Inventory =
  mongoose.models.Inventory ||
  mongoose.model("Inventory", InventorySchema);


/* =========================================================
   EMPLOYEE MODEL
========================================================= */

const EmployeeSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    name: {
      type: String,
      required: true
    },

    phone: {
      type: String,
      default: ""
    },

    position: {
      type: String,
      default: ""
    },

    salary: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

const Employee =
  mongoose.models.Employee ||
  mongoose.model("Employee", EmployeeSchema);


/* =========================================================
   INVOICE MODEL
========================================================= */

const InvoiceSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true
    },

    invoiceNumber: {
      type: String,
      required: true
    },

    total: {
      type: Number,
      default: 0
    },

    paid: {
      type: Number,
      default: 0
    },

    remaining: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

const Invoice =
  mongoose.models.Invoice ||
  mongoose.model("Invoice", InvoiceSchema);


/* =========================================================
   SETTINGS MODEL
========================================================= */

const SettingsSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },

    shopName: {
      type: String,
      default: ""
    },

    ownerName: {
      type: String,
      default: ""
    },

    phone: {
      type: String,
      default: ""
    },

    address: {
      type: String,
      default: ""
    },

    currency: {
      type: String,
      default: "AFN"
    },

    invoiceFooter: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

const Settings =
  mongoose.models.Settings ||
  mongoose.model("Settings", SettingsSchema);


/* =========================================================
   HELPERS
========================================================= */

function sendSuccess(res, data, message = "") {
  return res.json({
    success: true,
    message,
    data
  });
}


function sendError(res, message, status = 400) {
  return res.status(status).json({
    success: false,
    message
  });
}


function generateNumber(prefix) {
  return (
    prefix +
    "-" +
    Date.now().toString(36).toUpperCase() +
    "-" +
    Math.floor(Math.random() * 1000)
  );
}


/* =========================================================
   AUTH MIDDLEWARE
========================================================= */

async function auth(req, res, next) {

  try {

    const header =
      req.headers.authorization || "";

    if (!header.startsWith("Bearer ")) {
      return sendError(
        res,
        "دسترسی غیرمجاز",
        401
      );
    }

    const token =
      header.replace("Bearer ", "").trim();

    const decoded =
      jwt.verify(token, JWT_SECRET);

    const user =
      await User.findById(decoded.userId)
        .select("-password");

    if (!user) {
      return sendError(
        res,
        "کاربر پیدا نشد",
        401
      );
    }

    req.user = user;

    next();

  } catch (error) {

    return sendError(
      res,
      "توکن نامعتبر یا منقضی شده است",
      401
    );
  }
}


/* =========================================================
   HEALTH
========================================================= */

app.get("/api/health", (req, res) => {

  const connected =
    mongoose.connection.readyState === 1;

  return sendSuccess(res, {
    server: "online",
    database:
      connected
        ? "connected"
        : "disconnected"
  });

});


/* =========================================================
   REGISTER
========================================================= */

app.post(
  "/api/auth/register",
  async (req, res) => {

    try {

      const {
        name,
        email,
        phone,
        password,
        role
      } = req.body;

      if (!name) {
        return sendError(
          res,
          "نام الزامی است"
        );
      }

      if (!email && !phone) {
        return sendError(
          res,
          "ایمیل یا شماره تلفن الزامی است"
        );
      }

      if (!password || password.length < 8) {
        return sendError(
          res,
          "رمز عبور باید حداقل ۸ کاراکتر باشد"
        );
      }

      if (email) {

        const exists =
          await User.findOne({
            email:
              email.toLowerCase().trim()
          });

        if (exists) {
          return sendError(
            res,
            "این ایمیل قبلاً ثبت شده است"
          );
        }
      }

      if (phone) {

        const exists =
          await User.findOne({
            phone: phone.trim()
          });

        if (exists) {
          return sendError(
            res,
            "این شماره تلفن قبلاً ثبت شده است"
          );
        }
      }

      const hashedPassword =
        await bcrypt.hash(
          password,
          12
        );

      const user =
        await User.create({
          name: name.trim(),
          email:
            email
              ? email.toLowerCase().trim()
              : undefined,
          phone:
            phone
              ? phone.trim()
              : undefined,
          password: hashedPassword,
          role: role || "admin"
        });

      const token =
        jwt.sign(
          {
            userId: user._id.toString()
          },
          JWT_SECRET,
          {
            expiresIn: "30d"
          }
        );

      const safeUser = {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      };

      return sendSuccess(
        res,
        {
          token,
          user: safeUser
        },
        "ثبت‌نام موفق بود"
      );

    } catch (error) {

      console.error(error);

      return sendError(
        res,
        "خطا در ثبت‌نام"
      );
    }
  }
);


/* =========================================================
   LOGIN
========================================================= */

app.post(
  "/api/auth/login",
  async (req, res) => {

    try {

      const {
        identifier,
        password
      } = req.body;

      if (!identifier || !password) {
        return sendError(
          res,
          "ایمیل/شماره تلفن و رمز عبور الزامی است"
        );
      }

      const value =
        identifier.trim();

      const query = {
        $or: [
          {
            email:
              value.toLowerCase()
          },
          {
            phone: value
          }
        ]
      };

      const user =
        await User.findOne(query);

      if (!user) {
        return sendError(
          res,
          "کاربر یا رمز عبور اشتباه است",
          401
        );
      }

      const valid =
        await bcrypt.compare(
          password,
          user.password
        );

      if (!valid) {
        return sendError(
          res,
          "کاربر یا رمز عبور اشتباه است",
          401
        );
      }

      const token =
        jwt.sign(
          {
            userId: user._id.toString()
          },
          JWT_SECRET,
          {
            expiresIn: "30d"
          }
        );

      const safeUser = {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      };

      return sendSuccess(
        res,
        {
          token,
          user: safeUser
        },
        "ورود موفق بود"
      );

    } catch (error) {

      console.error(error);

      return sendError(
        res,
        "خطا در ورود"
      );
    }
  }
);


/* =========================================================
   CURRENT USER
========================================================= */

app.get(
  "/api/auth/me",
  auth,
  async (req, res) => {

    return sendSuccess(
      res,
      req.user
    );

  }
);


/* =========================================================
   CREATE CUSTOMER + MEASUREMENT + ORDER
========================================================= */

app.post(
  "/api/customers/with-order",
  auth,
  async (req, res) => {

    const session =
      await mongoose.startSession();

    try {

      session.startTransaction();

      const {
        customer,
        measurement,
        order
      } = req.body;

      if (!customer?.name) {
        throw new Error(
          "نام مشتری الزامی است"
        );
      }

      if (!customer?.phone) {
        throw new Error(
          "شماره تلفن مشتری الزامی است"
        );
      }

      if (!customer?.gender) {
        throw new Error(
          "جنسیت مشتری الزامی است"
        );
      }

      /* -------------------------
         CUSTOMER
      ------------------------- */

      const customerDoc =
        new Customer({
          owner: req.user._id,

          name:
            customer.name.trim(),

          phone:
            customer.phone.trim(),

          address:
            customer.address || "",

          gender:
            customer.gender,

          notes:
            customer.notes || ""
        });

      await customerDoc.save({
        session
      });


      /* -------------------------
         MEASUREMENT
      ------------------------- */

      if (measurement) {

        const measurementDoc =
          new Measurement({

            owner: req.user._id,

            customer:
              customerDoc._id,

            gender:
              measurement.gender ||
              customer.gender,

            unit:
              measurement.unit || "cm",

            male:
              measurement.male || null,

            female:
              measurement.female || null,

            notes:
              measurement.notes || ""
          });

        await measurementDoc.save({
          session
        });
      }


      /* -------------------------
         ORDER
      ------------------------- */

      let orderDoc = null;

      if (order) {

        const price =
          Number(order.price || 0);

        const discount =
          Number(order.discount || 0);

        const paidAmount =
          Number(order.paidAmount || 0);

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

        orderDoc =
          new Order({

            owner:
              req.user._id,

            customerId:
              customerDoc._id,

            orderNumber:
              generateNumber("ORD"),

            description:
              order.description || "",

            price,

            discount,

            finalPrice,

            paidAmount,

            remainingAmount,

            status:
              order.status ||
              "registered"
          });

        await orderDoc.save({
          session
        });


        /* -------------------------
           INITIAL PAYMENT
        ------------------------- */

        if (paidAmount > 0) {

          const payment =
            new Payment({

              owner:
                req.user._id,

              orderId:
                orderDoc._id,

              customerId:
                customerDoc._id,

              amount:
                paidAmount,

              method:
                order.paymentMethod ||
                "cash",

              note:
                "پرداخت اولیه سفارش"
            });

          await payment.save({
            session
          });
        }
      }


      await session.commitTransaction();

      return sendSuccess(
        res,
        {
          customer:
            customerDoc,

          order:
            orderDoc
        },
        "مشتری، اندازه‌ها و سفارش با موفقیت ثبت شدند"
      );

    } catch (error) {

      await session.abortTransaction();

      console.error(error);

      return sendError(
        res,
        error.message ||
        "ثبت اطلاعات انجام نشد"
      );

    } finally {

      session.endSession();
    }
  }
);


/* =========================================================
   CUSTOMERS
========================================================= */

app.post(
  "/api/customers",
  auth,
  async (req, res) => {

    try {

      const customer =
        await Customer.create({

          owner:
            req.user._id,

          name:
            req.body.name,

          phone:
            req.body.phone,

          address:
            req.body.address || "",

          gender:
            req.body.gender,

          notes:
            req.body.notes || ""
        });

      return sendSuccess(
        res,
        customer,
        "مشتری ثبت شد"
      );

    } catch (error) {

      return sendError(
        res,
        error.message
      );
    }
  }
);


/* =========================================================
   GET CUSTOMERS
========================================================= */

app.get(
  "/api/customers",
  auth,
  async (req, res) => {

    try {

      const search =
        (req.query.search || "").trim();

      const filter = {
        owner:
          req.user._id
      };

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

      const customers =
        await Customer
          .find(filter)
          .sort({
            createdAt: -1
          });

      return sendSuccess(
        res,
        customers
      );

    } catch (error) {

      return sendError(
        res,
        error.message
      );
    }
  }
);


/* =========================================================
   GET CUSTOMER
========================================================= */

app.get(
  "/api/customers/:id",
  auth,
  async (req, res) => {

    try {

      const customer =
        await Customer.findOne({
          _id: req.params.id,
          owner: req.user._id
        });

      if (!customer) {
        return sendError(
          res,
          "مشتری پیدا نشد",
          404
        );
      }

      const measurements =
        await Measurement.find({
          customer: customer._id,
          owner: req.user._id
        }).sort({
          createdAt: -1
        });

      const orders =
        await Order.find({
          customerId: customer._id,
          owner: req.user._id
        }).sort({
          createdAt: -1
        });

      return sendSuccess(
        res,
        {
          customer,
          measurements,
          orders
        }
      );

    } catch (error) {

      return sendError(
        res,
        error.message
      );
    }
  }
);


/* =========================================================
   DELETE CUSTOMER
========================================================= */

app.delete(
  "/api/customers/:id",
  auth,
  async (req, res) => {

    try {

      const customer =
        await Customer.findOne({
          _id: req.params.id,
          owner: req.user._id
        });

      if (!customer) {
        return sendError(
          res,
          "مشتری پیدا نشد",
          404
        );
      }

      await Measurement.deleteMany({
        customer: customer._id,
        owner: req.user._id
      });

      await Order.deleteMany({
        customerId: customer._id,
        owner: req.user._id
      });

      await Payment.deleteMany({
        customerId: customer._id,
        owner: req.user._id
      });

      await customer.deleteOne();

      return sendSuccess(
        res,
        null,
        "مشتری حذف شد"
      );

    } catch (error) {

      return sendError(
        res,
        error.message
      );
    }
  }
);


/* =========================================================
   MEASUREMENTS
========================================================= */

app.post(
  "/api/customers/:id/measurements",
  auth,
  async (req, res) => {

    try {

      const customer =
        await Customer.findOne({
          _id: req.params.id,
          owner: req.user._id
        });

      if (!customer) {
        return sendError(
          res,
          "مشتری پیدا نشد",
          404
        );
      }

      const measurement =
        await Measurement.create({

          owner:
            req.user._id,

          customer:
            customer._id,

          gender:
            req.body.gender ||
            customer.gender,

          unit:
            req.body.unit || "cm",

          male:
            req.body.male || null,

          female:
            req.body.female || null,

          notes:
            req.body.notes || ""
        });

      return sendSuccess(
        res,
        measurement,
        "اندازه‌ها ثبت شد"
      );

    } catch (error) {

      return sendError(
        res,
        error.message
      );
    }
  }
);


/* =========================================================
   ORDERS
========================================================= */

app.post(
  "/api/orders",
  auth,
  async (req, res) => {

    try {

      const customer =
        await Customer.findOne({
          _id: req.body.customerId,
          owner: req.user._id
        });

      if (!customer) {
        return sendError(
          res,
          "مشتری متعلق به این حساب نیست",
          403
        );
      }

      const price =
        Number(req.body.price || 0);

      const discount =
        Number(req.body.discount || 0);

      const paidAmount =
        Number(req.body.paidAmount || 0);

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

      const order =
        await Order.create({

          owner:
            req.user._id,

          customerId:
            customer._id,

          orderNumber:
            generateNumber("ORD"),

          description:
            req.body.description || "",

          price,

          discount,

          finalPrice,

          paidAmount,

          remainingAmount,

          status:
            req.body.status ||
            "registered"
        });

      if (paidAmount > 0) {

        await Payment.create({

          owner:
            req.user._id,

          orderId:
            order._id,

          customerId:
            customer._id,

          amount:
            paidAmount,

          method:
            req.body.paymentMethod ||
            "cash",

          note:
            "پرداخت اولیه"
        });
      }

      return sendSuccess(
        res,
        order,
        "سفارش ثبت شد"
      );

    } catch (error) {

      return sendError(
        res,
        error.message
      );
    }
  }
);


/* =========================================================
   GET ORDERS
========================================================= */

app.get(
  "/api/orders",
  auth,
  async (req, res) => {

    try {

      const orders =
        await Order
          .find({
            owner:
              req.user._id
          })
          .populate(
            "customerId",
            "name phone"
          )
          .sort({
            createdAt: -1
          });

      return sendSuccess(
        res,
        orders
      );

    } catch (error) {

      return sendError(
        res,
        error.message
      );
    }
  }
);


/* =========================================================
   PAYMENTS
========================================================= */

app.post(
  "/api/payments",
  auth,
  async (req, res) => {

    try {

      const order =
        await Order.findOne({
          _id: req.body.orderId,
          owner: req.user._id
        });

      if (!order) {
        return sendError(
          res,
          "سفارش متعلق به این حساب نیست",
          403
        );
      }

      const amount =
        Number(req.body.amount || 0);

      if (amount <= 0) {
        return sendError(
          res,
          "مبلغ پرداخت معتبر نیست"
        );
      }

      const payment =
        await Payment.create({

          owner:
            req.user._id,

          orderId:
            order._id,

          customerId:
            order.customerId,

          amount,

          method:
            req.body.method ||
            "cash",

          note:
            req.body.note || ""
        });

      order.paidAmount += amount;

      order.remainingAmount =
        Math.max(
          0,
          order.finalPrice -
          order.paidAmount
        );

      await order.save();

      return sendSuccess(
        res,
        payment,
        "پرداخت ثبت شد"
      );

    } catch (error) {

      return sendError(
        res,
        error.message
      );
    }
  }
);


/* =========================================================
   GET PAYMENTS
========================================================= */

app.get(
  "/api/payments",
  auth,
  async (req, res) => {

    try {

      const payments =
        await Payment
          .find({
            owner:
              req.user._id
          })
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

      return sendSuccess(
        res,
        payments
      );

    } catch (error) {

      return sendError(
        res,
        error.message
      );
    }
  }
);


/* =========================================================
   EXPENSES
========================================================= */

app.post(
  "/api/expenses",
  auth,
  async (req, res) => {

    try {

      const expense =
        await Expense.create({

          owner:
            req.user._id,

          title:
            req.body.title,

          amount:
            Number(req.body.amount || 0),

          category:
            req.body.category || "",

          description:
            req.body.description || ""
        });

      return sendSuccess(
        res,
        expense,
        "هزینه ثبت شد"
      );

    } catch (error) {

      return sendError(
        res,
        error.message
      );
    }
  }
);


app.get(
  "/api/expenses",
  auth,
  async (req, res) => {

    try {

      const expenses =
        await Expense
          .find({
            owner:
              req.user._id
          })
          .sort({
            createdAt: -1
          });

      return sendSuccess(
        res,
        expenses
      );

    } catch (error) {

      return sendError(
        res,
        error.message
      );
    }
  }
);


/* =========================================================
   INVENTORY
========================================================= */

app.post(
  "/api/inventory",
  auth,
  async (req, res) => {

    try {

      const item =
        await Inventory.create({

          owner:
            req.user._id,

          name:
            req.body.name,

          category:
            req.body.category || "",

          quantity:
            Number(req.body.quantity || 0),

          unit:
            req.body.unit || "عدد",

          minimumStock:
            Number(
              req.body.minimumStock || 0
            ),

          price:
            Number(req.body.price || 0)
        });

      return sendSuccess(
        res,
        item,
        "کالا ثبت شد"
      );

    } catch (error) {

      return sendError(
        res,
        error.message
      );
    }
  }
);


app.get(
  "/api/inventory",
  auth,
  async (req, res) => {

    try {

      const items =
        await Inventory
          .find({
            owner:
              req.user._id
          })
          .sort({
            createdAt: -1
          });

      return sendSuccess(
        res,
        items
      );

    } catch (error) {

      return sendError(
        res,
        error.message
      );
    }
  }
);


/* =========================================================
   EMPLOYEES
========================================================= */

app.post(
  "/api/employees",
  auth,
  async (req, res) => {

    try {

      const employee =
        await Employee.create({

          owner:
            req.user._id,

          name:
            req.body.name,

          phone:
            req.body.phone || "",

          position:
            req.body.position || "",

          salary:
            Number(req.body.salary || 0)
        });

      return sendSuccess(
        res,
        employee,
        "کارمند ثبت شد"
      );

    } catch (error) {

      return sendError(
        res,
        error.message
      );
    }
  }
);


app.get(
  "/api/employees",
  auth,
  async (req, res) => {

    try {

      const employees =
        await Employee
          .find({
            owner:
              req.user._id
          })
          .sort({
            createdAt: -1
          });

      return sendSuccess(
        res,
        employees
      );

    } catch (error) {

      return sendError(
        res,
        error.message
      );
    }
  }
);


/* =========================================================
   INVOICES
========================================================= */

app.post(
  "/api/invoices",
  auth,
  async (req, res) => {

    try {

      const order =
        await Order.findOne({
          _id: req.body.orderId,
          owner: req.user._id
        });

      if (!order) {
        return sendError(
          res,
          "سفارش پیدا نشد",
          404
        );
      }

      const invoice =
        await Invoice.create({

          owner:
            req.user._id,

          orderId:
            order._id,

          invoiceNumber:
            generateNumber("INV"),

          total:
            order.finalPrice,

          paid:
            order.paidAmount,

          remaining:
            order.remainingAmount
        });

      return sendSuccess(
        res,
        invoice,
        "فاکتور ساخته شد"
      );

    } catch (error) {

      return sendError(
        res,
        error.message
      );
    }
  }
);


app.get(
  "/api/invoices",
  auth,
  async (req, res) => {

    try {

      const invoices =
        await Invoice
          .find({
            owner:
              req.user._id
          })
          .populate(
            "orderId",
            "orderNumber customerId"
          )
          .sort({
            createdAt: -1
          });

      return sendSuccess(
        res,
        invoices
      );

    } catch (error) {

      return sendError(
        res,
        error.message
      );
    }
  }
);


/* =========================================================
   SETTINGS
========================================================= */

app.get(
  "/api/settings",
  auth,
  async (req, res) => {

    try {

      let settings =
        await Settings.findOne({
          owner:
            req.user._id
        });

      if (!settings) {

        settings =
          await Settings.create({
            owner:
              req.user._id
          });
      }

      return sendSuccess(
        res,
        settings
      );

    } catch (error) {

      return sendError(
        res,
        error.message
      );
    }
  }
);


app.put(
  "/api/settings",
  auth,
  async (req, res) => {

    try {

      const settings =
        await Settings.findOneAndUpdate(
          {
            owner:
              req.user._id
          },
          {
            $set: {
              shopName:
                req.body.shopName || "",

              ownerName:
                req.body.ownerName || "",

              phone:
                req.body.phone || "",

              address:
                req.body.address || "",

              currency:
                req.body.currency || "AFN",

              invoiceFooter:
                req.body.invoiceFooter || ""
            }
          },
          {
            new: true,
            upsert: true
          }
        );

      return sendSuccess(
        res,
        settings,
        "تنظیمات ذخیره شد"
      );

    } catch (error) {

      return sendError(
        res,
        error.message
      );
    }
  }
);


/* =========================================================
   DASHBOARD
========================================================= */

app.get(
  "/api/reports/dashboard",
  auth,
  async (req, res) => {

    try {

      const now = new Date();

      const startToday =
        new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

      const startMonth =
        new Date(
          now.getFullYear(),
          now.getMonth(),
          1
        );


      /* -------------------------
         TODAY SALES
      ------------------------- */

      const todayPayments =
        await Payment.aggregate([
          {
            $match: {
              owner:
                new mongoose.Types.ObjectId(
                  req.user._id
                ),

              createdAt: {
                $gte:
                  startToday
              }
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


      /* -------------------------
         MONTH SALES
      ------------------------- */

      const monthPayments =
        await Payment.aggregate([
          {
            $match: {
              owner:
                new mongoose.Types.ObjectId(
                  req.user._id
                ),

              createdAt: {
                $gte:
                  startMonth
              }
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


      /* -------------------------
         ACTIVE ORDERS
      ------------------------- */

      const activeOrders =
        await Order.countDocuments({
          owner:
            req.user._id,

          status: {
            $nin: [
              "delivered",
              "cancelled"
            ]
          }
        });


      /* -------------------------
         CUSTOMERS
      ------------------------- */

      const customers =
        await Customer.countDocuments({
          owner:
            req.user._id
        });


      return sendSuccess(
        res,
        {

          salesToday:
            todayPayments[0]?.total ||
            0,

          salesMonth:
            monthPayments[0]?.total ||
            0,

          activeOrders,

          customers
        }
      );

    } catch (error) {

      console.error(error);

      return sendError(
        res,
        "خطا در دریافت داشبورد"
      );
    }
  }
);


/* =========================================================
   404
========================================================= */

app.use(
  (req, res) => {

    return res.status(404).json({
      success: false,
      message:
        "مسیر مورد نظر پیدا نشد"
    });

  }
);


/* =========================================================
   ERROR HANDLER
========================================================= */

app.use(
  (error, req, res, next) => {

    console.error(error);

    return res.status(500).json({
      success: false,
      message:
        "خطای داخلی سرور"
    });

  }
);


/* =========================================================
   START SERVER
========================================================= */

app.listen(
  PORT,
  () => {

    console.log(
      `KhayatYar server running on port ${PORT}`
    );

  }
);
