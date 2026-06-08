require("dotenv").config();
const express = require("express");
const router = express.Router();

const auth = require("../middelware/auth");
const role = require("../middelware/role");

const Visa = require("../models/VisaapplicationModel");
const upload = require("../middelware/upload");

// ================= DEFAULT STEPS =================
const getSteps = () => [
  { name: "Application Form" },
  { name: "Submit Application" },
  { name: "Documentation" },
  { name: "Visa Fees" },
  { name: "Biometric" },
  { name: "Interview" },
  { name: "Processing" },
  { name: "Decision" },
];

// ================= 1. CREATE VISA =================
router.post("/create", auth, upload.array("documents"), async (req, res) => {
  try {
    const { visaType, name, email, phone, passport } = req.body;

    const docs = req.files.map((file) => ({
      name: file.originalname,
      file: file.path,
    }));

    let assignedTo = null;
    let handledBy = "admin";

    // 🔥 STUDENT AUTO ASSIGN
    if (req.user.role === "student") {
      handledBy = "counselor";
      // you can set auto counselor id here later
    }

    const visa = new Visa({
      userId: req.user.id,
      role: req.user.role,
      visaType,
      personalInfo: { name, email, phone, passport },
      documents: docs,
      assignedTo,
      handledBy,
      steps: getSteps(),
    });

    await visa.save();

    res.json({ message: "Visa submitted ✅", visa });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error creating visa" });
  }
});

// ================= 2. GET MY VISA =================
router.get("/my", auth, async (req, res) => {
  const data = await Visa.find({ userId: req.user.id }).sort({
    createdAt: -1,
  });

  res.json(data);
});

// ================= 3. ADMIN GET ALL =================
router.get("/all", auth, role("admin"), async (req, res) => {
  const data = await Visa.find()
    .populate("userId", "name email")
    .populate("assignedTo", "name");

  res.json(data);
});

// ================= 4. COUNSELOR GET ASSIGNED =================
router.get("/assigned", auth, role("counselor"), async (req, res) => {
  const data = await Visa.find({
    assignedTo: req.user.id,
  }).populate("userId", "name email");

  res.json(data);
});

// ================= 5. ADMIN ASSIGN =================
router.put("/assign/:id", auth, role("admin"), async (req, res) => {
  const { counselorId } = req.body;

  const visa = await Visa.findById(req.params.id);

  if (!visa) return res.status(404).json({ message: "Not found" });

  if (counselorId) {
    visa.assignedTo = counselorId;
    visa.handledBy = "counselor";
  } else {
    visa.assignedTo = null;
    visa.handledBy = "admin";
  }

  await visa.save();

  res.json({ message: "Updated successfully" });
});

// ================= 6. UPDATE STEP =================
router.put("/step/:visaId/:stepIndex", auth, async (req, res) => {
  const visa = await Visa.findById(req.params.visaId);

  if (!visa) return res.status(404).json({ message: "Not found" });

  const step = visa.steps[req.params.stepIndex];

  step.status = "completed";
  step.date = new Date();
  step.note = req.body.note;

  await visa.save();

  res.json({ message: "Step updated" });
});

// ================= 7. DELETE =================
router.delete("/delete/:id", auth, role("admin"), async (req, res) => {
  await Visa.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

module.exports = router;