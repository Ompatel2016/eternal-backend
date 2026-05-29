const mongoose = require("mongoose");

const counselorSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  experience: String,
  specialization: String,
  image: String, // 👈 profile image
  isPublic: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model("Counselor", counselorSchema);