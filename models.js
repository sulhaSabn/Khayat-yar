const mongoose = require("mongoose");

const { Schema } = mongoose;

// USER
const User = mongoose.model(
  "User",
  new Schema(
    {
      name: {
        type: String,
        required: true,
        trim: true
      },

      email: {
        type: String,
        lowercase: true,
        trim: true,
        sparse: true,
        unique: true
      },

      phone: {
        type: String,
        trim: true,
        sparse: true,
        unique: true
      },

      passwordHash: {
        type: String,
        required: true,
        select: false
      },

      role: {
        type: String,
        enum: ["admin", "manager", "tailor", "cashier"],
        default: "cashier"
      },

      isActive: {
        type: Boolean,
        default: true
      }
    },
    { timestamps: true }
  )
);

// CUSTOMER
const Customer = mongoose.model(
  "Customer",
  new Schema(
    {
      name: {
        type: String,
        required: true,
        trim: true
      },

      phone: {
        type: String,
        required: true,
        index: true
      },

      address: String,

      notes: String,

      customerType: {
        type: String,
        enum: ["normal", "vip", "special"],
        default: "normal"
      }
    },
    { timestamps: true }
  )
);

// MEASUREMENT
const Measurement = mongoose.model(
  "Measurement",
  new Schema(
    {
      customerId: {
        type: Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
        index: true
      },

      title: {
        type: String,
        required: true
      },

      height: Number,
      neck: Number,
      chest: Number,
      waist: Number,
      hip: Number,
      shoulder: Number,
      arm: Number,
      wrist: Number,
      sleeve: Number,
      shirtLength: Number,
      pantsLength: Number,
      thigh: Number,
      knee: Number,
      calf: Number,
      inseam: Number,

      notes: String
    },
    { timestamps: true }
  )
);

// ORDER
const Order = mongoose.model(
  "Order",
  new Schema(
    {
      orderNumber: {
        type: String,
        required: true,
        unique: true,
        index: true
      },

      customerId: {
        type: Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
        index: true
      },

      measurementId: {
        type: Schema.Types.ObjectId,
        ref: "Measurement"
      },

      type: {
        type: String,
        required: true
      },

      description: String,

      fabric: String,

      color: String,

      price: {
        type: Number,
        required: true,
        min: 0
      },

      discount: {
        type: Number,
        default: 0,
        min: 0
      },

      finalPrice: {
        type: Number,
        required: true,
        min: 0
      },

      paidAmount: {
        type: Number,
        default: 0,
        min: 0
      },

      remainingAmount: {
        type: Number,
        default: 0,
        min: 0
      },

      deliveryDate: {
        type: Date,
        index: true
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
        default: "registered",
        index: true
      },

      assignedTailorId: {
        type: Schema.Types.ObjectId,
        ref: "User"
      },

      notes: String
    },
    { timestamps: true }
  )
);

// PAYMENT
const Payment = mongoose.model(
  "Payment",
  new Schema(
    {
      customerId: {
        type: Schema.Types.ObjectId,
        ref: "Customer",
        required: true
      },

      orderId: {
        type: Schema.Types.ObjectId,
        ref: "Order",
        required: true
      },

      amount: {
        type: Number,
        required: true,
        min: 0.01
      },

      method: {
        type: String,
        enum: ["cash", "card", "bank", "other"],
        required: true
      },

      note: String,

      createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
      }
    },
    { timestamps: true }
  )
);

// EXPENSE
const Expense = mongoose.model(
  "Expense",
  new Schema(
    {
      title: {
        type: String,
        required: true
      },

      category: {
        type: String,
        enum: [
          "fabric",
          "thread",
          "equipment",
          "rent",
          "electricity",
          "water",
          "salary",
          "transport",
          "other"
        ],
        required: true
      },

      amount: {
        type: Number,
        required: true,
        min: 0
      },

      description: String,

      createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User"
      }
    },
    { timestamps: true }
  )
);

// INVENTORY
const Inventory = mongoose.model(
  "Inventory",
  new Schema(
    {
      name: {
        type: String,
        required: true
      },

      type: {
        type: String,
        required: true
      },

      color: String,

      quantity: {
        type: Number,
        required: true,
        min: 0
      },

      unit: {
        type: String,
        default: "meter"
      },

      pricePerUnit: {
        type: Number,
        default: 0
      },

      supplier: String,

      minimumStock: {
        type: Number,
        default: 0
      }
    },
    { timestamps: true }
  )
);

// INVOICE
const Invoice = mongoose.model(
  "Invoice",
  new Schema(
    {
      invoiceNumber: {
        type: String,
        required: true,
        unique: true
      },

      orderId: {
        type: Schema.Types.ObjectId,
        ref: "Order",
        required: true
      },

      customerId: {
        type: Schema.Types.ObjectId,
        ref: "Customer",
        required: true
      },

      subtotal: Number,
      discount: Number,
      total: Number,
      paid: Number,
      remaining: Number
    },
    { timestamps: true }
  )
);

// EMPLOYEE
const Employee = mongoose.model(
  "Employee",
  new Schema(
    {
      name: {
        type: String,
        required: true
      },

      phone: String,

      position: {
        type: String,
        required: true
      },

      salary: {
        type: Number,
        default: 0
      },

      isActive: {
        type: Boolean,
        default: true
      }
    },
    { timestamps: true }
  )
);

// NOTIFICATION
const Notification = mongoose.model(
  "Notification",
  new Schema(
    {
      userId: {
        type: Schema.Types.ObjectId,
        ref: "User"
      },

      type: String,

      title: String,

      message: String,

      read: {
        type: Boolean,
        default: false
      }
    },
    { timestamps: true }
  )
);

// SETTINGS
const Setting = mongoose.model(
  "Setting",
  new Schema(
    {
      businessName: {
        type: String,
        required: true
      },

      phone: String,

      address: String,

      currency: {
        type: String,
        default: "AFN"
      },

      logo: String,

      invoiceFooter: String
    },
    { timestamps: true }
  )
);

module.exports = {
  User,
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
};
