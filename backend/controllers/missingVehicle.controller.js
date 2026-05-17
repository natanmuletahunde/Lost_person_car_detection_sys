const MissingVehicle = require('../models/MissingVehicle');
const Sighting = require('../models/Sighting');
const Detection = require('../models/Detection');
const User = require('../models/User');

// ==============================
// CREATE VEHICLE CASE (multipart FormData + auth)
// ==============================
exports.createMissingVehicle = async (req, res) => {
  try {
    const fileGroups = req.files || {};
    const imageFiles = Array.isArray(fileGroups) ? fileGroups : fileGroups.images || [];
    const ownershipFiles = fileGroups.ownershipDocument || [];

    const imageUrls = imageFiles.map((f) => `/uploads/${f.filename}`);
    const imagePreview = imageUrls[0] || req.body.imagePreview || undefined;

    let ownershipDocumentUrl = [];
    if (ownershipFiles.length > 0) {
      ownershipDocumentUrl = ownershipFiles.map(f => `/uploads/${f.filename}`);
    }

    const authReportedBy = req.user
      ? {
          userId: req.user._id?.toString?.() || '',
          firstName: req.user.firstName || '',
          lastName: req.user.lastName || '',
          email: req.user.email || '',
          phone: req.user.phone || '',
          role: req.user.role || 'user',
          telegramChatId: req.user.telegramChatId || "",
          telegramUsername: req.user.telegramUsername || "",
        }
      : null;

    let bodyReportedBy = {};
    if (req.body.reportedBy) {
      if (typeof req.body.reportedBy === 'string') {
        try {
          bodyReportedBy = JSON.parse(req.body.reportedBy);
        } catch (e) {
          console.log('Failed to parse reportedBy:', e);
        }
      } else if (typeof req.body.reportedBy === 'object') {
        bodyReportedBy = req.body.reportedBy;
      }
    }

    const reportedBy = {
      ...(bodyReportedBy || {}),
      ...(authReportedBy || {}),
      userId:
        (authReportedBy && authReportedBy.userId) ||
        bodyReportedBy.userId ||
        '',
    };
    if (req.body.telegramUsername) {
      reportedBy.telegramUsername = req.body.telegramUsername;
    }

    if (reportedBy.userId) {
      const userDoc = await User.findById(reportedBy.userId);
      if (userDoc && userDoc.registrations >= 1 && !userDoc.hasPaidSubscription) {
        return res.status(403).json({
          success: false,
          message: 'You have used your 1 free registration. Please purchase a subscription to report more cases.',
        });
      }
    }

    const caseId = `CASE-MV-${Date.now()}`;

    const vehicle = new MissingVehicle({
      ...req.body,
      reportedBy,
      imagePreview,
      ownershipDocumentUrl,
      caseId,
      status: 'Active',
      verificationStatus: 'Pending',
      reportDate: new Date(),
    });

    await vehicle.save();

    if (reportedBy.userId) {
      await User.findByIdAndUpdate(reportedBy.userId, {
        $inc: { registrations: 1 }
      }).catch(err => console.log('Failed to update registrations count:', err));
    }

    res.status(201).json({
      success: true,
      message: 'Missing vehicle case created successfully',
      data: vehicle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ==============================
exports.getMissingVehicles = async (req, res) => {
  try {
    const vehicles = await MissingVehicle.find().sort({ createdAt: -1 });
    res.json({ success: true, data: vehicles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================
exports.getMyMissingVehicles = async (req, res) => {
  try {
    const uid = req.user._id.toString();
    const rawEmail = (req.user.email || '').trim();
    const emailExact = rawEmail.toLowerCase();
    const vehicles = await MissingVehicle.find({
      $or: [
        { 'reportedBy.userId': uid },
        ...(emailExact ? [{ 'reportedBy.email': emailExact }] : []),
      ],
    }).sort({ createdAt: -1 });
    res.json({ success: true, data: vehicles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================
exports.getMissingVehicleById = async (req, res) => {
  try {
    const vehicle = await MissingVehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    const sightings = await Sighting.find({
      $or: [
        { caseId: vehicle._id },
        { type: 'vehicle', description: { $regex: vehicle.plateNumber, $options: 'i' } }
      ]
    });

    const detections = await Detection.find({
      licensePlate: vehicle.plateNumber
    });

    res.json({
      success: true,
      data: { vehicle, sightings, detections }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==============================
exports.updateMissingVehicle = async (req, res) => {
  try {
    const vehicle = await MissingVehicle.findById(req.params.id);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    Object.assign(vehicle, req.body);
    vehicle.lastUpdated = new Date();

    await vehicle.save();

    res.json({
      success: true,
      message: 'Vehicle updated successfully',
      data: vehicle
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};