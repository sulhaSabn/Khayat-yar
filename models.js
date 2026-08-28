const mongoose = require("mongoose");

const { Schema } = mongoose;

/* =========================================================
   USER
========================================================= */

const userSchema = new Schema(
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


/* =========================================================
   CUSTOMER
========================================================= */

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

    customerCode: {
      type: String,
      trim: true,
      default: ""
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


/* =========================================================
   MALE MEASUREMENTS
========================================================= */

const maleMeasurementSchema = new Schema(
  {
    qaddPirahan: {
      type: Number,
      default: null
    },

    shana: {
      type: Number,
      default: null
    },

    astin: {
      type: Number,
      default: null
    },

    baghal: {
      type: Number,
      default: null
    },

    kamar: {
      type: Number,
      default: null
    },

    balaTana: {
      type: Number,
      default: null
    },

    sorin: {
      type: Number,
      default: null
    },

    qaddKarti: {
      type: Number,
      default: null
    },

    qaddVest: {
      type: Number,
      default: null
    },

    qaddDaman: {
      type: Number,
      default: null
    },

    qaddShalwar: {
      type: Number,
      default: null
    },

    barDaman: {
      type: Number,
      default: null
    },

    pachah: {
      type: Number,
      default: null
    },

    barYakhon: {
      type: Number,
      default: null
    },

    dehanAstin: {
      type: Number,
      default: null
    }
  },
  {
    _id: false
  }
);


/* =========================================================
   FEMALE MEASUREMENTS
========================================================= */

const femaleMeasurementSchema = new Schema(
  {
    qaddPirahan: {
      type: Number,
      default: null
    },

    shana: {
      type: Number,
      default: null
    },

    astin: {
      type: Number,
      default: null
    },

    baghal: {
      type: Number,
      default: null
    },

    kamar: {
      type: Number,
      default: null
    },

    balaTana: {
      type: Number,
      default: null
    },

    sorin: {
      type: Number,
      default: null
    },

    qaddKarti: {
      type: Number,
      default: null
    },

    qaddVest: {
      type: Number,
      default: null
    },

    qaddDaman: {
      type: Number,
      default: null
    },

    qaddShalwar: {
      type: Number,
      default: null
    },

    barDaman: {
      type: Number,
      default: null
    },

    pachah: {
      type: Number,
      default: null
    },

    barYakhon: {
      type: Number,
      default: null
    },

    dehanAstin: {
      type: Number,
      default: null
    }
  },
  {
    _id: false
  }
);


/* =========================================================
   MEASUREMENT
========================================================= */

const measurementSchema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
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


/* =========================================================
   ORDER
========================================================= */

const orderSchema = new Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
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
      ref: "Measurement",
      default: null
    },

    title: {
      type: String,
      default: "",
      trim: true
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
      default: "registered",
      index: true
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

    deliveryDate: {
      type: Date,
      default: null
    },

    notes: {
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


/* =========================================================
   PAYMENT
========================================================= */

const paymentSchema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true
    },

    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true
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


/* =========================================================
   EXPENSE
========================================================= */

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
      default: "other",
      trim: true
    },

    date: {
      type: Date,
      default: Date.now
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


/* =========================================================
   INVENTORY
========================================================= */

const inventorySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    category: {
      type: String,
      default: "other",
      trim: true
    },

    quantity: {
      type: Number,
      default: 0,
      min: 0
    },

    unit: {
      type: String,
      default: "عدد",
      trim: true
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


/* =========================================================
   INVOICE
========================================================= */

const invoiceSchema = new Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },

    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true
    },

    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true
    },

    subtotal: {
      type: Number,
      default: 0,
      min: 0
    },

    discount: {
      type: Number,
      default: 0,
      min: 0
    },

    total: {
      type: Number,
      default: 0,
      min: 0
    },

    paid: {
      type: Number,
      default: 0,
      min: 0
    },

    remaining: {
      type: Number,
      default: 0,
      min: 0
    },

    notes: {
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


/* =========================================================
   EMPLOYEE
========================================================= */

const employeeSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    phone: {
      type: String,
      default: "",
      trim: true
    },

    position: {
      type: String,
      default: "",
      trim: true
    },

    salary: {
      type: Number,
      default: 0,
      min: 0
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    },

    notes: {
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


/* =========================================================
   NOTIFICATION
========================================================= */

const notificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    title: {
      type: String,
      required: true,
      trim: true
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


/* =========================================================
   SETTINGS
========================================================= */

const settingSchema = new Schema(
  {
    shopName: {
      type: String,
      default: "خیاط‌یار",
      trim: true
    },

    ownerName: {
      type: String,
      default: "",
      trim: true
    },

    phone: {
      type: String,
      default: "",
      trim: true
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
    },

    description: {
      type: String,
      default: ""
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
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
  Invoice,
  Employee,
  Notification,
  Setting
};
