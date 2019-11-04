const express = require("express"),
   keySecret = process.env.SECRET_KEY,
   middleware = require("../middleware"),
   router = express.Router();

const { postPayment } = require("../controllers/stripe");

router.post("/charge/:slug", middleware.isLoggedIn, postPayment);

module.exports = router;
