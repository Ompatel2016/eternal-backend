const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    category: {
        type: String,
        default: "Visa",
      },
    
    Writtenby: {
      type: String,
      default: "User",
    },

    image: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["published", "hidden"],
      default: "published",
    },

    orderType: {
      type: String,
      enum: ["date", "manual"],
      default: "date",
    },

    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Blog", blogSchema);