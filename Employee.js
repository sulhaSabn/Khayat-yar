const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema(
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
      default: ""
    },

    position: {
      type: String,
      default: ""
    },

    salary: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.models.Employee ||
  mongoose.model("Employee", EmployeeSchema);
