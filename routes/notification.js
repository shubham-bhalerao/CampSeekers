const express = require("express"),
   router = express.Router(),
   middleware = require("../middleware/index");

const {
   follow,
   allNotifications,
   showNotification,
   unfollow
} = require("../controllers/notification");

router.get("/follow/:id", middleware.isLoggedIn, follow);

router.get("/notifications", middleware.isLoggedIn, allNotifications);

router.get("/notifications/:id", middleware.isLoggedIn, showNotification);

router.get("/unfollow/:id", unfollow);

module.exports = router;