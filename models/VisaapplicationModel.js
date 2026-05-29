const mongoose = require("mongoose");

const visaSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  visaType: {
    type: String,
    enum: ["work", "tourist", "study"]
  },

  fullName: String,
  passportNumber: String,
  country: String,

  // 🔥 STATUS PIPELINE
  stage: {
    type: String,
    enum: [
      "application",
      "documents",
      "fees",
      "interview",
      "processing",
      "completed"
    ],
    default: "application"
  },

  // 💳 FEES
  feesPaid: {
    type: Boolean,
    default: false
  },

  // 📅 INTERVIEW
  interviewDate: Date,

  // 📄 FINAL RESULT
  decision: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },

  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  }

}, { timestamps: true });

module.exports = mongoose.model("Visa", visaSchema);