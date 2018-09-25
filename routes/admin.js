// EXPRESS
let app = require("express")();

let http = require("http");
let server = http.createServer(app);
let io = require("socket.io")(server);

let ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
let ffmpeg = require("fluent-ffmpeg");

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

let FL_VIDEO_PATH = "/home/william/projects/flip/content/videos/";
let FL_THUMB_PATH = "/home/william/projects/flip/content/thumbnails/";

let fs = require("fs");

let flip = require("../FLKit/FLKit");

app.post("/admin/login", (req, res) => {
    let email = req.body.email;
    let password = req.body.password.toUpperCase();

    if(email && password) {
        if(flip.tools.validate.email(email) && flip.tools.validate.password(password)) {
            flip.user.login(email, password, function(data0) {
                if(data0.response == "OK") {
                    flip.admin.auth({
                        clientID: data0.data.clientID,
                        sessionID: data0.data.sessionID
                    }, function(data1) {
                        if(data1.response == "OK") {
                            res.send({
                                response: "OK",
                                data: data0.data
                            })
                        } else {
                            let err = flip.tools.res.LOGIN_ERR;
                            res.status(err.statusCode).send(err);
                        }
                    })
                } else {
                    let err = flip.tools.res.LOGIN_ERR;
                    res.status(err.statusCode).send(err);
                }
            })
        } else {
            let err = flip.tools.res.INVALID_PARAMS;
            res.status(err.statusCode).send(err);
        }
    } else {
        let err = flip.tools.res.INSUFFICIANT_PARAMS;
        res.status(err.statusCode).send(err);
    }
})

app.post("/admin/users/get", (req, res) => {
    let clientID = req.body.clientID;
    let sessionID = req.body.sessionID;

    flip.admin.auth(req.body, function(auth) {
        if(auth.response == "OK") {
            flip.admin.users.get(clientID, function(data0) {
                res.status(data0.statusCode).send(data0)
            })
        } else {
            res.status(auth.statusCode).send(auth);
        }
    });
})

app.post("/admin/posts/get", (req, res) => {
    let clientID = req.body.clientID;
    let sessionID = req.body.sessionID;

    flip.admin.auth(req.body, function(auth) {
        if(auth.response == "OK") {
            flip.admin.posts.get.latest(clientID, function(data0) {
                res.status(data0.statusCode).send(data0)
            })
        } else {
            res.status(auth.statusCode).send(auth);
        }
    });
})

app.post("/admin/explore/get", (req, res) => {
    let clientID = req.body.clientID;
    let sessionID = req.body.sessionID;

    flip.admin.auth(req.body, function(auth) {
        if(auth.response == "OK") {
            flip.explore.get(clientID, 0, true, function(data0) {
                if(data0.response == "OK") {
                    flip.admin.posts.get.popular(clientID, function(data1) {
                        if(data1.response == "OK") {
                            res.send({
                                response: "OK",
                                data: {
                                    explore: data0.data,
                                    posts: data1.data
                                }
                            })
                        } else {
                            res.send(data1)
                        }
                    })
                } else {
                    res.status(data0.statusCode).send(data0)
                }
            })
        } else {
            res.status(auth.statusCode).send(auth);
        }
    });
})

app.post("/admin/explore/feed/create", (req, res) => {
    let clientID = req.body.clientID;
    let sessionID = req.body.sessionID;

    flip.admin.auth(req.body, function(auth) {
        if(auth.response == "OK") {
            flip.explore.create.feed(function(data0) {
                if(data0.response == "OK") {
                    res.status(data0.statusCode).send(data0);
                } else {
                    res.status(data0.statusCode).send(data0);
                }
            })
        } else {
            res.status(auth.statusCode).send(auth);
        }
    });
})

app.post("/admin/explore/card/info/create", (req, res) => {
    let clientID = req.body.clientID;
    let sessionID = req.body.sessionID;

    let title = req.body.title;
    let body = req.body.body;

    let gradient = req.body["gradient[]"]

    flip.admin.auth(req.body, function(auth) {
        if(auth.response == "OK") {
            flip.explore.create.info(title, body, gradient, function(data0) {
                res.status(data0.statusCode).send(data0)
            })
        } else {
            res.status(auth.statusCode).send(auth);
        }
    });
});

app.post("/admin/explore/card/delete", (req, res) => {
    let clientID = req.body.clientID;
    let sessionID = req.body.sessionID;

    var cardID = req.body.cardID;

    flip.admin.auth(req.body, function(auth) {
        if(auth.response == "OK") {
            flip.explore.delete(cardID, function(data0) {
                res.status(data0.statusCode).send(data0)
            })
        } else {
            res.status(auth.statusCode).send(auth);
        }
    });
});

app.post("/admin/explore/card/user/create", (req, res) => {
    let clientID = req.body.clientID;
    let sessionID = req.body.sessionID;

    var username = req.body.username;

    flip.admin.auth(req.body, function(auth) {
        if(auth.response == "OK") {
            flip.explore.create.user(username, function(data0) {
                res.status(data0.statusCode).send(data0)
            })
        } else {
            res.status(auth.statusCode).send(auth);
        }
    });
});

app.post("/admin/explore/card/splitter/create", (req, res) => {
    let clientID = req.body.clientID;
    let sessionID = req.body.sessionID;

    flip.admin.auth(req.body, function(auth) {
        if(auth.response == "OK") {
            flip.explore.create.splitter(function(data0) {
                res.status(data0.statusCode).send(data0)
            })
        } else {
            res.status(auth.statusCode).send(auth);
        }
    });
});

app.post("/admin/explore/card/splitter/delete", (req, res) => {
    let clientID = req.body.clientID;
    let sessionID = req.body.sessionID;

    flip.admin.auth(req.body, function(auth) {
        if(auth.response == "OK") {
            flip.explore.delete.splitter(function(data0) {
                res.status(data0.statusCode).send(data0)
            })
        } else {
            res.status(auth.statusCode).send(auth);
        }
    });
});

app.post("/admin/explore/rearrange", (req, res) => {
    let clientID = req.body.clientID;
    let sessionID = req.body.sessionID;

    let cardID = req.body.cardID;
    let newIndex = req.body.newIndex;

    flip.admin.auth(req.body, function(auth) {
        if(auth.response == "OK") {
            flip.explore.rearrange(cardID, newIndex, function(data0) {
                res.status(data0.statusCode).send(data0);
            })
        } else {
            res.status(auth.statusCode).send(auth);
        }
    });
})

app.post("/admin/explore/post/create", (req, res) => {
    let clientID = req.body.clientID;
    let sessionID = req.body.sessionID;

    let postID = req.body.postID;

    flip.admin.auth(req.body, function(auth) {
        if(auth.response == "OK") {
            flip.explore.create.post(postID, function(data0) {
                res.status(data0.statusCode).send(data0);
            });
        } else {
            res.status(auth.statusCode).send(auth);
        }
    });
});

module.exports = app