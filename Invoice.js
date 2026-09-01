const mongoose = require("mongoose");

const InvoiceSchema = new mongoose.Schema(
  {
    userId: {
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

module.exports =
  mongoose.models.Invoice ||
  mongoose.model("Invoice", InvoiceSchema);
