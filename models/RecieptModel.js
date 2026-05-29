const mongoose = require("mongoose");

const receiptSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment"
  },

  amount: Number,

  receiptNumber: String,

  fileUrl: {
    type: String,
    default: ""
  }

}, { timestamps: true });

module.exports = mongoose.model("Receipt", receiptSchema);