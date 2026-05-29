const mongoose = require("mongoose");

const studySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },

  category: {
    type: String,
  },

  // 📄 File (PDF)
  file: {
    type: String,
    default: "",
  },

  // 🎥 Video Link
  videoLink: {
    type: String,
    default: "",
  },

  // 🔥 ASSIGN TYPE
  assignType: {
    type: String,
    enum: ["all", "specific"],
    default: "all",
  },

  // 👤 Specific Student
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },

}, { timestamps: true });

module.exports = mongoose.model("Study", studySchema);