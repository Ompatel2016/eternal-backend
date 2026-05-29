const mongoose = require("mongoose");
const University = require("../models/Universitymodel");

const countrySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    flagImage: {
      type: String,
      required: true,
    },
    bannerImage: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    capital: {
      type: String,
      trim: true,
    },
    currency: {
      type: String,
      trim: true,
    },
    language: {
      type: String,
      trim: true,
    },
    popularCities: [
      {
        type: String,
        trim: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    visaTypes: [
      {
        title: { type: String, trim: true },
        description: { type: String, trim: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

countrySchema.pre("findOneAndDelete", async function (next) {
  try {
    const countryId = this.getQuery()._id;

    await University.deleteMany({ country: countryId });

    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Country", countrySchema);
