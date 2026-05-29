const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  title: String,
  description: String,
  category: String,
  reply: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    default: "pending",
  },
}, { timestamps: true });

module.exports = mongoose.model("Question", questionSchema);