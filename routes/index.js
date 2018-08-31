var express = require("express");
var router = express.Router();
var request = require("request");

router.get("/", function(req, res, next) {
    res.render("index", { title: "flip" });
});
  
router.get("/beta", function(req, res, next) {
    res.redirect("https://goo.gl/forms/PkbDhIAq3MlTvwcy1");
});

router.get("/tos", function(req, res, next) {
    res.render("tos", { title: "Terms and Privacy - flip"});
});

router.get("/status", function(req, res, next) {
    res.redirect("https://authbase.co/status/flip");
})

router.get("/credits/ios", function(req, res, next) {
    res.render("credits");
})

router.get("/download", function(req, res, next) {
    res.redirect("http://bit.ly/flipiOS");
})

router.get("/watch/:postID", function(req, res, next){
    let url = "http://localhost:5000/api/v2/watch/" + req.params.postID
    request.get(url, function(err, response, body) {
        if(!err) {
            res.send(body);
        }
    });
})

var fs = require("fs")

router.get("/stream/:vID", function(req, res, next){
	var vID = req.params.vID;

	var path = "./videos/" + vID + ".mov";
	var stat = fs.statSync(path);
	var total = stat.size;

	if (req.headers["range"]) {
		var range = req.headers.range;
		var parts = range.replace(/bytes=/, "").split("-");
		var partialstart = parts[0];
		var partialend = parts[1];

		var start = parseInt(partialstart, 10);
		var end = partialend ? parseInt(partialend, 10) : total-1;
		var chunksize = (end-start)+1;

		var file = fs.createReadStream(path, {start: start, end: end});
		res.writeHead(206, { "Content-Range": "bytes " + start + "-" + end + "/" + total, "Accept-Ranges": "bytes", "Content-Length": chunksize, "Content-Type": "video/quicktime" });
		file.pipe(res);
	} else {
		res.writeHead(200, { "Content-Length": total, "Content-Type": "video/quicktime" });
		fs.createReadStream(path).pipe(res);
	}
});

router.get("/thumb/:tID", function(req, res, next){
	var tID = req.params.tID;

	fs.readFile("./thumbnails/" + tID + ".png", function(err, data) {
		if(!err){
			res.send(data)
		}
	})
})

const dbConfig = require("../config.json");

const mongojs = require("mongojs")
const db = mongojs(dbConfig.mDB, [ "users" ]);

router.get("/settings", function(req, res, next){
    let clientID = req.cookies.clientID;
    let sessionID = req.cookies.sessionID;

    if(clientID == null && sessionID == null){
        res.render("settings/login", {
            title: "Login - flip Settings"
        })
    } else {
        db.users.find({
            $and: [
                {
                    "info.clientID": clientID
                },
                {
                    "security.sessionID": sessionID
                }
            ]
        }, function(err0, docs0) {
            if(!err0) {
                if(docs0.length > 0) {
                    res.render("settings/index", {
                        title: "flip Settings",
                        user: docs0[0]
                    })
                } else {
                    res.clearCookie("clientID");
                    res.clearCookie("sessionID");

                    res.send("A user with your credentials does not exist. You have been automatically logged out.")
                }
            } else {
                res.send("An error occured whilst trying to communicate with the server. Please try again later.")
            }
        });
    }
})

router.get("/admin", function(req, res, next){
    let clientID = req.cookies.clientID;
    let sessionID = req.cookies.sessionID;

    if(clientID == null && sessionID == null){
        res.render("admin/login", {
            title: "Login - flip Admin"
        })
    } else {
        res.render("admin/index", {
            title: "flip Admin",
            sidebar: "home"
        })
    }
})

router.get("/admin/explore", function(req, res, next){
    let clientID = req.cookies.clientID;
    let sessionID = req.cookies.sessionID;

    if(clientID == null && sessionID == null){
        res.redirect("/admin/login")
    } else {
        res.render("admin/explore", {
            title: "Explore - flip Admin",
            sidebar: "explore"
        })
    }
})

router.get("/admin/support", function(req, res, next){
    let clientID = req.cookies.clientID;
    let sessionID = req.cookies.sessionID;

    if(clientID == null && sessionID == null){
        res.redirect("/admin/login")
    } else {
        res.render("admin/support", {
            title: "Support - flip Admin",
            sidebar: "support"
        })
    }
})

router.post("/logout", function(req, res, next){
    res.clearCookie("clientID");
    res.clearCookie("sessionID");

    res.send({
        response: "OK"
    })
})

module.exports = router;