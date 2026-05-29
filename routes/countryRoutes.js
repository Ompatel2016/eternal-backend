const express = require("express");
const router = express.Router();
const Country = require("../models/CountryModel");
const auth = require("../middelware/auth");
const role = require("../middelware/role");
const upload = require("../middelware/upload");

// ➕ Add New Country
router.post(
  "/add-country",
  auth,
  role("admin"),
  upload.fields([
    { name: "flagImage", maxCount: 1 },
    { name: "bannerImage", maxCount: 1 },
  ]),
  async (req, res) => {
  try {
    // ✅ PARSE visaTypes
      let visaTypes = [];
      if (req.body.visaTypes) {
        visaTypes = JSON.parse(req.body.visaTypes);
      }

    const countryData = {
      ...req.body,
      popularCities: req.body.popularCities
        ? JSON.parse(req.body.popularCities)
        : [],
      visaTypes: req.body.visaTypes
        ? JSON.parse(req.body.visaTypes)
        : [],
      flagImage: req.files?.flagImage?.[0]?.path || "",
      bannerImage: req.files?.bannerImage?.[0]?.path || "",
    };

    const country = await Country.create(countryData);
    res.status(201).json({
      success: true,
      message: "Country added successfully",
      country,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// 📋 Get All Countries (with pagination)
router.get("/all-countries", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;

    const skip = (page - 1) * limit;

    const search = req.query.search || "";

    // ✅ SEARCH QUERY
    const query = {
      name: { $regex: search, $options: "i" } // case-insensitive search
    };

    // ✅ TOTAL (with search applied)
    const total = await Country.countDocuments(query);

    const countries = await Country.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      countries,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// 🔍 Get Single Country
router.get("/:id", async (req, res) => {
  try {
    const country = await Country.findById(req.params.id);

    if (!country) {
      return res.status(404).json({ message: "Country not found" });
    }

    res.status(200).json(country);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✏️ Update Country
router.put(
  "/update-country/:id",
  auth,
  role("admin"),
  upload.fields([
    { name: "flagImage", maxCount: 1 },
    { name: "bannerImage", maxCount: 1 },
  ]),
  async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      visaTypes: req.body.visaTypes
        ? JSON.parse(req.body.visaTypes)
        : [],
    };

    // ✅ PARSE visaTypes (IMPORTANT)
    if (req.body.visaTypes) {
      updateData.visaTypes = JSON.parse(req.body.visaTypes);
    }

    if (req.files?.flagImage) {
      updateData.flagImage = req.files.flagImage[0].path;
    }

    if (req.files?.bannerImage) {
      updateData.bannerImage = req.files.bannerImage[0].path;
    }

    const country = await Country.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!country) {
      return res.status(404).json({ message: "Country not found" });
    }

    res.status(200).json({
      success: true,
      message: "Country updated successfully",
      country,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// 🗑️ Delete Country
router.delete("/delete-country/:id", auth, role("admin"), async (req, res) => {
  try {
    const country = await Country.findByIdAndDelete(req.params.id);

    if (!country) {
      return res.status(404).json({ message: "Country not found" });
    }

    res.status(200).json({
      success: true,
      message: "Country deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// GET universities by country
router.get("/by-country/:countryId", async (req, res) => {
  try {
    const universities = await University.find({
      country: req.params.countryId
    }).populate("country", "name");

    res.json({
      success: true,
      universities
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
