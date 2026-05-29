const mongoose = require("mongoose");

const galleryPostSchema =
  new mongoose.Schema(
    {
      title: {
        type: String,
        required: true,
      },

      description: {
        type: String,
        required: true,
      },

      image: {
        type: String,
        required: true,
      },

      status: {
        type: String,
        enum: ["published", "hidden"],
        default: "published",
      },

      category: {
        type: String,
        default: "Visa",
      },

      order: {
        type: Number,
        default: 0,
      },
    },
    {
      timestamps: true,
    }
  );

module.exports = mongoose.model("GalleryPost", galleryPostSchema);