const mongoose = require("mongoose");

const heroSectionSchema = new mongoose.Schema({
  title: {
    type: String,
    default: "Welcome to Eternal Immigration",
  },

  subtitle: {
    type: String,
    default: "ABOUT US",
  },

  description: {
    type: String,
  },

  features: [
    {
      type: String,
    },
  ],

  images: [
    {
      type: String,
    },
  ],

  buttonText: {
    type: String,
    default: "Read More",
  },

});

module.exports = mongoose.model("HeroSection", heroSectionSchema);