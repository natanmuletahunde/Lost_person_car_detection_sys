const Sighting = require('../models/Sighting');
const ApiResponse = require('../utils/ApiResponse');
const { paginate } = require('../utils/helpers');

const searchSightings = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const { keyword, type, status } = req.query;

    const query = {};

    if (keyword) {
      query.$or = [
        { description: { $regex: keyword, $options: 'i' } },
        { 'location.address': { $regex: keyword, $options: 'i' } },
      ];
    }

    if (type) query.type = type;
    if (status) query.status = status;

    const total = await Sighting.countDocuments(query);
    const sightings = await paginate(
      Sighting.find(query).populate('user', 'firstName lastName email phone'),
      page,
      limit
    ).sort('-reportedAt');

    return ApiResponse.paginated(
      res,
      'Search results retrieved successfully',
      sightings,
      page,
      limit,
      total
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchSightings,
};
