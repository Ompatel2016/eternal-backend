const mongoose = require("mongoose");

const examSchema = new mongoose.Schema({
  title: String,
  examDate: Date,
  file: String,

  assignType: {
    type: String,
    enum: ["all", "specific"],
    default: "all",
  },

  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model("Exam", examSchema);