const router = require('express').Router();
const controller = require('../controllers/missingVehicle.controller');
const upload = require('../config/multer');
const { protect } = require('../middlewares/auth');

router.post(
  '/',
  protect,
  upload.fields([
    { name: 'images', maxCount: 20 },
    { name: 'ownershipDocument', maxCount: 10 },
  ]),
  controller.createMissingVehicle
);

router.get('/my-reports', protect, controller.getMyMissingVehicles);
router.get('/', controller.getMissingVehicles);
router.get('/:id', controller.getMissingVehicleById);
router.patch('/:id', controller.updateMissingVehicle);

module.exports = router;