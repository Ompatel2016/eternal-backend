const express = require("express");
const router = express.Router();
const auth = require("../middelware/auth");
const role = require("../middelware/role");
const upload = require("../middelware/upload");
const HomeExtra = require("../models/HomeExtraSetting");

router.get("/", async( req, res) => {
     try {
        let data = await HomeExtra.findOne();

        // create default document if empty
        if (!data) {
        data = await HomeExtra.create({
            email: "",
            gallery: [],
             footer: {
                facebook: "",
                instagram: "",
                linkedin: "",

                copyright:
                  "© 2026 Eternal Immigration. All rights reserved.",
              },
        });
        }

        res.status(200).json({
        success: true,
        data,
        });
    } catch (error) {
        res.status(500).json({
        success: false,
        message: error.message,
        });
    }
});

router.post("/save", auth, role("admin"), upload.array("images", 20), async(req,res)=> {
    try{
      const email = req.body.email;

      const footer = req.body.footer
        ? JSON.parse(req.body.footer)
        : {};
      
       // gallery data from frontend
      let gallery = JSON.parse(req.body.gallery);

      // uploaded images
      if (req.files && req.files.length > 0) {
        gallery = gallery.map((item, index) => ({
          ...item,
          image: req.files[index]
            ? `/uploads/${req.files[index].filename}`
            : item.image,
        }));
      }

      let data = await HomeExtra.findOne();

      // first time create
      if (!data) {
        data = new HomeExtra({
          email,
          gallery,
          footer
        });
      } else {
        // update existing
        if (email) {
          data.email = email;
        }
        if (gallery.length > 0) {
            data.gallery = gallery;
          }
        data.footer = Object.keys(footer).length
          ? footer
          : data.footer;
      }

      await data.save();

      res.status(200).json({
        success: true,
        message: "Data saved successfully",
        data,
      });
    } catch (error) {
        res.status(500).json({
        success: false,
        message: error.message,
      });
    }
});

module.exports = router;