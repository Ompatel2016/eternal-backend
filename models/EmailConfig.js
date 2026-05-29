const mongoose = require("mongoose");

const emailConfigSchema = new mongoose.Schema({
  email: String,
  password: String
}, { timestamps: true });

module.exports = mongoose.model("EmailConfig", emailConfigSchema);