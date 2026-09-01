const mongoose = require("mongoose");

const MeasurementSchema = new mongoose.Schema(
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

      qaddDaman: Number,
      qaddShalwar: Number,

      barDaman: Number,

      // کف
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

      qaddDaman: Number,
      qaddShalwar: Number,

      barDaman: Number,

      // کف
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

module.exports =
  mongoose.models.Measurement ||
  mongoose.model("Measurement", MeasurementSchema);
