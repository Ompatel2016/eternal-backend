const express = require("express");
const router = express.Router();
const auth = require("../middelware/auth");
const role = require("../middelware/role");
const HeroSection = require("../models/HeroSectionModel");
const upload = require("../middelware/upload");
const { route } = require("./aboutRoutes");

router.get("/", async (req,res) => {
    try {
        const hero = await HeroSection.findOne();
        // if no data
        if (!hero) {

        hero = await HeroSection.create({
            features: [
            "Study Visa Assistance",
            "Work Visa Support",
            "Top Universities",
            "24/7 Guidance",
            ],
        });

        }
        res.json(hero);
    } catch(error)
    {
        res.status(500).json({
            message: error.message,
        });
    }
});

router.put(
  "/save",
  auth,
  role("admin"),
  upload.array("images", 6),
  async (req, res) => {

    try {

      let hero = await HeroSection.findOne();

      if (!hero) {
        hero = new HeroSection();
      }

      hero.title =
        req.body.title || hero.title;

      hero.subtitle =
        req.body.subtitle || hero.subtitle;

      hero.description =
        req.body.description || hero.description;

      hero.buttonText =
        req.body.buttonText || hero.buttonText;

      // FEATURES
      if (req.body.features) {

        hero.features = JSON.parse(
          req.body.features
        );

      }

      // IMAGES
      if (req.files && req.files.length > 0) {

        const uploadedImages =
          req.files.map(
            (file) => file.path
          );

        hero.images = uploadedImages;
      }

      await hero.save();

      res.json({
        success: true,
        message: "Hero Section Updated",
        hero,
      });

    } catch (error) {

      console.log(error);

      res.status(500).json({
        success: false,
        message: error.message,
      });

    }

  }
);

module.exports = router;