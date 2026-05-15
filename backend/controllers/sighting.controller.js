const Sighting = require('../models/Sighting');
const MissingPerson = require('../models/MissingPerson');
const MissingVehicle = require('../models/MissingVehicle');
const Notification = require('../models/Notification');
const bot = require('../telegramBot');
const ApiResponse = require('../utils/ApiResponse');
const { paginate } = require('../utils/helpers');

const reportSighting = async (req, res, next) => {
  try {
    const { type, name, plateNumber, description, location, images } = req.body;

    const sighting = await Sighting.create({
      user: req.user._id,
      type,
      name,
      plateNumber,
      description,
      location,
      images: images || [],
    });

    await sighting.populate('user', 'firstName lastName email phone');

    // Matching Logic
    let matchedCase = null;
    let reporter = null;

    if (type === 'person' && name) {
      const nameParts = name.trim().split(/\s+/);
      const nameQueries = nameParts.map(part => ({
        $or: [
          { firstName: { $regex: part, $options: 'i' } },
          { lastName: { $regex: part, $options: 'i' } }
        ]
      }));

      matchedCase = await MissingPerson.findOne({
        status: 'Active',
        $and: nameQueries
      });
      if (matchedCase) reporter = matchedCase.reportedBy;
    } else if (type === 'vehicle' && plateNumber) {
      matchedCase = await MissingVehicle.findOne({
        plateNumber: plateNumber.toUpperCase(),
        status: 'Active'
      });
      if (matchedCase) reporter = matchedCase.reportedBy;
    }

    if (matchedCase && reporter && reporter.userId) {
      const message = `A new sighting has been reported for your case: ${type === 'person' ? name : plateNumber}. Location: ${location.address || 'Unknown'}`;
      
      // Create in-app notification
      await Notification.create({
        recipient: reporter.userId,
        title: 'New Sighting Reported',
        message: message,
        type: 'alert',
        priority: 'high'
      });

      // Telegram notification
      if (reporter.telegramUsername) {
        try {
          await bot.sendMessage(`@${reporter.telegramUsername}`, `🚨 SIGHTING ALERT!\n\n${message}`);
        } catch (err) {
          console.log('Telegram notification failed:', err.message);
        }
      }
    }

    return ApiResponse.success(res, 'Sighting reported successfully', { sighting }, 201);
  } catch (error) {
    next(error);
  }
};

const getMySightings = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { status, type } = req.query;

    const query = { user: req.user._id };

    if (status) query.status = status;
    if (type) query.type = type;

    const total = await Sighting.countDocuments(query);
    const sightings = await paginate(
      Sighting.find(query),
      page,
      limit
    ).sort('-reportedAt');

    return ApiResponse.paginated(res, 'Sightings retrieved successfully', sightings, page, limit, total);
  } catch (error) {
    next(error);
  }
};

const getAllSightings = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { status, type, search } = req.query;

    const query = {};

    if (status) query.status = status;
    if (type) query.type = type;
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Sighting.countDocuments(query);
    const sightings = await paginate(
      Sighting.find(query)
        .populate('user', 'firstName lastName email phone')
        .populate('confirmedBy', 'firstName lastName'),
      page,
      limit
    ).sort('-reportedAt');

    return ApiResponse.paginated(res, 'Sightings retrieved successfully', sightings, page, limit, total);
  } catch (error) {
    next(error);
  }
};

const getSightingById = async (req, res, next) => {
  try {
    const sighting = await Sighting.findById(req.params.id)
      .populate('user', 'firstName lastName email phone')
      .populate('confirmedBy', 'firstName lastName')
      .populate('notes.author', 'firstName lastName');

    if (!sighting) {
      return ApiResponse.error(res, 'Sighting not found', 404);
    }

    return ApiResponse.success(res, 'Sighting retrieved successfully', { sighting });
  } catch (error) {
    next(error);
  }
};

const updateSighting = async (req, res, next) => {
  try {
    const { status, description, notes } = req.body;

    const sighting = await Sighting.findById(req.params.id);

    if (!sighting) {
      return ApiResponse.error(res, 'Sighting not found', 404);
    }

    if (status) {
      sighting.status = status;
      if (status === 'confirmed') {
        sighting.confirmedBy = req.user._id;
        sighting.confirmedAt = new Date();
      }
    }

    if (description) sighting.description = description;
    
    if (notes) {
      sighting.notes.push({
        text: notes,
        author: req.user._id,
      });
    }

    await sighting.save();

    return ApiResponse.success(res, 'Sighting updated successfully', { sighting });
  } catch (error) {
    next(error);
  }
};

const deleteSighting = async (req, res, next) => {
  try {
    const sighting = await Sighting.findByIdAndDelete(req.params.id);

    if (!sighting) {
      return ApiResponse.error(res, 'Sighting not found', 404);
    }

    return ApiResponse.success(res, 'Sighting deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getNearbySightings = async (req, res, next) => {
  try {
    const { longitude, latitude, radius = 10000 } = req.query;

    if (!longitude || !latitude) {
      return ApiResponse.error(res, 'Longitude and latitude are required', 400);
    }

    const sightings = await Sighting.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: parseInt(radius),
        },
      },
    }).limit(50);

    return ApiResponse.success(res, 'Nearby sightings retrieved successfully', { sightings });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  reportSighting,
  getMySightings,
  getAllSightings,
  getSightingById,
  updateSighting,
  deleteSighting,
  getNearbySightings,
};
