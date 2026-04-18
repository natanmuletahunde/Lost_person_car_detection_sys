const Sighting = require('../models/Sighting');
const ApiResponse = require('../utils/ApiResponse');
const { paginate } = require('../utils/helpers');

const createVehicleDetection = async (req, res, next) => {
  try {
    const { description, location, images } = req.body;

    const sighting = await Sighting.create({
      user: req.user._id,
      type: 'vehicle',
      description,
      location,
      images: images || [],
    });

    await sighting.populate('user', 'firstName lastName email phone');

    return ApiResponse.success(res, 'Vehicle detection reported successfully', { sighting }, 201);
  } catch (error) {
    next(error);
  }
};

const getVehicleDetections = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const { status } = req.query;

    const query = { type: 'vehicle' };
    if (status) query.status = status;

    const total = await Sighting.countDocuments(query);
    const detections = await paginate(
      Sighting.find(query).populate('user', 'firstName lastName email phone'),
      page,
      limit
    ).sort('-reportedAt');

    return ApiResponse.paginated(res, 'Vehicle detections retrieved successfully', detections, page, limit, total);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createVehicleDetection,
  getVehicleDetections,
};
