module.exports = function(flip, s3) {
    let FL_DEFAULT_STATUS = 200;

    let app = require("express")();

    let ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
    let ffmpeg = require("fluent-ffmpeg");
    ffmpeg.setFfmpegPath(ffmpegInstaller.path);

    let fs = require("fs");

    app.post("/user/auth", (req, res) => {
        flip.auth(req, function(data) {
            res.status(data.statusCode || FL_DEFAULT_STATUS).send(data);
        })
    });

    app.post("/user/token/switchover", (req, res) => {
        let clientID = req.body.clientID;
        let sessionID = req.body.sessionID;

        flip.user.token.switchover(clientID, sessionID, function(data0) {
            res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
        });
    });

    app.post("/user/login", (req, res) => {
        let email = req.body.email;
        let password = req.body.password.toUpperCase();

        if(email && password) {
            if(flip.tools.validate.email(email) && flip.tools.validate.password(password)) {
                flip.user.login(email, password, function(data0) {
                    res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                });
            } else {
                res.send(flip.tools.res.INVALID_PARAMS);
            }
        } else {
            res.send(flip.tools.res.INSUFFICIANT_PARAMS);
        }
    });

    app.post("/user/logout", (req, res) => {
        flip.auth(req, function(data0) {
            if(data0.response == "OK") {
                flip.user.logout(data0.data.info.clientID, function(data1) {
                    res.status(data1.statusCode || FL_DEFAULT_STATUS).send(data1);
                })
            } else {
                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
            }
        })
    });

    app.get("/user/:clientID/profile", (req, res) => {
        let type = req.query.type;

        let clientID = req.params.clientID;
        let username = req.params.clientID;

        if(clientID || username) {
            if(flip.tools.validate.clientID(clientID) || flip.tools.validate.username(username)) {
                flip.auth(req, function(auth) {
                    if(auth.response == "OK") {
                        if(type == "clientID") {
                            flip.user.get.safe.clientID(clientID, auth.data.info.clientID, function(data0) {
                                if(data0.response == "OK") {
                                    res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                                } else {
                                    res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                                }
                            });
                        } else if(type == "username") {
                            flip.user.get.safe.username(username, auth.data.info.clientID, function(data0) {
                                if(data0.response == "OK") {
                                    res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                                } else {
                                    res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                                }
                            });
                        } else {
                            let err = flip.tools.res.INVALID_PARAMS;
                            res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
                        }
                    } else {
                        res.status(auth.statusCode || FL_DEFAULT_STATUS).send(auth);
                    }
                });
            } else {
                let err = flip.tools.res.INVALID_PARAMS;
                res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
            }
        } else {
            let err = flip.tools.res.INSUFFICIANT_PARAMS;
            res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
        }
    });

// /user/settings/get

    app.get("/user/settings", (req, res) => {
        flip.auth(req, function(auth) {
            if(auth.response == "OK") {
                flip.user.settings.get(auth.data.info.clientID, function(data0) {
                    if(data0.response == "OK") {
                        res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                    } else {
                        res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                    }
                });
            } else {
                res.status(auth.statusCode || FL_DEFAULT_STATUS).send(auth);
            }
        });
    })

// /user/services/*

    app.get("/user/services/:name", (req, res) => {
        let name = req.params.name;

        if(name) {
            if(flip.tools.validate.serviceName(name)) {
                flip.auth(req, function(auth) {
                    if(auth.response == "OK") {
                        if(name == "contacts") {
                            var emailAddresses = req.body["emailAddresses[]"];

                            if(typeof emailAddresses !== "undefined") {
                                if(emailAddresses.constructor !== Array) {
                                    emailAddresses = [emailAddresses]
                                }

                                flip.user.service.get.contacts(auth.data.info.clientID, emailAddresses, function(data0) {
                                    if(data0.response == "OK") {
                                        res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                                    } else {
                                        res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                                    }
                                })
                            } else {
                                res.send(flip.tools.res.NO_DATA)
                            }
                        } else if(name == "twitter") {
                            flip.user.service.get.twitter(auth.data.info.clientID, function(data0) {
                                if(data0.response == "OK") {
                                    res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                                } else {
                                    res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                                }
                            })
                        } else {
                            res.send(flip.tools.res.SERVICE_UNKNOWN)
                        }
                    } else {
                        res.status(auth.statusCode || FL_DEFAULT_STATUS).send(auth);
                    }
                });
            } else {
                let err = flip.tools.res.INVALID_PARAMS;
                res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
            }
        } else {
            let err = flip.tools.res.INSUFFICIANT_PARAMS;
            res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
        }
    });

    app.post("/user/service/connect", (req, res) => {
        let name = req.body.name;
        let token = req.body.token;
        let secret = req.body.secret;

        if(name && token && secret) {
            if(flip.tools.validate.serviceName(name.toLowerCase())) {
                flip.auth(req, function(auth) {
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
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            } else {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            }
                        });
                    }
                })
            } else {
                let err = flip.tools.res.INVALID_PARAMS;
                res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
            }
        } else {
            let err = flip.tools.res.INSUFFICIANT_PARAMS;
            res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
        }
    });

    app.post("/user/service/disconnect", (req, res) => {
        let name = req.body.name;

        if(name) {
            if(flip.tools.validate.serviceName(name)) {
                flip.auth(req, function(auth) {
                    if(auth.response == "OK") {
                        let data = {
                            name: name
                        }

                        flip.user.service.disconnect(auth.data.info.clientID, data, function(data0) {
                            if(data0.response == "OK") {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            } else {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            }
                        });
                    }
                });
            } else {
                let err = flip.tools.res.INVALID_PARAMS;
                res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
            }
        } else {
            let err = flip.tools.res.INSUFFICIANT_PARAMS;
            res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
        }
    });

// /user/relationships/*

    app.get("/user/:clientID/relationships", (req, res) => {
        let clientID = req.params.clientID;
        let index = req.query.index;

        if(clientID && index) {
            if(flip.tools.validate.clientID(clientID) && flip.tools.validate.index(index)) {
                flip.auth(req, function(auth) {
                    if(auth.response == "OK") {
                        flip.user.relationships.get(clientID, index, auth.data.info.clientID, function(data0) {
                            if(data0.response == "OK") {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            } else {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            }
                        });
                    } else {
                        res.status(auth.statusCode || FL_DEFAULT_STATUS).send(auth);
                    }
                });
            } else {
                let err = flip.tools.res.INVALID_PARAMS;
                res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
            }
        } else {
            let err = flip.tools.res.INSUFFICIANT_PARAMS;
            res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
        }
    });

// BLOCK

    app.post("/user/:clientID/block/create/", (req, res) => {
        let clientID = req.params.clientID;

        if(clientID) {
            if(flip.tools.validate.clientID(clientID)) {
                flip.auth(req, function(auth) {
                    if(auth.response == "OK") {
                        if(clientID != auth.data.info.clientID) {
                            flip.user.block.create(clientID, auth.data.info.clientID, function(data0) {
                                if(data0.response == "OK") {
                                    res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                                } else {
                                    res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                                }
                            })
                        } else {
                            res.send(flip.tools.res.INVALID_PARAMS);
                        }
                    } else {
                        res.status(auth.statusCode || FL_DEFAULT_STATUS).send(auth);
                    }
                });
            } else {
                let err = flip.tools.res.INVALID_PARAMS;
                res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
            }
        } else {
            let err = flip.tools.res.INSUFFICIANT_PARAMS;
            res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
        }
    })

    app.post("/user/:clientID/block/destroy", (req, res) => {
        let clientID = req.params.clientID;

        if(clientID) {
            if(flip.tools.validate.clientID(clientID)) {
                flip.auth(req, function(auth) {
                    if(auth.response == "OK") {
                        if(clientID != auth.data.info.clientID) {
                            flip.user.block.destroy(clientID, auth.data.info.clientID, function(data0) {
                                if(data0.response == "OK") {
                                    res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                                } else {
                                    res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                                }
                            })
                        } else {
                            res.send(flip.tools.res.INVALID_PARAMS);
                        }
                    } else {
                        res.status(auth.statusCode || FL_DEFAULT_STATUS).send(auth);
                    }
                });
            } else {
                let err = flip.tools.res.INVALID_PARAMS;
                res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
            }
        } else {
            let err = flip.tools.res.INSUFFICIANT_PARAMS;
            res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
        }
    })

    app.post("/user/:clientID/relationship/create", (req, res) => {
        let clientID = req.params.clientID;

        if(clientID) {
            if(flip.tools.validate.clientID(clientID)) {
                flip.auth(req, function(auth) {
                    if(auth.response == "OK") {
                        if(clientID != auth.data.info.clientID) {
                            flip.user.interaction.follow(clientID, auth.data.info.clientID, function(data0) {
                                if(data0.response == "OK") {
                                    res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                                } else {
                                    res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                                }
                            });
                        } else {

                        }
                    } else {
                        res.status(auth.statusCode || FL_DEFAULT_STATUS).send(auth);
                    }
                });
            } else {
                let err = flip.tools.res.INVALID_PARAMS;
                res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
            }
        } else {
            let err = flip.tools.res.INSUFFICIANT_PARAMS;
            res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
        }
    });

    app.post("/user/:clientID/relationship/destroy", (req, res) => {
        let clientID = req.params.clientID;

        if(clientID) {
            if(flip.tools.validate.clientID(clientID)) {
                flip.auth(req, function(auth) {
                    if(auth.response == "OK") {
                        if(clientID != auth.data.info.clientID) {
                            flip.user.interaction.unfollow(clientID, auth.data.info.clientID, function(data0) {
                                if(data0.response == "OK") {
                                    res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                                } else {
                                    res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                                }
                            });
                        } else {
                            res.send(flip.tools.res.INVALID_PARAMS);
                        }
                    } else {
                        res.status(auth.statusCode || FL_DEFAULT_STATUS).send(auth);
                    }
                });
            } else {
                let err = flip.tools.res.INVALID_PARAMS;
                res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
            }
        } else {
            let err = flip.tools.res.INSUFFICIANT_PARAMS;
            res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
        }
    });

// /user/settings/*

    app.post("/user/settings/update", (req, res) => {
        var name = req.body.name;
        var bio = req.body.bio;
        var profileImgUrl = req.body.profileImgUrl;
        var gradient = req.body["gradient[]"];

        flip.auth(req, function(auth) {
            if(auth.response == "OK") {
                let settings = {
                    name: name,
                    bio: bio,
                    profileImgUrl: profileImgUrl,
                    gradient: gradient
                };

                flip.user.settings.update(auth.data.info.clientID, settings, function(data0) {
                    res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                });
            } else {
                res.status(auth.statusCode || FL_DEFAULT_STATUS).send(auth);
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
                flip.auth(req, function(auth) {
                    if(auth.response == "OK") {
                        flip.user.setting.set(auth.data.info.clientID, key, state, type, function(data0) {
                            if(data0.response == "OK") {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            } else {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            }
                        })
                    } else {
                        res.status(auth.statusCode || FL_DEFAULT_STATUS).send(auth);
                    }
                })
            } else {
                let err = flip.tools.res.INVALID_PARAMS;
                res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
            }
        } else {
            let err = flip.tools.res.INSUFFICIANT_PARAMS;
            res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
        }
    })

// /users/*

    app.get("/users/search/:query", (req, res) => {
        let query = req.params.query;

        if(query) {
            if(flip.tools.validate.query(query)) {
                flip.auth(req, function(auth) {
                    if(auth.response == "OK") {
                        if(flip.tools.validate.username(query)) {
                            flip.user.get.multi.search(query, auth.data.info.clientID, function(data0) {
                                if(data0.response == "OK") {
                                    res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                                } else {
                                    res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                                }
                            })
                        } else {
                            res.send(flip.tools.res.NO_DATA)
                        }
                    } else {
                        res.status(auth.statusCode || FL_DEFAULT_STATUS).send(auth);
                    }
                });
            } else {
                let err = flip.tools.res.INVALID_PARAMS;
                res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
            }
        } else {
            let err = flip.tools.res.INSUFFICIANT_PARAMS;
            res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
        }
    });

    app.get("/user/notifications", (req, res) => {
        let index = req.query.index;

        if(index) {
            if(flip.tools.validate.index(index)) {
                flip.auth(req, function(auth) {
                    if(auth.response == "OK") {
                        flip.notification.get(auth.data.info.clientID, index, function(data0) {
                            if(data0.response == "OK") {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0)
                            } else {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0)
                            }
                        })
                    } else {
                        res.status(auth.statusCode || FL_DEFAULT_STATUS).send(auth);
                    }
                });
            } else {
                let err = flip.tools.res.INVALID_PARAMS;
                res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
            }
        } else {
            let err = flip.tools.res.INSUFFICIANT_PARAMS;
            res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
        }
    })

// /post/*

    app.get("/post/:postID", (req, res) => {
        let postID = req.params.postID;

        if(postID) {
            if(flip.tools.validate.postID(postID)) {
                flip.auth(req, function(auth) {
                    if(auth.response == "OK") {
                        flip.post.get(postID, auth.data.info.clientID, function(data0) {
                            if(data0.response == "OK") {
                                data0.data = [data0.data]
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            } else {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            }
                        });
                    } else {
                        res.status(auth.statusCode || FL_DEFAULT_STATUS).send(auth);
                    }
                });
            } else {
                let err = flip.tools.res.INVALID_PARAMS;
                res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
            }
        } else {
            let err = flip.tools.res.INSUFFICIANT_PARAMS;
            res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
        }
    })

    app.post("/post/:postID/bookmark/create", (req, res) => {
        let postID = req.params.postID;

        if(postID) {
            if(flip.tools.validate.postID(postID)) {
                flip.auth(req, function(auth) {
                    if(auth.response == "OK") {
                        flip.user.bookmark.create(postID, auth.data.info.clientID, function(data0) {
                            if(data0.response == "OK") {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            } else {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            }
                        })
                    } else {
                        res.status(auth.statusCode || FL_DEFAULT_STATUS).send(auth);
                    }
                })
            } else {
                let err = flip.tools.res.INVALID_PARAMS;
                res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
            }
        } else {
            let err = flip.tools.res.INSUFFICIANT_PARAMS;
            res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
        }
    });

    app.post("/post/:postID/bookmark/destroy", (req, res) => {
        let postID = req.params.postID;

        if(postID) {
            if(flip.tools.validate.postID(postID)) {
                flip.auth(req, function(auth) {
                    if(auth.response == "OK") {
                        flip.user.bookmark.destroy(postID, auth.data.info.clientID, function(data0) {
                            if(data0.response == "OK") {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            } else {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            }
                        })
                    } else {
                        res.status(auth.statusCode || FL_DEFAULT_STATUS).send(auth);
                    }
                })
            } else {
                let err = flip.tools.res.INVALID_PARAMS;
                res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
            }
        } else {
            let err = flip.tools.res.INSUFFICIANT_PARAMS;
            res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
        }
    });

    app.get("/user/bookmarks", (req, res) => {
        let index = req.query.index;

        if(index) {
            if(flip.tools.validate.index(index)) {
                flip.auth(req, function(auth) {
                    if(auth.response == "OK") {
                        flip.user.get.bookmarks(auth.data.info.clientID, index, function(data0) {
                            if(data0.response == "OK") {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            } else {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            }
                        })
                    } else {
                        res.status(auth.statusCode || FL_DEFAULT_STATUS).send(auth);
                    }
                })
            } else {
                let err = flip.tools.res.INVALID_PARAMS;
                res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
            }
        } else {
            let err = flip.tools.res.INSUFFICIANT_PARAMS;
            res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
        }
    })

    // DEPRECATED

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

    // DEPRECATED

    app.get("/post/thumb/:tID", (req, res) => {
        var tID = req.params.tID;

        fs.readFile(FL_THUMB_PATH + tID + ".png", function(err, data) {
            if(!err) {
                res.send(data);
            }
        });
    })

    app.post("/post/:postID/view", (req, res) => {
        var postID = req.params.postID;

        if(postID) {
            if(flip.tools.validate.postID(postID)) {
                flip.auth(req, function(auth) {
                    if(auth.response == "OK") {
                        flip.post.view(postID, function(data0) {
                            if(data0.response == "OK") {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            } else {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            }
                        });
                    } else {
                        res.status(auth.statusCode || FL_DEFAULT_STATUS).send(auth);
                    }
                });
            } else {
                let err = flip.tools.res.INVALID_PARAMS;
                res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
            }
        } else {
            let err = flip.tools.res.INSUFFICIANT_PARAMS;
            res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
        }
    })

    function cleanup(processingID) {
        fs.unlink("./processing/vid/" + processingID + ".mov", (err) => {});
        fs.unlink("./processing/scr/" + processingID + ".png", (err) => {});
    }

    app.post("/post/upload", (req, res) => {
        if(typeof req.files !== "undefined") {
            let vid = req.files.flipVid;
            let wasUploaded = req.body.uploadedFromCameraRoll;

            // Generate processing ID
            let processingID = flip.tools.gen.randomString(5);

            // Move video to temporary directory
            vid.mv("./processing/vid/" + processingID + ".mov", function(mvErr) {
                if(!mvErr) {
                    // Create screenshots from ffmpeg from temp dir
                    new ffmpeg("./processing/vid/" + processingID + ".mov").screenshots({
                        timestamps: [ 0 ],
                        filename: processingID + ".png",
                        folder: "./processing/scr"
                    });

                    if(vid && wasUploaded) {
                        flip.auth(req, function(auth) {
                            if(auth.response == "OK") {
                                flip.post.create(vid.name, auth.data.info.clientID, wasUploaded, function(data0) {
                                    if(data0.response == "OK") {
                                        fs.readFile("./processing/scr/" + processingID + ".png", function(err1, data1) {
                                            if(!err1) {
                                                let videoExtension = vid.name.split(".")[vid.name.split(".").length - 1];
                
                                                // Setup parameters for S3 PUT request
                                                let vParams = {
                                                    Key: data0.data.postID + "." + videoExtension,
                                                    Bucket: process.env.BUCKETEER_BUCKET_NAME + "/public/videos",
                                                    Body: vid.data
                                                }, sParams = {
                                                    Key: data0.data.postID + ".png",
                                                    Bucket: process.env.BUCKETEER_BUCKET_NAME + "/public/thumbnails",
                                                    Body: data1
                                                };
                                                
                                                // Put screenshot update w/o callback
                                                s3.putObject(sParams);
                                                
                                                // Put video update w/ callback
                                                s3.putObject(vParams, function(err2, data2) {
                                                    // If an error occured
                                                    if(err2) {
                                                        // Create the appropeate error and callback
                                                        let err = flip.tools.res.ERR;
                                                        res.status(err.statusCode).send(err);
                
                                                        cleanup(processingID);
                                                    } else {
                                                        // Callback with response OK
                                                        res.send({
                                                            response: "OK",
                                                            data: {
                                                                postID: data0.data.postID
                                                            },
                                                            statusCode: 200
                                                        });
                
                                                        cleanup(processingID);
                                                    }
                                                });
                                            } else {
                                                let err = flip.tools.res.INSUFFICIANT_PARAMS;
                                                res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
                                            }
                                        })
                                    } else {
                                        res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
        
                                        cleanup(processingID);
                                    }
                                });
                            } else {
                                res.status(auth.statusCode || FL_DEFAULT_STATUS).send(auth);
        
                                cleanup(processingID);
                            }
                        });
                    } else {
                        let err = flip.tools.res.INSUFFICIANT_PARAMS;
                        res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
        
                        cleanup(processingID);
                    }
                } else {
                    // Create the appropeate error and callback
                    let err = flip.tools.res.ERR;
                    res.status(err.statusCode).send({
                        response: err.response,
                        formattedTitle: err.formattedTitle,
                        formattedResponse: err.formattedResponse,
                        data: mvErr,
                        statusCode: err.statusCode
                    });
                }
            });
        } else {
            let err = flip.tools.res.INSUFFICIANT_PARAMS;
            res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
        }
    });

    app.post("/post/:postID/destroy", (req, res) => {
        let postID = req.params.postID;

        if(postID) {
            if(flip.tools.validate.postID(postID)) {
                flip.auth(req, function(auth) {
                    if(auth.response == "OK") {
                        flip.post.destroy(postID, auth.data.info.clientID, function(data0) {
                            if(data0.response == "OK") {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            } else {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            }
                        })
                    } else {
                        res.status(auth.statusCode || FL_DEFAULT_STATUS).send(auth);
                    }
                });
            } else {
                let err = flip.tools.res.INVALID_PARAMS;
                res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
            }
        } else {
            let err = flip.tools.res.INSUFFICIANT_PARAMS;
            res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
        }
    });

// /post/caption/*

    app.post("/post/:postID/caption/update", (req, res) => {
        let postID = req.params.postID;
        let caption = req.body.caption;

        if(postID && caption) {
            if(flip.tools.validate.postID(postID) && flip.tools.validate.caption(caption)) {
                flip.auth(req, function(auth) {
                    if(auth.response == "OK") {
                        flip.post.caption.edit(caption, postID, auth.data.info.clientID, function(data0) {
                            if(data0.response == "OK") {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            } else {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            }
                        });
                    } else {
                        res.status(auth.statusCode || FL_DEFAULT_STATUS).send(auth);
                    }
                });
            } else {
                let err = flip.tools.res.INVALID_PARAMS;
                res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
            }
        } else {
            let err = flip.tools.res.INSUFFICIANT_PARAMS;
            res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
        }
    })

// /posts/hashtag/*

    app.get("/posts/hashtag/:hashtag", (req, res) => {
        let hashtag = req.params.hashtag;
        let index = req.query.index;

        if(hashtag && index) {
            if(hashtag.length > 0 && hashtag.length < 20) {
                flip.auth(req, function(auth) {
                    if(auth.response == "OK") {
                        flip.post.search.hashtag(hashtag, index, auth.data.info.clientID, function(data0) {
                            if(data0.response == "OK") {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            } else {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            }
                        })
                    } else {
                        res.status(auth.statusCode || FL_DEFAULT_STATUS).send(auth);
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

    app.post("/post/:postID/like/create", (req, res) => {
        var postID = req.params.postID;

        if(postID) {
            if(flip.tools.validate.postID(postID)) {
                flip.auth(req, function(auth) {
                    if(auth.response == "OK") {
                        flip.post.interaction.like.create(auth.data.info.clientID, postID, function(data0) {
                            if(data0.response == "OK") {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            } else {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            }
                        });
                    } else {
                        res.status(auth.statusCode || FL_DEFAULT_STATUS).send(auth);
                    }
                });
            } else {
                let err = flip.tools.res.INVALID_PARAMS;
                res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
            }
        } else {
            let err = flip.tools.res.INSUFFICIANT_PARAMS;
            res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
        }
    });

    app.post("/post/:postID/like/destroy", (req, res) => {
        var postID = req.params.postID;

        if(postID) {
            if(flip.tools.validate.postID(postID)) {
                flip.auth(req, function(auth) {
                    if(auth.response == "OK") {
                        flip.post.interaction.like.destroy(auth.data.info.clientID, postID, function(data0) {
                            if(data0.response == "OK") {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            } else {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            }
                        });
                    } else {
                        res.status(auth.statusCode || FL_DEFAULT_STATUS).send(auth);
                    }
                });
            } else {
                let err = flip.tools.res.INVALID_PARAMS;
                res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
            }
        } else {
            let err = flip.tools.res.INSUFFICIANT_PARAMS;
            res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
        }
    });

// /post/likes/get

    app.get("/post/:postID/likes", (req, res) => {
        let postID = req.params.postID;
        let index = req.query.index;

        if(postID) {
            if(flip.tools.validate.postID(postID) && flip.tools.validate.index(index)) {
                flip.auth(req, function(auth) {
                    if(auth.response == "OK") {
                        flip.post.likes.get(postID, index, auth.data.info.clientID, function(data0) {
                            if(data0.response == "OK") {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            } else {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            }
                        });
                    } else {
                        res.status(auth.statusCode || FL_DEFAULT_STATUS).send(auth);
                    }
                });
            } else {
                let err = flip.tools.res.INVALID_PARAMS;
                res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
            }
        } else {
            let err = flip.tools.res.INSUFFICIANT_PARAMS;
            res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
        }
    });

// /post/comments/get

    app.get("/post/:postID/comments", (req, res) => {
        let postID = req.params.postID;
        let index = req.query.index;

        if(postID && index) {
            if(flip.tools.validate.postID(postID) && flip.tools.validate.index(index)) {
                flip.auth(req, function(auth) {
                    if(auth.response == "OK") {
                        flip.post.comments.get(postID, index, auth.data.info.clientID, function(data0) {
                            if(data0.response == "OK") {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            } else {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            }
                        });
                    } else {
                        res.status(auth.statusCode || FL_DEFAULT_STATUS).send(auth);
                    }
                });
            } else {
                let err = flip.tools.res.INVALID_PARAMS;
                res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
            }
        } else {
            let err = flip.tools.res.INSUFFICIANT_PARAMS;
            res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
        }
    });

// /post/comment/create

    app.post("/post/:postID/comment/create", (req, res) => {
        let comment = req.body.comment;
        let postID = req.params.postID;

        if(comment && postID) {
            if(flip.tools.validate.comment(comment) && flip.tools.validate.postID(postID)) {
                flip.auth(req, function(auth) {
                    if(auth.response == "OK") {
                        flip.post.interaction.comment.create(comment, auth.data.info.clientID, postID, function(data0) {
                            if(data0.response == "OK") {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            } else {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            }
                        });
                    } else {
                        res.status(auth.statusCode || FL_DEFAULT_STATUS).send(auth);
                    }
                });
            } else {
                let err = flip.tools.res.INVALID_PARAMS;
                res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
            }
        } else {
            let err = flip.tools.res.INSUFFICIANT_PARAMS;
            res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
        }
    });

// /post/comment/destroy

    app.post("/post/:postID/comment/destroy", (req, res) => {
        var commentID = req.body.commentID;
        var postID = req.params.postID;

        if(commentID && postID) {
            if(flip.tools.validate.commentID(commentID) && flip.tools.validate.postID(postID)) {
                flip.auth(req, function(auth) {
                    if(auth.response == "OK") {
                        flip.post.interaction.comment.destroy(commentID, auth.data.info.clientID, postID, function(data0) {
                            if(data0.response == "OK") {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            } else {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            }
                        });
                    } else {
                        res.status(auth.statusCode || FL_DEFAULT_STATUS).send(auth);
                    }
                });
            } else {
                let err = flip.tools.res.INVALID_PARAMS;
                res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
            }
        } else {
            let err = flip.tools.res.INSUFFICIANT_PARAMS;
            res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
        }
    });

// /posts/*

    app.get("/user/feed", (req, res) => {
        let index = req.query.index;

        if(index) {
            if(flip.tools.validate.index(index)) {
                flip.auth(req, function(auth) {
                    if(auth.response == "OK") {
                        flip.feed.get(auth.data.info.clientID, index, function(data0) {
                            if(data0.response == "OK") {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            } else {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            }
                        });
                    } else {
                        res.status(auth.statusCode || FL_DEFAULT_STATUS).send(auth);
                    }
                });
            } else {
                let err = flip.tools.res.INVALID_PARAMS;
                res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
            }
        } else {
            let err = flip.tools.res.INSUFFICIANT_PARAMS;
            res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
        }
    });

    app.get("/posts/explore", (req, res) => {
        let index = req.query.index;

        if(index) {
            if(flip.tools.validate.index(index)) {
                flip.auth(req, function(auth) {
                    if(auth.response == "OK") {
                        flip.explore.get(auth.data.info.clientID, index, false, function(data0) {

                            if(data0.response == "OK") {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0)
                            } else {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            }
                        });
                    } else {
                        res.status(auth.statusCode || FL_DEFAULT_STATUS).send(auth);
                    }
                });
            } else {
                let err = flip.tools.res.INVALID_PARAMS;
                res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
            }
        } else {
            let err = flip.tools.res.INSUFFICIANT_PARAMS;
            res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
        }
    });

    app.get("/onboarding/posts", (req, res) => {
        flip.onboarding.get(function(data0) {
            data0.meta = {};
            data0.meta.tagline = "A new home for short, looping videos.";
            data0.meta.isTwitterLoginEnabled = true;

            res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
        })
    })

    app.get("/user/:clientID/posts", (req, res) => {
        let clientID = req.params.clientID;
        let index = req.query.index;

        if(clientID && index) {
            if(flip.tools.validate.clientID(clientID) && flip.tools.validate.index(index)) {
                flip.auth(req, function(auth) {
                    if(auth.response == "OK") {
                        flip.user.get.posts(clientID, index, auth.data.info.clientID, function(data0) {
                            if(data0.response == "OK") {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            } else {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            }
                        });
                    } else {
                        res.status(auth.statusCode || FL_DEFAULT_STATUS).send(auth);
                    }
                });
            } else {
                let err = flip.tools.res.INVALID_PARAMS;
                res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
            }
        } else {
            let err = flip.tools.res.INSUFFICIANT_PARAMS;
            res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
        }
    });


// /report/*

    app.post("/report/create", (req, res) => {
        var idToReport = req.body.idToReport;
        var type = req.body.type;
        var reason = req.body.reason;
        var details = req.body.details;

        if(idToReport && type && reason) {
            flip.auth(req, function(auth) {
                if(auth.response == "OK") {
                    flip.report.create(auth.data.info.clientID, idToReport, type, reason, details, function(data0) {
                        if(data0.response == "OK") {
                            res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                        } else {
                            res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                        }
                    });
                } else {
                    res.status(auth.statusCode || FL_DEFAULT_STATUS).send(auth);
                }
            });
        } else {
            let err = flip.tools.res.INSUFFICIANT_PARAMS;
            res.status(err.statusCode || FL_DEFAULT_STATUS).send(err);
        }
    });

    app.get("/report/types/:for", (req, res) => {
        let reportReasons = {
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

        if(typeof reportReasons[req.params.for] !== "undefined") {
            res.send({
                response: "OK",
                data: reportReasons[req.params.for]
            })
        } else {
            res.send({
                response: "OK",
                data: []
            })
        }
    })

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
                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
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

    app.post("/chat/thread/:clientID/create", (req, res) => {
        let clientID = req.params.clientID;

        if(clientID) {
            if(flip.tools.validate.clientID(clientID)) {
                flip.auth(req, function(auth0) {
                    if(auth0.response == "OK") {
                        flip.chat.thread.create(auth0.data.info.clientID, clientID, function(data0) {
                            if(data0.response == "OK") {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0)
                            } else {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
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

    app.post("/chat/thread/:threadID/destroy", (req, res) => {
        let threadID = req.params.threadID;

        if(threadID) {
            if(flip.tools.validate.threadID(threadID)) {
                flip.auth(req, function(auth0) {
                    if(auth0.response == "OK") {
                        flip.chat.user.auth(auth0.data.info.clientID, threadID, function(auth1) {
                            if(auth1.response == "OK") {
                                flip.chat.thread.destroy(threadID, function(data0) {
                                    if(data0.response == "OK") {
                                        res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0)
                                    } else {
                                        res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
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

    app.post("/chat/thread/:threadID/message/create", (req, res) => {
        let threadID = req.params.threadID;
        let message = req.body.message;

        if(message && threadID) {
            if(flip.tools.validate.message(message) && flip.tools.validate.threadID(threadID)) {
                flip.auth(req, function(auth0) {
                    if(auth0.response == "OK") {
                        flip.chat.user.auth(auth0.data.info.clientID, threadID, function(auth1) {
                            if(auth1.response == "OK") {
                                flip.chat.thread.message.send(message, threadID, auth0.data.info.clientID, function(data0) {
                                    if(data0.response == "OK") {
                                        res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0)
                                    } else {
                                        res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
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

    app.post("/chat/thread/:threadID/message/destroy", (req, res) => {
        let threadID = req.params.threadID;
        let messageID = req.body.messageID;

        if(messageID && threadID) {
            if(flip.tools.validate.messageID(messageID) && flip.tools.validate.threadID(threadID)) {
                flip.auth(req, function(auth0) {
                    if(auth0.response == "OK") {
                        flip.chat.user.auth(auth0.data.info.clientID, threadID, function(auth1) {
                            if(auth1.response == "OK") {
                                flip.chat.thread.message.destroy(messageID, threadID, auth0.data.info.clientID, function(data0) {
                                    if(data0.response == "OK") {
                                        res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0)
                                    } else {
                                        res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
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
                flip.auth(req, function(auth0) {
                    if(auth0.response == "OK") {
                        flip.chat.user.auth(auth0.data.info.clientID, threadID, function(auth1) {
                            if(auth1.response == "OK") {
                                flip.chat.thread.get(threadID, auth0.data.info.clientID, function(data0) {
                                    if(data0.response == "OK") {
                                        res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0)
                                    } else {
                                        res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
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
                flip.auth(req, function(auth) {
                    if(auth.response == "OK") {
                        flip.chat.user.threads.get(auth.data.info.clientID, index, function(data0) {
                            if(data0.response == "OK") {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0)
                            } else {
                                res.status(data0.statusCode || FL_DEFAULT_STATUS).send(data0);
                            }
                        })
                    } else {
                        res.status(auth.statusCode || FL_DEFAULT_STATUS).send(auth);
                    }
                });
            } else {
                res.send(flip.tools.res.INVALID_PARAMS);
            }
        } else {
            res.send(flip.tools.res.INSUFFICIANT_PARAMS);
        }
    });

    return app;
}