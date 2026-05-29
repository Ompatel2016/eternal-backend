const express = require("express");
const router = express.Router();
const University = require("../models/Universitymodel");
const auth = require("../middelware/auth");
const role = require("../middelware/role");
const upload = require("../middelware/upload");

router.post("/add", auth, role("admin"),  upload.single("image"), async (req, res) => {
  try {

    if (req.body.courses) {
      req.body.courses = JSON.parse(req.body.courses);
    }

    if (req.body.highlights) {
      req.body.highlights = JSON.parse(req.body.highlights);
    }

    const university = await University.create(
      {
        name: req.body.name,
        description: req.body.description,
        country: req.body.country,
        ranking: req.body.ranking,
        courses: req.body.courses,
        highlights: req.body.highlights,
        location: req.body.location,
        isActive: req.body.isActive,
        image: req.file?.path || "",
      });

     res.status(201).json({
        success: true,
        university,
        message: "Add Successfully",
      });
      
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 📋 Get all universities (with country populated)
router.get("/all", async (req, res) => {
  try {
    const universities = await University.find()
      .populate("country", "name flagImage");

    res.json({
      success: true,
      universities,
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// ✏️ Update
router.put("/update/:id", auth, role("admin"), upload.single("logo"), async (req, res) => {
  try {

   const updateData = {
      ...req.body,
    };

    if (req.file) {
      updateData.logo = req.file.path;
    }

    if (req.body.courses) {
      req.body.courses = JSON.parse(req.body.courses);
    }

    if (req.body.highlights) {
      req.body.highlights = JSON.parse(req.body.highlights);
    }

    const uni = await University.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json({ success: true, uni });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, message: err.message, });
  }
});

// ❌ Delete
router.delete("/delete/:id", auth, role("admin"), async (req, res) => {
  try {
    
    const university = await University.findByIdAndDelete(
      req.params.id
    );

    if (!university) {
        return res.status(404).json({
          success: false,
          message: "University not found",
        });
      }

    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

module.exports = router;