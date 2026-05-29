const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema({
  city: String,
  state: String,
  contact: String,
  phone: String,
});

const AboutusSchema = new mongoose.Schema(
    {
    students: {
      type: String,
      default: "500+",
    },

    visaSuccess: {
      type: String,
      default: "98%",
    },

    experience: {
      type: String,
      default: "10+",
    },

    countriesCount: {
      type: String,
      default: "20+",
    },

    countries: [
      {
        type: String,
      },
    ],

    services: [
      {
        type: String,
      },
    ],

    branches: [branchSchema],

    email: {
      type: String,
    },

    website: {
      type: String,
    },

    phone: {
      type: String,
    },

    instagram1: {
      type: String,
    },

    instagram2: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Aboutus",AboutusSchema);