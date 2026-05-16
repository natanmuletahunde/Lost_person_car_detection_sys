const router = require("express").Router();
const controller = require("../controllers/notification.controller");

// get all notifications for the logged in user
router.get("/my-notifications", controller.getNotifications);

// mark as read
router.patch("/:id/read", controller.markAsRead);

module.exports = router;
