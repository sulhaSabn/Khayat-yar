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


// =========================================================
// CONFIG
// =========================================================

app.use(
  cors({
    origin: true,
    credentials: true
  })
);

app.use(express.json({ limit: "2mb" }));

app.use(
  express.urlencoded({
    extended: true
  })
);

app.use(morgan("dev"));


// =========================================================
// HELPERS
// =========================================================

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

function numberOrNull(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  if (
    !Number.isFinite(number) ||
    number < 0
  ) {
    return null;
  }

  return number;
}


// =========================================================
// MEASUREMENT FIELDS
// =========================================================

const maleFields = [
  "qaddPirahan",
  "shana",
  "astin",
  "baghal",
  "kamar",
  "balaTana",
  "sorin",
  "qaddKarti",
  "qaddVest",
  "qaddDaman",
  "qaddShalwar",
  "barDaman",
  "pachah",
  "barYakhon",
  "dehanAstin"
];

const femaleFields = [
  "qaddPirahan",
  "shana",
  "astin",
  "baghal",
  "kamar",
  "balaTana",
  "sorin",
  "qaddKarti",
  "qaddVest",
  "qaddDaman",
  "qaddShalwar",
  "barDaman",
  "pachah",
  "barYakhon",
  "dehanAstin"
];


function cleanMeasurement(data, gender) {

  const source =
    gender === "male"
      ? data.male || data
      : data.female || data;

  const fields =
    gender === "male"
      ? maleFields
      : femaleFields;

  const result = {};

  fields.forEach((field) => {

    result[field] =
      numberOrNull(
        source[field]
      );

  });

  return result;
}


// =========================================================
// HEALTH
// =========================================================

app.get(
  "/api/health",
  (req, res) => {

    success(res, {

      server: "online",

      database:
        mongoose.connection.readyState === 1
          ? "connected"
          : "disconnected",

      databaseName:
        mongoose.connection.name || null,

      time:
        new Date().toISOString()

    });

  }
);


// =========================================================
// AUTH
// =========================================================

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


// =========================================================
// CUSTOMERS
// =========================================================

// GET CUSTOMERS

app.get(
  "/api/customers",
  authRequired,
  async (req, res) => {

    try {

      const search =
        String(
          req.query.search || ""
        ).trim();

      const gender =
        req.query.gender;

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

        filter.gender =
          gender;

      }

      const customers =
        await Customer.find(filter)
          .sort({
            createdAt: -1
          });

      success(
        res,
        customers
      );

    } catch (err) {

      console.error(err);

      error(
        res,
        "خطا در دریافت مشتریان",
        500
      );

    }

  }
);


// CREATE CUSTOMER

app.post(
  "/api/customers",
  authRequired,
  async (req, res) => {

    try {

      const {
        name,
        phone,
        gender,
        address = "",
        notes = ""
      } = req.body;

      if (!name) {

        return error(
          res,
          "نام مشتری الزامی است"
        );

      }

      if (!phone) {

        return error(
          res,
          "شماره تلفن الزامی است"
        );

      }

      if (
        gender !== "male" &&
        gender !== "female"
      ) {

        return error(
          res,
          "جنسیت باید مرد یا زن باشد"
        );

      }

      const customer =
        await Customer.create({

          name:
            name.trim(),

          phone:
            phone.trim(),

          gender,

          address,

          notes

        });

      success(
        res,
        customer,
        201
      );

    } catch (err) {

      console.error(err);

      error(
        res,
        "خطا در ایجاد مشتری",
        500
      );

    }

  }
);


// GET ONE CUSTOMER

app.get(
  "/api/customers/:id",
  authRequired,
  async (req, res) => {

    try {

      if (
        !validId(req.params.id)
      ) {

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

          customerId:
            customer._id

        }).sort({
          createdAt: -1
        });

      const orders =
        await Order.find({

          customerId:
            customer._id

        }).sort({
          createdAt: -1
        });

      success(res, {

        customer,

        measurements,

        orders

      });

    } catch (err) {

      console.error(err);

      error(
        res,
        "خطا در دریافت اطلاعات مشتری",
        500
      );

    }

  }
);


// UPDATE CUSTOMER

app.put(
  "/api/customers/:id",
  authRequired,
  async (req, res) => {

    try {

      if (
        !validId(req.params.id)
      ) {

        return error(
          res,
          "شناسه مشتری نامعتبر است"
        );

      }

      const update = {};

      if (
        req.body.name !== undefined
      ) {

        update.name =
          req.body.name;

      }

      if (
        req.body.phone !== undefined
      ) {

        update.phone =
          req.body.phone;

      }

      if (
        req.body.address !== undefined
      ) {

        update.address =
          req.body.address;

      }

      if (
        req.body.notes !== undefined
      ) {

        update.notes =
          req.body.notes;

      }

      if (
        req.body.gender !== undefined
      ) {

        if (
          req.body.gender !== "male" &&
          req.body.gender !== "female"
        ) {

          return error(
            res,
            "جنسیت نامعتبر است"
          );

        }

        update.gender =
          req.body.gender;

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

        return error(
          res,
          "مشتری پیدا نشد",
          404
        );

      }

      success(
        res,
        customer
      );

    } catch (err) {

      console.error(err);

      error(
        res,
        "خطا در ویرایش مشتری",
        500
      );

    }

  }
);


// DELETE CUSTOMER

app.delete(
  "/api/customers/:id",
  authRequired,
  async (req, res) => {

    try {

      if (
        !validId(req.params.id)
      ) {

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

      await Measurement.deleteMany({

        customerId:
          customer._id

      });

      await Order.deleteMany({

        customerId:
          customer._id

      });

      success(res, {

        message:
          "مشتری و اطلاعات مرتبط حذف شد"

      });

    } catch (err) {

      console.error(err);

      error(
        res,
        "خطا در حذف مشتری",
        500
      );

    }

  }
);


// =========================================================
// MEASUREMENTS
// =========================================================


// GET MEASUREMENTS

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

      const measurements =
        await Measurement.find({

          customerId:
            customer._id

        }).sort({
          createdAt: -1
        });

      success(
        res,
        measurements
      );

    } catch (err) {

      console.error(err);

      error(
        res,
        "خطا در دریافت اندازه‌ها",
        500
      );

    }

  }
);


// CREATE MEASUREMENT

app.post(
  "/api/customers/:customerId/measurements",
  authRequired,
  async (req, res) => {

    try {

      const customerId =
        req.params.customerId;

      if (
        !validId(customerId)
      ) {

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

      /*
       * جنسیت همیشه از دیتابیس گرفته می‌شود.
       * بنابراین فرانت‌اند نمی‌تواند
       * اندازه زن را برای مرد ذخیره کند.
       */

      const gender =
        customer.gender;

      const measurementData =
        cleanMeasurement(
          req.body,
          gender
        );

      const measurement =
        await Measurement.create({

          customerId:
            customer._id,

          gender,

          unit:
            req.body.unit === "inch"
              ? "inch"
              : "cm",

          ...(gender === "male"
            ? {
                male:
                  measurementData
              }
            : {
                female:
                  measurementData
              }),

          notes:
            req.body.notes || ""

        });

      success(
        res,
        measurement,
        201
      );

    } catch (err) {

      console.error(err);

      error(
        res,
        "خطا در ذخیره اندازه‌ها",
        500
      );

    }

  }
);


// UPDATE MEASUREMENT

app.put(
  "/api/measurements/:id",
  authRequired,
  async (req, res) => {

    try {

      if (
        !validId(req.params.id)
      ) {

        return error(
          res,
          "شناسه اندازه نامعتبر است"
        );

      }

      const current =
        await Measurement.findById(
          req.params.id
        );

      if (!current) {

        return error(
          res,
          "اندازه پیدا نشد",
          404
        );

      }

      const gender =
        current.gender;

      const measurementData =
        cleanMeasurement(
          req.body,
          gender
        );

      const update = {

        unit:
          req.body.unit === "inch"
            ? "inch"
            : current.unit,

        notes:
          req.body.notes !== undefined
            ? req.body.notes
            : current.notes

      };

      if (gender === "male") {

        update.male =
          measurementData;

      } else {

        update.female =
          measurementData;

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

      success(
        res,
        measurement
      );

    } catch (err) {

      console.error(err);

      error(
        res,
        "خطا در ویرایش اندازه",
        500
      );

    }

  }
);


// DELETE MEASUREMENT

app.delete(
  "/api/measurements/:id",
  authRequired,
  async (req, res) => {

    try {

      if (
        !validId(req.params.id)
      ) {

        return error(
          res,
          "شناسه اندازه نامعتبر است"
        );

      }

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

      success(res, {

        message:
          "اندازه حذف شد"

      });

    } catch (err) {

      console.error(err);

      error(
        res,
        "خطا در حذف اندازه",
        500
      );

    }

  }
);


// =========================================================
// ORDERS
// =========================================================


// GET ORDERS

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

      success(
        res,
        orders
      );

    } catch (err) {

      console.error(err);

      error(
        res,
        "خطا در دریافت سفارش‌ها",
        500
      );

    }

  }
);


// CREATE ORDER

app.post(
  "/api/orders",
  authRequired,
  async (req, res) => {

    try {

      const {
        customerId,
        measurementId,
        price,
        discount = 0,
        paidAmount = 0
      } = req.body;

      if (
        !validId(customerId)
      ) {

        return error(
          res,
          "مشتری نامعتبر است"
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

      if (
        measurementId &&
        !validId(measurementId)
      ) {

        return error(
          res,
          "اندازه نامعتبر است"
        );

      }

      if (measurementId) {

        const measurement =
          await Measurement.findOne({

            _id:
              measurementId,

            customerId

          });

        if (!measurement) {

          return error(
            res,
            "این اندازه متعلق به این مشتری نیست"
          );

        }

      }

      const originalPrice =
        Math.max(
          0,
          Number(price || 0)
        );

      const discountAmount =
        Math.min(

          originalPrice,

          Math.max(
            0,
            Number(discount || 0)
          )

        );

      const finalPrice =
        originalPrice -
        discountAmount;

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

          customerId,

          measurementId:
            measurementId || null,

          price:
            originalPrice,

          discount:
            discountAmount,

          finalPrice,

          paidAmount:
            paid,

          remainingAmount:
            finalPrice - paid

        });

      success(
        res,
        order,
        201
      );

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


// GET ORDER

app.get(
  "/api/orders/:id",
  authRequired,
  async (req, res) => {

    try {

      if (
        !validId(req.params.id)
      ) {

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
          );

      if (!order) {

        return error(
          res,
          "سفارش پیدا نشد",
          404
        );

      }

      success(
        res,
        order
      );

    } catch (err) {

      console.error(err);

      error(
        res,
        "خطا در دریافت سفارش",
        500
      );

    }

  }
);


// UPDATE ORDER

app.put(
  "/api/orders/:id",
  authRequired,
  async (req, res) => {

    try {

      if (
        !validId(req.params.id)
      ) {

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

          ? current.price

          : Math.max(
              0,
              Number(req.body.price)
            );

      const discount =
        req.body.discount === undefined

          ? current.discount

          : Math.max(
              0,
              Number(req.body.discount)
            );

      const finalPrice =
        Math.max(
          0,
          price - discount
        );

      const paid =
        req.body.paidAmount === undefined

          ? current.paidAmount

          : Math.max(
              0,
              Number(req.body.paidAmount)
            );

      const paidAmount =
        Math.min(
          finalPrice,
          paid
        );

      const update = {

        ...req.body,

        price,

        discount,

        finalPrice,

        paidAmount,

        remainingAmount:
          finalPrice -
          paidAmount

      };

      /*
       * مشتری سفارش نباید از طریق
       * ویرایش عوض شود.
       */

      delete update.customerId;

      const order =
        await Order.findByIdAndUpdate(

          req.params.id,

          update,

          {
            new: true,
            runValidators: true
          }

        );

      success(
        res,
        order
      );

    } catch (err) {

      console.error(err);

      error(
        res,
        "خطا در ویرایش سفارش",
        500
      );

    }

  }
);


// DELETE ORDER

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

      success(res, {

        message:
          "سفارش حذف شد"

      });

    } catch (err) {

      console.error(err);

      error(
        res,
        "خطا در حذف سفارش",
        500
      );

    }

  }
);


// =========================================================
// PAYMENTS
// =========================================================

app.get(
  "/api/payments",
  authRequired,
  async (req, res) => {

    try {

      const payments =
        await Payment.find()

          .populate(
            "customerId",
            "name phone gender"
          )

          .populate(
            "orderId",
            "orderNumber finalPrice"
          )

          .sort({
            createdAt: -1
          });

      success(
        res,
        payments
      );

    } catch (err) {

      console.error(err);

      error(
        res,
        "خطا در دریافت پرداخت‌ها",
        500
      );

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
        note = ""
      } = req.body;

      if (
        !validId(orderId)
      ) {

        return error(
          res,
          "سفارش نامعتبر است"
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
          "مبلغ بیشتر از بدهی سفارش است"
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
        Math.max(

          0,

          order.finalPrice -
          order.paidAmount

        );

      await order.save();

      success(

        res,

        {
          payment,
          order
        },

        201

      );

    } catch (err) {

      console.error(err);

      error(
        res,
        "خطا در ثبت پرداخت",
        500
      );

    }

  }
);


// =========================================================
// EXPENSES
// =========================================================

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

      success(
        res,
        expenses
      );

    } catch (err) {

      console.error(err);

      error(
        res,
        "خطا در دریافت هزینه‌ها",
        500
      );

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

          ...req.body,

          createdBy:
            req.user.id

        });

      success(
        res,
        expense,
        201
      );

    } catch (err) {

      console.error(err);

      error(
        res,
        "خطا در ثبت هزینه",
        500
      );

    }

  }
);


// =========================================================
// INVENTORY
// =========================================================

app.get(
  "/api/inventory",
  authRequired,
  async (req, res) => {

    try {

      const inventory =
        await Inventory.find()
          .sort({
            createdAt: -1
          });

      success(
        res,
        inventory
      );

    } catch (err) {

      console.error(err);

      error(
        res,
        "خطا در دریافت موجودی",
        500
      );

    }

  }
);


app.post(
  "/api/inventory",
  authRequired,
  async (req, res) => {

    try {

      const item =
        await Inventory.create(
          req.body
        );

      success(
        res,
        item,
        201
      );

    } catch (err) {

      console.error(err);

      error(
        res,
        "خطا در ثبت موجودی",
        500
      );

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

        return error(
          res,
          "مورد موجودی پیدا نشد",
          404
        );

      }

      success(
        res,
        item
      );

    } catch (err) {

      console.error(err);

      error(
        res,
        "خطا در ویرایش موجودی",
        500
      );

    }

  }
);


// =========================================================
// INVOICES
// =========================================================

app.get(
  "/api/invoices",
  authRequired,
  async (req, res) => {

    try {

      const invoices =
        await Invoice.find()

          .populate(
            "customerId",
            "name phone gender"
          )

          .populate(
            "orderId",
            "orderNumber"
          )

          .sort({
            createdAt: -1
          });

      success(
        res,
        invoices
      );

    } catch (err) {

      console.error(err);

      error(
        res,
        "خطا در دریافت فاکتورها",
        500
      );

    }

  }
);


app.post(
  "/api/invoices",
  authRequired,
  async (req, res) => {

    try {

      if (
        !validId(
          req.body.orderId
        )
      ) {

        return error(
          res,
          "سفارش نامعتبر است"
        );

      }

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
            order.remainingAmount,

          notes:
            req.body.notes || ""

        });

      success(
        res,
        invoice,
        201
      );

    } catch (err) {

      console.error(err);

      error(
        res,
        "خطا در ساخت فاکتور",
        500
      );

    }

  }
);


// =========================================================
// EMPLOYEES
// =========================================================

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

      success(
        res,
        employees
      );

    } catch (err) {

      console.error(err);

      error(
        res,
        "خطا در دریافت کارمندان",
        500
      );

    }

  }
);


app.post(
  "/api/employees",
  authRequired,
  async (req, res) => {

    try {

      const employee =
        await Employee.create(
          req.body
        );

      success(
        res,
        employee,
        201
      );

    } catch (err) {

      console.error(err);

      error(
        res,
        "خطا در ثبت کارمند",
        500
      );

    }

  }
);


// =========================================================
// NOTIFICATIONS
// =========================================================

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

      success(
        res,
        notifications
      );

    } catch (err) {

      console.error(err);

      error(
        res,
        "خطا در دریافت اعلان‌ها",
        500
      );

    }

  }
);


// =========================================================
// DASHBOARD
// =========================================================

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

          status:
            "ready"

        }),


        Customer.countDocuments(),


        Order.aggregate([

          {
            $match: {

              remainingAmount: {
                $gt: 0
              }

            }
          },

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

    } catch (err) {

      console.error(err);

      error(
        res,
        "خطا در گزارش داشبورد",
        500
      );

    }

  }
);


// =========================================================
// SETTINGS
// =========================================================

app.get(
  "/api/settings",
  authRequired,
  async (req, res) => {

    try {

      const settings =
        await Setting.findOne();

      success(
        res,
        settings
      );

    } catch (err) {

      console.error(err);

      error(
        res,
        "خطا در دریافت تنظیمات",
        500
      );

    }

  }
);


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

      success(
        res,
        settings
      );

    } catch (err) {

      console.error(err);

      error(
        res,
        "خطا در ذخیره تنظیمات",
        500
      );

    }

  }
);


// =========================================================
// 404
// =========================================================

app.use(
  (req, res) => {

    error(
      res,
      "API مورد نظر پیدا نشد",
      404
    );

  }
);


// =========================================================
// ERROR HANDLER
// =========================================================

app.use(
  (err, req, res, next) => {

    console.error(
      "SERVER ERROR:",
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

    error(
      res,
      "خطای داخلی سرور",
      500
    );

  }
);


// =========================================================
// START SERVER
// =========================================================

const PORT =
  Number(
    process.env.PORT || 5000
  );


connectDatabase()

  .then(() => {

    console.log(
      "✅ MongoDB connected"
    );

    console.log(
      "📊 Database:",
      mongoose.connection.name
    );

    app.listen(
      PORT,
      "0.0.0.0",
      () => {

        console.log(
          `🚀 Khayat-Yar API running on port ${PORT}`
        );

        console.log(
          `❤️ Health: /api/health`
        );

      }
    );

  })

  .catch((err) => {

    console.error(
      "❌ MongoDB connection failed:"
    );

    console.error(
      err.message
    );

    process.exit(1);

  });
