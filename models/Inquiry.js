const mongoose = require("mongoose");

const inquirySchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,        // ✅ NEW
  country: String,      // ✅ NEW
  visa: String,         // ✅ NEW
  intake: String,       // ✅ NEW
  message: String,
  reply: String,
  status: {
    type: String,
    default: "pending"
  }
}, { timestamps: true });

module.exports = mongoose.model("Inquiry", inquirySchema);