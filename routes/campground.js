const express = require("express"),
   router = express.Router(),
   middleware = require("../middleware/index");

const {
   getCampgrounds,
   newCampgroundForm,
   createCampground,
   showCampground,
   editCampgroundForm,
   updateCampground,
   deleteCampground,
   postLike
} = require("../controllers/campground");

router.get("/", getCampgrounds)

router.get("/new", middleware.isLoggedIn, newCampgroundForm);

router.post("/", middleware.isLoggedIn, createCampground);

router.get("/:slug", showCampground);

router.get("/:slug/edit", middleware.campgroundOwnership, editCampgroundForm);

router.put("/:slug", middleware.campgroundOwnership, updateCampground);

router.delete("/:slug", middleware.campgroundOwnership, deleteCampground);

router.post("/:slug/like", middleware.isLoggedIn, postLike);

module.exports = router;