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

app.post("/user/auth", (req, res) => {
    flip.authWithToken(req, function(data) {
        res.status(data.statusCode || 200).send(data);
    })
});

app.post("/user/login", (req, res) => {
    let email = req.body.email;
    let password = req.body.password.toUpperCase();

    if(email && password) {
        if(flip.tools.validate.email(email) && flip.tools.validate.password(password)) {
            flip.user.login(email, password, function(data0) {
                res.status(data0.statusCode || 200).send(data0);
            });
        } else {
            res.send(flip.tools.res.INVALID_PARAMS);
        }
    } else {
        res.send(flip.tools.res.INSUFFICIANT_PARAMS);
    }
});

app.post("/user/logout", (req, res) => {
    flip.authWithToken(req, function(data0) {
        if(data0.response == "OK") {
            flip.user.logout(data0.data.info.clientID, function(data1) {
                res.status(data1.statusCode || 200).send(data1);
            })
        } else {
            res.status(data0.statusCode || 200).send(data0);
        }
    })
});

app.get("/user/profile/:clientID", (req, res) => {
    let clientID = req.params.clientID;

    if(clientID) {
        if(flip.tools.validate.clientID(clientID)) {
            flip.authWithToken(req, function(auth) {
                if(auth.response == "OK") {
                    flip.user.get.safe.clientID(clientID, auth.data.info.clientID, function(data0) {
                        if(data0.response == "OK") {
                            res.status(data0.statusCode || 200).send(data0);
                        } else {
                            res.status(data0.statusCode || 200).send(data0);
                        }
                    });
                } else {
                    res.status(auth.statusCode || 200).send(auth);
                }
            });
        } else {
            let err = flip.tools.res.INVALID_PARAMS;
            res.status(err.statusCode || 200).send(err);
        }
    } else {
        let err = flip.tools.res.INSUFFICIANT_PARAMS;
        res.status(err.statusCode || 200).send(err);
    }
});

// /user/settings/get

app.get("/user/settings", (req, res) => {
    flip.authWithToken(req, function(auth) {
        if(auth.response == "OK") {
            flip.user.settings.get(auth.data.info.clientID, function(data0) {
                if(data0.response == "OK") {
                    res.status(data0.statusCode || 200).send(data0);
                } else {
                    res.status(data0.statusCode || 200).send(data0);
                }
            });
        } else {
            res.status(auth.statusCode || 200).send(auth);
        }
    });
})

// /user/services/*

app.get("/user/services/:name", (req, res) => {
    let name = req.params.name;

    if(name) {
        if(flip.tools.validate.serviceName(name)) {
            flip.authWithToken(req, function(auth) {
                if(auth.response == "OK") {
                    if(name == "contacts") {
                        var emailAddresses = req.body["emailAddresses[]"];

                        if(typeof emailAddresses !== "undefined") {
                            if(emailAddresses.constructor !== Array) {
                                emailAddresses = [emailAddresses]
                            }
    
                            flip.user.service.get.contacts(auth.data.info.clientID, emailAddresses, function(data0) {
                                if(data0.response == "OK") {
                                    res.status(data0.statusCode || 200).send(data0);
                                } else {
                                    res.status(data0.statusCode || 200).send(data0);
                                }
                            })
                        } else {
                            res.send(flip.tools.res.NO_DATA)
                        }
                    } else if(name == "twitter") {
                        flip.user.service.get.twitter(auth.data.info.clientID, function(data0) {
                            if(data0.response == "OK") {
                                res.status(data0.statusCode || 200).send(data0);
                            } else {
                                res.status(data0.statusCode || 200).send(data0);
                            }
                        })
                    } else {
                        res.send(flip.tools.res.SERVICE_UNKNOWN)
                    }
                } else {
                    res.status(auth.statusCode || 200).send(auth);
                }
            });
        } else {
            let err = flip.tools.res.INVALID_PARAMS;
            res.status(err.statusCode || 200).send(err);
        }
    } else {
        let err = flip.tools.res.INSUFFICIANT_PARAMS;
        res.status(err.statusCode || 200).send(err);
    }
});

app.post("/user/service/connect", (req, res) => {
    let name = req.body.name;
    let token = req.body.token;
    let secret = req.body.secret;

    if(name && token && secret) {
        if(flip.tools.validate.serviceName(name.toLowerCase())) {
            flip.authWithToken(req, function(auth) {
                if(auth.response == "OK") {
                    let data = {
                        name: name,
                        tokens: {
                            token: token,
                            secret: secret
                        }
                    };
        
                    flip.user.service.connect(auth.data.info.clientID, data, function(data0) {
                        if(data0.response == "OK") {
                            res.status(data0.statusCode || 200).send(data0);
                        } else {
                            res.status(data0.statusCode || 200).send(data0);
                        }
                    });
                }
            })
        } else {
            let err = flip.tools.res.INVALID_PARAMS;
            res.status(err.statusCode || 200).send(err);
        }
    } else {
        let err = flip.tools.res.INSUFFICIANT_PARAMS;
        res.status(err.statusCode || 200).send(err);
    }
});

app.post("/user/service/disconnect", (req, res) => {
    let name = req.body.name;

    if(name) {
        if(flip.tools.validate.serviceName(name)) {
            flip.authWithToken(req, function(auth) {
                if(auth.response == "OK") {
                    let data = {
                        name: name
                    }
        
                    flip.user.service.disconnect(auth.data.info.clientID, data, function(data0) {
                        if(data0.response == "OK") {
                            res.status(data0.statusCode || 200).send(data0);
                        } else {
                            res.status(data0.statusCode || 200).send(data0);
                        }
                    });
                }
            });
        } else {
            let err = flip.tools.res.INVALID_PARAMS;
            res.status(err.statusCode || 200).send(err);
        }
    } else {
        let err = flip.tools.res.INSUFFICIANT_PARAMS;
        res.status(err.statusCode || 200).send(err);
    }
});

// /user/relationships/*

app.get("/user/relationships/:clientID", (req, res) => {
    let clientID = req.params.clientID;
    let index = req.query.index;

    if(clientID && index) {
        if(flip.tools.validate.clientID(clientID) && flip.tools.validate.index(index)) {
            flip.authWithToken(req, function(auth) {
                if(auth.response == "OK") {
                    flip.user.relationships.get(clientID, index, auth.data.info.clientID, function(data0) {
                        if(data0.response == "OK") {
                            res.status(data0.statusCode || 200).send(data0);
                        } else {
                            res.status(data0.statusCode || 200).send(data0);
                        }
                    });
                } else {
                    res.status(auth.statusCode || 200).send(auth);
                }
            });
        } else {
            let err = flip.tools.res.INVALID_PARAMS;
            res.status(err.statusCode || 200).send(err);
        }
    } else {
        let err = flip.tools.res.INSUFFICIANT_PARAMS;
        res.status(err.statusCode || 200).send(err);
    }
});

// BLOCK

app.post("/user/block/create/:clientID", (req, res) => {
    let clientID = req.params.clientID;

    if(clientID) {
        if(flip.tools.validate.clientID(clientID)) {
            flip.authWithToken(req, function(auth) {
                if(auth.response == "OK") {
                    if(clientID != auth.data.info.clientID) {
                        flip.user.block.create(clientID, auth.data.info.clientID, function(data0) {
                            if(data0.response == "OK") {
                                res.status(data0.statusCode || 200).send(data0);
                            } else {
                                res.status(data0.statusCode || 200).send(data0);
                            }
                        })
                    } else {
                        res.send(flip.tools.res.INVALID_PARAMS);
                    }
                } else {
                    res.status(auth.statusCode || 200).send(auth);
                }
            });
        } else {
            let err = flip.tools.res.INVALID_PARAMS;
            res.status(err.statusCode || 200).send(err);
        }
    } else {
        let err = flip.tools.res.INSUFFICIANT_PARAMS;
        res.status(err.statusCode || 200).send(err);
    }
})

app.post("/user/block/destroy/:clientID", (req, res) => {
    let clientID = req.params.clientID;

    if(clientID) {
        if(flip.tools.validate.clientID(clientID)) {
            flip.authWithToken(req, function(auth) {
                if(auth.response == "OK") {
                    if(clientID != auth.data.info.clientID) {
                        flip.user.block.destroy(clientID, auth.data.info.clientID, function(data0) {
                            if(data0.response == "OK") {
                                res.status(data0.statusCode || 200).send(data0);
                            } else {
                                res.status(data0.statusCode || 200).send(data0);
                            }
                        })
                    } else {
                        res.send(flip.tools.res.INVALID_PARAMS);
                    }
                } else {
                    res.status(auth.statusCode || 200).send(auth);
                }
            });
        } else {
            let err = flip.tools.res.INVALID_PARAMS;
            res.status(err.statusCode || 200).send(err);
        }
    } else {
        let err = flip.tools.res.INSUFFICIANT_PARAMS;
        res.status(err.statusCode || 200).send(err);
    }
})

// BLOCK END

app.post("/user/relationship/create/:clientID", (req, res) => {
    let clientID = req.params.clientID;
    
    if(clientID) {
        if(flip.tools.validate.clientID(clientID)) {
            flip.authWithToken(req, function(auth) {
                if(auth.response == "OK") {
                    if(clientID != auth.data.info.clientID) {
                        flip.user.interaction.follow(clientID, auth.data.info.clientID, function(data0) {
                            if(data0.response == "OK") {
                                res.status(data0.statusCode || 200).send(data0);
                            } else {
                                res.status(data0.statusCode || 200).send(data0);
                            }
                        });
                    } else {
    
                    }
                } else {
                    res.status(auth.statusCode || 200).send(auth);
                }
            });
        } else {
            let err = flip.tools.res.INVALID_PARAMS;
            res.status(err.statusCode || 200).send(err);
        }
    } else {
        let err = flip.tools.res.INSUFFICIANT_PARAMS;
        res.status(err.statusCode || 200).send(err);
    }
});

app.post("/user/relationship/destroy/:clientID", (req, res) => {
    let clientID = req.params.clientID;

    if(clientID) {
        if(flip.tools.validate.clientID(clientID)) {
            flip.authWithToken(req, function(auth) {
                if(auth.response == "OK") {
                    if(clientID != auth.data.info.clientID) {
                        flip.user.interaction.unfollow(clientID, auth.data.info.clientID, function(data0) {
                            if(data0.response == "OK") {
                                res.status(data0.statusCode || 200).send(data0);
                            } else {
                                res.status(data0.statusCode || 200).send(data0);
                            }
                        });
                    } else {
                        res.send(flip.tools.res.INVALID_PARAMS);
                    }
                } else {
                    res.status(auth.statusCode || 200).send(auth);
                }
            });
        } else {
            let err = flip.tools.res.INVALID_PARAMS;
            res.status(err.statusCode || 200).send(err);
        }
    } else {
        let err = flip.tools.res.INSUFFICIANT_PARAMS;
        res.status(err.statusCode || 200).send(err);
    }
});

// /user/settings/*

app.post("/user/settings/update", (req, res) => {
    var name = req.body.name;
    var bio = req.body.bio;
    var profileImgUrl = req.body.profileImgUrl;
    var gradient = req.body["gradient[]"];

    flip.authWithToken(req, function(auth) {
        if(auth.response == "OK") {
            let settings = {
                name: name,
                bio: bio,
                profileImgUrl: profileImgUrl,
                gradient: gradient
            };

            flip.user.settings.update(auth.data.info.clientID, settings, function(data0) {
                res.status(data0.statusCode || 200).send(data0);
            });
        } else {
            res.status(auth.statusCode || 200).send(auth);
        }
    });
});

app.post("/user/setting/update", (req, res) => {
    let type = req.body.type;
    let key = req.body.key;
    let rawState = req.body.state;

    var state = !(rawState == 1)

    if(type && key) {
        if((type == "notification" || type == "discovery") && flip.tools.validate.key(key)) {
            flip.authWithToken(req, function(auth) {
                if(auth.response == "OK") {
                    flip.user.setting.set(auth.data.info.clientID, key, state, type, function(data0) {
                        if(data0.response == "OK") {
                            res.status(data0.statusCode || 200).send(data0);
                        } else {
                            res.status(data0.statusCode || 200).send(data0);
                        }
                    })
                } else {
                    res.status(auth.statusCode || 200).send(auth);
                }
            })
        } else {
            let err = flip.tools.res.INVALID_PARAMS;
            res.status(err.statusCode || 200).send(err);
        }
    } else {
        let err = flip.tools.res.INSUFFICIANT_PARAMS;
        res.status(err.statusCode || 200).send(err);
    }
})

// /users/*

app.get("/users/search/:query", (req, res) => {
    let query = req.params.query;
    
    if(query) {
        if(flip.tools.validate.query(query)) {
            flip.authWithToken(req, function(auth) {
                if(auth.response == "OK") {
                    if(flip.tools.validate.username(query)) {
                        flip.user.get.multi.search(query, auth.data.info.clientID, function(data0) {
                            if(data0.response == "OK") {
                                res.status(data0.statusCode || 200).send(data0);
                            } else {
                                res.status(data0.statusCode || 200).send(data0);
                            }
                        })
                    } else {
                        res.send(flip.tools.res.NO_DATA)
                    }
                } else {
                    res.status(auth.statusCode || 200).send(auth);
                }
            });
        } else {
            let err = flip.tools.res.INVALID_PARAMS;
            res.status(err.statusCode || 200).send(err);
        }
    } else {
        let err = flip.tools.res.INSUFFICIANT_PARAMS;
        res.status(err.statusCode || 200).send(err);
    }
});

app.get("/user/notifications", (req, res) => {
    let index = req.query.index;

    if(index) {
        if(flip.tools.validate.index(index)) {
            flip.authWithToken(req, function(auth) {
                if(auth.response == "OK") {
                    flip.notification.get(auth.data.info.clientID, index, function(data0) {
                        if(data0.response == "OK") {
                            res.status(data0.statusCode || 200).send(data0)
                        } else {
                            res.status(data0.statusCode || 200).send(data0)
                        }
                    })
                } else {
                    res.status(auth.statusCode || 200).send(auth);
                }
            });
        } else {
            let err = flip.tools.res.INVALID_PARAMS;
            res.status(err.statusCode || 200).send(err);
        }
    } else {
        let err = flip.tools.res.INSUFFICIANT_PARAMS;
        res.status(err.statusCode || 200).send(err);
    }
})

// /post/*

app.get("/post/:postID", (req, res) => {
    let postID = req.params.postID;

    if(postID) {
        if(flip.tools.validate.postID(postID)) {
            flip.authWithToken(req, function(auth) {
                if(auth.response == "OK") {
                    flip.post.get(postID, auth.data.info.clientID, function(data0) {
                        if(data0.response == "OK") {
                            data0.data = [data0.data]
                            res.status(data0.statusCode || 200).send(data0);
                        } else {
                            res.status(data0.statusCode || 200).send(data0);
                        }
                    });
                } else {
                    res.status(auth.statusCode || 200).send(auth);
                }
            });
        } else {
            let err = flip.tools.res.INVALID_PARAMS;
            res.status(err.statusCode || 200).send(err);
        }
    } else {
        let err = flip.tools.res.INSUFFICIANT_PARAMS;
        res.status(err.statusCode || 200).send(err);
    }
})

app.post("/user/bookmark/create/:postID", (req, res) => {
    let postID = req.params.postID;

    if(postID) {
        if(flip.tools.validate.postID(postID)) {
            flip.authWithToken(req, function(auth) {
                if(auth.response == "OK") {
                    flip.user.bookmark.create(postID, auth.data.info.clientID, function(data0) {
                        if(data0.response == "OK") {
                            res.status(data0.statusCode || 200).send(data0);
                        } else {
                            res.status(data0.statusCode || 200).send(data0);
                        }
                    })
                } else {
                    res.status(auth.statusCode || 200).send(auth);
                }
            })
        } else {
            let err = flip.tools.res.INVALID_PARAMS;
            res.status(err.statusCode || 200).send(err);
        }
    } else {
        let err = flip.tools.res.INSUFFICIANT_PARAMS;
        res.status(err.statusCode || 200).send(err);
    }
});

app.post("/user/bookmark/destroy/:postID", (req, res) => {
    let postID = req.params.postID;

    if(postID) {
        if(flip.tools.validate.postID(postID)) {
            flip.authWithToken(req, function(auth) {
                if(auth.response == "OK") {
                    flip.user.bookmark.destroy(postID, auth.data.info.clientID, function(data0) {
                        if(data0.response == "OK") {
                            res.status(data0.statusCode || 200).send(data0);
                        } else {
                            res.status(data0.statusCode || 200).send(data0);
                        }
                    })
                } else {
                    res.status(auth.statusCode || 200).send(auth);
                }
            })
        } else {
            let err = flip.tools.res.INVALID_PARAMS;
            res.status(err.statusCode || 200).send(err);
        }
    } else {
        let err = flip.tools.res.INSUFFICIANT_PARAMS;
        res.status(err.statusCode || 200).send(err);
    }
});

app.get("/user/bookmarks", (req, res) => {
    let index = req.query.index;

    if(index) {
        if(flip.tools.validate.index(index)) {
            flip.authWithToken(req, function(auth) {
                if(auth.response == "OK") {
                    flip.user.get.bookmarks(auth.data.info.clientID, index, function(data0) {
                        if(data0.response == "OK") {
                            res.status(data0.statusCode || 200).send(data0);
                        } else {
                            res.status(data0.statusCode || 200).send(data0);
                        }
                    })
                } else {
                    res.status(auth.statusCode || 200).send(auth);
                }
            })
        } else {
            let err = flip.tools.res.INVALID_PARAMS;
            res.status(err.statusCode || 200).send(err);
        }
    } else {
        let err = flip.tools.res.INSUFFICIANT_PARAMS;
        res.status(err.statusCode || 200).send(err);
    }
})


app.get("/post/stream/:vID", (req, res) => {
    var vID = req.params.vID;

    var path = FL_VIDEO_PATH + vID + ".mov";
    var stat = fs.statSync(path);
    var total = stat.size;

    if(req.headers["range"]) {
        var range = req.headers.range;
        var parts = range.replace(/bytes=/, "").split("-");
        var partialstart = parts[0];
        var partialend = parts[1];

        var start = parseInt(partialstart, 10);
        var end = partialend ? parseInt(partialend, 10): total-1;
        var chunksize = (end-start)+1;

        var file = fs.createReadStream(path, {start: start, end: end});
        res.writeHead(206, { "Content-Range": "bytes " + start + "-" + end + "/" + total, "Accept-Ranges": "bytes", "Content-Length": chunksize, "Content-Type": "video/mp4" });
        file.pipe(res);
    } else {
        res.writeHead(200, { "Content-Length": total, "Content-Type": "video/mp4" });
        fs.createReadStream(path).pipe(res);
    }
});

app.get("/post/thumb/:tID", (req, res) => {
    var tID = req.params.tID;

    fs.readFile(FL_THUMB_PATH + tID + ".png", function(err, data) {
        if(!err) {
            res.send(data);
        }
    });
})

app.post("/post/view/:postID", (req, res) => {
    var postID = req.params.postID;

    if(postID) {
        if(flip.tools.validate.postID(postID)) {
            flip.authWithToken(req, function(auth) {
                if(auth.response == "OK") {
                    flip.post.view(postID, function(data0) {
                        if(data0.response == "OK") {
                            res.status(data0.statusCode || 200).send(data0);
                        } else {
                            res.status(data0.statusCode || 200).send(data0);
                        }
                    });
                } else {
                    res.status(auth.statusCode || 200).send(auth);
                }
            });
        } else {
            let err = flip.tools.res.INVALID_PARAMS;
            res.status(err.statusCode || 200).send(err);
        }
    } else {
        let err = flip.tools.res.INSUFFICIANT_PARAMS;
        res.status(err.statusCode || 200).send(err);
    }
})

app.post("/post/upload", (req, res) => {
    let vid = req.files.flipVid;
    let wasUploaded = req.body.uploadedFromCameraRoll;

    if(vid && wasUploaded) {
        flip.authWithToken(req, function(auth) {
            if(auth.response == "OK") {
                flip.post.create(vid.name, auth.data.info.clientID, wasUploaded, function(data0) {
                    if(data0.response == "OK") {
                        vid.mv(FL_VIDEO_PATH + data0.data.postID + ".mov", function(err) {
                            if(!err) {
                                new ffmpeg(FL_VIDEO_PATH + data0.data.postID + ".mov").screenshots({
                                    timestamps: [ 0 ],
                                    filename: data0.data.postID + ".png",
                                    folder: FL_THUMB_PATH
                                });
    
                                res.send({
                                    response: "OK"
                                });
                            } else {
                                res.send(flip.tools.res.ERR);
                            }
                        });
                    } else {
                        res.status(data0.statusCode || 200).send(data0)
                    }
                });
            } else {
                res.status(auth.statusCode || 200).send(auth);
            }
        });
    } else {
        let err = flip.tools.res.INSUFFICIANT_PARAMS;
        res.status(err.statusCode || 200).send(err);
    }
});

app.post("/post/destroy", (req, res) => {
    let postID = req.body.postID;

    if(postID) {
        if(flip.tools.validate.postID(postID)) {
            flip.authWithToken(req, function(auth) {
                if(auth.response == "OK") {
                    flip.post.destroy(postID, auth.data.info.clientID, function(data0) {
                        if(data0.response == "OK") {
                            res.status(data0.statusCode || 200).send(data0);
                        } else {
                            res.status(data0.statusCode || 200).send(data0);
                        }
                    })
                } else {
                    res.status(auth.statusCode || 200).send(auth);
                }
            });
        } else {
            let err = flip.tools.res.INVALID_PARAMS;
            res.status(err.statusCode || 200).send(err);
        }
    } else {
        let err = flip.tools.res.INSUFFICIANT_PARAMS;
        res.status(err.statusCode || 200).send(err);
    }
});

// /post/caption/*

app.post("/post/caption/update", (req, res) => {
    let postID = req.body.postID;
    let caption = req.body.caption;

    if(postID && caption) {
        if(flip.tools.validate.postID(postID) && flip.tools.validate.caption(caption)) {
            flip.authWithToken(req, function(auth) {
                if(auth.response == "OK") {
                    flip.post.caption.edit(caption, postID, auth.data.info.clientID, function(data0) {
                        if(data0.response == "OK") {
                            res.status(data0.statusCode || 200).send(data0);
                        } else {
                            res.status(data0.statusCode || 200).send(data0);
                        }
                    });
                } else {
                    res.status(auth.statusCode || 200).send(auth);
                }
            });
        } else {
            let err = flip.tools.res.INVALID_PARAMS;
            res.status(err.statusCode || 200).send(err);
        }
    } else {
        let err = flip.tools.res.INSUFFICIANT_PARAMS;
        res.status(err.statusCode || 200).send(err);
    }
})

// /posts/hashtag/*

app.get("/posts/hashtag/:hashtag", (req, res) => {
    let hashtag = req.params.hashtag;
    let index = req.query.index;

    if(hashtag && index) {
        if(hashtag.length > 0 && hashtag.length < 20) {
            flip.authWithToken(req, function(auth) {
                if(auth.response == "OK") {
                    flip.post.search.hashtag(hashtag, index, auth.data.info.clientID, function(data0) {
                        if(data0.response == "OK") {
                            res.status(data0.statusCode || 200).send(data0);
                        } else {
                            res.status(data0.statusCode || 200).send(data0);
                        }
                    })
                } else {
                    res.status(auth.statusCode || 200).send(auth);
                }
            });
        } else {
            res.send(flip.tools.res.INVALID_PARAMS);
        }
    } else {
        res.send(flip.tools.res.INSUFFICIANT_PARAMS);
    }
});

// /post/like/*

app.post("/post/like/create", (req, res) => {
    var postID = req.body.postID;

    if(postID) {
        if(flip.tools.validate.postID(postID)) {
            flip.authWithToken(req, function(auth) {
                if(auth.response == "OK") {
                    flip.post.interaction.like.create(auth.data.info.clientID, postID, function(data0) {
                        if(data0.response == "OK") {
                            res.status(data0.statusCode || 200).send(data0);
                        } else {
                            res.status(data0.statusCode || 200).send(data0);
                        }
                    });
                } else {
                    res.status(auth.statusCode || 200).send(auth);
                }
            });
        } else {
            let err = flip.tools.res.INVALID_PARAMS;
            res.status(err.statusCode || 200).send(err);
        }
    } else {
        let err = flip.tools.res.INSUFFICIANT_PARAMS;
        res.status(err.statusCode || 200).send(err);
    }
});

app.post("/post/like/destroy", (req, res) => {
    var postID = req.body.postID;

    if(postID) {
        if(flip.tools.validate.postID(postID)) {
            flip.authWithToken(req, function(auth) {
                if(auth.response == "OK") {
                    flip.post.interaction.like.destroy(auth.data.info.clientID, postID, function(data0) {
                        if(data0.response == "OK") {
                            res.status(data0.statusCode || 200).send(data0);
                        } else {
                            res.status(data0.statusCode || 200).send(data0);
                        }
                    });
                } else {
                    res.status(auth.statusCode || 200).send(auth);
                }
            });
        } else {
            let err = flip.tools.res.INVALID_PARAMS;
            res.status(err.statusCode || 200).send(err);
        }
    } else {
        let err = flip.tools.res.INSUFFICIANT_PARAMS;
        res.status(err.statusCode || 200).send(err);
    }
});

// /post/likes/get

app.get("/post/likes/:postID", (req, res) => {
    let postID = req.params.postID;
    let index = req.query.index;

    if(postID) {
        if(flip.tools.validate.postID(postID) && flip.tools.validate.index(index)) {
            flip.authWithToken(req, function(auth) {
                if(auth.response == "OK") {
                    flip.post.likes.get(postID, index, auth.data.info.clientID, function(data0) {
                        if(data0.response == "OK") {
                            res.status(data0.statusCode || 200).send(data0);
                        } else {
                            res.status(data0.statusCode || 200).send(data0);
                        }
                    });
                } else {
                    res.status(auth.statusCode || 200).send(auth);
                }
            });
        } else {
            let err = flip.tools.res.INVALID_PARAMS;
            res.status(err.statusCode || 200).send(err);
        }
    } else {
        let err = flip.tools.res.INSUFFICIANT_PARAMS;
        res.status(err.statusCode || 200).send(err);
    }
});

// /post/comments/get

app.get("/post/comments/:postID", (req, res) => {
    let postID = req.params.postID;
    let index = req.query.index;

    if(postID && index) {
        if(flip.tools.validate.postID(postID) && flip.tools.validate.index(index)) {
            flip.authWithToken(req, function(auth) {
                if(auth.response == "OK") {
                    flip.post.comments.get(postID, index, auth.data.info.clientID, function(data0) {
                        if(data0.response == "OK") {
                            res.status(data0.statusCode || 200).send(data0);
                        } else {
                            res.status(data0.statusCode || 200).send(data0);
                        }
                    });
                } else {
                    res.status(auth.statusCode || 200).send(auth);
                }
            });
        } else {
            let err = flip.tools.res.INVALID_PARAMS;
            res.status(err.statusCode || 200).send(err);
        }
    } else {
        let err = flip.tools.res.INSUFFICIANT_PARAMS;
        res.status(err.statusCode || 200).send(err);
    }
});

// /post/comment/create

app.post("/post/comment/create", (req, res) => {
    let comment = req.body.comment;
    let postID = req.body.postID;

    if(comment && postID) {
        if(flip.tools.validate.comment(comment) && flip.tools.validate.postID(postID)) {
            flip.authWithToken(req, function(auth) {
                if(auth.response == "OK") {
                    flip.post.interaction.comment.create(comment, auth.data.info.clientID, postID, function(data0) {
                        if(data0.response == "OK") {
                            res.status(data0.statusCode || 200).send(data0);
                        } else {
                            res.status(data0.statusCode || 200).send(data0);
                        }
                    });
                } else {
                    res.status(auth.statusCode || 200).send(auth);
                }
            });
        } else {
            let err = flip.tools.res.INVALID_PARAMS;
            res.status(err.statusCode || 200).send(err);
        }
    } else {
        let err = flip.tools.res.INSUFFICIANT_PARAMS;
        res.status(err.statusCode || 200).send(err);
    }
});

// /post/comment/destroy

app.post("/post/comment/destroy", (req, res) => {
    var commentID = req.body.commentID;
    var postID = req.body.postID;

    if(commentID && postID) {
        if(flip.tools.validate.commentID(commentID) && flip.tools.validate.postID(postID)) {
            flip.authWithToken(req, function(auth) {
                if(auth.response == "OK") {
                    flip.post.interaction.comment.destroy(commentID, auth.data.info.clientID, postID, function(data0) {
                        if(data0.response == "OK") {
                            res.status(data0.statusCode || 200).send(data0);
                        } else {
                            res.status(data0.statusCode || 200).send(data0);
                        }
                    });
                } else {
                    res.status(auth.statusCode || 200).send(auth);
                }
            });
        } else {
            let err = flip.tools.res.INVALID_PARAMS;
            res.status(err.statusCode || 200).send(err);
        }
    } else {
        let err = flip.tools.res.INSUFFICIANT_PARAMS;
        res.status(err.statusCode || 200).send(err);
    }
});

// /posts/*

app.get("/user/feed", (req, res) => {
    let index = req.query.index;

    if(index) {
        if(flip.tools.validate.index(index)) {
            flip.authWithToken(req, function(auth) {
                if(auth.response == "OK") {
                    flip.feed.get(auth.data.info.clientID, index, function(data0) {
                        if(data0.response == "OK") {
                            res.status(data0.statusCode || 200).send(data0);
                        } else {
                            res.status(data0.statusCode || 200).send(data0);
                        }
                    });
                } else {
                    res.status(auth.statusCode || 200).send(auth);
                }
            });
        } else {
            let err = flip.tools.res.INVALID_PARAMS;
            res.status(err.statusCode || 200).send(err);
        }
    } else {
        let err = flip.tools.res.INSUFFICIANT_PARAMS;
        res.status(err.statusCode || 200).send(err);
    }
});

app.get("/posts/explore", (req, res) => {
    let index = req.query.index;

    if(index) {
        if(flip.tools.validate.index(index)) {
            flip.authWithToken(req, function(auth) {
                if(auth.response == "OK") {
                    flip.explore.get(auth.data.info.clientID, index, false, function(data0) {
    
                        if(data0.response == "OK") {
                            res.status(data0.statusCode || 200).send(data0)
                        } else {
                            res.status(data0.statusCode || 200).send(data0);
                        }
                    });
                } else {
                    res.status(auth.statusCode || 200).send(auth);
                }
            });
        } else {
            let err = flip.tools.res.INVALID_PARAMS;
            res.status(err.statusCode || 200).send(err);
        }
    } else {
        let err = flip.tools.res.INSUFFICIANT_PARAMS;
        res.status(err.statusCode || 200).send(err);
    }
});

app.get("/onboarding/posts", (req, res) => {
    flip.onboarding.get(function(data0) {
        data0.meta = {};
        data0.meta.tagline = "A new home for short, looping videos.";
        
        res.status(data0.statusCode || 200).send(data0);
    })
})

app.get("/user/posts/:clientID", (req, res) => {
    let clientID = req.params.clientID;
    let index = req.query.index;

    if(clientID && index) {
        if(flip.tools.validate.clientID(clientID) && flip.tools.validate.index(index)) {
            flip.authWithToken(req, function(auth) {
                if(auth.response == "OK") {
                    flip.user.get.posts(clientID, index, auth.data.info.clientID, function(data0) {
                        if(data0.response == "OK") {
                            res.status(data0.statusCode || 200).send(data0);
                        } else {
                            res.status(data0.statusCode || 200).send(data0);
                        }
                    });
                } else {
                    res.status(auth.statusCode || 200).send(auth);
                }
            });
        } else {
            let err = flip.tools.res.INVALID_PARAMS;
            res.status(err.statusCode || 200).send(err);
        }
    } else {
        let err = flip.tools.res.INSUFFICIANT_PARAMS;
        res.status(err.statusCode || 200).send(err);
    }
});


// /report/*

app.post("/report/create", (req, res) => {
    var idToReport = req.body.idToReport;
    var type = req.body.type;
    var reason = req.body.reason;
    var details = req.body.details;

    if(idToReport && type && reason) {
        flip.authWithToken(req, function(auth) {
            if(auth.response == "OK") {
                flip.report.create(auth.data.info.clientID, idToReport, type, reason, details, function(data0) {
                    if(data0.response == "OK") {
                        res.status(data0.statusCode || 200).send(data0);
                    } else {
                        res.status(data0.statusCode || 200).send(data0);
                    }
                });
            } else {
                res.status(auth.statusCode || 200).send(auth);
            }
        });
    } else {
        let err = flip.tools.res.INSUFFICIANT_PARAMS;
        res.status(err.statusCode || 200).send(err);
    }
});

app.post("/report/types/get", (req, res) => {
    var reportReasons = {
        "post": [
            {
                id: 0,
                title: "Violence",
                shortCode: "violence"
            },
            {
                id: 1,
                title: "Spam",
                shortCode: "spam"
            },
            {
                id: 2,
                title: "Nudity / Pornography",
                shortCode: "nudity-pornography"
            },
            {
                id: 3,
                title: "Illegal Material",
                shortCode: "illegal"
            },
            {
                id: 4,
                title: "Self Injury",
                shortCode: "self-injury"
            },
            {
                id: 5,
                title: "Harassment / Bullying",
                shortCode: "harassment-bullying"
            },
            {
                id: 6,
                title: "Copyright / IP Infringement",
                shortCode: "copyright-infringement",
                doesRequireFurtherDetails: true,
                furtherDetailsExamples: "For example, include the copyright holder, and the timecode the copyrighted media is located at."
            }
        ],
        "user": [
            {
                id: 0,
                title: "Impersonation",
                shortCode: "impersonation"
            },
            {
                id: 1,
                title: "Spam",
                shortCode: "spam"
            },
            {
                id: 2,
                title: "Nudity / Pornography",
                shortCode: "nudity-pornography"
            }
        ],
        "comment": [
        {
            id: 0,
            title: "Spam",
            shortCode: "spam"
        },
        {
            id: 1,
            title: "Threatening",
            shortCode: "threatening"
        },
        {
            id: 2,
            title: "Harassment / Bullying",
            shortCode: "harassment-bullying"
        }
        ]
    };

    if(typeof reportReasons[req.body.for] !== "undefined") {
        res.send({
            response: "OK",
            data: reportReasons[req.body.for]
        })
    } else {
        res.send({
            response: "OK",
            data: []
        })
    }
})

// /watch/*

app.get("/watch/:postID", (req, res) => {
    let postID = req.params.postID;

    flip.post.get(postID, "", function(data0) {
        res.render("video", {
            data: data0.data
        });
    });
});

app.post("/user/forgot/password/request", (req, res) => {
    let email = req.body.email;

    res.send({
        response: "IN_DEV",
        formattedTitle: "Feature in Development",
        formattedResponse: "This feature is in development. Contact support@flip.wtf for further details."
    })
})

app.post("/user/twitter/login", (req, res) => {
    let accessToken = req.body.accessToken;
    let accessTokenSecret = req.body.accessTokenSecret;

    if(accessToken && accessTokenSecret) {
        flip.user.loginWithTwitter(accessToken, accessTokenSecret, function(data0) {
            res.status(data0.statusCode || 200).send(data0);
        })
    } else {
        res.send(flip.tools.res.INSUFFICIANT_PARAMS);
    }
})

app.post("/user/signup", (req, res) => {
    let username = req.body.username;
    let email = req.body.email;
    let password = req.body.password;

    let UUID = req.body.UUID;

    let twAccessToken = req.body.twAccessToken;
    let twAccessTokenSecret = req.body.twAccessTokenSecret;

    if(username && email && password) {
        username = username.replace("@", "");

        let twitterData = {
            name: "twitter",
            tokens: {
                token: twAccessToken,
                secret: twAccessTokenSecret
            }
        }

        if(flip.tools.validate.username(username) && flip.tools.validate.email(email) && flip.tools.validate.password(password)) {
            flip.user.create(username, email, password, twitterData, function(data) {
                res.send(data);
            });
        } else {
            if(!flip.tools.validate.username(username)) {
                if(username.length < 16) {
                    res.send(flip.tools.res.USERNAME_INVALID_CHAR);
                } else {
                    res.send(flip.tools.res.USERNAME_INVALID_LENGTH.prep(username));
                }
            } else if(!flip.tools.validate.email(email)) {
                res.send(flip.tools.res.EMAIL_INVALID);
            } else if(!flip.tools.validate.password(password)) {
                res.send(flip.tools.res.PASSWORD_INVALID);
            } else {
                res.send(flip.tools.res.INVALID_PARAMS);
            }
        }
    } else {
        res.send(flip.tools.res.INSUFFICIANT_PARAMS);
    }
})

app.post("/chat/thread/create", (req, res) => {
    let clientID = req.body.clientID;

    if(clientID) {
        if(flip.tools.validate.clientID(clientID)) {
            flip.authWithToken(req, function(auth0) {
                if(auth0.response == "OK") {
                    flip.chat.thread.create(auth0.data.info.clientID, clientID, function(data0) {
                        if(data0.response == "OK") {
                            res.status(data0.statusCode || 200).send(data0)
                        } else {
                            res.status(data0.statusCode || 200).send(data0);
                        }
                    })
                } else {
                    res.send(auth0);
                }
            });
        } else {
            res.send(flip.tools.res.INVALID_PARAMS);
        }
    } else {
        res.send(flip.tools.res.INSUFFICIANT_PARAMS);
    }
})

app.post("/chat/thread/destroy", (req, res) => {
    let threadID = req.body.threadID;

    if(threadID) {
        if(flip.tools.validate.threadID(threadID)) {
            flip.authWithToken(req, function(auth0) {
                if(auth0.response == "OK") {
                    flip.chat.user.auth(auth0.data.info.clientID, threadID, function(auth1) {
                        if(auth1.response == "OK") {
                            flip.chat.thread.destroy(threadID, function(data0) {
                                if(data0.response == "OK") {
                                    res.status(data0.statusCode || 200).send(data0)
                                } else {
                                    res.status(data0.statusCode || 200).send(data0);
                                }
                            })
                        } else {
                            res.send(auth1);
                        }
                    })
                } else {
                    res.send(auth0);
                }
            });
        } else {
            res.send(flip.tools.res.INVALID_PARAMS);
        }
    } else {
        res.send(flip.tools.res.INSUFFICIANT_PARAMS);
    }
});

app.post("/chat/thread/message/create", (req, res) => {
    let message = req.body.message;
    let threadID = req.body.threadID;

    if(message && threadID) {
        if(flip.tools.validate.message(message) && flip.tools.validate.threadID(threadID)) {
            flip.authWithToken(req, function(auth0) {
                if(auth0.response == "OK") {
                    flip.chat.user.auth(auth0.data.info.clientID, threadID, function(auth1) {
                        if(auth1.response == "OK") {
                            flip.chat.thread.message.send(message, threadID, auth0.data.info.clientID, function(data0) {
                                if(data0.response == "OK") {
                                    res.status(data0.statusCode || 200).send(data0)
                                } else {
                                    res.status(data0.statusCode || 200).send(data0);
                                }
                            })
                        } else {
                            res.send(auth1);
                        }
                    })
                } else {
                    res.send(auth0);
                }
            });
        } else {
            res.send(flip.tools.res.INVALID_PARAMS);
        }
    } else {
        res.send(flip.tools.res.INSUFFICIANT_PARAMS);
    }
})

app.post("/chat/thread/message/destroy", (req, res) => {
    let messageID = req.body.messageID;
    let threadID = req.body.threadID;

    if(messageID && threadID) {
        if(flip.tools.validate.messageID(messageID) && flip.tools.validate.threadID(threadID)) {
            flip.authWithToken(req, function(auth0) {
                if(auth0.response == "OK") {
                    flip.chat.user.auth(auth0.data.info.clientID, threadID, function(auth1) {
                        if(auth1.response == "OK") {
                            flip.chat.thread.message.destroy(messageID, threadID, auth0.data.info.clientID, function(data0) {
                                if(data0.response == "OK") {
                                    res.status(data0.statusCode || 200).send(data0)
                                } else {
                                    res.status(data0.statusCode || 200).send(data0);
                                }
                            })
                        } else {
                            res.send(auth1);
                        }
                    })
                } else {
                    res.send(auth0);
                }
            });
        } else {
            res.send(flip.tools.res.INVALID_PARAMS);
        }
    } else {
        res.send(flip.tools.res.INSUFFICIANT_PARAMS);
    }
});

app.get("/chat/thread/:threadID", (req, res) => {
    let threadID = req.params.threadID;
    let index = req.query.index;

    if(threadID && index) {
        if(flip.tools.validate.threadID(threadID) && flip.tools.validate.index(index)) {
            flip.authWithToken(req, function(auth0) {
                if(auth0.response == "OK") {
                    flip.chat.user.auth(auth0.data.info.clientID, threadID, function(auth1) {
                        if(auth1.response == "OK") {
                            flip.chat.thread.get(threadID, auth0.data.info.clientID, function(data0) {
                                if(data0.response == "OK") {
                                    res.status(data0.statusCode || 200).send(data0)
                                } else {
                                    res.status(data0.statusCode || 200).send(data0);
                                }
                            })
                        } else {
                            res.send(auth1);
                        }
                    })
                } else {
                    res.send(auth0);
                }
            });
        } else {
            res.send(flip.tools.res.INVALID_PARAMS);
        }
    } else {
        res.send(flip.tools.res.INSUFFICIANT_PARAMS);
    }
});

app.get("/chat/threads", (req, res) => {
    let index = req.query.index;

    if(index) {
        if(flip.tools.validate.index(index)) {
            flip.authWithToken(req, function(auth) {
                if(auth.response == "OK") {
                    flip.chat.user.threads.get(auth.data.info.clientID, index, function(data0) {
                        if(data0.response == "OK") {
                            res.status(data0.statusCode || 200).send(data0)
                        } else {
                            res.status(data0.statusCode || 200).send(data0);
                        }
                    })
                } else {
                    res.status(auth.statusCode || 200).send(auth);
                }
            });
        } else {
            res.send(flip.tools.res.INVALID_PARAMS);
        }
    } else {
        res.send(flip.tools.res.INSUFFICIANT_PARAMS);
    }
});

io.on("connection", function(socket) {
    socket.on("FL_CH_SUBSCRIBE_TO_THREAD", function(threadData) {
        socket.join(threadData.threadLiveTypingKey)

        flip.FL_LIVE_TYPING_KEYS[socket.id] = threadData.threadLiveTypingKey
        flip.FL_LIVE_TYPING_USERS[socket.id] = threadData.clientID
    })

    socket.on("FL_CH_LT_DID_TYPING_OCCUR", function(data) {
        if(typeof flip.FL_LIVE_TYPING_USERS[socket.id] !== "undefined") {
            let liveTypingData = {
                info: {
                    messageID: "",
                    messageSentAt: Date.now(),
                    messageLastUpdatedAt: Date.now(),
                    messageSentAgo: "live",
                    messageSentBy: flip.FL_LIVE_TYPING_USERS[socket.id]
                },
                data: {
                    content: data.content.trim()
                }
            }

            io.to(flip.FL_LIVE_TYPING_KEYS[socket.id]).emit("FL_CH_LT_DID_TYPING_OCCUR", liveTypingData)
        }
    })

    socket.on("disconnect", function() {
        delete flip.FL_LIVE_TYPING_KEYS[socket.id]
    })
});

module.exports = app;