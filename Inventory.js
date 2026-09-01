const mongoose = require("mongoose");

const InventorySchema = new mongoose.Schema(
  {
    userId: {
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
      default: 0
    },

    unit: {
      type: String,
      default: "عدد"
    },

    minimumStock: {
      type: Number,
      default: 0
    },

    price: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.models.Inventory ||
  mongoose.model("Inventory", InventorySchema);
