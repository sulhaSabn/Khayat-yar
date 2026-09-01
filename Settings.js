const mongoose = require("mongoose");

const SettingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },

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

    invoiceFooter: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.models.Settings ||
  mongoose.model("Settings", SettingsSchema);
