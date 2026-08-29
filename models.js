const mongoose = require("mongoose");

const { Schema } = mongoose;

// =====================================================
// USER
// =====================================================

const userSchema = new Schema(
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
      enum: ["admin", "manager", "employee"],
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


// =====================================================
// CUSTOMER
// =====================================================

const customerSchema = new Schema(
  {
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


// =====================================================
// MEASUREMENT
// =====================================================

const measurementFields = {
  qaddPirahan: Number,
  shana: Number,
  astin: Number,
  baghal: Number,
  kamar: Number,
  balaTana: Number,
  sorin: Number,
  qaddKarti: Number,
  qaddVest: Number,
  qaddDaman: Number,
  qaddShalwar: Number,
  barDaman: Number,
  pachah: Number,
  barYakhon: Number,
  dehanAstin: Number
};

const maleMeasurementSchema = new Schema(
  measurementFields,
  {
    _id: false
  }
);

const femaleMeasurementSchema = new Schema(
  measurementFields,
  {
    _id: false
  }
);

const measurementSchema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true
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
      type: maleMeasurementSchema,
      default: undefined
    },

    female: {
      type: femaleMeasurementSchema,
      default: undefined
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


// =====================================================
// ORDER
// =====================================================

const orderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true
    },

    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true
    },

    measurementId: {
      type: Schema.Types.ObjectId,
      ref: "Measurement"
    },

    description: {
      type: String,
      default: ""
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
    },

    price: {
      type: Number,
      default: 0,
      min: 0
    },

    discount: {
      type: Number,
      default: 0,
      min: 0
    },

    finalPrice: {
      type: Number,
      default: 0,
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

    deliveryDate: Date,

    notes: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);


// =====================================================
// PAYMENT
// =====================================================

const paymentSchema = new Schema(
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
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);


// =====================================================
// EXPENSE
// =====================================================

const expenseSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    category: {
      type: String,
      default: "other"
    },

    description: {
      type: String,
      default: ""
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);


// =====================================================
// INVENTORY
// =====================================================

const inventorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    category: {
      type: String,
      default: "other"
    },

    quantity: {
      type: Number,
      default: 0,
      min: 0
    },

    unit: {
      type: String,
      default: "عدد"
    },

    minimumStock: {
      type: Number,
      default: 0,
      min: 0
    },

    price: {
      type: Number,
      default: 0,
      min: 0
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


// =====================================================
// INVOICE
// =====================================================

const invoiceSchema = new Schema(
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

    subtotal: {
      type: Number,
      default: 0
    },

    discount: {
      type: Number,
      default: 0
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


// =====================================================
// EMPLOYEE
// =====================================================

const employeeSchema = new Schema(
  {
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
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
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


// =====================================================
// NOTIFICATION
// =====================================================

const notificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    title: {
      type: String,
      required: true
    },

    message: {
      type: String,
      required: true
    },

    type: {
      type: String,
      default: "info"
    },

    read: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);


// =====================================================
// SETTINGS
// =====================================================

const settingSchema = new Schema(
  {
    shopName: {
      type: String,
      default: "خیاط‌یار"
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

    logo: {
      type: String,
      default: ""
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


// =====================================================
// MODELS
// =====================================================

const User =
  mongoose.models.User ||
  mongoose.model("User", userSchema);

const Customer =
  mongoose.models.Customer ||
  mongoose.model("Customer", customerSchema);

const Measurement =
  mongoose.models.Measurement ||
  mongoose.model("Measurement", measurementSchema);

const Order =
  mongoose.models.Order ||
  mongoose.model("Order", orderSchema);

const Payment =
  mongoose.models.Payment ||
  mongoose.model("Payment", paymentSchema);

const Expense =
  mongoose.models.Expense ||
  mongoose.model("Expense", expenseSchema);

const Inventory =
  mongoose.models.Inventory ||
  mongoose.model("Inventory", inventorySchema);

const Invoice =
  mongoose.models.Invoice ||
  mongoose.model("Invoice", invoiceSchema);

const Employee =
  mongoose.models.Employee ||
  mongoose.model("Employee", employeeSchema);

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);

const Setting =
  mongoose.models.Setting ||
  mongoose.model("Setting", settingSchema);


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
