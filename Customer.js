const mongoose = require("mongoose");

const CustomerSchema = new mongoose.Schema(
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

CustomerSchema.index({
  userId: 1,
  phone: 1
});

module.exports =
  mongoose.models.Customer ||
  mongoose.model("Customer", CustomerSchema);
