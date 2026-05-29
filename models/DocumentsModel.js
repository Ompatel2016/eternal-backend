const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  name: {
    type: String,
    enum: [
      "Aadhar Card",
      "Passport",
      "10th Marksheet",
      "12th Marksheet",
      "University Degree"
    ],
    required: true
  },

  fileUrl: {
    type: String,
    default: ""
  },

  isSubmitted: {
    type: Boolean,
    default: false
  },

  isRequired: {
    type: Boolean,
    default: false
  },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  },

  // 🔥 NEW (ONLY ADD)
  visaType: {
    type: String,
    enum: ["study", "work", "tourist"],
    default: "study" // study / work / tourist
  },

  uploadedBy: {
    type: String,
    enum: ["student", "public"],
    default: "student" // student / public
  },

  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },

  visaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Visa"
  }

}, { timestamps: true });

module.exports = mongoose.model("StudentDocument", documentSchema);