require("dotenv").config();
const express = require("express");
const router = express.Router();

const auth = require("../middelware/auth");
const role = require("../middelware/role");

const Question = require("../models/QustionModel");
const multer = require("multer");
const Study = require("../models/StudentContentModel");
const Exam = require("../models/ExamModel");
const Assign = require("../models/AssignModel");

// ✅ 1. STUDENT → ASK QUESTION
router.post("/ask", auth, role("student"), async (req, res) => {
  try {
    const { title, description, category } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ message: "All fields required" });
    }

    const question = new Question({
      studentId: req.user.id,
      title,
      description,
      category,
    });

    await question.save();

    res.json({
      message: "Question submitted ✅",
      question,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ 2. STUDENT → MY QUESTIONS
router.get("/my", auth, role("student"), async (req, res) => {
  try {
    const questions = await Question.find({
      studentId: req.user.id,
    }).sort({ createdAt: -1 });

    res.json(questions);

  } catch (err) {
    res.status(500).json({ message: "Error fetching questions" });
  }
});


// ✅ 3. COUNSELOR → ALL QUESTIONS
router.get("/all", auth, role("counselor"), async (req, res) => {
  try {
    const questions = await Question.find()
      .populate("studentId", "name email")
      .sort({ createdAt: -1 });

    res.json(questions);

  } catch (err) {
    res.status(500).json({ message: "Error fetching questions" });
  }
});


// ✅ 4. COUNSELOR → REPLY
router.put("/reply/:id", auth, role("counselor"), async (req, res) => {
  try {
    const { reply } = req.body;

    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    question.reply = reply;
    question.status = "replied";

    await question.save();

    res.json({
      message: "Reply added ✅",
      question,
    });

  } catch (err) {
    res.status(500).json({ message: "Error replying" });
  }
});


// ✅ 5. DELETE (optional)
router.delete("/delete/:id", auth, role("counselor"), async (req, res) => {
  try {
    await Question.findByIdAndDelete(req.params.id);
    res.json({ message: "Question deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting" });
  }
});

// ================= FILE UPLOAD CONFIG =================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// ✅ UPLOAD STUDY
router.post("/study/upload", upload.single("file"), async (req, res) => {
  try {
    const { title, category, videoLink } = req.body;

    const study = new Study({
      title,
      category,
      file: req.file ? req.file.filename : "",
      videoLink,
    });

    await study.save();

    res.json({ message: "Uploaded successfully" });

  } catch (err) {
    res.status(500).json({ message: "Upload error" });
  }
});


// ✅ GET ALL STUDY
router.get("/study/all", async (req, res) => {
  const data = await Study.find().sort({ createdAt: -1 });
  res.json(data);
});


// ✅ DELETE
router.delete("/study/delete/:id", async (req, res) => {
  await Study.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

router.get("/study/student", auth, async (req, res) => {
  try {
    const data = await Study.find({
      $or: [
        { assignType: "all" },
        { studentId: req.user.id },
      ],
    }).sort({ createdAt: -1 });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
});

// ================= UPLOAD EXAM =================
router.post("/exam/upload", upload.single("file"), async (req, res) => {
  try {
    const { title, examDate, assignType, studentId } = req.body;

    const exam = new Exam({
      title,
      examDate,
      file: req.file ? req.file.filename : "",
      assignType,
      studentId: assignType === "specific" ? studentId : null,
    });

    await exam.save();

    res.json({ message: "Exam uploaded" });
  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
});


// ================= GET ALL =================
router.get("/exam/all", async (req, res) => {
  const data = await Exam.find().sort({ createdAt: -1 });
  res.json(data);
});


// ================= DELETE =================
router.delete("/exam/delete/:id", async (req, res) => {
  await Exam.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// ASSIGN
router.post("/assign", async (req, res) => {
  try {
    let { studentIds, studyId, examId } = req.body;

    // 🔥 VERY IMPORTANT FIX
    //studyId = studyId && studyId !== "" ? studyId : null;
    //examId = examId && examId !== "" ? examId : null;

    const assign = new Assign({
      studentIds,
      studyId,
      examId,
    });

    await assign.save();

    res.json({ message: "Assigned successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error assigning" });
  }
});

// GET ASSIGN DATA
router.get("/assign/all", async (req, res) => {
  const data = await Assign.find()
    .populate("studyId")
    .populate("examId")
    .populate("studentIds", "name");

  res.json(data);
});

// DELETE ASSIGN
router.delete("/assign/delete/:id", async (req, res) => {
  await Assign.findByIdAndDelete(req.params.id);
  res.json({ message: "Assignment deleted" });
});

// GET STUDENT ASSIGN DATA
router.get("/assign/my", auth, role("student"), async (req, res) => {
  const data = await Assign.find({
    studentIds: req.user.id,
  })
    .populate("studyId")
    .populate("examId");

  res.json(data);
});

module.exports = router;
