var express = require("express");
var router = express.Router();

router.get("/", function(req, res, next) {
    res.send("<img style=\"height: 500px;\" src=\"https://i.imgur.com/YZAdad2.jpg\" /></br><h1>epic</h1>")
});

router.get("/ping", function(req, res, next) {
    res.send("Ping... pong?")
});

module.exports = router