const mongoose = require("mongoose");

const assignSchema = new mongoose.Schema({
  studentIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],

  studyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Study",
    default: null,
  },

  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Exam",
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model("Assign", assignSchema);