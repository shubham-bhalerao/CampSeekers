const express = require("express"),
   router = express.Router();

const {
   getForgot,
   postForgot,
   getReset,
   postReset
} = require("../controllers/passwordReset");
//===============
//Password Reset
//===============

router.get("/forgot", getForgot);

router.post("/forgot", postForgot);

router.get("/reset/:token", getReset);

router.post("/reset/:token", postReset);

module.exports = router;