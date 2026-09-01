const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
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
      unique: true,
      sparse: true
    },

    phone: {
      type: String,
      trim: true,
      unique: true,
      sparse: true
    },

    password: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ["admin", "employee"],
      default: "admin"
    },

    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.models.User ||
  mongoose.model("User", UserSchema);
