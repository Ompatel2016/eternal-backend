const mongoose = require("mongoose");

const universitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Country",
      required: true,
    },

    location: {
      type: String,
      require: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    ranking: {
      type: Number,
    },

    courses: [
      {
        type: String,
      },
    ],

    highlights: [
      {
        type: String,
        trim: true,
      },
    ],

    image: {
      type: String,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("University", universitySchema);