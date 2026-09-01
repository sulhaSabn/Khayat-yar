const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    userId: {
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
      required: true
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

OrderSchema.index({
  userId: 1,
  createdAt: -1
});

module.exports =
  mongoose.models.Order ||
  mongoose.model("Order", OrderSchema);
