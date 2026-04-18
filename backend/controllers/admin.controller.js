const Sighting = require('../models/Sighting');
const ApiResponse = require('../utils/ApiResponse');

const approveSighting = async (req, res, next) => {
  try {
    const sighting = await Sighting.findById(req.params.id);

    if (!sighting) {
      return ApiResponse.error(res, 'Sighting not found', 404);
    }

    sighting.status = 'confirmed';
    sighting.confirmedBy = req.user._id;
    sighting.confirmedAt = new Date();
    await sighting.save();

    return ApiResponse.success(res, 'Sighting approved successfully', { sighting });
  } catch (error) {
    next(error);
  }
};

const rejectSighting = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const sighting = await Sighting.findById(req.params.id);

    if (!sighting) {
      return ApiResponse.error(res, 'Sighting not found', 404);
    }

    sighting.status = 'reviewed';
    if (reason) {
      sighting.notes.push({
        text: `Rejected by moderator/admin: ${reason}`,
        author: req.user._id,
      });
    }
    await sighting.save();

    return ApiResponse.success(res, 'Sighting rejected successfully', { sighting });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  approveSighting,
  rejectSighting,
};
