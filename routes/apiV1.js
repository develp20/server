var express = require("express");
var router = express.Router();

router.all("*", function(req, res, next){
    res.send({
        response: "DEPRECATED",
        formattedTitle: "Version Deprecated",
        formattedResponse: "The version of the app you're using is deprecated."
    })
})

module.exports = router;