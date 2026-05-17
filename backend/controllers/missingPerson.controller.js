const MissingPerson = require("../models/MissingPerson");
const Sighting = require("../models/Sighting");
const Detection = require("../models/Detection");
const User = require("../models/User");

// ==============================
// CREATE
// ==============================

// CREATE (Unified)
exports.createMissingPerson = async (req, res) => {
  try {
    const files = req.files || [];

    if (files.length < 3 && req.body.type === 'Person') {
      return res.status(400).json({
        success: false,
        message: "Minimum 3 images required for missing persons",
      });
    }

    const images = files.map((f) => `/uploads/${f.filename}`);

    // Normalize reportedBy from auth user and/or request body.
    const authReportedBy = req.user
      ? {
          userId: req.user._id?.toString?.() || "",
          firstName: req.user.firstName || "",
          lastName: req.user.lastName || "",
          email: req.user.email || "",
          phone: req.user.phone || "",
          role: req.user.role || "user",
          telegramChatId: req.user.telegramChatId || "",
          telegramUsername: req.user.telegramUsername || "",
        }
      : null;

    let bodyReportedBy = {};
    if (req.body.reportedBy) {
      if (typeof req.body.reportedBy === "string") {
        try {
          bodyReportedBy = JSON.parse(req.body.reportedBy);
        } catch (err) {
          console.log("Failed to parse reportedBy:", err);
        }
      } else if (typeof req.body.reportedBy === "object") {
        bodyReportedBy = req.body.reportedBy;
      }
    }

    const reportedBy = {
      ...(bodyReportedBy || {}),
      ...(authReportedBy || {}),
      userId:
        (authReportedBy && authReportedBy.userId) ||
        bodyReportedBy.userId ||
        "",
    };

    if (reportedBy.userId) {
      const userDoc = await User.findById(reportedBy.userId);
      if (userDoc && userDoc.registrations >= 1 && !userDoc.hasPaidSubscription) {
        return res.status(403).json({
          success: false,
          message: 'You have used your 1 free registration. Please purchase a subscription to report more cases.',
        });
      }
    }

    const reportData = {
      ...req.body,
      reportedBy, // ✅ override with parsed object
      images,
      reportDate: new Date(),
      lastUpdated: new Date(),
      status: 'Pending',
      verified: false,
    };

    const person = await MissingPerson.create(reportData);

    if (reportedBy.userId) {
      await User.findByIdAndUpdate(reportedBy.userId, {
        $inc: { registrations: 1 }
      }).catch(err => console.log('Failed to update registrations count:', err));
    }

    res.status(201).json({
      success: true,
      message: "Missing person registered successfully",
      data: person,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==============================
// GET ALL
// ==============================
exports.getMissingPersons = async (req, res) => {
  try {
    const persons = await MissingPerson.find({ verified: true, status: 'Active' }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: persons,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==============================
// GET MY REPORTS (logged-in user only)
// ==============================
exports.getMyMissingPersons = async (req, res) => {
  try {
    const uid = req.user._id.toString();
    const rawEmail = (req.user.email || '').trim();
    const emailExact = rawEmail.toLowerCase();
    const persons = await MissingPerson.find({
      $or: [
        { 'reportedBy.userId': uid },
        ...(emailExact ? [{ 'reportedBy.email': emailExact }] : []),
      ],
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: persons,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==============================
// GET ONE
// ==============================
exports.getMissingPersonById = async (req, res) => {
  try {
    const person = await MissingPerson.findOne({ _id: req.params.id, verified: true, status: 'Active' });

    if (!person) {
      return res.status(404).json({ success: false, message: "Not found or not verified" });
    }

    const sightings = await Sighting.find({
      $or: [
        { caseId: person._id },
        { description: { $regex: person.firstName, $options: "i" } }
      ]
    });

    const detections = await Detection.find({
      name: { $regex: person.firstName, $options: "i" },
    });

    res.json({
      success: true,
      data: { person, sightings, detections },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==============================
// UPDATE
// ==============================
exports.updateMissingPerson = async (req, res) => {
  try {
    const person = await MissingPerson.findById(req.params.id);

    if (!person) {
      return res.status(404).json({ success: false });
    }

    Object.assign(person, req.body);
    person.lastUpdated = new Date();

    await person.save();

    res.json({ success: true, data: person });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};