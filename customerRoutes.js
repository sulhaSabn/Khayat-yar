const express = require("express");

const router = express.Router();

const {
  Customer,
  Measurement,
  Order
} = require("./models");

const {
  authRequired
} = require("./auth");


/* =========================================================
   HELPER
========================================================= */

function clean(value) {

  return String(value || "").trim();

}


const measurementMap = {

  shirtLength: "qaddPirahan",

  shoulder: "shana",

  sleeve: "astin",

  armpit: "baghal",

  waist: "kamar",

  upperBody: "balaTana",

  surin: "sorin",

  kurtiLength: "qaddKarti",

  vestLength: "qaddVest",

  skirtLength: "qaddDaman",

  pantsLength: "qaddShalwar",

  waistBand: "barDaman",

  legOpening: "pachah",

  collar: "barYakhon",

  sleeveOpening: "dehanAstin"

};


/* =========================================================
   GET CUSTOMERS
   GET /api/customers
========================================================= */

router.get(
  "/",
  authRequired,
  async (req, res) => {

    try {

      const search =
        clean(req.query.search);


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
          },

          {
            customerCode: {
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


      return res.json({

        success: true,

        data: customers

      });

    } catch (error) {

      console.error(
        "GET CUSTOMERS ERROR:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "خطا در دریافت مشتریان"

      });

    }

  }
);


/* =========================================================
   CREATE CUSTOMER
   POST /api/customers
========================================================= */

router.post(
  "/",
  authRequired,
  async (req, res) => {

    try {

      const {
        name,
        phone,
        gender,
        customerCode,
        address,
        notes
      } = req.body || {};


      if (
        !clean(name) ||
        !clean(phone) ||
        !["male", "female"].includes(gender)
      ) {

        return res.status(400).json({

          success: false,

          message:
            "نام، شماره تلفن و جنسیت الزامی است"

        });

      }


      /* بررسی شماره تکراری */

      const phoneExists =
        await Customer.findOne({
          phone: clean(phone)
        });


      if (phoneExists) {

        return res.status(409).json({

          success: false,

          message:
            "این شماره تلفن قبلاً برای مشتری دیگری ثبت شده است"

        });

      }


      /* بررسی کد مشتری */

      if (clean(customerCode)) {

        const codeExists =
          await Customer.findOne({
            customerCode:
              clean(customerCode)
          });


        if (codeExists) {

          return res.status(409).json({

            success: false,

            message:
              "کد مشتری قبلاً استفاده شده است"

          });

        }

      }


      const customer =
        await Customer.create({

          name: clean(name),

          phone: clean(phone),

          gender,

          customerCode:
            clean(customerCode) ||
            undefined,

          address:
            clean(address),

          notes:
            clean(notes),

          createdBy:
            req.user.id

        });


      return res.status(201).json({

        success: true,

        message:
          "مشتری با موفقیت ثبت شد",

        data: customer

      });

    } catch (error) {

      console.error(
        "CREATE CUSTOMER ERROR:",
        error
      );

      if (error.code === 11000) {

        return res.status(409).json({

          success: false,

          message:
            "اطلاعات تکراری است"

        });

      }

      return res.status(500).json({

        success: false,

        message:
          "خطا در ثبت مشتری"

      });

    }

  }
);


/* =========================================================
   GET CUSTOMER DETAILS
   GET /api/customers/:id
========================================================= */

router.get(
  "/:id",
  authRequired,
  async (req, res) => {

    try {

      const customer =
        await Customer.findById(
          req.params.id
        );


      if (!customer) {

        return res.status(404).json({

          success: false,

          message:
            "مشتری پیدا نشد"

        });

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


      return res.json({

        success: true,

        data: {

          customer,

          measurements,

          orders

        }

      });

    } catch (error) {

      console.error(
        "CUSTOMER DETAILS ERROR:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "خطا در دریافت اطلاعات مشتری"

      });

    }

  }
);


/* =========================================================
   UPDATE CUSTOMER
   PUT /api/customers/:id
========================================================= */

router.put(
  "/:id",
  authRequired,
  async (req, res) => {

    try {

      const {
        name,
        phone,
        gender,
        customerCode,
        address,
        notes
      } = req.body || {};


      if (
        !clean(name) ||
        !clean(phone) ||
        !["male", "female"].includes(gender)
      ) {

        return res.status(400).json({

          success: false,

          message:
            "نام، شماره تلفن و جنسیت الزامی است"

        });

      }


      const duplicate =
        await Customer.findOne({

          phone: clean(phone),

          _id: {
            $ne: req.params.id
          }

        });


      if (duplicate) {

        return res.status(409).json({

          success: false,

          message:
            "این شماره تلفن متعلق به مشتری دیگری است"

        });

      }


      const customer =
        await Customer.findByIdAndUpdate(

          req.params.id,

          {

            name: clean(name),

            phone: clean(phone),

            gender,

            customerCode:
              clean(customerCode) ||
              undefined,

            address:
              clean(address),

            notes:
              clean(notes)

          },

          {
            new: true,
            runValidators: true
          }

        );


      if (!customer) {

        return res.status(404).json({

          success: false,

          message:
            "مشتری پیدا نشد"

        });

      }


      return res.json({

        success: true,

        message:
          "اطلاعات مشتری ویرایش شد",

        data: customer

      });

    } catch (error) {

      console.error(
        "UPDATE CUSTOMER ERROR:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "خطا در ویرایش مشتری"

      });

    }

  }
);


/* =========================================================
   DELETE CUSTOMER
   DELETE /api/customers/:id
========================================================= */

router.delete(
  "/:id",
  authRequired,
  async (req, res) => {

    try {

      const customer =
        await Customer.findById(
          req.params.id
        );


      if (!customer) {

        return res.status(404).json({

          success: false,

          message:
            "مشتری پیدا نشد"

        });

      }


      await Measurement.deleteMany({

        customerId:
          customer._id

      });


      await Customer.findByIdAndDelete(
        customer._id
      );


      return res.json({

        success: true,

        message:
          "مشتری حذف شد"

      });

    } catch (error) {

      console.error(
        "DELETE CUSTOMER ERROR:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "خطا در حذف مشتری"

      });

    }

  }
);


/* =========================================================
   ADD MEASUREMENT
   POST /api/customers/:id/measurements
========================================================= */

router.post(
  "/:id/measurements",
  authRequired,
  async (req, res) => {

    try {

      const customerId =
        req.params.id;


      const customer =
        await Customer.findById(
          customerId
        );


      if (!customer) {

        return res.status(404).json({

          success: false,

          message:
            "مشتری پیدا نشد"

        });

      }


      let gender =
        req.body.gender ||
        customer.gender;


      if (
        !["male", "female"].includes(gender)
      ) {

        return res.status(400).json({

          success: false,

          message:
            "جنسیت اندازه‌گیری نامعتبر است"

        });

      }


      const unit =
        ["cm", "inch"].includes(req.body.unit)
          ? req.body.unit
          : "cm";


      const measurements = {};


      /*
        تبدیل نام‌های فرانت‌اند به نام‌های مدل
      */

      Object.entries(
        measurementMap
      ).forEach(
        ([frontendKey, backendKey]) => {

          const value =
            req.body[backendKey] !== undefined
              ? req.body[backendKey]
              : req.body[frontendKey];


          if (
            value !== undefined &&
            value !== null &&
            value !== ""
          ) {

            const number =
              Number(value);


            if (!Number.isNaN(number)) {

              measurements[
                backendKey
              ] = number;

            }

          }

        }
      );


      const data = {

        customerId,

        gender,

        unit,

        notes:
          clean(req.body.notes),

        createdBy:
          req.user.id

      };


      if (gender === "male") {

        data.male =
          measurements;

      } else {

        data.female =
          measurements;

      }


      const measurement =
        await Measurement.create(
          data
        );


      return res.status(201).json({

        success: true,

        message:
          "اندازه مشتری با موفقیت ثبت شد",

        data: measurement

      });

    } catch (error) {

      console.error(
        "ADD MEASUREMENT ERROR:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "خطا در ثبت اندازه مشتری"

      });

    }

  }
);


/* =========================================================
   GET CUSTOMER MEASUREMENTS
   GET /api/customers/:id/measurements
========================================================= */

router.get(
  "/:id/measurements",
  authRequired,
  async (req, res) => {

    try {

      const customer =
        await Customer.findById(
          req.params.id
        );


      if (!customer) {

        return res.status(404).json({

          success: false,

          message:
            "مشتری پیدا نشد"

        });

      }


      const measurements =
        await Measurement.find({

          customerId:
            customer._id

        }).sort({

          createdAt: -1

        });


      return res.json({

        success: true,

        data: measurements

      });

    } catch (error) {

      console.error(
        "GET MEASUREMENTS ERROR:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "خطا در دریافت اندازه‌ها"

      });

    }

  }
);


/* =========================================================
   DELETE MEASUREMENT
   DELETE /api/customers/:customerId/measurements/:measurementId
========================================================= */

router.delete(
  "/:customerId/measurements/:measurementId",
  authRequired,
  async (req, res) => {

    try {

      const result =
        await Measurement.findOneAndDelete({

          _id:
            req.params.measurementId,

          customerId:
            req.params.customerId

        });


      if (!result) {

        return res.status(404).json({

          success: false,

          message:
            "اندازه پیدا نشد"

        });

      }


      return res.json({

        success: true,

        message:
          "اندازه حذف شد"

      });

    } catch (error) {

      console.error(
        "DELETE MEASUREMENT ERROR:",
        error
      );

      return res.status(500).json({

        success: false,

        message:
          "خطا در حذف اندازه"

      });

    }

  }
);


/* =========================================================
   EXPORT
========================================================= */

module.exports = router;
