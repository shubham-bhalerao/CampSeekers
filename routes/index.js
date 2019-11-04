const express = require("express"),
   router = express.Router();

const {
   getLanding,
   getRegister,
   postRegister,
   getLogin,
   postLogin,
   logout,
   userHome
} = require("../controllers/index");

router.get("/", getLanding);

router.get("/register", getRegister);

router.post("/register", postRegister);

router.get("/login", getLogin);

router.post("/login", postLogin);

router.get("/logout", logout);

//===============
//User routes
//===============

router.get("/users/:id", userHome);


//Testing apis
// router.get("/fetch", function (req, res) {
//     let search = "&search=1";
//     let baseUrl = "https://swapi.co/api/films/?format=json"
//     let url = baseUrl + search;
//     fetch("https://icanhazdadjoke.com/")
//         .then(respone => respone.json())
//         .then(function (data) {
//             console.log(data);
//             res.send(data);
//         })
//         .catch(err => console.log(err));
// });


module.exports = router;