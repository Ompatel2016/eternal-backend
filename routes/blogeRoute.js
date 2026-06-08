const express = require("express");
const router = express.Router();
const auth = require("../middelware/auth");
const role = require("../middelware/role");
const upload = require("../middelware/upload");
const Blog = require("../models/BlogeModel");

// GET ALL BLOGS
router.get("/", async (req, res) => {
  try {

    const blogs = await Blog.find()
      .sort({
        order: 1,
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      blogs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ADD BLOG
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
        Writtenby,
        status,
        orderType,
        order,
      } = req.body;

      const blog = new Blog({
        title,
        description,
        category,
        Writtenby,
        status,
        orderType,
        order,

        image: req.file
          ? req.file.filename
          : "",
      });

      await blog.save();

      res.status(201).json({
        success: true,
        message: "Blog added",
        blog,
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        message: error.message,
      });

    }
  }
);


// UPDATE BLOG
router.put(
  "/:id",
  auth,
  role("admin"),
  upload.single("image"),

  async (req, res) => {

    try {

      const blog = await Blog.findById(
        req.params.id
      );

      if (!blog) {
        return res.status(404).json({
          success: false,
          message: "Blog not found",
        });
      }

      blog.title =
        req.body.title || blog.title;

      blog.description =
        req.body.description ||
        blog.description;

      blog.category = 
        req.body.category ||
        blog.category;
      
      blog.Writtenby = 
        req.body.Writtenby ||
        blog.Writtenby;

      blog.status =
        req.body.status || blog.status;

      blog.orderType =
        req.body.orderType ||
        blog.orderType;

      blog.order =
        req.body.order || blog.order;

      if (req.file) {
        blog.image = req.file.filename;
      }

      await blog.save();

      res.status(200).json({
        success: true,
        message: "Blog updated",
        blog,
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        message: error.message,
      });

    }
  }
);


// DELETE BLOG
router.delete(
  "/:id",
  auth,
  role("admin"),

  async (req, res) => {

    try {

      await Blog.findByIdAndDelete(
        req.params.id
      );

      res.status(200).json({
        success: true,
        message: "Blog deleted",
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

