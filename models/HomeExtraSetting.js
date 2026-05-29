const mongoose = require("mongoose");

const homeExtraSettingSchema =
  new mongoose.Schema({

    // NAVBAR EMAIL
    email: {
      type: String,
      default: "",
    },

    // GALLERY SECTION
    gallery: [
      {
        title: String,

        description: String,

        image: String,
      },
    ],

    footer: {
      facebook: {
        type: String,
        default: "",
      },

      instagram: {
        type: String,
        default: "",
      },

      linkedin: {
        type: String,
        default: "",
      },

      copyright: {
        type: String,
        default:
          "© 2026 Eternal Immigration. All rights reserved.",
      },
    },
  });

  module.exports = mongoose.model("HomeExtra", homeExtraSettingSchema);