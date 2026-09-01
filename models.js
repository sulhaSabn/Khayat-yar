const mongoose = require("mongoose");

/* =========================================================
   CUSTOMER
========================================================= */

const customerSchema = new mongoose.Schema(
  {
    ownerId: {
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
      default: "",
      trim: true
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


/* =========================================================
   MEASUREMENT
========================================================= */

const measurementSchema = new mongoose.Schema(
  {
    ownerId: {
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
      qaddPirahan: Number,
      shana: Number,
      astin: Number,
      baghal: Number,

      // کمر حذف شده
      // بالاتنه حذف شده
      // سینه حذف شده
      // قد کرتی حذف شده
      // قد واسکت حذف شده

      qaddDaman: Number,
      qaddShalwar: Number,

      barDaman: Number,

      // کف اضافه شد
      kaf: Number,

      pachah: Number,
      barYakhon: Number,
      dehanAstin: Number
    },

    female: {
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
      kaf: Number,

      pachah: Number,
      barYakhon: Number,
      dehanAstin: Number
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


/* =========================================================
   ORDER
========================================================= */

const orderSchema = new mongoose.Schema(
  {
    ownerId: {
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
      required: true,
      unique: true,
      index: true
    },

    description: {
      type: String,
      default: ""
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


/* =========================================================
   PAYMENT
========================================================= */

const paymentSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
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
    }
  },
  {
    timestamps: true
  }
);


/* =========================================================
   EXPENSE
========================================================= */

const expenseSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

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


/* =========================================================
   INVENTORY
========================================================= */

const inventorySchema = new mongoose.Schema(
  {
    ownerId: {
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

    category: {
      type: String,
      default: ""
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
    }
  },
  {
    timestamps: true
  }
);


/* =========================================================
   EMPLOYEE
========================================================= */

const employeeSchema = new mongoose.Schema(
  {
    ownerId: {
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
      default: ""
    },

    position: {
      type: String,
      default: ""
    },

    salary: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);


/* =========================================================
   INVOICE
========================================================= */

const invoiceSchema = new mongoose.Schema(
  {
    ownerId: {
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
      ref: "Customer",
      required: true
    },

    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
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


/* =========================================================
   NOTIFICATION
========================================================= */

const notificationSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    title: {
      type: String,
      required: true
    },

    message: {
      type: String,
      default: ""
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


/* =========================================================
   SETTINGS
========================================================= */

const settingSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },

    shopName: {
      type: String,
      default: "خیاطی من"
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
      default: "با تشکر از اعتماد شما"
    }
  },
  {
    timestamps: true
  }
);


/* =========================================================
   USER
========================================================= */

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

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: [
        "admin",
        "user"
      ],
      default: "admin"
    }
  },
  {
    timestamps: true
  }
);


/* =========================================================
   MODELS
========================================================= */

const User =
  mongoose.models.User ||
  mongoose.model(
    "User",
    userSchema
  );

const Customer =
  mongoose.models.Customer ||
  mongoose.model(
    "Customer",
    customerSchema
  );

const Measurement =
  mongoose.models.Measurement ||
  mongoose.model(
    "Measurement",
    measurementSchema
  );

const Order =
  mongoose.models.Order ||
  mongoose.model(
    "Order",
    orderSchema
  );

const Payment =
  mongoose.models.Payment ||
  mongoose.model(
    "Payment",
    paymentSchema
  );

const Expense =
  mongoose.models.Expense ||
  mongoose.model(
    "Expense",
    expenseSchema
  );

const Inventory =
  mongoose.models.Inventory ||
  mongoose.model(
    "Inventory",
    inventorySchema
  );

const Employee =
  mongoose.models.Employee ||
  mongoose.model(
    "Employee",
    employeeSchema
  );

const Invoice =
  mongoose.models.Invoice ||
  mongoose.model(
    "Invoice",
    invoiceSchema
  );

const Notification =
  mongoose.models.Notification ||
  mongoose.model(
    "Notification",
    notificationSchema
  );

const Setting =
  mongoose.models.Setting ||
  mongoose.model(
    "Setting",
    settingSchema
  );


/* =========================================================
   EXPORT
========================================================= */

module.exports = {
  User,
  Customer,
  Measurement,
  Order,
  Payment,
  Expense,
  Inventory,
  Employee,
  Invoice,
  Notification,
  Setting
};
