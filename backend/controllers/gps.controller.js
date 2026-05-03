const MissingPerson = require('../models/MissingPerson');
const MissingVehicle = require('../models/MissingVehicle');
const Sighting = require('../models/Sighting');
const ApiResponse = require('../utils/ApiResponse');

const registerGpsLocation = async (req, res, next) => {
  try {
    const { type, caseId, latitude, longitude, address, deviceId } = req.body;

    if (!type || !caseId || !latitude || !longitude) {
      return ApiResponse.error(res, 'Missing required fields: type, caseId, latitude, longitude', 400);
    }

    let model;
    if (type.toLowerCase() === 'person') {
      model = MissingPerson;
    } else if (type.toLowerCase() === 'vehicle') {
      model = MissingVehicle;
    } else {
      return ApiResponse.error(res, 'Invalid type. Must be "person" or "vehicle"', 400);
    }

    const caseItem = await model.findOne({ caseId });
    if (!caseItem) {
      return ApiResponse.error(res, 'Case not found', 404);
    }

    caseItem.lastSeenLocation = address || '';
    caseItem.lastSeenDate = new Date();
    caseItem.gpsCoordinates = {
      latitude,
      longitude,
      timestamp: new Date(),
      deviceId
    };
    await caseItem.save();

    return ApiResponse.success(res, 'GPS location registered successfully', {
      caseId: caseItem.caseId,
      lastSeenLocation: caseItem.lastSeenLocation,
      gpsCoordinates: caseItem.gpsCoordinates
    });
  } catch (error) {
    next(error);
  }
};

const trackCaseLocation = async (req, res, next) => {
  try {
    const { caseId, type } = req.params;

    if (!type || !caseId) {
      return ApiResponse.error(res, 'Missing type or caseId', 400);
    }

    let model;
    if (type.toLowerCase() === 'person') {
      model = MissingPerson;
    } else if (type.toLowerCase() === 'vehicle') {
      model = MissingVehicle;
    } else {
      return ApiResponse.error(res, 'Invalid type', 400);
    }

    const caseItem = await model.findOne({ caseId });
    if (!caseItem) {
      return ApiResponse.error(res, 'Case not found', 404);
    }

    return ApiResponse.success(res, 'Location found', {
      caseId: caseItem.caseId,
      type,
      lastSeenLocation: caseItem.lastSeenLocation,
      lastSeenDate: caseItem.lastSeenDate,
      gpsCoordinates: caseItem.gpsCoordinates,
      status: caseItem.status
    });
  } catch (error) {
    next(error);
  }
};

const getAllTrackedLocations = async (req, res, next) => {
  try {
    const { status = 'Active' } = req.query;

    const [persons, vehicles] = await Promise.all([
      MissingPerson.find({ status }).select('caseId firstName lastName brand model lastSeenLocation lastSeenDate gpsCoordinates'),
      MissingVehicle.find({ status }).select('caseId brand model lastSeenLocation lastSeenDate gpsCoordinates')
    ]);

    const locations = [];

    persons.forEach(p => {
      if (p.gpsCoordinates || p.lastSeenLocation) {
        locations.push({
          type: 'person',
          caseId: p.caseId,
          name: `${p.firstName} ${p.lastName}`.trim(),
          lastSeenLocation: p.lastSeenLocation,
          lastSeenDate: p.lastSeenDate,
          gpsCoordinates: p.gpsCoordinates
        });
      }
    });

    vehicles.forEach(v => {
      if (v.gpsCoordinates || v.lastSeenLocation) {
        locations.push({
          type: 'vehicle',
          caseId: v.caseId,
          name: `${v.brand} ${v.model}`.trim(),
          lastSeenLocation: v.lastSeenLocation,
          lastSeenDate: v.lastSeenDate,
          gpsCoordinates: v.gpsCoordinates
        });
      }
    });

    return ApiResponse.success(res, 'Tracked locations retrieved', { locations });
  } catch (error) {
    next(error);
  }
};

const getLocationHistory = async (req, res, next) => {
  try {
    const { caseId, type } = req.params;

    if (!type || !caseId) {
      return ApiResponse.error(res, 'Missing type or caseId', 400);
    }

    const sightings = await Sighting.find({
      originalCaseId: caseId
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('location reportDate description images');

    const history = sightings.map(s => ({
      id: s._id,
      location: s.location,
      address: s.location?.address,
      coordinates: s.location?.coordinates,
      reportDate: s.reportDate,
      description: s.description
    }));

    return ApiResponse.success(res, 'Location history retrieved', { history });
  } catch (error) {
    next(error);
  }
};

const updateGpsDevice = async (req, res, next) => {
  try {
    const { caseId, type, deviceId, active } = req.body;

    if (!caseId || !type || !deviceId) {
      return ApiResponse.error(res, 'Missing required fields', 400);
    }

    let model;
    if (type.toLowerCase() === 'person') {
      model = MissingPerson;
    } else if (type.toLowerCase() === 'vehicle') {
      model = MissingVehicle;
    } else {
      return ApiResponse.error(res, 'Invalid type', 400);
    }

    const caseItem = await model.findOne({ caseId });
    if (!caseItem) {
      return ApiResponse.error(res, 'Case not found', 404);
    }

    if (!caseItem.trackingDevices) {
      caseItem.trackingDevices = [];
    }

    const existingDevice = caseItem.trackingDevices.find(d => d.deviceId === deviceId);
    if (existingDevice) {
      existingDevice.active = active !== false;
      existingDevice.lastPing = new Date();
    } else {
      caseItem.trackingDevices.push({
        deviceId,
        active: active !== false,
        lastPing: new Date()
      });
    }

    await caseItem.save();

    return ApiResponse.success(res, 'GPS device updated', {
      deviceId,
      active: existingDevice?.active
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerGpsLocation,
  trackCaseLocation,
  getAllTrackedLocations,
  getLocationHistory,
  updateGpsDevice
};