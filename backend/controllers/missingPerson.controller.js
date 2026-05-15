const MissingPerson = require("../models/MissingPerson");
const Sighting = require("../models/Sighting");
const Detection = require("../models/Detection");
const User = require("../models/User");

// ==============================
// CREATE
// ==============================
<<<<<<< HEAD
// ==============================
// CREATE (Unified)
exports.createMissingPerson = async (req, res) => {
  try {
    const files = req.files || [];

    if (files.length < 3 && req.body.type === 'Person') {
=======
// In your createMissingPerson controller
exports.createMissingPerson = async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length < 2) {
>>>>>>> a6c758a (full project updated)
      return res.status(400).json({
        success: false,
        message: "Minimum 3 images required for missing persons",
      });
    }

    const images = files.map((f) => `/uploads/${f.filename}`);

<<<<<<< HEAD
    // Normalize reportedBy from auth user and/or request body.
    const authReportedBy = req.user
      ? {
          userId: req.user._id?.toString?.() || "",
          firstName: req.user.firstName || "",
          lastName: req.user.lastName || "",
          email: req.user.email || "",
          phone: req.user.phone || "",
          role: req.user.role || "user",
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

    const reportData = {
      ...req.body,
      reportedBy, // ✅ override with parsed object
=======
    // Get reporter info from authenticated user
    const reporter = req.user;   // Assuming you have user in req.user after auth

    const person = new MissingPerson({
      ...req.body,
>>>>>>> a6c758a (full project updated)
      images,
      reportDate: new Date(),
<<<<<<< HEAD
      lastUpdated: new Date(),
      status: 'Active',
      verified: false,
    };
=======
      reportedBy: {
        userId: reporter._id,
        firstName: reporter.firstName,
        lastName: reporter.lastName,
        email: reporter.email,
        phone: reporter.phone,
        role: reporter.role,
        telegramChatId: reporter.telegramChatId,     // ← Important
        telegramUsername: reporter.telegramUsername || null
      }
    });
>>>>>>> a6c758a (full project updated)

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
    const persons = await MissingPerson.find().sort({ createdAt: -1 });

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
    const person = await MissingPerson.findById(req.params.id);

    if (!person) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    const sightings = await Sighting.find({
      description: { $regex: person.firstName, $options: "i" },
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