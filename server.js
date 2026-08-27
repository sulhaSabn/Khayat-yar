const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");

const connectDatabase = require("./database");

const {
  register,
  login,
  me,
  authRequired
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

const app = express();

/*
==================================================
 BASIC CONFIGURATION
==================================================
*/

// Render provides PORT automatically.
// For local development, 5000 will be used.
const PORT = Number(process.env.PORT) || 5000;

// Frontend URL.
// If CLIENT_URL is not configured, CORS allows requests.
const CLIENT_URL = process.env.CLIENT_URL || "*";

/*
==================================================
 MIDDLEWARE
==================================================
*/

app.use(
  cors({
    origin: CLIENT_URL === "*" ? true : CLIENT_URL
  })
);

app.use(
  express.json({
    limit: "10mb"
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb"
  })
);

app.use(morgan("dev"));

/*
==================================================
 HELPER FUNCTIONS
==================================================
*/

function success(res, data = null, status = 200) {
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

/*
==================================================
 ROOT
==================================================
*/

app.get("/", (req, res) => {
  res.json({
    success: true,
    name: "Khayat-Yar API",
    message: "Khayat-Yar server is running",
    version: "1.0.0"
  });
});

/*
==================================================
 HEALTH CHECK
==================================================
*/

app.get("/api/health", (req, res) => {
  const state = mongoose.connection.readyState;

  let database = "disconnected";

  if (state === 1) {
    database = "connected";
  }

  if (state === 2) {
    database = "connecting";
  }

  return success(res, {
    server: "online",
    database,
    databaseName: mongoose.connection.name || null,
    host: mongoose.connection.host || null,
    time: new Date().toISOString()
  });
});

/*
==================================================
 AUTH
==================================================
*/

// Register
app.post(
  "/api/auth/register",
  register
);

// Login
app.post(
  "/api/auth/login",
  login
);

// Current user
app.get(
  "/api/auth/me",
  authRequired,
  me
);

/*
==================================================
 CUSTOMERS
==================================================
*/

// Get customers
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
          .sort({
            createdAt: -1
          });

      return success(
        res,
        customers
      );

    } catch (err) {
      console.error(
        "GET CUSTOMERS ERROR:",
        err
      );

      return error(
        res,
        "خطا در دریافت مشتریان",
        500
      );
    }
  }
);

// Create customer
app.post(
  "/api/customers",
  authRequired,
  async (req, res) => {
    try {
      const {
        name,
        phone,
        address,
        notes,
        customerType
      } = req.body;

      if (!name || !phone) {
        return error(
          res,
          "نام و شماره تلفن الزامی است"
        );
      }

      const customer =
        await Customer.create({
          name,
          phone,
          address,
          notes,
          customerType
        });

      return success(
        res,
        customer,
        201
      );

    } catch (err) {
      console.error(
        "CREATE CUSTOMER ERROR:",
        err
      );

      return error(
        res,
        "خطا در ایجاد مشتری",
        500
      );
    }
  }
);

// Get one customer
app.get(
  "/api/customers/:id",
  authRequired,
  async (req, res) => {
    try {
      if (!validId(req.params.id)) {
        return error(
          res,
          "شناسه مشتری نامعتبر است"
        );
      }

      const customer =
        await Customer.findById(
          req.params.id
        );

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
        }).sort({
          createdAt: -1
        });

      const orders =
        await Order.find({
          customerId: customer._id
        })
          .populate(
            "measurementId"
          )
          .sort({
            createdAt: -1
          });

      return success(res, {
        customer,
        measurements,
        orders
      });

    } catch (err) {
      console.error(
        "GET CUSTOMER ERROR:",
        err
      );

      return error(
        res,
        "خطا در دریافت اطلاعات مشتری",
        500
      );
    }
  }
);

// Update customer
app.put(
  "/api/customers/:id",
  authRequired,
  async (req, res) => {
    try {
      if (!validId(req.params.id)) {
        return error(
          res,
          "شناسه مشتری نامعتبر است"
        );
      }

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

      return success(
        res,
        customer
      );

    } catch (err) {
      console.error(
        "UPDATE CUSTOMER ERROR:",
        err
      );

      return error(
        res,
        "خطا در ویرایش مشتری",
        500
      );
    }
  }
);

// Delete customer
app.delete(
  "/api/customers/:id",
  authRequired,
  async (req, res) => {
    try {
      if (!validId(req.params.id)) {
        return error(
          res,
          "شناسه مشتری نامعتبر است"
        );
      }

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

      // Delete related measurements
      await Measurement.deleteMany({
        customerId: customer._id
      });

      return success(
        res,
        {
          message:
            "مشتری حذف شد"
        }
      );

    } catch (err) {
      console.error(
        "DELETE CUSTOMER ERROR:",
        err
      );

      return error(
        res,
        "خطا در حذف مشتری",
        500
      );
    }
  }
);

/*
==================================================
 MEASUREMENTS
==================================================
*/

// Get customer measurements
app.get(
  "/api/customers/:customerId/measurements",
  authRequired,
  async (req, res) => {
    try {
      if (
        !validId(
          req.params.customerId
        )
      ) {
        return error(
          res,
          "شناسه مشتری نامعتبر است"
        );
      }

      const measurements =
        await Measurement.find({
          customerId:
            req.params.customerId
        }).sort({
          createdAt: -1
        });

      return success(
        res,
        measurements
      );

    } catch (err) {
      console.error(
        "GET MEASUREMENTS ERROR:",
        err
      );

      return error(
        res,
        "خطا در دریافت اندازه‌ها",
        500
      );
    }
  }
);

// Create measurement
app.post(
  "/api/customers/:customerId/measurements",
  authRequired,
  async (req, res) => {
    try {
      if (
        !validId(
          req.params.customerId
        )
      ) {
        return error(
          res,
          "شناسه مشتری نامعتبر است"
        );
      }

      const customer =
        await Customer.findById(
          req.params.customerId
        );

      if (!customer) {
        return error(
          res,
          "مشتری پیدا نشد",
          404
        );
      }

      const measurement =
        await Measurement.create({
          ...req.body,
          customerId:
            req.params.customerId
        });

      return success(
        res,
        measurement,
        201
      );

    } catch (err) {
      console.error(
        "CREATE MEASUREMENT ERROR:",
        err
      );

      return error(
        res,
        "خطا در ذخیره اندازه‌ها",
        500
      );
    }
  }
);

// Update measurement
app.put(
  "/api/measurements/:id",
  authRequired,
  async (req, res) => {
    try {
      if (!validId(req.params.id)) {
        return error(
          res,
          "شناسه اندازه نامعتبر است"
        );
      }

      const measurement =
        await Measurement.findByIdAndUpdate(
          req.params.id,
          req.body,
          {
            new: true,
            runValidators: true
          }
        );

      if (!measurement) {
        return error(
          res,
          "اندازه پیدا نشد",
          404
        );
      }

      return success(
        res,
        measurement
      );

    } catch (err) {
      console.error(
        "UPDATE MEASUREMENT ERROR:",
        err
      );

      return error(
        res,
        "خطا در ویرایش اندازه",
        500
      );
    }
  }
);

// Delete measurement
app.delete(
  "/api/measurements/:id",
  authRequired,
  async (req, res) => {
    try {
      const measurement =
        await Measurement.findByIdAndDelete(
          req.params.id
        );

      if (!measurement) {
        return error(
          res,
          "اندازه پیدا نشد",
          404
        );
      }

      return success(
        res,
        {
          message:
            "اندازه حذف شد"
        }
      );

    } catch (err) {
      console.error(
        "DELETE MEASUREMENT ERROR:",
        err
      );

      return error(
        res,
        "خطا در حذف اندازه",
        500
      );
    }
  }
);

/*
==================================================
 ORDERS
==================================================
*/

// Get orders
app.get(
  "/api/orders",
  authRequired,
  async (req, res) => {
    try {
      const filter = {};

      if (req.query.status) {
        filter.status =
          req.query.status;
      }

      if (req.query.customerId) {
        if (
          !validId(
            req.query.customerId
          )
        ) {
          return error(
            res,
            "شناسه مشتری نامعتبر است"
          );
        }

        filter.customerId =
          req.query.customerId;
      }

      const orders =
        await Order.find(filter)
          .populate(
            "customerId",
            "name phone"
          )
          .populate(
            "measurementId"
          )
          .populate(
            "assignedTailorId",
            "name phone role"
          )
          .sort({
            createdAt: -1
          });

      return success(
        res,
        orders
      );

    } catch (err) {
      console.error(
        "GET ORDERS ERROR:",
        err
      );

      return error(
        res,
        "خطا در دریافت سفارش‌ها",
        500
      );
    }
  }
);

// Create order
app.post(
  "/api/orders",
  authRequired,
  async (req, res) => {
    try {
      const {
        customerId,
        measurementId,
        type,
        description,
        fabric,
        color,
        price,
        discount = 0,
        paidAmount = 0,
        deliveryDate,
        status = "registered",
        assignedTailorId,
        notes
      } = req.body;

      if (!validId(customerId)) {
        return error(
          res,
          "شناسه مشتری نامعتبر است"
        );
      }

      const customer =
        await Customer.findById(
          customerId
        );

      if (!customer) {
        return error(
          res,
          "مشتری پیدا نشد",
          404
        );
      }

      const numericPrice =
        Number(price || 0);

      const numericDiscount =
        Number(discount || 0);

      const numericPaid =
        Number(paidAmount || 0);

      if (numericPrice < 0) {
        return error(
          res,
          "قیمت نامعتبر است"
        );
      }

      const finalPrice =
        Math.max(
          0,
          numericPrice -
            numericDiscount
        );

      if (numericPaid < 0) {
        return error(
          res,
          "مبلغ پرداختی نامعتبر است"
        );
      }

      if (numericPaid > finalPrice) {
        return error(
          res,
          "مبلغ پرداختی نمی‌تواند بیشتر از مبلغ نهایی باشد"
        );
      }

      const order =
        await Order.create({
          orderNumber:
            req.body.orderNumber ||
            `ORD-${Date.now()}`,

          customerId,

          measurementId,

          type,

          description,

          fabric,

          color,

          price:
            numericPrice,

          discount:
            numericDiscount,

          finalPrice,

          paidAmount:
            numericPaid,

          remainingAmount:
            finalPrice -
            numericPaid,

          deliveryDate,

          status,

          assignedTailorId,

          notes
        });

      return success(
        res,
        order,
        201
      );

    } catch (err) {
      console.error(
        "CREATE ORDER ERROR:",
        err
      );

      return error(
        res,
        "خطا در ایجاد سفارش",
        500
      );
    }
  }
);

// Get one order
app.get(
  "/api/orders/:id",
  authRequired,
  async (req, res) => {
    try {
      if (!validId(req.params.id)) {
        return error(
          res,
          "شناسه سفارش نامعتبر است"
        );
      }

      const order =
        await Order.findById(
          req.params.id
        )
          .populate(
            "customerId"
          )
          .populate(
            "measurementId"
          )
          .populate(
            "assignedTailorId",
            "name phone role"
          );

      if (!order) {
        return error(
          res,
          "سفارش پیدا نشد",
          404
        );
      }

      return success(
        res,
        order
      );

    } catch (err) {
      console.error(
        "GET ORDER ERROR:",
        err
      );

      return error(
        res,
        "خطا در دریافت سفارش",
        500
      );
    }
  }
);

// Update order
app.put(
  "/api/orders/:id",
  authRequired,
  async (req, res) => {
    try {
      if (!validId(req.params.id)) {
        return error(
          res,
          "شناسه سفارش نامعتبر است"
        );
      }

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
          ? Number(current.price)
          : Number(req.body.price);

      const discount =
        req.body.discount === undefined
          ? Number(current.discount)
          : Number(req.body.discount);

      const finalPrice =
        Math.max(
          0,
          price - discount
        );

      const paidAmount =
        req.body.paidAmount === undefined
          ? Number(current.paidAmount)
          : Number(req.body.paidAmount);

      if (price < 0) {
        return error(
          res,
          "قیمت نامعتبر است"
        );
      }

      if (discount < 0) {
        return error(
          res,
          "تخفیف نامعتبر است"
        );
      }

      if (paidAmount < 0) {
        return error(
          res,
          "مبلغ پرداختی نامعتبر است"
        );
      }

      if (paidAmount > finalPrice) {
        return error(
          res,
          "مبلغ پرداختی نمی‌تواند بیشتر از مبلغ نهایی باشد"
        );
      }

      const updateData = {
        ...req.body,

        price,

        discount,

        finalPrice,

        paidAmount,

        remainingAmount:
          finalPrice -
          paidAmount
      };

      const order =
        await Order.findByIdAndUpdate(
          req.params.id,
          updateData,
          {
            new: true,
            runValidators: true
          }
        );

      return success(
        res,
        order
      );

    } catch (err) {
      console.error(
        "UPDATE ORDER ERROR:",
        err
      );

      return error(
        res,
        "خطا در ویرایش سفارش",
        500
      );
    }
  }
);

// Delete order
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
        return error(
          res,
          "سفارش پیدا نشد",
          404
        );
      }

      return success(
        res,
        {
          message:
            "سفارش حذف شد"
        }
      );

    } catch (err) {
      console.error(
        "DELETE ORDER ERROR:",
        err
      );

      return error(
        res,
        "خطا در حذف سفارش",
        500
      );
    }
  }
);

/*
==================================================
 PAYMENTS
==================================================
*/

// Get payments
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
            "orderNumber finalPrice paidAmount remainingAmount"
          )
          .sort({
            createdAt: -1
          });

      return success(
        res,
        payments
      );

    } catch (err) {
      console.error(
        "GET PAYMENTS ERROR:",
        err
      );

      return error(
        res,
        "خطا در دریافت پرداخت‌ها",
        500
      );
    }
  }
);

// Create payment
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

      if (!validId(orderId)) {
        return error(
          res,
          "شناسه سفارش نامعتبر است"
        );
      }

      const order =
        await Order.findById(
          orderId
        );

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
        !Number.isFinite(
          paymentAmount
        ) ||
        paymentAmount <= 0
      ) {
        return error(
          res,
          "مبلغ پرداخت نامعتبر است"
        );
      }

      if (
        paymentAmount >
        order.remainingAmount
      ) {
        return error(
          res,
          "مبلغ پرداخت بیشتر از بدهی سفارش است"
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

      order.paidAmount =
        Number(order.paidAmount || 0) +
        paymentAmount;

      order.remainingAmount =
        Math.max(
          0,
          Number(order.finalPrice) -
            order.paidAmount
        );

      await order.save();

      return success(
        res,
        {
          payment,
          order
        },
        201
      );

    } catch (err) {
      console.error(
        "CREATE PAYMENT ERROR:",
        err
      );

      return error(
        res,
        "خطا در ثبت پرداخت",
        500
      );
    }
  }
);

/*
==================================================
 EXPENSES
==================================================
*/

// Get expenses
app.get(
  "/api/expenses",
  authRequired,
  async (req, res) => {
    try {
      const expenses =
        await Expense.find()
          .populate(
            "createdBy",
            "name"
          )
          .sort({
            createdAt: -1
          });

      return success(
        res,
        expenses
      );

    } catch (err) {
      console.error(
        "GET EXPENSES ERROR:",
        err
      );

      return error(
        res,
        "خطا در دریافت هزینه‌ها",
        500
      );
    }
  }
);

// Create expense
app.post(
  "/api/expenses",
  authRequired,
  async (req, res) => {
    try {
      const {
        title,
        category,
        amount,
        description
      } = req.body;

      if (!title || !category) {
        return error(
          res,
          "عنوان و دسته‌بندی الزامی است"
        );
      }

      const numericAmount =
        Number(amount);

      if (
        !Number.isFinite(
          numericAmount
        ) ||
        numericAmount < 0
      ) {
        return error(
          res,
          "مبلغ هزینه نامعتبر است"
        );
      }

      const expense =
        await Expense.create({
          title,
          category,
          amount:
            numericAmount,
          description,
          createdBy:
            req.user.id
        });

      return success(
        res,
        expense,
        201
      );

    } catch (err) {
      console.error(
        "CREATE EXPENSE ERROR:",
        err
      );

      return error(
        res,
        "خطا در ثبت هزینه",
        500
      );
    }
  }
);

/*
==================================================
 INVENTORY
==================================================
*/

// Get inventory
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

      return success(
        res,
        items
      );

    } catch (err) {
      console.error(
        "GET INVENTORY ERROR:",
        err
      );

      return error(
        res,
        "خطا در دریافت موجودی",
        500
      );
    }
  }
);

// Create inventory item
app.post(
  "/api/inventory",
  authRequired,
  async (req, res) => {
    try {
      const item =
        await Inventory.create(
          req.body
        );

      return success(
        res,
        item,
        201
      );

    } catch (err) {
      console.error(
        "CREATE INVENTORY ERROR:",
        err
      );

      return error(
        res,
        "خطا در ثبت موجودی",
        500
      );
    }
  }
);

// Update inventory
app.put(
  "/api/inventory/:id",
  authRequired,
  async (req, res) => {
    try {
      if (!validId(req.params.id)) {
        return error(
          res,
          "شناسه موجودی نامعتبر است"
        );
      }

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
        return error(
          res,
          "آیتم موجودی پیدا نشد",
          404
        );
      }

      return success(
        res,
        item
      );

    } catch (err) {
      console.error(
        "UPDATE INVENTORY ERROR:",
        err
      );

      return error(
        res,
        "خطا در ویرایش موجودی",
        500
      );
    }
  }
);

// Delete inventory
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
        return error(
          res,
          "آیتم موجودی پیدا نشد",
          404
        );
      }

      return success(
        res,
        {
          message:
            "آیتم حذف شد"
        }
      );

    } catch (err) {
      console.error(
        "DELETE INVENTORY ERROR:",
        err
      );

      return error(
        res,
        "خطا در حذف موجودی",
        500
      );
    }
  }
);

/*
==================================================
 INVOICES
==================================================
*/

// Get invoices
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

      return success(
        res,
        invoices
      );

    } catch (err) {
      console.error(
        "GET INVOICES ERROR:",
        err
      );

      return error(
        res,
        "خطا در دریافت فاکتورها",
        500
      );
    }
  }
);

// Create invoice
app.post(
  "/api/invoices",
  authRequired,
  async (req, res) => {
    try {
      const {
        orderId
      } = req.body;

      if (!validId(orderId)) {
        return error(
          res,
          "شناسه سفارش نامعتبر است"
        );
      }

      const order =
        await Order.findById(
          orderId
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

      return success(
        res,
        invoice,
        201
      );

    } catch (err) {
      console.error(
        "CREATE INVOICE ERROR:",
        err
      );

      return error(
        res,
        "خطا در ساخت فاکتور",
        500
      );
    }
  }
);

/*
==================================================
 EMPLOYEES
==================================================
*/

// Get employees
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

      return success(
        res,
        employees
      );

    } catch (err) {
      console.error(
        "GET EMPLOYEES ERROR:",
        err
      );

      return error(
        res,
        "خطا در دریافت کارمندان",
        500
      );
    }
  }
);

// Create employee
app.post(
  "/api/employees",
  authRequired,
  async (req, res) => {
    try {
      const employee =
        await Employee.create(
          req.body
        );

      return success(
        res,
        employee,
        201
      );

    } catch (err) {
      console.error(
        "CREATE EMPLOYEE ERROR:",
        err
      );

      return error(
        res,
        "خطا در ثبت کارمند",
        500
      );
    }
  }
);

// Update employee
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
        return error(
          res,
          "کارمند پیدا نشد",
          404
        );
      }

      return success(
        res,
        employee
      );

    } catch (err) {
      console.error(
        "UPDATE EMPLOYEE ERROR:",
        err
      );

      return error(
        res,
        "خطا در ویرایش کارمند",
        500
      );
    }
  }
);

// Delete employee
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
        return error(
          res,
          "کارمند پیدا نشد",
          404
        );
      }

      return success(
        res,
        {
          message:
            "کارمند حذف شد"
        }
      );

    } catch (err) {
      console.error(
        "DELETE EMPLOYEE ERROR:",
        err
      );

      return error(
        res,
        "خطا در حذف کارمند",
        500
      );
    }
  }
);

/*
==================================================
 NOTIFICATIONS
==================================================
*/

// Get notifications
app.get(
  "/api/notifications",
  authRequired,
  async (req, res) => {
    try {
      const notifications =
        await Notification.find({
          userId:
            req.user.id
        }).sort({
          createdAt: -1
        });

      return success(
        res,
        notifications
      );

    } catch (err) {
      console.error(
        "GET NOTIFICATIONS ERROR:",
        err
      );

      return error(
        res,
        "خطا در دریافت اعلان‌ها",
        500
      );
    }
  }
);

// Mark notification as read
app.put(
  "/api/notifications/:id/read",
  authRequired,
  async (req, res) => {
    try {
      const notification =
        await Notification.findOneAndUpdate(
          {
            _id:
              req.params.id,

            userId:
              req.user.id
          },
          {
            read: true
          },
          {
            new: true
          }
        );

      if (!notification) {
        return error(
          res,
          "اعلان پیدا نشد",
          404
        );
      }

      return success(
        res,
        notification
      );

    } catch (err) {
      console.error(
        "READ NOTIFICATION ERROR:",
        err
      );

      return error(
        res,
        "خطا در تغییر اعلان",
        500
      );
    }
  }
);

/*
==================================================
 DASHBOARD / REPORTS
==================================================
*/

app.get(
  "/api/reports/dashboard",
  authRequired,
  async (req, res) => {
    try {
      const now =
        new Date();

      const today =
        new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

      const month =
        new Date(
          now.getFullYear(),
          now.getMonth(),
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
      ] = await Promise.all([

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

      const totalDebts =
        debts[0]?.total || 0;

      return success(
        res,
        {
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
            totalDebts,

          lowStock
        }
      );

    } catch (err) {
      console.error(
        "DASHBOARD ERROR:",
        err
      );

      return error(
        res,
        "خطا در گزارش داشبورد",
        500
      );
    }
  }
);

/*
==================================================
 SETTINGS
==================================================
*/

// Get settings
app.get(
  "/api/settings",
  authRequired,
  async (req, res) => {
    try {
      const settings =
        await Setting.findOne();

      return success(
        res,
        settings
      );

    } catch (err) {
      console.error(
        "GET SETTINGS ERROR:",
        err
      );

      return error(
        res,
        "خطا در دریافت تنظیمات",
        500
      );
    }
  }
);

// Update settings
app.put(
  "/api/settings",
  authRequired,
  async (req, res) => {
    try {
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

      return success(
        res,
        settings
      );

    } catch (err) {
      console.error(
        "UPDATE SETTINGS ERROR:",
        err
      );

      return error(
        res,
        "خطا در ذخیره تنظیمات",
        500
      );
    }
  }
);

/*
==================================================
 404
==================================================
*/

app.use(
  (req, res) => {
    return error(
      res,
      "API مورد نظر پیدا نشد",
      404
    );
  }
);

/*
==================================================
 GLOBAL ERROR HANDLER
==================================================
*/

app.use(
  (err, req, res, next) => {

    console.error(
      "GLOBAL ERROR:",
      err
    );

    if (
      err &&
      err.code === 11000
    ) {
      return error(
        res,
        "اطلاعات تکراری است",
        409
      );
    }

    return error(
      res,
      "خطای داخلی سرور",
      500
    );
  }
);

/*
==================================================
 DATABASE + SERVER START
==================================================
*/

async function startServer() {

  try {

    console.log(
      "======================================"
    );

    console.log(
      "🚀 Starting Khayat-Yar Server..."
    );

    console.log(
      "======================================"
    );

    // Connect MongoDB
    await connectDatabase();

    // Start Express
    app.listen(
      PORT,
      "0.0.0.0",
      () => {

        console.log(
          "======================================"
        );

        console.log(
          "✅ Khayat-Yar Server Started"
        );

        console.log(
          `🚀 Port: ${PORT}`
        );

        console.log(
          "🌐 Server is ready"
        );

        console.log(
          "======================================"
        );
      }
    );

  } catch (err) {

    console.error(
      "======================================"
    );

    console.error(
      "❌ SERVER START FAILED"
    );

    console.error(
      err.message
    );

    console.error(
      "======================================"
    );

    process.exit(1);
  }
}

startServer();
