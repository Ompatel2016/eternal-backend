const express = require("express");
const router = express.Router();
const auth = require("../middelware/auth");
const role = require("../middelware/role");
const upload = require("../middelware/upload");
const GalleryPost = require("../models/GalleryModel");

// GET ALL POSTS
router.get("/", async (req, res) => {

  try {

    const posts =
      await GalleryPost.find().sort({
        order: 1,
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      posts,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
});


// ADD POST
router.post(
  "/add",
  auth,
  role("admin"),
  upload.single("image"),

  async (req, res) => {

    try {

      const {
        title,
        description,
        category,
        status,
        order,
      } = req.body;

      const post =
        new GalleryPost({
          title,
          description,
          category,
          status,
          order,

          image: req.file
            ? req.file.path
            : "",
        });

      await post.save();

      res.status(201).json({
        success: true,
        message: "Gallery post added",
        post,
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        message: error.message,
      });

    }
  }
);


// UPDATE
router.put(
  "/:id",
  auth,
  role("admin"),
  upload.single("image"),

  async (req, res) => {

    try {

      const post =
        await GalleryPost.findById(
          req.params.id
        );

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      post.title =
        req.body.title || post.title;

      post.description =
        req.body.description ||
        post.description;

      post.category =
        req.body.category || post.category;

      post.status =
        req.body.status || post.status;

      post.order =
        req.body.order || post.order;

      if (req.file) {
        post.image = req.file.filename;
      }

      await post.save();

      res.status(200).json({
        success: true,
        message: "Gallery updated",
        post,
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        message: error.message,
      });

    }
  }
);


// DELETE
router.delete(
  "/:id",
  auth,
  role("admin"),

  async (req, res) => {

    try {

      await GalleryPost.findByIdAndDelete(
        req.params.id
      );

      res.status(200).json({
        success: true,
        message: "Deleted",
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        message: error.message,
      });

    }
  }
);

module.exports = router;