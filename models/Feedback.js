const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  name: String,
  message: String,
  rating: Number,

  isPublic: {
    type: Boolean,
    default: false   // 👈 IMPORTANT
  }

}, { timestamps: true });

module.exports = mongoose.model("Feedback", feedbackSchema);