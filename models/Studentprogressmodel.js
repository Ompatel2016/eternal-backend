const studentprogressSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  totalLectures: Number,
  completedLectures: Number

}, { timestamps: true });