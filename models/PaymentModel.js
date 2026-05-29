const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

   visaId: { // 🔥 ADD THIS
    type: mongoose.Schema.Types.ObjectId,
    ref: "Visa"
  },

  paymentFor: { // 🔥 IMPORTANT
    type: String,
    enum: ["visa", "course"]
  },
  
  amount: Number,

  screenshot: String,

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },

  method: {
    type: String,
    enum: ["upi", "bank"]
  },

  receiptGenerated: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);