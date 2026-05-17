const PcLocation = require('../models/PcLocation');

// ==============================
// CREATE / UPDATE LOCATION
// ==============================
exports.updateLocation = async (req, res) => {

  try {

    const {
      deviceName,
      latitude,
      longitude,
      address
    } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'latitude and longitude are required'
      });
    }

    // only one record per device
    let location = await PcLocation.findOne({
      deviceName: deviceName || 'CCTV-PC'
    });

    if (location) {

      location.latitude = latitude;
      location.longitude = longitude;
      location.address = address || '';
      location.lastUpdated = new Date();

      await location.save();

    } else {

      location = await PcLocation.create({
        deviceName: deviceName || 'CCTV-PC',
        latitude,
        longitude,
        address
      });

    }

    console.log(
      `📍 Location Updated: ${latitude}, ${longitude}`
    );

    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      data: location
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

};

// ==============================
// GET LOCATION
// ==============================
exports.getLocation = async (req, res) => {

  try {

    const location = await PcLocation.findOne().sort({
      updatedAt: -1
    });

    res.status(200).json({
      success: true,
      data: location
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message
    });

  }

};