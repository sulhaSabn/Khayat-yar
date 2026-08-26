require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const connectDatabase = require("./database");

const {
  register,
  login,
  me,
  authRequired,
  roles
} = require("./auth");

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

const mongoose = require("mongoose");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || true
  })
);

app.use(express.json());

app.use(morgan("dev"));

function success(res, data, status = 200) {
  return res.status(status).json({
    success: true,
    data
  });
}

function error(res, message, status = 400) {
  return res.status(status).json({
    success: false,
    message
  });
}

function validId(value) {
  return mongoose.isValidObjectId(value);
}

// HEALTH
app.get("/api/health", (req, res) => {
  success(res, {
    server: "online",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected"
  });
});

// AUTH
app.post("/api/auth/register", register);

app.post("/api/auth/login", login);

app.get("/api/auth/me", authRequired, me);

// CUSTOMERS
app.get(
  "/api/customers",
  authRequired,
  async (req, res) => {
    try {
      const search = req.query.search;

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

      const customers =
        await Customer.find(filter)
          .sort({ createdAt: -1 });

      success(res, customers);
    } catch (err) {
      error(res, "خطا در دریافت مشتریان", 500);
    }
  }
);

app.post(
  "/api/customers",
  authRequired,
  async (req, res) => {
    try {
      if (!req.body.name || !req.body.phone) {
        return error(
          res,
          "نام و شماره تلفن الزامی است"
        );
      }

      const customer =
        await Customer.create(req.body);

      success(res, customer, 201);
    } catch (err) {
      error(res, "خطا در ایجاد مشتری", 500);
    }
  }
);

app.get(
  "/api/customers/:id",
  authRequired,
  async (req, res) => {
    try {
      if (!validId(req.params.id)) {
        return error(res, "شناسه نامعتبر است");
      }

      const customer =
        await Customer.findById(req.params.id);

      if (!customer) {
        return error(
          res,
          "مشتری پیدا نشد",
          404
        );
      }

      const measurements =
        await Measurement.find({
          customerId: customer._id
        });

      const orders =
        await Order.find({
          customerId: customer._id
        }).sort({
          createdAt: -1
        });

      success(res, {
        customer,
        measurements,
        orders
      });
    } catch {
      error(
        res,
        "خطا در دریافت اطلاعات مشتری",
        500
      );
    }
  }
);

app.put(
  "/api/customers/:id",
  authRequired,
  async (req, res) => {
    try {
      const customer =
        await Customer.findByIdAndUpdate(
          req.params.id,
          req.body,
          {
            new: true,
            runValidators: true
          }
        );

      if (!customer) {
        return error(
          res,
          "مشتری پیدا نشد",
          404
        );
      }

      success(res, customer);
    } catch {
      error(res, "خطا در ویرایش مشتری", 500);
    }
  }
);

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
        return error(
          res,
          "مشتری پیدا نشد",
          404
        );
      }

      success(res, {
        message: "مشتری حذف شد"
      });
    } catch {
      error(res, "خطا در حذف مشتری", 500);
    }
  }
);

// MEASUREMENTS
app.get(
  "/api/customers/:customerId/measurements",
  authRequired,
  async (req, res) => {
    try {
      const data =
        await Measurement.find({
          customerId: req.params.customerId
        }).sort({
          createdAt: -1
        });

      success(res, data);
    } catch {
      error(res, "خطا در دریافت اندازه‌ها", 500);
    }
  }
);

app.post(
  "/api/customers/:customerId/measurements",
  authRequired,
  async (req, res) => {
    try {
      const measurement =
        await Measurement.create({
          ...req.body,
          customerId:
            req.params.customerId
        });

      success(res, measurement, 201);
    } catch {
      error(res, "خطا در ذخیره اندازه‌ها", 500);
    }
  }
);

// ORDERS
app.get(
  "/api/orders",
  authRequired,
  async (req, res) => {
    try {
      const filter = {};

      if (req.query.status) {
        filter.status = req.query.status;
      }

      const orders =
        await Order.find(filter)
          .populate(
            "customerId",
            "name phone"
          )
          .sort({
            createdAt: -1
          });

      success(res, orders);
    } catch {
      error(res, "خطا در دریافت سفارش‌ها", 500);
    }
  }
);

app.post(
  "/api/orders",
  authRequired,
  async (req, res) => {
    try {
      const {
        customerId,
        price,
        discount = 0,
        paidAmount = 0
      } = req.body;

      if (!validId(customerId)) {
        return error(
          res,
          "مشتری نامعتبر است"
        );
      }

      const customer =
        await Customer.findById(customerId);

      if (!customer) {
        return error(
          res,
          "مشتری پیدا نشد",
          404
        );
      }

      const finalPrice =
        Math.max(
          0,
          Number(price || 0) -
            Number(discount || 0)
        );

      const paid =
        Math.min(
          finalPrice,
          Math.max(
            0,
            Number(paidAmount || 0)
          )
        );

      const order =
        await Order.create({
          ...req.body,

          orderNumber:
            req.body.orderNumber ||
            `ORD-${Date.now()}`,

          price:
            Number(price || 0),

          discount:
            Number(discount || 0),

          finalPrice,

          paidAmount: paid,

          remainingAmount:
            finalPrice - paid
        });

      success(res, order, 201);
    } catch (err) {
      console.error(err);

      error(
        res,
        "خطا در ایجاد سفارش",
        500
      );
    }
  }
);

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
        return error(
          res,
          "سفارش پیدا نشد",
          404
        );
      }

      success(res, order);
    } catch {
      error(res, "خطا در دریافت سفارش", 500);
    }
  }
);

app.put(
  "/api/orders/:id",
  authRequired,
  async (req, res) => {
    try {
      const current =
        await Order.findById(
          req.params.id
        );

      if (!current) {
        return error(
          res,
          "سفارش پیدا نشد",
          404
        );
      }

      const price =
        req.body.price === undefined
          ? current.price
          : Number(req.body.price);

      const discount =
        req.body.discount === undefined
          ? current.discount
          : Number(req.body.discount);

      const finalPrice =
        Math.max(0, price - discount);

      const paid =
        req.body.paidAmount === undefined
          ? current.paidAmount
          : Number(req.body.paidAmount);

      const paidAmount =
        Math.min(
          finalPrice,
          Math.max(0, paid)
        );

      const order =
        await Order.findByIdAndUpdate(
          req.params.id,
          {
            ...req.body,
            price,
            discount,
            finalPrice,
            paidAmount,
            remainingAmount:
              finalPrice - paidAmount
          },
          {
            new: true,
            runValidators: true
          }
        );

      success(res, order);
    } catch {
      error(res, "خطا در ویرایش سفارش", 500);
    }
  }
);

// PAYMENTS
app.get(
  "/api/payments",
  authRequired,
  async (req, res) => {
    try {
      const payments =
        await Payment.find()
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

      success(res, payments);
    } catch {
      error(res, "خطا در دریافت پرداخت‌ها", 500);
    }
  }
);

app.post(
  "/api/payments",
  authRequired,
  async (req, res) => {
    try {
      const {
        orderId,
        amount,
        method = "cash",
        note
      } = req.body;

      const order =
        await Order.findById(orderId);

      if (!order) {
        return error(
          res,
          "سفارش پیدا نشد",
          404
        );
      }

      const paymentAmount =
        Number(amount);

      if (
        paymentAmount <= 0 ||
        paymentAmount >
          order.remainingAmount
      ) {
        return error(
          res,
          "مبلغ پرداخت نامعتبر است"
        );
      }

      const payment =
        await Payment.create({
          customerId:
            order.customerId,

          orderId,

          amount:
            paymentAmount,

          method,

          note,

          createdBy:
            req.user.id
        });

      order.paidAmount +=
        paymentAmount;

      order.remainingAmount =
        order.finalPrice -
        order.paidAmount;

      await order.save();

      success(
        res,
        {
          payment,
          order
        },
        201
      );
    } catch {
      error(res, "خطا در ثبت پرداخت", 500);
    }
  }
);

// EXPENSES
app.get(
  "/api/expenses",
  authRequired,
  async (req, res) => {
    success(
      res,
      await Expense.find().sort({
        createdAt: -1
      })
    );
  }
);

app.post(
  "/api/expenses",
  authRequired,
  async (req, res) => {
    try {
      const expense =
        await Expense.create({
          ...req.body,
          createdBy: req.user.id
        });

      success(res, expense, 201);
    } catch {
      error(res, "خطا در ثبت هزینه", 500);
    }
  }
);

// INVENTORY
app.get(
  "/api/inventory",
  authRequired,
  async (req, res) => {
    success(
      res,
      await Inventory.find().sort({
        createdAt: -1
      })
    );
  }
);

app.post(
  "/api/inventory",
  authRequired,
  async (req, res) => {
    try {
      const item =
        await Inventory.create(req.body);

      success(res, item, 201);
    } catch {
      error(res, "خطا در ثبت موجودی", 500);
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

      success(res, item);
    } catch {
      error(res, "خطا در ویرایش موجودی", 500);
    }
  }
);

// INVOICES
app.get(
  "/api/invoices",
  authRequired,
  async (req, res) => {
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

    success(res, invoices);
  }
);

app.post(
  "/api/invoices",
  authRequired,
  async (req, res) => {
    try {
      const order =
        await Order.findById(
          req.body.orderId
        );

      if (!order) {
        return error(
          res,
          "سفارش پیدا نشد",
          404
        );
      }

      const invoice =
        await Invoice.create({
          invoiceNumber:
            `INV-${Date.now()}`,

          orderId:
            order._id,

          customerId:
            order.customerId,

          subtotal:
            order.price,

          discount:
            order.discount,

          total:
            order.finalPrice,

          paid:
            order.paidAmount,

          remaining:
            order.remainingAmount
        });

      success(res, invoice, 201);
    } catch {
      error(res, "خطا در ساخت فاکتور", 500);
    }
  }
);

// EMPLOYEES
app.get(
  "/api/employees",
  authRequired,
  async (req, res) => {
    success(
      res,
      await Employee.find().sort({
        createdAt: -1
      })
    );
  }
);

app.post(
  "/api/employees",
  authRequired,
  async (req, res) => {
    try {
      const employee =
        await Employee.create(req.body);

      success(res, employee, 201);
    } catch {
      error(res, "خطا در ثبت کارمند", 500);
    }
  }
);

// NOTIFICATIONS
app.get(
  "/api/notifications",
  authRequired,
  async (req, res) => {
    success(
      res,
      await Notification.find({
        userId: req.user.id
      }).sort({
        createdAt: -1
      })
    );
  }
);

// DASHBOARD
app.get(
  "/api/reports/dashboard",
  authRequired,
  async (req, res) => {
    try {
      const today =
        new Date();

      today.setHours(
        0,
        0,
        0,
        0
      );

      const month =
        new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        );

      const [
        todaySales,
        monthSales,
        monthExpenses,
        activeOrders,
        readyOrders,
        customers,
        debts,
        lowStock
      ] =
        await Promise.all([

          Payment.aggregate([
            {
              $match: {
                createdAt: {
                  $gte: today
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
          ]),

          Payment.aggregate([
            {
              $match: {
                createdAt: {
                  $gte: month
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
          ]),

          Expense.aggregate([
            {
              $match: {
                createdAt: {
                  $gte: month
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
          ]),

          Order.countDocuments({
            status: {
              $in: [
                "registered",
                "cutting",
                "sewing",
                "fitting"
              ]
            }
          }),

          Order.countDocuments({
            status: "ready"
          }),

          Customer.countDocuments(),

          Order.aggregate([
            {
              $group: {
                _id: null,
                total: {
                  $sum:
                    "$remainingAmount"
                }
              }
            }
          ]),

          Inventory.find({
            $expr: {
              $lte: [
                "$quantity",
                "$minimumStock"
              ]
            }
          })
        ]);

      const salesToday =
        todaySales[0]?.total || 0;

      const salesMonth =
        monthSales[0]?.total || 0;

      const expensesMonth =
        monthExpenses[0]?.total || 0;

      success(res, {
        salesToday,

        salesMonth,

        expensesMonth,

        profit:
          salesMonth -
          expensesMonth,

        activeOrders,

        readyOrders,

        customers,

        debts:
          debts[0]?.total || 0,

        lowStock
      });
    } catch {
      error(
        res,
        "خطا در گزارش داشبورد",
        500
      );
    }
  }
);

// SETTINGS
app.get(
  "/api/settings",
  authRequired,
  async (req, res) => {
    success(
      res,
      await Setting.findOne()
    );
  }
);

app.put(
  "/api/settings",
  authRequired,
  async (req, res) => {
    const settings =
      await Setting.findOneAndUpdate(
        {},
        req.body,
        {
          new: true,
          upsert: true,
          runValidators: true
        }
      );

    success(res, settings);
  }
);

// 404
app.use((req, res) => {
  error(
    res,
    "API مورد نظر پیدا نشد",
    404
  );
});

// ERROR
app.use(
  (err, req, res, next) => {
    console.error(err);

    if (err.code === 11000) {
      return error(
        res,
        "اطلاعات تکراری است",
        409
      );
    }

    error(
      res,
      "خطای داخلی سرور",
      500
    );
  }
);

// START
connectDatabase()
  .then(() => {
    const PORT =
      Number(
        process.env.PORT || 5000
      );

    app.listen(
      PORT,
      () => {
        console.log(
          `🚀 Khayat-Yar API: http://localhost:${PORT}`
        );
      }
    );
  })
  .catch((err) => {
    console.error(
      "❌ MongoDB connection failed:",
      err.message
    );

    process.exit(1);
  });
