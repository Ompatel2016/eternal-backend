const express = require("express");
const router = express.Router();
const auth = require("../middelware/auth");
const role = require("../middelware/role");
const About = require("../models/AboutModel");

// =====================================
// GET ABOUT DATA (PUBLIC)
// =====================================
router.get("/", async (req, res) => {
  try {

    const about = await About.findOne();

    res.json({
      success: true,
      about,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
});

// =====================================
// SAVE / UPDATE ABOUT DATA
// ONLY ADMIN
// =====================================
router.post(
  "/save",
  auth,
  role("admin"),
  async (req, res) => {

    try {

      let about = await About.findOne();

      if (about) {

        about = await About.findByIdAndUpdate(
          about._id,
          req.body,
          { new: true }
        );

      } else {

        about = await About.create(req.body);

      }

      res.json({
        success: true,
        about,
        message: "About data saved successfully",
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