const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  role: {
    type: String,
    enum: ["admin", "counselor", "student", "public"],
    default: "public"
  },

  // 🔗 Assigned Counselor
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  //this for counselor profile
  // 👇 ADD THESE
  experience: String,
  specialization: String,
  image: String,

  isPublic: {
    type: Boolean,
    default: false
  },

  // 🎓 STUDENT DETAILS (only used if role = student)

  country: {
    type: String,
    default: ""
  },

  field: {
    type: String,
    default: ""
  },

  university: {
    type: String,
    default: ""
  },

  intake: {
    type: String,
    default: ""
  },
  
  visaStatus: {
    type: String,
    enum: ["pending", "processing", "applied", "approved", "rejected"],
    default: "pending"
  },

  fees: {
    total: Number
  },

  address: {
    type: String,
    default: ""
  },

  mobile: {
    type: String,
    default: ""
  },

  gender: {
    type: String,
    enum: ["male", "female", "other"]
  },

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);