require("dotenv").config(); // 👈 load .env
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const auth = require("../middelware/auth");
const role = require("../middelware/role");
const Inquiry = require("../models/Inquiry");
const sendEmail = require("../utils/sendEmail");
const EmailConfig = require("../models/EmailConfig");
const upload = require("../middelware/upload");
const Document = require("../models/DocumentsModel");
const Payment = require("../models/PaymentModel");
const Receipt = require("../models/RecieptModel");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const cloudinary = require("../cloudinary");
// ================= VISA SYSTEM =================
const Visa = require("../models/VisaapplicationModel");
const Feedback = require("../models/Feedback");


router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    // 2. Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Save user
    const user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    res.status(201).json({
      message: "User registered successfully"
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check fields
    if (!email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    // 2. Check user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // 3. Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // 4. Create token
    const token = jwt.sign(
      { id: user._id , email: user.email , role: user.role},
      process.env.JWT_SECRET,   // ⚠️ later move to .env
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token
    });

    // after password match
    if (user) {

      // 🔥 AUTO CREATE DOCUMENTS
      if (user.role === "student") {

        const existingDocs = await Document.find({ studentId: user._id });

        if (existingDocs.length === 0) {

          const docs = [
            { name: "Aadhar Card", isRequired: true },
            { name: "Passport", isRequired: true },
            { name: "10th Marksheet", isRequired: true },
            { name: "12th Marksheet", isRequired: false },
            { name: "University Degree", isRequired: false }
          ];

          const documents = docs.map(doc => ({
            studentId: user._id,
            name: doc.name,
            isRequired: doc.isRequired
          }));

          await Document.insertMany(documents);

          console.log("Documents auto-created ✅");
        }
      }
    }

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/profile", auth, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
});

// 🔹 Get all users (Admin only)
router.get("/all-users", auth, role("admin"), async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/update-role", auth, role("admin"), async (req, res) => {
  try {
    const { userId, newRole } = req.body;

    const allowedRoles = ["admin", "counselor", "student", "public"];

    if (!allowedRoles.includes(newRole)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // 🔥 STEP 1: Get existing user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 🔥 STEP 2: Check if becoming student
    const isStudent = newRole === "student";

    // 🔥 STEP 3: Update role
    user.role = newRole;
    await user.save();

    res.json({
      message: "Role updated successfully",
      user
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/delete-user/:id", auth, role("admin"), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/update-user/:id", auth, role("admin"), async (req, res) => {
  try {
    const { name, email } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email },
      { new: true }
    );

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/counselor/profile", auth, role("counselor"), async (req, res) => {
  const { name, experience, specialization } = req.body;

  const user = await User.findById(req.user.id);

  user.name = name || user.name;
  user.experience = experience;
  user.specialization = specialization;

  await user.save();

  res.json({ message: "Profile updated", user });
});

router.put("/counselor/upload-image", auth, role("counselor"), upload.single("file"), async (req, res) => {
  const user = await User.findById(req.user.id);

  user.image = req.file.path;

  await user.save();

  res.json({ message: "Image uploaded" });
});

router.get("/counselor/my-profile", auth, role("counselor"), async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json(user);
});

router.get("/all-counselors", auth, role("admin"), async (req, res) => {
  const data = await User.find({ role: "counselor" });
  res.json(data);
});

router.put("/toggle-counselor", auth, role("admin"), async (req, res) => {
  const { id } = req.body;

  const user = await User.findById(id);

  user.isPublic = !user.isPublic;

  await user.save();

  res.json({ message: "Updated" });
});

router.get("/public-counselors", async (req, res) => {
  const data = await User.find({
    role: "counselor",
    isPublic: true
  }).select("name experience specialization image");

  res.json(data);
});

router.put("/assign", auth, role("admin"), async (req, res) => {
  const { studentId, counselorId } = req.body;

  try {
    const student = await User.findById(studentId);

    if (!student) return res.status(404).json({ message: "Student not found" });

    student.assignedTo = counselorId;
    await student.save();

    res.json({ message: "Assigned successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/students", auth, role("admin"), async (req, res) => {
  try {
    const students = await User.find({ role: "student" })
      .populate("assignedTo", "name email")
      .select("-password");

    res.json(students);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/counselors", auth, role("admin"), async (req, res) => {
  try {
    const counselors = await User.find({ role: "counselor" })
      .select("-password");

    res.json(counselors);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/assignments", auth, role("admin"), async (req, res) => {
  try {
    const counselors = await User.find({ role: "counselor" });

    const data = await Promise.all(
      counselors.map(async (c) => {
        const students = await User.find({
          role: "student",
          assignedTo: c._id
        });

        return {
          counselorId: c._id,
          counselorName: c.name,
          counselorEmail: c.email,
          totalStudents: students.length,
          students
        };
      })
    );

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/unassign", auth, role("admin"), async (req, res) => {
  const { studentId } = req.body;

  try {
    const student = await User.findById(studentId);

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    student.assignedTo = null;
    await student.save();

    res.json({ message: "Unassigned successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/inquiry", async (req, res) => {
  try {
    const { name, email, phone, country, visa, intake, message } = req.body;

    const inquiry = new Inquiry({
      name,
      email,
      phone,
      country,
      visa,
      intake,
      message
    });

    await inquiry.save();

    res.json({ message: "Inquiry sent" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/all-inquiry", auth, role("admin","counselor"), async (req, res) => {
  const data = await Inquiry.find().sort({ createdAt: -1 });
  res.json(data);
});

router.put("/reply-inquiry", auth, role("admin","counselor"), async (req, res) => {
  try {
    const { id, reply } = req.body;

    const inquiry = await Inquiry.findById(id);

    if (!inquiry) {
      return res.status(404).json({ message: "Inquiry not found" });
    }

    // ✅ Update DB
    inquiry.reply = reply;
    inquiry.status = "resolved";
    await inquiry.save();

    // ✅ SEND EMAIL
    await sendEmail(
      inquiry.email,
      "Reply to Your Inquiry",
      `
      <div style="font-family: Arial; padding:20px;">
        <h2>Hello ${inquiry.name}</h2>

        <p>We have responded to your inquiry:</p>

        <div style="background:#f4f4f4; padding:10px; border-radius:5px;">
          ${reply}
        </div>

        <br/>

        <p>Thank you,<br/>Visa Consultancy Team</p>
      </div>
      `
    );

    res.json({ message: "Reply sent + email delivered ✅" });

  } 
    catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/test-mail", async (req, res) => {
  const sendEmail = require("../utils/sendEmail");

  await sendEmail(
    "yourtestemail@gmail.com",
    "Test Email",
    "Hello this is test"
  );

  res.send("Test email sent");
});

router.post("/set-email-config", auth, role("admin","counselor"), async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    // ✅ hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let config = await EmailConfig.findOne();

    if (config) {
      config.email = email;
      config.password = password;
      await config.save();
    } else {
      config = new EmailConfig({
        email,
        password: hashedPassword
      });
      await config.save();
    }

    res.json({ message: "Email config saved securely ✅" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/delete-inquiry/:id", auth, role("admin","counselor"), async (req, res) => {
  try {
    await Inquiry.findByIdAndDelete(req.params.id);
    res.json({ message: "Inquiry deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/feedback", auth, async (req, res) => {
  try {
    console.log("USER:", req.user);  // 👈 ADD THIS

    const { message, rating } = req.body;

    const feedback = new Feedback({
      userId: req.user.id,
      name: req.user.email,
      message,
      rating
    });

    await feedback.save();

    res.json({ message: "Feedback submitted" });

  } catch (err) {
    console.error("FEEDBACK ERROR:", err);  // 👈 VERY IMPORTANT
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/all-feedback", auth, role("admin", "counselor"), async (req, res) => {
  const data = await Feedback.find()
    .populate("userId", "name email")  // 👈 IMPORTANT
    .sort({ createdAt: -1 });

  res.json(data);
});

router.put("/toggle-feedback", auth, role("admin", "counselor"), async (req, res) => {
  const { id } = req.body;

  const feedback = await Feedback.findById(id);

  feedback.isPublic = !feedback.isPublic;

  await feedback.save();

  res.json({ message: "Updated", feedback });
});

router.get("/public-feedback", async (req, res) => {
  const data = await Feedback.find({ isPublic: true })
    .populate("userId", "name email")  // 👈 IMPORTANT
    .sort({ createdAt: -1 })
    .limit(6); // 👈 limit for homepage

  res.json(data);
});

router.get("/my-feedback", auth, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({
      userId: req.user.id
    }).sort({ createdAt: -1 });

    res.json(feedbacks);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching feedback" });
  }
});

// student profile
router.put("/update-profile", auth, role("student"), async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      req.body,
      { new: true }
    );

    res.json({
      message: "Profile updated successfully",
      user: updatedUser
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
// student and public uploed documant
router.put(
  "/upload-doc/:id",
  auth,
  upload.single("file"),
  async (req, res) => {
    try {
      const doc = await Document.findOne({
        _id: req.params.id,
        studentId: req.user.id
      });

      if (!doc) {
        return res.status(404).json({ message: "Document not found" });
      }

      doc.fileUrl = req.file.path;
      doc.isSubmitted = true;

      // 🔥 ADD THIS (NEW LOGIC)
      if (req.user.role === "public") {
        doc.uploadedBy = "public";
        doc.visaType = req.body.visaType; // work / tourist
      }

      await doc.save();

      res.json({
        message: "Document uploaded ✅",
        doc
      });

    } catch (err) {
      res.status(500).json({ message: "Error uploading doc" });
    }
  }
);
//get studnet document
router.get("/my-documents", auth, role("student"), async (req, res) => {
  try {
    const docs = await Document.find({ studentId: req.user.id });
    res.json(docs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching documents" });
  }
});
//student assign view 
router.get("/my-students", auth, role("counselor"), async (req, res) => {
  const students = await User.find({
    assignedTo: req.user.id,
    role: "student"
  });

  res.json(students);
});
// student profile data
router.get("/student/:id", auth, role("counselor"), async (req, res) => {
  const student = await User.findById(req.params.id);
  res.json(student);
});
// student document for counselor
router.get("/student-docs/:studentId", auth, role("counselor"), async (req, res) => {
  const docs = await Document.find({
    studentId: req.params.studentId
  });

  res.json(docs);
});
// student document approve or reject
router.put(
  "/verify-doc/:id",
  auth,
  role("counselor", "admin"), // 🔥 UPDATED
  async (req, res) => {
    const { status } = req.body;

    const doc = await Document.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json({
      message: "Updated successfully",
      doc
    });
  }
);

router.post(
  "/create-payment",
  auth,
  role("student", "public"),
  upload.single("file"),
  async (req, res) => {
    try {
      const { amount, method, visaId, paymentFor } = req.body;

      if (!amount || !method) {
        return res.status(400).json({ message: "All fields required" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Screenshot required" });
      }

      const payment = new Payment({
        studentId: req.user.id,
        visaId: paymentFor === "visa" ? visaId : null, // ✅ ADD THIS
        paymentFor, // ✅ ADD THIS
        amount,
        method,
        screenshot: req.file.path
      });

      await payment.save();

      res.json({
        message: "Payment submitted successfully ✅",
        payment
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error creating payment" });
    }
  }
);

router.get(
  "/my-payments",
  auth,
  role("student","public"),
  async (req, res) => {
    try {
      const payments = await Payment.find({
        studentId: req.user.id
      }).sort({ createdAt: -1 });

      res.json(payments);

    } catch (err) {
      res.status(500).json({ message: "Error fetching payments" });
    }
  }
);

router.get(
  "/my-receipts",
  auth,
  role("student","public"),
  async (req, res) => {
    try {
      const receipts = await Receipt.find({
        studentId: req.user.id
      }).sort({ createdAt: -1 });

      res.json(receipts);

    } catch (err) {
      res.status(500).json({ message: "Error fetching receipts" });
    }
  }
);

router.get(
  "/student-payments/:id",
  auth,
  role("counselor","admin"),
  async (req, res) => {
    try {
      const payments = await Payment.find({
        studentId: req.params.id
      }).sort({ createdAt: -1 });

      res.json(payments);

    } catch (err) {
      res.status(500).json({ message: "Error fetching student payments" });
    }
  }
);

router.put(
  "/verify-payment/:id",
  auth,
  role("counselor","admin"),
  async (req, res) => {
    try {
      const { status } = req.body;

      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const payment = await Payment.findById(req.params.id);

      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      payment.status = status;
      await payment.save();

      res.json({
        message: "Payment updated successfully ✅",
        payment
      });

      if (status === "approved" &&  payment.visaId) {
        await Visa.findByIdAndUpdate(payment.visaId, {
          feesPaid: true,
          stage: "interview" // optional auto move
        });
      }

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error updating payment" });
    }
  }
);

router.get(
  "/student-receipts/:id",
  auth,
  role("counselor","admin"),
  async (req, res) => {
    try {
      const receipts = await Receipt.find({
        studentId: req.params.id
      }).sort({ createdAt: -1 });

      res.json(receipts);

    } catch (err) {
      res.status(500).json({ message: "Error fetching receipts" });
    }
  }
);

// 🔥 Counselor: get all payments
router.get(
  "/all-payments",
  auth,
  role("counselor","admin"),
  async (req, res) => {
    try {
      const payments = await Payment.find()
        .populate("studentId", "email name")
        .sort({ createdAt: -1 });

      res.json(payments);

    } catch (err) {
      res.status(500).json({ message: "Error fetching payments" });
    }
  }
);

router.post(
  "/generate-receipt/:paymentId",
  auth,
  role("counselor", "admin"),
  async (req, res) => {
    try {
      const payment = await Payment.findById(req.params.paymentId)
        .populate("studentId", "name email");

      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      if (payment.status !== "approved") {
        return res.status(400).json({ message: "Payment not approved" });
      }

      const existing = await Receipt.findOne({
        paymentId: payment._id
      });

      if (existing) {
        return res.json({ message: "Receipt already exists", existing });
      }

      // 📄 Create file name
      const fileName = `receipt-${Date.now()}.pdf`;
      const filePath = path.join("uploads", fileName);

      // 🧾 Create PDF
      const doc = new PDFDocument({ margin: 40 });
        doc.pipe(fs.createWriteStream(filePath));

        // 📦 PAGE WIDTH
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;

        // 🔲 BORDER (FULL PAGE)
        doc
          .rect(20, 20, pageWidth - 40, pageHeight - 40)
          .stroke();

        // 🏢 HEADER
        doc
          .fontSize(20)
          .text("ETERNAL IMMIGRATION", { align: "center" });

        doc
          .fontSize(10)
          .text("Surat, Gujarat, India", { align: "center" });

        doc
          .text("Contact: +91 9876543210", { align: "center" });

        doc.moveDown();

        // 🔹 DIVIDER LINE
        doc.moveTo(40, doc.y).lineTo(pageWidth - 40, doc.y).stroke();

        doc.moveDown();

        // 🧾 RECEIPT INFO
        const receiptNo = "RCPT" + Date.now();

        doc.fontSize(12);
        doc.text(`Receipt No: ${receiptNo}`);
        doc.text(`Date: ${new Date().toLocaleDateString()}`);

        doc.moveDown();

        // 🔹 DIVIDER LINE
        doc.moveTo(40, doc.y).lineTo(pageWidth - 40, doc.y).stroke();

        doc.moveDown();

        // 👤 STUDENT DETAILS
        doc.font("Helvetica-Bold").text("Student Details");
        doc.moveDown(0.5);

        doc.font("Helvetica");
        doc.text(`Name           : ${payment.studentId.name}`);
        doc.text(`Email          : ${payment.studentId.email}`);
        doc.text(`Payment Method : ${payment.method}`);

        doc.moveDown();

        // 🔹 DIVIDER LINE
        doc.moveTo(40, doc.y).lineTo(pageWidth - 40, doc.y).stroke();

        doc.moveDown();

        // 💰 PAYMENT SECTION
        doc.font("Helvetica-Bold").text("Payment Details");
        doc.moveDown(0.5);

        doc.fontSize(14).font("Helvetica");
        doc.text(`Amount Paid : ₹${payment.amount}`);

        doc.moveDown(2);

        // 🔹 DIVIDER LINE
        doc.moveTo(40, doc.y).lineTo(pageWidth - 40, doc.y).stroke();

        doc.moveDown();

        // 🙏 FOOTER
        doc.fontSize(12).text("Thank You for your payment!", {
          align: "center"
        });

        doc.moveDown(2);

        // ✍️ SIGNATURE
        doc.text("Authorized Signature", {
          align: "right"
        });

        doc.end();

        // Wait until file is fully written
        await new Promise((resolve, reject) => {
          stream.on("finish", resolve);
          stream.on("error", reject);
        });
      
         // Upload PDF to Cloudinary
        const result =
          await cloudinary.uploader.upload(
            filePath,
            {
              resource_type: "raw",
              folder: "receipts",
            }
          );



      // 💾 Save in DB
      const receipt = new Receipt({
        studentId: payment.studentId._id,
        paymentId: payment._id,
        amount: payment.amount,
        receiptNumber: "RCPT" + Date.now(),
        fileUrl: result.secure_url,  // 🔥 important
      });

      await receipt.save();

       // Delete local temp file
      fs.unlinkSync(filePath);

      // 🔥 mark payment
      payment.receiptGenerated = true;
      await payment.save();

      res.json({
        message: "PDF Receipt generated ✅",
        receipt
      });

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error generating receipt" });
    }
  }
);

// 🔥 counselor see ALL receipts
router.get(
  "/all-receipts",
  auth,
  role("counselor"),
  async (req, res) => {
    try {
      const receipts = await Receipt.find()
        .populate("studentId", "name email")
        .sort({ createdAt: -1 });

      res.json(receipts); // ✅ always array

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error fetching receipts" });
    }
  }
);
// visa documention
// ================= VISA SYSTEM =================

// ✅ CREATE VISA + DOCUMENTS (COMBINED)
router.post("/visa/create-docs", auth, async (req, res) => {
  try {
    const { visaType, fullName, passportNumber, country } = req.body;

    // 🔥 allow study also
    const allowedTypes = ["work", "tourist", "study"];
    if (!allowedTypes.includes(visaType)) {
      return res.status(400).json({ message: "Invalid visa type" });
    }

    const userId = req.body.studentId || req.user.id;

    // 🔥 check if counselor is creating
    const isCounselorFlow = !!req.body.studentId;

    // ================= VISA =================
    let visa = await Visa.findOne({
      userId,
      visaType
    });

    if (!visa) {
      visa = await Visa.create({
        userId,
        visaType,
        fullName,
        passportNumber,
        country,

        // 🔥 ONLY auto assign if counselor created
        assignedTo: isCounselorFlow ? req.user.id : null,

        stage: "application",
        feesPaid: false
      });
    }

    // ================= DOCUMENTS =================
    const docsList = ["Aadhar Card", "Passport", "Fees Receipt"];

    const existing = await Document.find({
      studentId: userId, // ✅ FIXED
      visaType
    });

    if (existing.length > 0) {
      return res.json({
        message: "Already exists",
        visa,
        docs: existing
      });
    }

    const docs = await Promise.all(
      docsList.map((name) =>
        Document.create({
          studentId: userId, // ✅ FIXED
          name,
          isRequired: true,
          uploadedBy: "public",
          visaType,
          visaId: visa._id
        })
      )
    );

    res.json({
      message: "Application created ✅",
      visa,
      docs
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating visa" });
  }
});


// ✅ GET MY VISA
router.get("/visa/my", auth, async (req, res) => {
  try {
    const visa = await Visa.findOne({
      userId: req.user.id
    }).populate("assignedTo", "name");

    res.json(visa);

  } catch (err) {
    res.status(500).json({ message: "Error fetching visa" });
  }
});


// ✅ GET MY DOCUMENTS (FILTER BY TYPE)
router.get("/visa/my-documents", auth, async (req, res) => {
  try {
    const { visaType } = req.query;

    const docs = await Document.find({
      studentId: req.user.id,
      uploadedBy: "public",
      visaType
    });

    res.json(docs);

  } catch (err) {
    res.status(500).json({ message: "Error fetching docs" });
  }
});


// ================= ADMIN =================

router.get("/visa-users", auth, role("admin"), async (req, res) => {
  try {
    const docs = await Document.find({
      uploadedBy: "public"
    })
      .populate("studentId", "name email")
      .populate({
        path: "visaId",
        populate: {
          path: "assignedTo",
          model: "User",
          select: "name email"
        }
      });

    const grouped = {};

    docs.forEach((doc) => {
      const key = doc.studentId._id + "-" + doc.visaType;

      if (!grouped[key]) {
        grouped[key] = {
          user: doc.studentId,
          visaType: doc.visaType,
          visa: doc.visaId, // ✅ populated visa
          docs: []
        };
      }

      grouped[key].docs.push(doc);
    });

    res.json(Object.values(grouped));

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching visa users" });
  }
});

router.put("/visa/assign/:id", auth, role("admin"), async (req, res) => {
  try {
    const { counselorId } = req.body;

    const visa = await Visa.findById(req.params.id);

    if (!visa) {
      return res.status(404).json({ message: "Visa not found" });
    }

    visa.assignedTo = counselorId || null;

    await visa.save();

    res.json({
      message: counselorId
        ? "Assigned to counselor ✅"
        : "Now handled by admin ✅",
      visa
    });

  } catch (err) {
    res.status(500).json({ message: "Error assigning visa" });
  }
});


// ================= COUNSELOR =================

// ✅ GET ASSIGNED VISAS
router.get("/visa/counselor", auth, role("counselor"), async (req, res) => {
  try {
    // 🔥 1. Find assigned visas
    const visas = await Visa.find({
      assignedTo: req.user.id
    }).populate("userId", "name email");

    // 🔥 2. Get documents for each visa
    const result = await Promise.all(
      visas.map(async (visa) => {
        const docs = await Document.find({
          visaId: visa._id
        });

        return {
          visa,
          user: visa.userId,
          docs
        };
      })
    );

    res.json(result);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching counselor visas" });
  }
});


// ================= UPDATE STATUS =================

// ✅ UPDATE VISA STATUS / FEES / INTERVIEW
router.put("/visa/update/:id", auth, role("admin","counselor"), async (req, res) => {
  try {
    const visa = await Visa.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({
      message: "Updated successfully ✅",
      visa
    });

  } catch (err) {
    res.status(500).json({ message: "Error updating visa" });
  }
});

// ✅ COUNSELOR START VISA FOR STUDENT
router.post("/visa/start", auth, role("admin","counselor"), async (req, res) => {
  try {
    const { studentId, fullName, passportNumber, country } = req.body;

    // default study visa
    const visaType = "study";

    // check already exists
    let visa = await Visa.findOne({ userId: studentId, visaType });

    if (visa) {
      return res.json({ message: "Visa already started", visa });
    }

    visa = await Visa.create({
      userId: studentId,
      visaType,
      fullName,
      passportNumber,
      country,
      assignedTo: req.user.id // counselor/admin
    });

    // create default docs
    const docsList = ["Aadhar Card", "Passport", "10th Marksheet", "12th Marksheet"];

    const docs = await Promise.all(
      docsList.map((name) =>
        Document.create({
          studentId,
          name,
          isRequired: true,
          uploadedBy: "student",
          visaType,
          visaId: visa._id
        })
      )
    );

    res.json({
      message: "Visa started successfully ✅",
      visa,
      docs
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error starting visa" });
  }
});

// ✅ COUNSELOR STUDENTS (WITH OR WITHOUT VISA)
router.get("/counselor/students", auth, role("counselor"), async (req, res) => {
  try {
    const students = await User.find({
      role: "student",
      assignedTo: req.user.id
    }).select("name email");

    const result = await Promise.all(
      students.map(async (s) => {
        const visa = await Visa.findOne({
          userId: s._id,
          visaType: "study"
        });

        const docs = visa
          ? await Document.find({ visaId: visa._id })
          : [];

        return {
          user: s,
          visa,
          docs
        };
      })
    );

    res.json(result);

  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
});

module.exports = router;