const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const connectDatabase =
  require("./database");

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


const app = express();


// =====================================================
// CONFIG
// =====================================================

const PORT =
  process.env.PORT || 5000;


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(
  cors({
    origin: true,
    credentials: true
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


// =====================================================
// RESPONSE HELPERS
// =====================================================

function success(
  res,
  data,
  status = 200
) {
  return res.status(status).json({
    success: true,
    data
  });
}


function error(
  res,
  message,
  status = 400
) {
  return res.status(status).json({
    success: false,
    message
  });
}


function validId(id) {
  return mongoose.isValidObjectId(id);
}


// =====================================================
// ROOT
// =====================================================

app.get("/", (req, res) => {

  res.json({
    success: true,
    name: "Khayat-Yar API",
    version: "1.0.0",
    message: "سرور خیاط‌یار فعال است"
  });

});


// =====================================================
// HEALTH
// =====================================================

app.get(
  "/api/health",
  (req, res) => {

    success(res, {
      server: "online",

      database:
        mongoose.connection.readyState === 1
          ? "connected"
          : "disconnected"
    });

  }
);


// =====================================================
// AUTH
// =====================================================

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


// =====================================================
// CUSTOMERS
// =====================================================

app.get(
  "/api/customers",
  authRequired,
  async (req, res) => {

    try {

      const search =
        req.query.search;

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

      success(res, customers);

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


app.post(
  "/api/customers",
  authRequired,
  async (req, res) => {

    try {

      const {
        name,
        phone,
        address = "",
        gender,
        notes = ""
      } = req.body;

      if (!name || !phone) {
        return error(
          res,
          "نام و شماره تلفن الزامی است"
        );
      }

      if (
        !["male", "female"]
          .includes(gender)
      ) {
        return error(
          res,
          "جنسیت مشتری را انتخاب کنید"
        );
      }

      const customer =
        await Customer.create({
          name,
          phone,
          address,
          gender,
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
        }).sort({
          createdAt: -1
        });

      success(res, {
        customer,
        measurements,
        orders
      });

    } catch (err) {

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

      success(
        res,
        customer
      );

    } catch {

      error(
        res,
        "خطا در ویرایش مشتری",
        500
      );
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

      error(
        res,
        "خطا در حذف مشتری",
        500
      );
    }

  }
);


// =====================================================
// MEASUREMENTS
// =====================================================

app.get(
  "/api/customers/:customerId/measurements",
  authRequired,
  async (req, res) => {

    try {

      const data =
        await Measurement.find({
          customerId:
            req.params.customerId
        }).sort({
          createdAt: -1
        });

      success(res, data);

    } catch {

      error(
        res,
        "خطا در دریافت اندازه‌ها",
        500
      );
    }

  }
);


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
        return error(
          res,
          "مشتری پیدا نشد",
          404
        );
      }

      const gender =
        req.body.gender ||
        customer.gender;

      if (
        gender !== customer.gender
      ) {
        return error(
          res,
          "جنسیت اندازه‌گیری با جنسیت مشتری مطابقت ندارد"
        );
      }

      const data = {
        customerId:
          customer._id,

        gender,

        unit:
          req.body.unit || "cm",

        notes:
          req.body.notes || ""
      };

      if (gender === "male") {

        data.male =
          req.body.male || {};

      } else {

        data.female =
          req.body.female || {};

      }

      const measurement =
        await Measurement.create(
          data
        );

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


// =====================================================
// ORDERS
// =====================================================

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

      success(res, orders);

    } catch {

      error(
        res,
        "خطا در دریافت سفارش‌ها",
        500
      );
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
        measurementId,
        description = "",
        price = 0,
        discount = 0,
        paidAmount = 0,
        deliveryDate,
        notes = ""
      } = req.body;

      if (!validId(customerId)) {
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

      const p =
        Math.max(
          0,
          Number(price) || 0
        );

      const d =
        Math.max(
          0,
          Number(discount) || 0
        );

      const finalPrice =
        Math.max(
          0,
          p - d
        );

      const paid =
        Math.min(
          finalPrice,
          Math.max(
            0,
            Number(paidAmount) || 0
          )
        );

      const order =
        await Order.create({

          orderNumber:
            req.body.orderNumber ||
            `ORD-${Date.now()}`,

          customerId,

          measurementId:
            validId(measurementId)
              ? measurementId
              : undefined,

          description,

          status:
            req.body.status ||
            "registered",

          price: p,

          discount: d,

          finalPrice,

          paidAmount: paid,

          remainingAmount:
            finalPrice - paid,

          deliveryDate,

          notes
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


app.get(
  "/api/orders/:id",
  authRequired,
  async (req, res) => {

    try {

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

      success(res, order);

    } catch {

      error(
        res,
        "خطا در دریافت سفارش",
        500
      );
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
        Math.max(
          0,
          price - discount
        );

      const paid =
        req.body.paidAmount === undefined
          ? current.paidAmount
          : Number(req.body.paidAmount);

      const paidAmount =
        Math.min(
          finalPrice,
          Math.max(
            0,
            paid
          )
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
              finalPrice -
              paidAmount
          },
          {
            new: true,
            runValidators: true
          }
        );

      success(
        res,
        order
      );

    } catch {

      error(
        res,
        "خطا در ویرایش سفارش",
        500
      );
    }

  }
);


// =====================================================
// PAYMENTS
// =====================================================

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

      success(
        res,
        payments
      );

    } catch {

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

      if (!validId(orderId)) {
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

      const value =
        Number(amount);

      if (
        !Number.isFinite(value) ||
        value <= 0 ||
        value > order.remainingAmount
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

          amount: value,

          method,

          note,

          createdBy:
            req.user.id
        });

      order.paidAmount += value;

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

    } catch {

      error(
        res,
        "خطا در ثبت پرداخت",
        500
      );
    }

  }
);


// =====================================================
// EXPENSES
// =====================================================

app.get(
  "/api/expenses",
  authRequired,
  async (req, res) => {

    try {

      const data =
        await Expense.find()
          .sort({
            createdAt: -1
          });

      success(res, data);

    } catch {

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

    } catch {

      error(
        res,
        "خطا در ثبت هزینه",
        500
      );
    }

  }
);


// =====================================================
// INVENTORY
// =====================================================

app.get(
  "/api/inventory",
  authRequired,
  async (req, res) => {

    try {

      const data =
        await Inventory.find()
          .sort({
            createdAt: -1
          });

      success(res, data);

    } catch {

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

    } catch {

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

    } catch {

      error(
        res,
        "خطا در ویرایش موجودی",
        500
      );
    }

  }
);


// =====================================================
// INVOICES
// =====================================================

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

      success(
        res,
        invoices
      );

    } catch {

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

    } catch {

      error(
        res,
        "خطا در ساخت فاکتور",
        500
      );
    }

  }
);


// =====================================================
// EMPLOYEES
// =====================================================

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

    } catch {

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

    } catch {

      error(
        res,
        "خطا در ثبت کارمند",
        500
      );
    }

  }
);


// =====================================================
// NOTIFICATIONS
// =====================================================

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

    } catch {

      error(
        res,
        "خطا در دریافت اعلان‌ها",
        500
      );
    }

  }
);


// =====================================================
// SETTINGS
// =====================================================

app.get(
  "/api/settings",
  authRequired,
  async (req, res) => {

    try {

      let settings =
        await Setting.findOne();

      if (!settings) {
        settings =
          await Setting.create({});
      }

      success(
        res,
        settings
      );

    } catch {

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

    } catch {

      error(
        res,
        "خطا در ذخیره تنظیمات",
        500
      );
    }

  }
);


// =====================================================
// DASHBOARD
// =====================================================

app.get(
  "/api/reports/dashboard",
  authRequired,
  async (req, res) => {

    try {

      const now =
        new Date();

      const today =
        new Date(now);

      today.setHours(
        0,
        0,
        0,
        0
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

      success(
        res,
        {

          salesToday:
            todaySales[0]?.total || 0,

          salesMonth:
            monthSales[0]?.total || 0,

          expensesMonth:
            monthExpenses[0]?.total || 0,

          profit:
            (monthSales[0]?.total || 0) -
            (monthExpenses[0]?.total || 0),

          activeOrders,

          readyOrders,

          customers,

          debts:
            debts[0]?.total || 0,

          lowStock

        }
      );

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


// =====================================================
// 404
// =====================================================

app.use(
  (req, res) => {

    error(
      res,
      "API مورد نظر پیدا نشد",
      404
    );

  }
);


// =====================================================
// ERROR HANDLER
// =====================================================

app.use(
  (err, req, res, next) => {

    console.error(
      "SERVER ERROR:",
      err
    );

    if (
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


// =====================================================
// START SERVER
// =====================================================

async function startServer() {

  try {

    await connectDatabase();

    app.listen(
      PORT,
      "0.0.0.0",
      () => {

        console.log("");
        console.log(
          "================================="
        );

        console.log(
          "🚀 KHAYAT-YAR SERVER"
        );

        console.log(
          `🌐 PORT: ${PORT}`
        );

        console.log(
          `🔗 http://localhost:${PORT}`
        );

        console.log(
          "================================="
        );

      }
    );

  } catch (error) {

    console.error(
      "❌ Server startup failed"
    );

    process.exit(1);
  }

}

startServer();
