module.exports = function(io, s3) {
    // PROHIBITED USERNAMES
    let prohibitedUsers = [
        "7Gqertfaqdgo1wN", //BabyMarina
        "8cUybaUC0ZBPLv5" //william
    ];

    let hasChatCapabilities = [
        "8cUybaUC0ZBPLv5", // william
        "gcVKSxFv2hk3o8V", // flip
        "VieF7g6dswfsaqs", // carolyn
        "u4kQmp6hBtIWhX7", // elias
        "xYxWE8vp2ERcUKc", // dmfj
        "MsPNil6Maw94weu", // finn
        "ntdDYf2Xd1nPYf5", // colt
        "pLr17XERVYrmUoL", // l
        "GEcohc2jzFq9Xs5", // reed
        "nO8SeseASez3zpn", // noah
        "ZayZNBxo26bQRPI", // 3raxton
        "GRsVOxSLadGeUgX" // amrith
    ];

    // TIMED OUT USERS
    let timedOutUsers = [];

    // JSON WEB TOKEN
    let jwt = require("jsonwebtoken");

    // FS
    let fs = require("fs");

    // DATABASE CONFIG
    let dbConfig = require("../config/config.json");

    // MONGO JS
    let mongojs = require("mongojs")
    let db = mongojs(process.env.MONGODB_URI, [ "users", "posts", "chat", "reservations", "featured", "reports", "hashtags", "bookmarks", "notifications" ])

    // BCRYPT
    let bcrypt = require("bcryptjs");
    let md5 = require("md5");

    // RANDOM POSSIBLE CHARACTERS
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let FL_LIVE_TYPING_ENC = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    // FFMPEG
    let ffmpegInstaller = require("@ffmpeg-installer/ffmpeg");
    let ffmpeg = require("fluent-ffmpeg");

    ffmpeg.setFfmpegPath(ffmpegInstaller.path);

    // MOMENT
    let moment = require("moment");

    // SHORT NUMBER
    let shortNumber = require("short-number");

    // SENDGRID
    let sgMail = require("@sendgrid/mail");
    sgMail.setApiKey(process.env.SG_KEY);

    // TWIT
    let Twit = require("twit");

    // GRADIENTS
    let gradients = [
        [
            "#FF4B2B",
            "#FF416C"
        ],
        [
            "#F76B1C",
            "#FAD961"
        ],
        [
            "#00A505",
            "#BDEC51"
        ],
        [
            "#0085FF",
            "#00C1FF"
        ],
        [
            "#BA00FE",
            "#F900D4"
        ],
        [
            "#232526",
            "#414345"
        ]
    ]

    // APPLE PUSH NOTIFICATION SERVICE
    let apn = require("apn");

    let productionAPN = {
        token: dbConfig.apns,
        production: true
    };

    let developmentAPN = {
        token: dbConfig.apns,
        production: false
    };

    let productionAPNSProvider = new apn.Provider(productionAPN);
    let developmentAPNSProvider = new apn.Provider(developmentAPN);

    // CLEAN ARRAY EXTENSION
    Array.prototype.clean = function(deleteValue) {
        for(let i = 0; i < this.length; i++) {
            if(this[i] == deleteValue) {
                this.splice(i, 1);
                i--;
            }
        }

        return this;
    };

    //
    let FL_SCREENSHOTS_ENABLED = false;

    const flip = {
        auth: (req, callback) => {
            let token = req.headers["authorization"];

            if(token) {
                jwt.verify(token, process.env.JWT, (err0, decoded) => {
                    if(!err0) {
                        let clientID = decoded.clientID;
                        let sessionID = decoded.sessionID;

                        db.users.find({
                            $and: [
                                {
                                    "info.clientID": clientID
                                },
                                {
                                    "security.sessionID": sessionID
                                }
                            ],
                        }, (err0, docs0) => {
                            if(!err0) {
                                if(docs0.length > 0) {
                                    flip.user.get.safe.clientID(clientID, clientID, (data0) => {
                                        if(data0.response == "OK") {
                                            if(typeof req.body.isInitialAuthRequest !== "undefined") {
                                                if(req.body.isInitialAuthRequest == true) {
                                                    db.users.update({
                                                        "info.clientID": clientID
                                                    }, {
                                                        $set: {
                                                            "session.UUID": req.body.UUID,
                                                            "session.lastUsedVersion": req.body.version,
                                                            "session.lastOpenedAppAt": Date.now(),
                                                            "session.isLoggedIn": true
                                                        }
                                                    });
                                                }
                                            }

                                            let privileges = {
                                                isChatEnabled: (hasChatCapabilities.includes(clientID)),
                                                canUploadVideos: true,
                                                doesRequireWatermarkOnExport: !(data0.data.info.username == "william"),
                                                timeLimit: 7.5,
                                                server: {
                                                    BASE_URL: "https://nuyr.io",
                                                    BASE_API_URL: "https://api.flip.wtf/v4/",
                                                    BASE_SOCKET_URL: "https://api.flip.wtf/"
                                                }
                                            }

                                            console.log(`${data0.data.info.username.toLowerCase()} just made a request`)

                                            callback({
                                                response: "OK",
                                                data: data0.data,
                                                privileges: privileges,
                                                statusCode: 200
                                            })
                                        } else {
                                            callback(flip.tools.res.SUCCESS);
                                        }
                                    });
                                } else {
                                    callback(flip.tools.res.NO_AUTH)
                                }
                            } else {
                                callback(flip.tools.res.ERR);
                            }
                        });
                    } else {
                        callback({
                            response: "TOKEN_NOT_VALID",
                            statusCode: 401
                        });
                    }
                });
            } else {
                callback({
                    response: "NO_TOKEN_PROVIDED",
                    statusCode: 401
                });
            }
        },
        admin: {
            auth: (body, callback) => {
                flip.auth(body, (auth) => {
                    if(auth.response == "OK") {
                        db.admins.find({
                            "info.clientID": body.clientID
                        }, (err0, docs0) => {
                            if(!err0) {
                                if(docs0.length > 0) {
                                    callback(flip.tools.res.SUCCESS)
                                } else {
                                    callback(flip.tools.res.NO_AUTH)
                                }
                            } else {
                                callback(flip.tools.res.NO_AUTH)
                            }
                        })
                    } else {
                        callback(auth)
                    }
                })
            },
            users: {
                get: (clientID, callback) => {
                    db.users.find({}).limit(10).sort({
                        "info.joinedAt": -1
                    }, (err0, docs0) => {
                        if(!err0) {
                            if(docs0.length > 0) {
                                let clientIDs = [];

                                for(i = 0; i < docs0.length; i++) {
                                    clientIDs.splice(i, 0, docs0[i].info.clientID)

                                    if(i == docs0.length - 1) {
                                        flip.user.get.multi.minified(clientIDs, 0, clientID, (data0) => {
                                            callback(data0)
                                        })
                                    }
                                }
                            } else {
                                callback(flip.tools.res.NO_ITEMS);
                            }
                        } else {
                            callback(flip.tools.res.ERR);
                        }
                    })
                }
            },
            posts: {
                get: {
                    latest: (clientID, callback) => {
                        db.posts.find({
                            "info.postedBy": {
                                $nin: prohibitedUsers
                            }
                        }).sort({
                            "info.postedAt": -1
                        }).limit(10, (err0, docs0) => {
                            if(!err0) {
                                if(docs0.length > 0) {
                                    flip.post.multi.handle(docs0, clientID, (data0) => {
                                        if(data0.response == "OK") {
                                            callback(data0);
                                        } else {
                                            callback({
                                                response: "OK",
                                                data: [],
                                                statusCode: 200
                                            })
                                        }
                                    })
                                } else {
                                    callback({
                                        response: "OK",
                                        data: [],
                                        statusCode: 200
                                    })
                                }
                            } else {
                                callback(flip.tools.res.ERR)
                            }
                        })
                    },
                    popular: (clientID, callback) => {
                        db.posts.find({
                            $and: [
                                {
                                    "info.postedAt": {
                                        $gt: Date.now() - 86400000
                                    }
                                },
                                {
                                    "info.postedBy": {
                                        $nin: prohibitedUsers
                                    }
                                },
                                {
                                    "info.meta.wasFeatured": false
                                }
                            ]
                        }).sort({
                            "data.stats.raw.views": -1
                        }).limit(10, (err0, docs0) => {
                            if(!err0) {
                                if(docs0.length > 0) {
                                    flip.post.multi.handle(docs0, clientID, (data0) => {
                                        if(data0.response == "OK") {
                                            callback(data0);
                                        } else {
                                            callback(flip.tools.res.NO_DATA);
                                        }
                                    })
                                } else {
                                    callback(flip.tools.res.NO_DATA);
                                }
                            } else {
                                callback(flip.tools.res.ERR);
                            }
                        })
                    }
                }
            }
        },
        onboarding: {
            get: (callback) => {
                flip.explore.latestID((feedID) => {
                    db.explore.find({
                        "info.feedID": feedID
                    }).limit(1, (err0, docs0) => {
                        if(!err0) {
                            if(docs0.length > 0) {
                                let exploreLimit = 10
                                let exploreData = docs0[0].data

                                exploreData = exploreData.slice(0, 10)

                                if(exploreData.length > 0) {
                                    let posts = []
                                    let processed = exploreData.length

                                    exploreData.forEach((doc, i) => {
                                        if(doc.info.meta.type == "post") {
                                            flip.post.get(doc.info.postID, "", (data0) => {
                                                if(data0.response == "OK") {
                                                    posts.push(data0.data)
                                                }

                                                processed--;
                                                if(processed == 0) {
                                                    callback({
                                                        response: "OK",
                                                        data: posts,
                                                        statusCode: 200
                                                    })
                                                }
                                            })
                                        } else {
                                            processed--;
                                            if(processed == 0) {
                                                callback({
                                                    response: "OK",
                                                    data: posts,
                                                    statusCode: 200
                                                })
                                            }
                                        }
                                    })
                                } else {
                                    callback(flip.tools.res.NO_DATA);
                                }
                            } else {
                                callback(flip.tools.res.NO_DATA);
                            }
                        } else {
                            callback(flip.tools.res.ERR);
                        }
                    })
                })
            }
        },
        explore: {
            latestID: (callback) => {
                if(FL_SCREENSHOTS_ENABLED) {
                    callback("testt");
                } else {
                    db.explore.find({}).sort({
                        "info.feedCreatedAt": -1
                    }).limit(1, (err0, docs0) => {
                        if(!err0) {
                            if(docs0.length > 0) {
                                callback(docs0[0].info.feedID);
                            } else {
                                callback("");
                            }
                        } else {
                            callback("");
                        }
                    });
                }
            },
            create: {
                feed: (callback) => {
                    db.explore.insert({
                        info: {
                            feedID: flip.tools.gen.randomString(5),
                            feedCreatedAt: Date.now()
                        },
                        data: [
                            {
                                info: {
                                    meta: {
                                        type: "trending"
                                    }
                                }
                            },
                            {
                                info: {
                                    cardID: flip.tools.gen.cardID(),
                                    cardCreatedAt: Date.now(),
                                    meta: {
                                        type: "splitter"
                                    }
                                }
                            }
                        ]
                    }, (err0, docs0) => {
                        if(!err0) {
                            callback(flip.tools.res.SUCCESS)
                        } else {
                            callback(flip.tools.res.ERR)
                        }
                    });
                },
                post: (postID, callback) => {
                    flip.explore.latestID((feedID) => {
                        db.explore.update({
                            "info.feedID": feedID
                        }, {
                            $push: {
                                data: {
                                    info: {
                                        cardID: flip.tools.gen.splitterID(),
                                        cardCreatedAt: Date.now(),
                                        meta: {
                                            type: "post"
                                        },
                                        postID: postID
                                    }
                                }
                            }
                        }, (err0, docs0) => {
                            if(!err0) {
                                db.posts.find({
                                    "info.postID": postID
                                }, (err1, docs1) => {
                                    if(!err1) {
                                        if(docs1.length > 0) {
                                            flip.notification.send({
                                                forClientID: docs1[0].info.postedBy,
                                                body: "✨ We just added your post to Explore for all of flip to see, check it out!",
                                                forPostID: postID
                                            })
                                        }
                                    }
                                })

                                db.posts.update({
                                    "info.postID": postID
                                }, {
                                    $set: {
                                        "info.meta.wasFeatured": true,
                                        "info.meta.featuredAt": Date.now()
                                    }
                                })

                                callback(flip.tools.res.SUCCESS)
                            } else {
                                callback(flip.tools.res.ERR)
                            }
                        })
                    })
                },
                info: (title, body, gradient, callback) => {
                    flip.explore.latestID((feedID) => {
                        db.explore.update({
                            "info.feedID": feedID
                        }, {
                            $push: {
                                "data": {
                                    info: {
                                        cardID: flip.tools.gen.cardID(5),
                                        cardCreatedAt: Date.now(),
                                        meta: {
                                            type: "card"
                                        }
                                    },
                                    data: {
                                        title: title,
                                        date: moment().format("Do MMMM"),
                                        desc: body,
                                        gradient: gradient
                                    }
                                }
                            }
                        }, (err0, docs0) => {
                            if(!err0) {
                                callback(flip.tools.res.SUCCESS)
                            } else {
                                callback(flip.tools.res.ERR)
                            }
                        })
                    })
                },
                user: (username, callback) => {
                    db.users.find({
                        "info.username": username
                    }, (err0, docs0) => {
                        if(!err0) {
                            if(docs0.length > 0) {
                                flip.explore.latestID((feedID) => {
                                    flip.notification.send({
                                        forClientID: docs0[0].info.clientID,
                                        body: "✨ We just added you to Explore for all of flip to see, check it out!"
                                    })

                                    db.explore.update({
                                        "info.feedID": feedID
                                    }, {
                                        $push: {
                                            "data": {
                                                info: {
                                                    cardID: flip.tools.gen.cardID(),
                                                    cardCreatedAt: Date.now(),
                                                    meta: {
                                                        type: "user"
                                                    },
                                                    clientID: docs0[0].info.clientID
                                                }
                                            }
                                        }
                                    }, (err1, docs1) => {
                                        if(!err1) {
                                            callback(flip.tools.res.SUCCESS)
                                        } else {
                                            callback(flip.tools.res.ERR)
                                        }
                                    })
                                })
                            } else {
                                callback(flip.tools.res.NO_ITEMS);
                            }
                        } else {
                            callback(flip.tools.res.ERR)
                        }
                    })
                },
                splitter: (callback) => {
                    flip.explore.latestID((feedID) => {
                        db.explore.update({
                            "info.feedID": feedID
                        }, {
                            $push: {
                                "data": {
                                    info: {
                                        cardID: flip.tools.gen.splitterID(),
                                        cardCreatedAt: Date.now(),
                                        meta: {
                                            type: "splitter"
                                        }
                                    }
                                }
                            }
                        }, (err0, docs0) => {
                            if(!err0) {
                                callback(flip.tools.res.SUCCESS)
                            } else {
                                callback(flip.tools.res.ERR)
                            }
                        })
                    })
                }
            },
            delete: (cardID, callback) => {
                flip.explore.latestID((feedID) => {
                    db.explore.find({
                        "info.feedID": feedID
                    }, (err0, docs0) => {
                        if(!err0) {
                            if(docs0.length > 0) {
                                let cards = docs0[0].data;

                                for(i = 0; i < cards.length; i++) {
                                    if(cards[i].info.cardID == cardID) {
                                        if(cards[i].info.meta.type == "post") {
                                            db.posts.update({
                                                "info.postID": cards[i].info.postID
                                            }, {
                                                $set: {
                                                    "info.meta.wasFeatured": false,
                                                    "info.meta.featuredAt": 0
                                                }
                                            })
                                        }

                                        break;
                                    }
                                }
                            }
                        }

                        db.explore.update({
                            "info.feedID": feedID
                        }, {
                            $pull: {
                                "data": {
                                    "info.cardID": cardID
                                }
                            }
                        }, (err1, docs1) => {
                            if(!err1) {
                                callback(flip.tools.res.SUCCESS)
                            } else {
                                callback(flip.tools.res.ERR)
                            }
                        })
                    })
                })
            },
            rearrange: (cardID, newIndex, callback) => {
                flip.explore.latestID((feedID) => {
                    let query = {
                        "info.feedID": feedID
                    }

                    db.explore.find(query, (err0, docs0) => {
                        if(!err0) {
                            let oldElem = null
                            let data = docs0[0].data;

                            for(i = 0; i < data.length; i++) {
                                if(data[i].info.cardID == cardID) {
                                    oldElem = data[i]

                                    db.explore.update(query, {
                                        $pull: {
                                            "data": oldElem
                                        }
                                    }, (err1, data1) => {
                                        if(!err1) {
                                            db.explore.update(query, {
                                                $push: {
                                                    "data": {
                                                        $each: [
                                                            oldElem
                                                        ],
                                                        $position: parseInt(newIndex)
                                                    }
                                                }
                                            }, (err2, data2) => {
                                                if(!err2) {
                                                    callback(flip.tools.res.SUCCESS)
                                                } else {
                                                    callback(flip.tools.res.ERR)
                                                }
                                            });
                                        } else {
                                            callback(flip.tools.res.ERR)
                                        }
                                    });

                                    break
                                }
                            }

                        } else {
                            callback(flip.tools.res.ERR)
                        }
                    })
                })
            },
            compile: {
                manual: (data, clientID, hasGotMoreItems, callback) => {
                    let processed = data.length;

                    let meta = {
                        hasGotMoreItems: hasGotMoreItems
                    }

                    data.forEach((doc, i) => {
                        if(doc != null) {
                            if(doc.info.meta.type == "post") {
                                flip.post.get(doc.info.postID, clientID, (data0) => {
                                    if(data0.response == "OK") {
                                        data0.data.info.cardID = doc.info.cardID
                                        data0.data.info.cardCreatedAt = doc.info.cardCreatedAt

                                        data[i] = data0.data

                                        processed--;
                                    } else {
                                        data[i] = null

                                        processed--;
                                    }

                                    if(processed == 0) {
                                        callback({
                                            response: "OK",
                                            data: data.clean(null),
                                            meta: meta,
                                            statusCode: 200
                                        })
                                    }
                                })
                            } else if(doc.info.meta.type == "user") {
                                flip.user.get.safe.clientID(doc.info.clientID, clientID, (data0) => {
                                    if(data0.response == "OK") {
                                        processed--;
                                        data0.data.info.cardID = doc.info.cardID
                                        data0.data.info.cardCreatedAt = doc.info.cardCreatedAt

                                        data[i] = data0.data
                                    } else {
                                        data[i] = null

                                        processed--;
                                    }

                                    if(processed == 0) {
                                        callback({
                                            response: "OK",
                                            data: data.clean(null),
                                            meta: meta,
                                            statusCode: 200
                                        })
                                    }
                                })
                            } else if(doc.info.meta.type == "trending") {
                                flip.hashtag.get((data0) => {
                                    if(data0.response == "OK") {
                                        if(data0.data.length > 0) {
                                            processed--;

                                            data[i].data = {
                                                title: "Trending",
                                                date: "",
                                                hashtags: [],
                                                gradient: [
                                                    "#BA00FE",
                                                    "#F900D4"
                                                ]
                                            }

                                            data[i].data.hashtags = data0.data
                                        } else {
                                            data[i] = null
                                            data[i + 1] = null

                                            processed--;
                                        }
                                    } else {
                                        data[i] = null

                                        processed--;
                                    }

                                    if(processed == 0) {
                                        callback({
                                            response: "OK",
                                            data: data.clean(null),
                                            meta: meta,
                                            statusCode: 200
                                        })
                                    }
                                })
                            } else if(doc.info.meta.type == "card") {
                                processed--;

                                data[i].data.gradient = data[i].data.colors;
                                delete data[i].data.colors;

                                if(processed == 0) {
                                    callback({
                                        response: "OK",
                                        data: data.clean(null),
                                        meta: meta,
                                        statusCode: 200
                                    })
                                }
                            } else {
                                processed--;

                                if(processed == 0) {
                                    callback({
                                        response: "OK",
                                        data: data.clean(null),
                                        meta: meta,
                                        statusCode: 200
                                    })
                                }
                            }
                        } else {
                            processed--;

                            if(processed == 0) {
                                callback({
                                    response: "OK",
                                    data: data.clean(null),
                                    meta: meta,
                                    statusCode: 200
                                })
                            }
                        }
                    })
                },
                auto: (clientID, index, callback) => {
                    let exploreData = []

                    if(index == 0) {
                        exploreData.push()
                    }



                    db.posts.find({
                        $and: [
                            {
                                "info.postedAt": {
                                    $gt: Date.now() - (86400000 * 2)
                                }
                            },
                            {
                                "info.postedBy": {
                                    $nin: prohibitedUsers
                                }
                            }
                        ]
                    }).sort({
                        "data.stats.raw.views": -1
                    }).limit(10, (err0, docs0) => {
                        if(!err0) {
                            if(docs0.length > 0) {
                                flip.post.multi.handle(docs0, clientID, (data0) => {
                                    if(data0.response == "OK") {
                                        if(index == 0) {
                                            data0.data.splice(0, 0, {
                                                "info": {
                                                    "cardID" : "xxxxx",
                                                    "cardCreatedAt" : 0,
                                                    "meta": {
                                                        "type" : "header"
                                                    }
                                                },
                                                "data": {
                                                    "content": "Popular Posts"
                                                }
                                            })

                                            data0.data.splice(0, 0, {
                                                "info": {
                                                    "cardID" : "xxxxx",
                                                    "cardCreatedAt" : 0,
                                                    "meta": {
                                                        "type" : "splitter"
                                                    }
                                                }
                                            })
                                        }

                                        data0.meta = {
                                            hasGotMoreItems: false
                                        }

                                        flip.hashtag.get((data1) => {
                                            if(data1.response == "OK") {
                                                if(data1.data.length > 0) {
                                                    data0.data.splice(0, 0, {
                                                        info: {
                                                            "cardID" : "xxxxx",
                                                            "cardCreatedAt" : 0,
                                                            "meta": {
                                                                "type" : "trending"
                                                            }
                                                        },
                                                        data:  {
                                                            title: "Trending",
                                                            date: "",
                                                            hashtags: [],
                                                            gradient: [
                                                                "#BA00FE",
                                                                "#F900D4"
                                                            ]
                                                        }
                                                    })

                                                    data0.data[0].data.hashtags = data1.data

                                                    callback(data0);
                                                } else {
                                                    callback(data0);
                                                }
                                            } else {
                                                callback(data0);
                                            }
                                        })
                                    } else {
                                        callback(flip.tools.res.NO_DATA)
                                    }
                                })
                            } else {
                                callback(flip.tools.res.NO_DATA)
                            }
                        } else {
                            callback(flip.tools.res.ERR)
                        }
                    })
                }
            },
            get: (clientID, index, inf, callback) => {
                flip.explore.latestID((feedID) => {
                    db.explore.find({
                        "info.feedID": feedID
                    }).limit(1, (err0, docs0) => {
                        if(!err0) {
                            if(docs0.length > 0) {
                                // if(true) {
                                if(docs0[0].info.feedCreatedAt > (Date.now() - (86400000 * 7)) || FL_SCREENSHOTS_ENABLED) {
                                    let exploreLimit = 10
                                    let exploreData = docs0[0].data

                                    if(!inf) {
                                        exploreData = exploreData.slice(parseInt(index), parseInt(index) + 10)
                                    }

                                    if(exploreData.length > 0) {
                                        flip.explore.compile.manual(exploreData, clientID, !(exploreData.length < 10), (data0) => {
                                            if(data0.response == "OK") {
                                                callback(data0)
                                            } else {
                                                callback(data0)
                                            }
                                        });
                                    } else {
                                        callback(flip.tools.res.NO_DATA);
                                    }
                                } else {
                                    flip.explore.compile.auto(clientID, index, (data0) => {
                                        if(data0.response == "OK") {
                                            callback(data0)
                                        } else {
                                            callback(data0)
                                        }
                                    });
                                }
                            } else {
                                callback(flip.tools.res.NO_DATA);
                            }
                        } else {
                            callback(flip.tools.res.ERR);
                        }
                    })
                })
            }
        },
        user: {
            token: {
                generate: (clientID, sessionID) => {
                    let token = jwt.sign({
                        clientID: clientID,
                        sessionID: sessionID
                    }, process.env.JWT);

                    return token
                },
                switchover: (clientID, sessionID, callback) => {
                    db.users.find({
                        $and: [
                            {
                                "info.clientID": clientID
                            },
                            {
                                "security.sessionID": sessionID
                            },
                            {
                                "security.isUsingJWTAuth": false
                            }
                        ]
                    }, (err0, data0) => {
                        if(!err0) {
                            if(data0.length > 0) {
                                let token = flip.user.token.generate(clientID, sessionID);

                                db.users.update({
                                    "info.clientID": clientID
                                }, {
                                    $set: {
                                        "security.isUsingJWTAuth": true
                                    }
                                });

                                callback({
                                    response: "OK",
                                    data: {
                                        clientID: clientID,
                                        token: token
                                    },
                                    statusCode: 200
                                });
                            } else {
                                callback(flip.tools.res.NO_AUTH);
                            }
                        } else {
                            callback(flip.tools.res.ERR);
                        }
                    });
                }
            },
            logout: (clientID, callback) => {
                flip.user.get.raw(clientID, (data0) => {
                    if(data0.response == "OK") {
                        db.users.update({
                            "info.clientID": clientID
                        }, {
                            $set: {
                                "session.isLoggedIn": false,
                                "session.lastLoggedInAt": Date.now()
                            },
                            $unset: {
                                "info.deviceToken": ""
                            }
                        }, (err0, docs0) => {
                            if(!err0) {
                                callback(flip.tools.res.SUCCESS)
                            } else {
                                callback(flip.tools.res.ERR);
                            }
                        })
                    } else {
                        callback(flip.tools.res.ERR);
                    }
                })
            },
            service: {
                get: {
                    contacts: (clientID, emailAddresses, callback) => {
                        db.users.find({
                            "security.email": {
                                $in: emailAddresses
                            }
                        }, (err0, docs0) => {
                            if(!err0) {
                                if(docs0.length > 0) {
                                    let clientIDs = [];
                                    let processed = docs0.length;

                                    for(i = 0; i < docs0.length; i++) {
                                        if(typeof docs0[i].settings.discovery !== "undefined") {
                                            if(docs0[i].settings.discovery.letFriendsFindMe) {
                                                clientIDs.push(docs0[i].info.clientID);
                                            }
                                        } else {
                                            clientIDs.push(docs0[i].info.clientID);
                                        }

                                        processed--;
                                        if(processed == 0) {
                                            flip.user.get.multi.minified(clientIDs, 0, clientID, (data0) => {
                                                callback(data0)
                                            })
                                        }
                                    }
                                } else {
                                    callback(flip.tools.res.NO_DATA);
                                }
                            } else {
                                callback(flip.tools.res.ERR);
                            }
                        })
                    },
                    twitter: (clientID, callback) => {
                        flip.user.get.raw(clientID, (data0) => {
                            if(data0.response == "OK") {
                                let data = data0.data;

                                let connectedServices = data.services.connected;

                                if(connectedServices.includes("twitter")) {
                                    let credentials = data.services["twitter"];

                                    let T = new Twit({
                                        consumer_key: dbConfig.twitter.consumer_key,
                                        consumer_secret: dbConfig.twitter.consumer_secret,
                                        access_token: credentials.accessToken,
                                        access_token_secret: credentials.accessTokenSecret
                                    })

                                    T.get("account/verify_credentials", (err1, data1, res1) => {
                                        if(!err1) {
                                            if(data1.friends_count > 0) {
                                                let userID = data1.id;

                                                T.get("friends/ids", { user_id: userID }, (err2, data2, res2) => {
                                                    if(!err2) {
                                                        let following = data2.ids;

                                                        db.users.find({
                                                            "services.twitter.userID": {
                                                                $in: following
                                                            }
                                                        }, (err3, docs3) => {
                                                            if(!err3) {
                                                                flip.user.get.multi.raw(docs3, clientID, (data4) => {
                                                                    callback(data4);
                                                                })
                                                            } else {
                                                                callback(flip.tools.res.NO_DATA);
                                                            }
                                                        })
                                                    } else {
                                                        callback(flip.tools.res.NO_DATA);
                                                    }
                                                })
                                            } else {
                                                callback(flip.tools.res.NO_DATA);
                                            }
                                        } else {
                                            callback(flip.tools.res.NO_DATA);
                                        }
                                    })
                                } else {
                                    callback(flip.tools.res.NO_DATA);
                                }
                            } else {
                                callback(data0);
                            }
                        })
                    }
                },
                connect: (clientID, data, callback) => {
                    let name = data.name;
                    let token = data.tokens.token;
                    let secret = data.tokens.secret;

                    let id = name.toLowerCase();

                    if(id == "twitter") {
                        db.users.find({
                            "services.twitter.accessToken": token
                        }, (err0, docs0) => {
                            if(!err0) {
                                if(docs0.count == 0) {
                                    let T = new Twit({
                                        consumer_key: dbConfig.twitter.consumer_key,
                                        consumer_secret: dbConfig.twitter.consumer_secret,
                                        access_token: token,
                                        access_token_secret: secret
                                    })

                                    T.get("account/verify_credentials", (err0, data0, res0) => {
                                        if(!err0) {
                                            let userID = data0.id_str;

                                            db.users.update({
                                                "info.clientID": clientID
                                            }, {
                                                $set: {
                                                    "services.twitter": {
                                                        userID: userID,
                                                        accessToken: token,
                                                        accessTokenSecret: secret
                                                    }
                                                },
                                                $addToSet: {
                                                    "services.connected": id
                                                }
                                            }, (err1, docs1) => {
                                                if(!err1) {
                                                    callback(flip.tools.res.SUCCESS);
                                                } else {
                                                    callback(flip.tools.res.ERR);
                                                }
                                            })
                                        } else {
                                            callback(flip.tools.res.ERR);
                                        }
                                    })
                                } else {
                                    callback(flip.tools.res.TWITTER_ACCOUNT_ALREADY_LINKED);
                                }
                            } else {
                                callback(flip.tools.res.ERR);
                            }
                        })

                    } else {
                        callback(flip.tools.res.SERVICE_UNKNOWN)
                    }
                },
                disconnect: (clientID, data, callback) => {
                    let name = data.name;

                    let id = name.toLowerCase();

                    db.users.update({
                        "info.clientID": clientID
                    }, {
                        $unset: {
                            "services.twitter": ""
                        },
                        $pull: {
                            "services.connected": id
                        }
                    }, (err0, docs0) => {
                        if(!err0) {
                            callback(flip.tools.res.SUCCESS);
                        } else {
                            callback(flip.tools.res.ERR);
                        }
                    })
                }
            },
            settings: {
                get: (clientID, callback) => {
                    // You're probably never gonna uncomment this but I'm making it ES6 anyways.
                    // flip.user.get.raw(clientID, (data0) => {
                    //     if(data0.response == "OK") {

                    //     } else {}
                    // })
                    db.users.find({
                        "info.clientID": clientID
                    }, (err0, docs0) => {
                        if(!err0) {
                            if(docs0.length > 0) {
                                let currentGradient = docs0[0].profile.gradient;
                                let availableGradients = gradients;
                                let selectedGradientIndex = flip.tools.indexGradient(availableGradients, currentGradient)

                                if(typeof selectedGradientIndex === "undefined") {
                                    // availableGradients.splice(0, 0, docs0[0].profile.gradient)
                                    selectedGradientIndex = 0
                                }

                                callback({
                                    response: "OK",
                                    data: {
                                        name: docs0[0].profile.name,
                                        bio: docs0[0].profile.bio,
                                        gradients: {
                                            type: "gradient",
                                            selectedIndex: selectedGradientIndex,
                                            gradients: availableGradients
                                        },
                                        connectedServices: docs0[0].services.connected,
                                        settings: docs0[0].settings
                                    },
                                    statusCode: 200
                                });
                            } else {
                                callback(flip.tools.res.NO_ITEMS);
                            }
                        } else {
                            callback(flip.tools.res.ERR);
                        }
                    })
                },
                update: (clientID, settings, callback) => {
                    let masterSettings = {};
                    let hasUpdated = false;

                    if(typeof settings.name !== "undefined") {
                        if(flip.tools.validate.name(settings.name)) {
                            masterSettings["profile.name"] = settings.name;
                            hasUpdated = true
                        }
                    }

                    if(typeof settings.bio !== "undefined") {
                        if(flip.tools.validate.bio(settings.bio)) {
                            masterSettings["profile.bio"] = settings.bio;
                            hasUpdated = true
                        }
                    }

                    if(typeof settings.profileImgUrl !== "undefined" && settings.profileImgUrl.trim() !== "") {
                        masterSettings["profile.profileImg"] = settings.profileImgUrl;
                        hasUpdated = true
                    }

                    if(typeof settings.gradient !== "undefined") {
                        masterSettings["profile.gradient"] = settings.gradient;
                        hasUpdated = true
                    }

                    if(hasUpdated) {
                        db.users.update({
                            "info.clientID": clientID
                        }, {
                            $set: masterSettings
                        }, (err0, docs0) => {
                            if(!err0) {
                                callback(flip.tools.res.SUCCESS)
                            } else {
                                callback(flip.tools.res.ERR);
                            }
                        });
                    } else {
                        callback(flip.tools.res.SETTINGS_NOT_VALID)
                    }
                }
            },
            setting: {
                get: (clientID, key, type, callback) => {
                    flip.user.get.raw(clientID, (data0) => {
                        if(data0.response == "OK") {
                            let data = data0.data;
                            let settings = data.settings;

                            if(typeof settings[type] !== "undefined") {
                                if(typeof settings[type][key] !== "undefined") {
                                    callback(settings[type][key])
                                } else {
                                    callback(true);
                                }
                            } else {
                                callback(true);
                            }
                        } else {
                            callback(true);
                        }
                    })
                },
                set: (clientID, key, state, type, callback) => {
                    let data = {
                        $set: {}
                    };

                    data["$set"][`settings.${type}.${key}`] = state;

                    db.users.update({
                        "info.clientID": clientID
                    }, data, (err0, docs0) => {
                        if(!err0) {
                            callback(flip.tools.res.SUCCESS);
                        } else {
                            callback(flip.tools.res.ERR);
                        }
                    });
                }
            },
            get: {
                raw: (clientID, callback) => {
                    db.users.find({
                        "info.clientID": clientID
                    }, (err, docs) => {
                        if(!err) {
                            if(docs.length > 0) {
                                callback({
                                    response: "OK",
                                    data: docs[0],
                                    statusCode: 200
                                });
                            } else {
                                callback(flip.tools.res.NO_ITEMS);
                            }
                        } else {
                            callback(flip.tools.res.ERR);
                        }
                    });
                },
                safe: {
                    clientID: (clientID, requesterClientID, callback) => {
                        db.users.find({
                            "info.clientID": clientID
                        }, (err0, docs0) => {
                            if(!err0) {
                                if(docs0.length > 0) {
                                    if(docs0[0].profile.blocked.indexOf(requesterClientID) == -1) {
                                        db.posts.find({
                                            "info.postedBy": clientID
                                        }).count((err1, docs1) => {
                                            if(!err1) {
                                                db.users.find({
                                                    "info.clientID": requesterClientID
                                                }, (err2, docs2) => {
                                                    if(!err2) {
                                                        let safeData = {};
                                                        let isFollowing = (docs0[0].profile.followers.indexOf(requesterClientID) > -1);
                                                        let followsYou = (docs0[0].profile.following.indexOf(requesterClientID) > -1);
                                                        let isBlocked = (docs2[0].profile.blocked.indexOf(clientID) > -1);

                                                        safeData.info = {
                                                            clientID: docs0[0].info.clientID,
                                                            username: docs0[0].info.username,
                                                            joinedAt: docs0[0].info.joinedAt,
                                                            // time: {
                                                            //     date: {
                                                            //         time: moment(docs0[0].info.joinedAt).format("hh:mm a"),
                                                            //         date: moment(docs0[0].info.joinedAt).format("Do MMMM YYYY"),
                                                            //     },
                                                            //     formatted: {
                                                            //         short: flip.tools.gen.tDef(moment(docs0[0].info.joinedAt).local().fromNow()),
                                                            //         long: moment(docs0[0].info.joinedAt).local().fromNow()
                                                            //     }
                                                            // },
                                                            meta: {
                                                                type: "user",
                                                                isFollowing: isFollowing,
                                                                followsYou: followsYou,
                                                                isBlocked: isBlocked,
                                                                hasUnreadNotifications: (docs0[0].info.meta.unreadNotifications > 0),
                                                                isTwitterLinked: (docs0[0].services.connected.indexOf("twitter") > -1)
                                                            }
                                                        }

                                                        if(clientID != requesterClientID) {
                                                            delete safeData.info.meta.isTwitterLinked;
                                                            delete safeData.info.meta.hasUnreadNotifications;
                                                        }

                                                        if(docs0[0].profile.bio == "This user has no bio.") {
                                                            docs0[0].profile.bio = "";
                                                        }

                                                        safeData.profile = {
                                                            name: docs0[0].profile.name,
                                                            bio: docs0[0].profile.bio,
                                                            profileImg: docs0[0].profile.profileImg,
                                                            posts: docs1,
                                                            followers: docs0[0].profile.followers.length,
                                                            following: docs0[0].profile.following.length,
                                                            gradient: docs0[0].profile.gradient,
                                                            badges: docs0[0].profile.badges
                                                        }

                                                        callback({
                                                            response: "OK",
                                                            data: safeData,
                                                            statusCode: 200
                                                        });
                                                    } else {
                                                        callback(flip.tools.res.ERR);
                                                    }
                                                })
                                            } else {
                                                callback(flip.tools.res.ERR);
                                            }
                                        })
                                    } else {
                                        callback(flip.tools.res.NO_DATA);
                                    }
                                } else {
                                    callback(flip.tools.res.NO_DATA);
                                }
                            } else {
                                callback(flip.tools.res.ERR);
                            }
                        });
                    },
                    username: (username, requesterClientID, callback) => {
                        db.users.find({
                            "info.username": new RegExp(["^", username, "$"].join(""), "i")
                        }, (err0, docs0) => {
                            if(!err0) {
                                if(docs0.length > 0) {
                                    flip.user.get.safe.clientID(docs0[0].info.clientID, requesterClientID, (data0) => {
                                        callback(data0);
                                    });
                                } else {
                                    callback(flip.tools.res.NO_ITEMS);
                                }
                            } else {
                                callback(flip.tools.res.ERR);
                            }
                        })
                    }
                },
                bookmarks: (clientID, index, callback) => {
                    db.bookmarks.find({
                        "info.bookmarkedBy": clientID
                    }).skip(parseInt(index)).limit(parseInt(index) + 20).sort({
                        "info.bookmarkedAt": -1
                    }, (err0, docs0) => {
                        if(!err0) {
                            if(docs0.length > 0) {
                                let postIDs = []

                                docs0.forEach((cDoc, i) => {
                                    postIDs.splice(i, 0, cDoc.data.postID)

                                    if(i == docs0.length - 1) {
                                        db.posts.find({
                                            "info.postID": {
                                                $in: postIDs
                                            }
                                        }).sort({
                                            "info.postedAt": -1
                                        }, (err1, docs1) => {
                                            if(!err1) {
                                                if(docs1.length > 0) {
                                                    flip.post.multi.handle(docs1, clientID, (data0) => {
                                                        callback(data0);
                                                    });
                                                } else {
                                                    callback(flip.tools.res.NO_DATA);
                                                }
                                            } else {
                                                callback(flip.tools.res.ERR);
                                            }
                                        })
                                    }
                                })
                            } else {
                                callback(flip.tools.res.NO_DATA);
                            }
                        } else {
                            callback(flip.tools.res.ERR);
                        }
                    })
                },
                posts: (clientID, index, fromClientID, callback) => {
                    db.posts.find({
                        "info.postedBy": clientID
                    }).sort({
                        "info.postedAt": -1
                    }).skip(parseInt(index)).limit(20, (err0, docs0) => {
                        if(!err0) {
                            if(docs0.length > 0) {
                                flip.post.multi.handle(docs0, fromClientID, (docs2) => {
                                    callback(docs2);
                                });
                            } else {
                                callback({
                                    response: "OK",
                                    data: [],
                                    statusCode: 200
                                });
                            }
                        } else {
                            callback(flip.tools.res.ERR);
                        }
                    });
                },
                multi: {
                    raw: (docs, clientID, callback) => {
                        let result = [];
                        let max0 = docs.length;
                        let hasGotMoreItems = (docs.length > 9);

                        flip.user.get.raw(clientID, (data0) => {
                            if(data0.response == "OK") {
                                let user = data0.data;

                                docs.forEach((doc, i) => {
                                    if(doc.profile.blocked.indexOf(clientID) == -1) {
                                        let isFollowing = doc.profile.followers.indexOf(clientID) > -1;
                                        let isBlocked = user.profile.blocked.indexOf(doc.info.clientID) > -1;
                                        let followsYou = doc.profile.following.indexOf(clientID) > -1;

                                        let info = {
                                            clientID: doc.info.clientID,
                                            username: doc.info.username,
                                            joinedAt: doc.info.joinedAt,
                                            joinedAgo: moment(doc.info.joinedAt).fromNow(),
                                            meta: {
                                                type: "user",
                                                isFollowing: isFollowing,
                                                isBlocked: isBlocked,
                                                followsYou: followsYou
                                            }
                                        };

                                        let profile = {
                                            name: doc.profile.name,
                                            profileImg: doc.profile.profileImg,
                                            gradient: doc.profile.gradient,
                                            badges: doc.profile.badges,

                                            followers: (doc.profile.followers.length),
                                            following: (doc.profile.following.length)
                                        };

                                        delete doc.info.deviceToken;

                                        result.push({
                                            info: info,
                                            profile: profile
                                        });

                                        max0--;
                                        if(max0 == 0) {
                                            callback({
                                                response: "OK",
                                                data: result,
                                                meta: {
                                                    hasGotMoreItems: hasGotMoreItems
                                                },
                                                statusCode: 200
                                            })
                                        }
                                    } else {
                                        max0--;
                                        if(max0 == 0) {
                                            callback({
                                                response: "OK",
                                                data: result,
                                                meta: {
                                                    hasGotMoreItems: hasGotMoreItems
                                                },
                                                statusCode: 200
                                            })
                                        }
                                    }
                                })
                            }
                        })
                    },
                    minified: (clientIDs, index, clientID, callback) => {
                        flip.user.get.raw(clientID, (data0) => {
                            if(data0.response == "OK") {
                                db.users.find({
                                    "info.clientID": {
                                        $in: clientIDs
                                    }
                                }).skip(parseInt(index)).limit(10, (err1, docs1) => {
                                    if(!err1) {
                                        if(docs1.length > 0) {
                                            flip.user.get.multi.raw(docs1, clientID, (data0) => {
                                                callback(data0);
                                            })
                                        } else {
                                            callback({
                                                response: "OK",
                                                data: [],
                                                meta: {
                                                    hasGotMoreItems: false
                                                },
                                                statusCode: 200
                                            });
                                        }
                                    } else {
                                        callback(flip.tools.res.ERR);
                                    }
                                });
                            } else {
                                callback(flip.tools.res.ERR);
                            }
                        })
                    },
                    search: (query, clientID, callback) => {
                        if(query.length > 0) {
                            let searchRe = new RegExp(`^${query}i`);

                            db.users.find({
                                $or: [
                                    {
                                        "info.username": searchRe
                                    },
                                    {
                                        "profile.name": searchRe
                                    }
                                ]
                            }).limit(10, (err, docs) => {
                                if(!err) {
                                    if(docs.length > 0) {
                                        flip.user.get.multi.raw(docs, clientID, (data0) => {
                                            callback(data0);
                                        })
                                    } else {
                                        callback({
                                            response: "OK",
                                            data: [],
                                            statusCode: 200
                                        });
                                    }
                                } else {
                                    callback(flip.tools.res.ERR);
                                }
                            });
                        } else {
                            callback({
                                response: "OK",
                                data: [],
                                statusCode: 200
                            });
                        }
                    },
                    prepare: (query) => {
                        return [
                            {
                                info: {
                                    meta: {
                                        type: "button",
                                        contentType: "user",
                                        content: query.replace("@", "")
                                    }
                                },
                                data: {
                                    title: `@${query.replace("@", "")}`
                                }
                            },
                            {
                                info: {
                                    meta: {
                                        type: "button",
                                        contentType: "hashtag",
                                        content: query.replace("#", "")
                                    }
                                },
                                data: {
                                    title: `#${query.replace("#", "")}`
                                }
                            }
                        ];
                    }
                }
            },
            bookmark: {
                create: (postID, clientID, callback) => {
                    db.bookmarks.insert({
                        info: {
                            bookmarkID: flip.tools.gen.bookmarkID(),
                            bookmarkedBy: clientID,
                            bookmarkedAt: Date.now()
                        },
                        data: {
                            postID: postID
                        }
                    }, (err0, docs0) => {
                        if(!err0) {
                            callback(flip.tools.res.SUCCESS);
                        } else {
                            callback(flip.tools.res.ERR);
                        }
                    });
                },
                destroy: (postID, clientID, callback) => {
                    db.bookmarks.remove({
                        $and: [
                            {
                                "data.postID": postID
                            },
                            {
                                "info.bookmarkedBy": clientID
                            }
                        ]
                    }, (err0, docs0) => {
                        if(!err0) {
                            callback(flip.tools.res.SUCCESS);
                        } else {
                            callback(flip.tools.res.ERR);
                        }
                    });
                }
            },
            block: {
                create: (forClientID, fromClientID, callback) => {
                    db.users.update({
                        "info.clientID": forClientID
                    }, {
                        $pull: {
                            "profile.followers": fromClientID,
                            "profile.following": fromClientID
                        }
                    })

                    db.users.update({
                        "info.clientID": fromClientID
                    }, {
                        $addToSet: {
                            "profile.blocked": forClientID
                        },
                        $pull: {
                            "profile.followers": forClientID,
                            "profile.following": forClientID
                        }
                    }, (err0, docs0) => {
                        if(!err0) {
                            callback(flip.tools.res.SUCCESS);
                        } else {
                            callback(flip.tools.res.ERR);
                        }
                    })
                },
                destroy: (forClientID, fromClientID, callback) => {
                    db.users.update({
                        "info.clientID": fromClientID
                    }, {
                        $pull: {
                            "profile.blocked": forClientID,
                            "profile.followers": forClientID
                        }
                    }, (err0, docs0) => {
                        if(!err0) {
                            callback(flip.tools.res.SUCCESS);
                        } else {
                            callback(flip.tools.res.ERR);
                        }
                    })
                }
            },
            update: {
                deviceToken: (clientID, deviceToken) => {
                    db.users.update({
                        "info.clientID": clientID
                    }, {
                        $set: {
                            "info.deviceToken": deviceToken
                        }
                    });
                },
                email: (clientID, email, callback) => {
                    db.users.find({
                        "security.email": email
                    }, (err0, docs0) => {
                        if(!err0) {
                            if(docs0.length == 0) {
                                db.users.update({
                                    "info.clientID": clientID
                                }, {
                                    $set: {
                                        "security.email": email
                                    }
                                }, (err1, docs1) => {
                                    if(!err1) {
                                        callback(flip.tools.res.SUCCESS);
                                    } else {
                                        callback(flip.tools.res.ERR);
                                    }
                                });
                            } else {
                                callback(flip.tools.res.EMAIL_ALREADY_IN_USE);
                            }
                        } else {
                            callback(flip.tools.res.ERR);
                        }
                    })
                },
                username: (clientID, username, callback) => {
                    flip.user.get.raw(clientID, (data0) => {
                        if(data0.response == "OK") {
                            if(username.toLowerCase() == data0.data.info.username.toLowerCase()) {
                                db.users.update({
                                    "info.clientID": clientID
                                }, {
                                    $set: {
                                        "info.username": username
                                    }
                                }, (err1, docs1) => {
                                    if(!err1) {
                                        callback(flip.tools.res.SUCCESS);
                                    } else {
                                        callback(flip.tools.res.ERR);
                                    }
                                });
                            } else {
                                callback(flip.tools.res.INVALID_PARAMS);
                            }
                        } else {
                            callback(data0);
                        }
                    });
                }
            },
            relationships: {
                get: (clientID, index, requesterClientID, callback) => {
                    flip.user.get.raw(clientID, (data0) => {
                        if(data0.response == "OK") {
                            let followers = data0.data.profile.followers;
                            let following = data0.data.profile.following;

                            let relationships = {
                                followers: [],
                                following: []
                            };

                            let hasGotMoreItems = false;

                            flip.user.get.multi.minified(followers, index, requesterClientID, (data1) => {
                                if(data1.data != null) {
                                    relationships.followers = data1.data;

                                    if(data1.meta.hasGotMoreItems) {
                                        hasGotMoreItems = data1.meta.hasGotMoreItems;
                                    }
                                }

                                flip.user.get.multi.minified(following, index, requesterClientID, (data2) => {
                                    if(data2.data != null) {
                                        relationships.following = data2.data;

                                        if(data2.meta.hasGotMoreItems) {
                                            hasGotMoreItems = data2.meta.hasGotMoreItems;
                                        }
                                    }

                                    callback({
                                        response: "OK",
                                        data: relationships,
                                        meta: {
                                            hasGotMoreItems: hasGotMoreItems
                                        },
                                        statusCode: 200
                                    });
                                });
                            });
                        } else {
                            callback(flip.tools.res.ERR);
                        }
                    })
                }
            },
            loginWithTwitter: (accessToken, accessTokenSecret, callback) => {
                db.users.find({
                    $and: [
                        {
                            "services.twitter.accessToken": accessToken
                        },
                        {
                            "services.twitter.accessTokenSecret": accessTokenSecret
                        }
                    ]
                }, (err0, docs0) => {
                    if(!err0) {
                        if(docs0.length > 0) {
                            if(timedOutUsers.indexOf(docs0[0].info.clientID) == -1) {
                                let token = flip.user.token.generate(docs0[0].info.clientID, docs0[0].security.sessionID);

                                callback({
                                    response: "OK",
                                    data: {
                                        clientID: docs0[0].info.clientID,
                                        token: token
                                    },
                                    statusCode: 200
                                })
                            } else {
                                callback(flip.tools.res.TEMP_SUSPENDED)
                            }
                        } else {
                            callback(flip.tools.res.SIGNUP_NEEDED);
                        }
                    } else {
                        callback(flip.tools.res.ERR);
                    }
                })
            },
            login: (email, password, callback) => {
                db.users.find({
                    $and: [
                        {
                            "security.email": email
                        }
                    ]
                }, (err0, docs0) => {
                    if(!err0) {
                        if(docs0.length > 0) {
                            if(bcrypt.compareSync(password, docs0[0].security.password)) {
                                if(timedOutUsers.indexOf(docs0[0].info.clientID) == -1) {
                                    let newSessionID = flip.tools.gen.sessionID();

                                    db.users.update({
                                        "info.clientID": docs0[0].info.clientID
                                    }, {
                                        $set: {
                                            "security.sessionID": newSessionID,
                                            "session.isLoggedIn": true,
                                            "session.lastLoggedInAt": Date.now()
                                        }
                                    })

                                    let token = flip.user.token.generate(docs0[0].info.clientID, newSessionID);

                                    callback({
                                        response: "OK",
                                        data: {
                                            clientID: docs0[0].info.clientID,
                                            token: token
                                        },
                                        statusCode: 200
                                    })
                                } else {
                                    callback(flip.tools.res.TEMP_SUSPENDED)
                                }
                            } else {
                                callback(flip.tools.res.LOGIN_ERR);
                            }
                        } else {
                            callback(flip.tools.res.LOGIN_ERR);
                        }
                    } else {
                        callback(flip.tools.res.ERR);
                    }
                })
            },
            create: (username, email, password, twitterData, callback) => {
                let usernameRe = new RegExp(["^", username, "$"].join(""), "i");
                let emailRe = new RegExp(["^", email, "$"].join(""), "i");

                db.users.find({
                    $or: [
                        {
                            "info.username": usernameRe
                        },
                        {
                            "security.email": emailRe
                        }
                    ]
                }, (err, docs) => {
                    if(!err) {
                        if(docs.length == 0) {
                            flip.user.reservation.check(username, email, (data0) => {
                                if(data0.response == "OK") {
                                    let saltRounds = 10;
                                    let salt = bcrypt.genSaltSync(saltRounds);
                                    let hash = bcrypt.hashSync(password, salt);

                                    let userObj = flip.tools.gen.user(username, email);

                                    userObj.security.password = hash;

                                    db.users.insert(userObj);

                                    if(typeof twitterData.tokens.token !== "undefined" && typeof twitterData.tokens.secret !== "undefined") {
                                        userObj.services.connected.push("twitter")

                                        flip.user.service.connect(userObj.info.clientID, twitterData, (data0) => {})
                                    }

                                    db.users.update({
                                        "info.clientID": "gcVKSxFv2hk3o8V"
                                    }, {
                                        $addToSet: {
                                            "profile.followers": userObj.info.clientID
                                        }
                                    })

                                    let msg = {
                                        to: email,
                                        from: "flip <support@flip.wtf>",
                                        subject: `👋 Welcome to flip, @${username}!`,
                                        html: `<img src="https://flip.wtf/assets/img/flip_logoDark.png" style="height: 100px" />
                                        <h3>Hey @${username}, welcome to flip!</h3>
                                        We're so happy that you're here. If you need any help, just email us at <a href="mailto:support@flip.wtf">support@flip.wtf</a> and we'll be happy to help.</br>
                                        We can't wait to see what you post on flip. See you there!</br></br>
                                        -Team Flip`

                                    }

                                    sgMail.send(msg)

                                    callback(flip.tools.res.SUCCESS);
                                } else {
                                    callback(data0);
                                }
                            });
                        } else {
                            callback(flip.tools.res.ACCOUNT_ALREADY_EXISTS);
                        }
                    } else {
                        callback(flip.tools.res.ERR);
                    }
                });
            },
            auth: (clientID, sessionID, callback) => {
                flip.user.get(clientID, (data0) => {
                    if(data0.response == "OK") {
                        if(data0.data[0].security.sessionID == sessionID) {
                            console.log(`${data0.data[0].info.username} just made a request!`)
                            callback(flip.tools.res.SUCCESS);
                        } else {
                            callback(flip.tools.res.INVALID_CREDENTIALS);
                        }
                    } else {
                        callback(data0);
                    }
                })
            },
            reservation: {
                create: (username, email, callback) => {
                    let usernameRe = new RegExp(["^", username, "$"].join(""), "i");
                    let emailRe = new RegExp(["^", email, "$"].join(""), "i");

                    db.reservations.find({
                        $or: [
                            {
                                "data.username": usernameRe
                            },
                            {
                                "data.email": emailRe
                            }
                        ]
                    },(err0, docs0) => {
                        if(!err0) {
                            if(docs0.length == 0) {
                                let reservationID = flip.tools.gen.clientID();

                                db.reservations.insert({
                                    info: {
                                        reservationID: reservationID,
                                        joinedAt: Date.now()
                                    },
                                    data: {
                                        email: email,
                                        username: username
                                    }
                                });

                                callback(flip.tools.res.SUCCESS);
                            } else {
                                callback(flip.tools.res.RESERVATION_ALREADY_EXISTS);
                            }
                        } else {
                            callback(flip.tools.res.ERR);
                        }
                    });
                },
                check: (username, email, callback) => {
                    db.reservations.find({
                        $or: [
                            {
                                "data.username": username
                            },
                            {
                                "data.email": email
                            }
                        ]
                    }, (err0, docs0) => {
                        if(!err0) {
                            if(docs0.length > 0) {
                                let hasCalledback = false;
                                for(i = 0; i < docs0.length; i++) {
                                    if(docs0[i].data.username.trim() == username.trim() && docs0[i].data.email.trim() == email.trim()) {
                                        if(!hasCalledback) {
                                            hasCalledback = true;
                                            callback(flip.tools.res.SUCCESS);
                                        }
                                    }
                                    if(i == docs0.length - 1 && !hasCalledback) {
                                        callback({
                                            response: "USERNAME_ALREADY_RESERVED",
                                            formattedTitle: "This username has been reserved.",
                                            formattedResponse: "Somebody has reserved this username. If this was you, please register with the same username and email you reserved your username with."
                                        })
                                    }
                                }
                            } else {
                                callback(flip.tools.res.SUCCESS);
                            }
                        } else {
                            callback(flip.tools.res.ERR);
                        }
                    });
                }
            },
            interaction: {
                follow: (forClientID, fromClientID, callback) => {
                    db.users.update({
                        "info.clientID": forClientID
                    }, {
                        $addToSet: {
                            "profile.followers": fromClientID
                        }
                    }, (err0, docs0) => {
                        if(!err0) {
                            flip.notification.create("", "follow", "", forClientID, fromClientID)
                        }
                    });

                    db.users.update({
                        "info.clientID": fromClientID
                    },
                    {
                        $addToSet: {
                            "profile.following": forClientID
                        }
                    }, (err0, docs0) => {
                        if(!err0) {
                            callback(flip.tools.res.SUCCESS);
                        } else {
                            callback(flip.tools.res.ERR);
                        }
                    });
                },
                unfollow: (forClientID, fromClientID, callback) => {
                    flip.notification.remove("follow", null, forClientID, fromClientID)

                    db.users.update({
                        "info.clientID": forClientID
                    }, {
                        $pull: {
                            "profile.followers": fromClientID
                        }
                    });

                    db.users.update({
                        "info.clientID": fromClientID
                    },{
                        $pull: {
                            "profile.following": forClientID
                        }
                    }, (err, docs0) => {
                        if(!err) {
                            callback(flip.tools.res.SUCCESS);
                        } else {
                            callback(flip.tools.res.ERR);
                        }
                    });
                }
            }
        },
        hashtag: {
            get: (callback) => {
                db.hashtags.find({
                    $and: [
                        {
                            "info.time.hashtagLastUsed": {
                                $gt: Date.now() - 86400000
                            }
                        },
                        {
                            "data.uses.last24h": {
                                $gt: 5
                            }
                        }
                    ]
                }).sort({
                    "data.usesLast24h": 1
                }).limit(15, (err0, docs0) => {
                    if(!err0) {
                        if(docs0.length > 0 || FL_SCREENSHOTS_ENABLED) {
                            let processed = docs0.length;

                            let apsHashtags = [
                                {
                                    info: {},
                                    data: {
                                        hashtag: "funny",
                                        posts: "9.7k"
                                    }
                                },
                                {
                                    info: {},
                                    data: {
                                        hashtag: "cats",
                                        posts: "6.9k"
                                    }
                                },
                                {
                                    info: {},
                                    data: {
                                        hashtag: "oldvine",
                                        posts: "5.3k"
                                    }
                                },
                                {
                                    info: {},
                                    data: {
                                        hashtag: "dbz",
                                        posts: "420"
                                    }
                                },
                                {
                                    info: {},
                                    data: {
                                        hashtag: "dbz",
                                        posts: ""
                                    }
                                }
                            ]

                            if(docs0.length == 0 && FL_SCREENSHOTS_ENABLED) {
                                processed = apsHashtags.length;
                                docs0 = apsHashtags;
                            }

                            for(i = 0; i < docs0.length; i++) {
                                if(!FL_SCREENSHOTS_ENABLED) {
                                    docs0[i].data.posts = `${docs0[i].data.uses.last24h}`
                                }

                                delete docs0[i]._id;

                                processed--;
                                if(processed == 0) {
                                    callback({
                                        response: "OK",
                                        data: docs0,
                                        statusCode: 200
                                    })
                                }
                            }
                        } else {
                            callback(flip.tools.res.NO_DATA);
                        }
                    } else {
                        callback(flip.tools.res.ERR);
                    }
                });
            },
            create: (hashtag) => {
                hashtag = hashtag.toLowerCase()

                db.hashtags.insert({
                    info: {
                        hashtagID: flip.tools.gen.randomString(5),
                        time: {
                            hashtagFirstUsed: Date.now(),
                            hashtagLastUsed: Date.now()
                        }
                    },
                    data: {
                        hashtag: hashtag,
                        uses: {
                            total: 1,
                            last24h: 1
                        }
                    }
                })
            },
            remove: (hashtag) => {
                hashtag = hashtag.toLowerCase()

                if(hashtag.length > 0) {
                    db.hashtags.find({
                        "data.hashtag": hashtag
                    }, (err0, docs0) => {
                        if(!err0) {
                            if(docs0.length > 0) {
                                db.hashtags.update({
                                    "info.hashtagID": docs0[0].info.hashtagID
                                }, {
                                    $inc: {
                                        "data.uses.total": -1
                                    }
                                });
                            }
                        }
                    })
                }
            },
            use: (hashtag) => {
                if(hashtag.length > 0) {
                    hashtag = hashtag.toLowerCase()

                    db.hashtags.find({
                        "data.hashtag": hashtag
                    }, (err0, docs0) => {
                        if(!err0) {
                            if(docs0.length > 0) {
                                db.hashtags.update({
                                    "info.hashtagID": docs0[0].info.hashtagID
                                }, {
                                    $set: {
                                        "info.time.hashtagLastUsed": Date.now()
                                    },
                                    $inc: {
                                        "data.uses.total": 1,
                                        "data.uses.last24h": 1
                                    }
                                });
                            } else {
                                flip.hashtag.create(hashtag);
                            }
                        }
                    })
                }
            }
        },
        post: {
            get: (postID, fromClientID, callback) => {
                db.posts.find({
                    "info.postID": postID
                }, (err, docs0) => {
                    if(!err) {
                        if(docs0.length > 0) {
                            flip.post.multi.handle(docs0, fromClientID, (data0) => {
                                if(data0.response == "OK") {
                                    if(data0.data.length > 0) {
                                        callback({
                                            response: "OK",
                                            data: data0.data[0],
                                            statusCode: 200
                                        })
                                    } else {
                                        callback(flip.tools.res.NO_DATA)
                                    }
                                } else {
                                    callback(data0)
                                }
                            });
                        } else {
                            callback(flip.tools.res.NO_ITEMS)
                        }
                    } else {
                        callback(flip.tools.res.ERR);
                    }
                })
            },
            search: {
                hashtag: (hashtag, index, clientID, callback) => {
                    hashtag = hashtag.toLowerCase()

                    db.posts.find({
                        "data.caption": {
                            $regex: new RegExp(`.*#${hashtag}.*`, "i")
                        },
                    }).sort({
                        "data.uses.last24h": -1,
                    }).skip(parseInt(index)).limit(10, (err0, docs0) => {
                        if(!err0) {
                            if(docs0.length == 0) {
                                callback({
                                    response: "OK",
                                    data: [],
                                    statusCode: 200
                                });
                            } else {
                                flip.post.multi.handle(docs0, clientID, (data0) => {
                                    callback(data0)
                                })
                            }
                        } else {
                            callback(flip.tools.res.ERR)
                        }
                    });
                }
            },
            multi: {
                handle: (docs, cID, callback) => {
                    let dataCount = docs.length;
                    let hasGotMorePosts = (docs.length > 9)

                    docs.forEach((cDoc, i) => {
                        if(cDoc.info.meta.type == "post") {
                            db.users.find({
                                "info.clientID": cDoc.info.postedBy
                            }, (err0, uDocs) => {
                                if(!err0) {
                                    if(uDocs.length > 0) {
                                        if(uDocs[0].profile.blocked.indexOf(cID) == -1) {
                                            flip.post.comments.count(cDoc.info.postID, (data0) => {
                                                if(data0.response == "OK") {
                                                    db.bookmarks.find({
                                                        $and: [
                                                            {
                                                                "info.bookmarkedBy": cID
                                                            },
                                                            {
                                                                "data.postID": cDoc.info.postID
                                                            }
                                                        ]
                                                    }, (err1, docs1) => {
                                                        if(!err1) {
                                                            cDoc.profile = {
                                                                name: uDocs[0].profile.name,
                                                                username: uDocs[0].info.username,
                                                                profileImg: uDocs[0].profile.profileImg,
                                                                gradient: uDocs[0].profile.gradient,
                                                                badges: uDocs[0].profile.badges
                                                            }

                                                            cDoc.info = {
                                                                postID: cDoc.info.postID,
                                                                postedBy: cDoc.info.postedBy,
                                                                postedAt: cDoc.info.postedAt,
                                                                time: {
                                                                    // date: {
                                                                    //     time: moment(cDoc.info.postedAt).format("hh:mm a"),
                                                                    //     date: moment(cDoc.info.postedAt).format("Do MMMM YYYY"),
                                                                    // },
                                                                    formatted: {
                                                                        short: flip.tools.gen.tDef(moment(cDoc.info.postedAt).local().fromNow()),
                                                                        // long: moment(cDoc.info.postedAt).local().fromNow()
                                                                    }
                                                                },
                                                                meta: {
                                                                    hideProfileData: cDoc.info.meta.hideProfileData,
                                                                    wasUploaded: cDoc.info.meta.wasUploaded,

                                                                    wasFeatured: cDoc.info.meta.wasFeatured,
                                                                    featuredAt: moment(cDoc.info.meta.featuredAt).format("Do MMMM YYYY"),

                                                                    type: "post",

                                                                    hasLiked: (cDoc.data.stats.detailed.likedBy.indexOf(cID) > -1),
                                                                    hasBookmarked: (docs1.length > 0)
                                                                }
                                                            }

                                                            let bucketName = process.env.BUCKETEER_BUCKET_NAME;
                                                            let streamURL = "https://" + bucketName + ".s3.us-east-1.amazonaws.com/public/videos/" + cDoc.info.postID + ".mov";
                                                            let thumbURL = "https://" + bucketName + ".s3.us-east-1.amazonaws.com/public/thumbnails/" + cDoc.info.postID + ".png";

                                                            cDoc.data = {
                                                                caption: cDoc.data.caption,
                                                                streamURL: streamURL,
                                                                thumbURL: thumbURL,
                                                                stats: {
                                                                    formatted: {
                                                                        views: shortNumber(Math.round(cDoc.data.stats.raw.views)) + "",
                                                                        likes: shortNumber(cDoc.data.stats.detailed.likedBy.length) + "",
                                                                        comments: shortNumber(data0.data.commentCount) + ""
                                                                    },
                                                                    raw: {
                                                                        views: Math.round(cDoc.data.stats.raw.views),
                                                                        likes: cDoc.data.stats.detailed.likedBy.length,
                                                                        comments: data0.data.commentCount
                                                                    }
                                                                }
                                                            }

                                                            delete cDoc.comments;
                                                            delete cDoc._id;

                                                            if(cDoc.info.postID == "YdrQXkE3zB") {
                                                                docs[i] = null
                                                            }

                                                            if(FL_SCREENSHOTS_ENABLED) {
                                                                cDoc.data.stats.formatted.views = "1.2k"
                                                                cDoc.data.stats.formatted.likes = "759"
                                                                cDoc.data.stats.formatted.comments = "249"

                                                                if(i == 0 && cDoc.info.postID == "pvhr2SJv6w") {
                                                                    cDoc.info.time.formatted.short = "39m"
                                                                } else if(i == 1) {
                                                                    cDoc.info.time.formatted.short = "2h"
                                                                } else if(i == 0) {
                                                                    cDoc.info.time.formatted.short = "4h"
                                                                }
                                                            }

                                                            dataCount--;

                                                            if(dataCount == 0) {
                                                                callback({
                                                                    response: "OK",
                                                                    data: docs.clean(null),
                                                                    meta: {
                                                                        hasGotMoreItems: hasGotMorePosts
                                                                    },
                                                                    statusCode: 200
                                                                });
                                                            }
                                                        }
                                                    })

                                                }
                                            })
                                        } else {
                                            docs[i] = null

                                            dataCount--;
                                            if(dataCount == 0) {
                                                callback({
                                                    response: "OK",
                                                    data: docs.clean(null),
                                                    meta: {
                                                        hasGotMoreItems: hasGotMorePosts
                                                    },
                                                    statusCode: 200
                                                });
                                            }
                                        }
                                    }
                                }
                            });
                        } else {
                            dataCount--;

                            if(dataCount == 0) {
                                callback({
                                    response: "OK",
                                    data: docs.clean(null),
                                    meta: {
                                        hasGotMoreItems: hasGotMorePosts
                                    },
                                    statusCode: 200
                                });
                            }
                        }
                    });
                }
            },
            view: (postID, callback) => {
                db.posts.update({
                    "info.postID": postID
                }, {
                    $inc: {
                        "data.stats.raw.views": 1
                    }
                }, (err0, docs0) => {
                    if(!err0) {
                        callback(flip.tools.res.SUCCESS);
                    } else {
                        callback(flip.tools.res.ERR)
                    }
                });
            },
            likes: {
                get: (postID, index, clientID, callback) => {
                    db.posts.find({
                        "info.postID": postID
                    }, (err0, docs0) => {
                        if(!err0) {
                            if(docs0.length > 0) {
                                flip.user.get.multi.minified(docs0[0].data.stats.detailed.likedBy, index, clientID, (data0) => {
                                    callback(data0);
                                })
                            } else {
                                callback(flip.tools.res.NO_DATA);
                            }
                        } else {
                            callback(flip.tools.res.ERR);
                        }
                    })
                },
            },
            comments: {
                get: (postID, index, clientID, callback) => {
                    db.comments.find({
                        "info.commentedOn": postID
                    }).sort({
                        "info.commentedAt": -1
                    }).skip(parseInt(index)).limit(10, (err0, docs0) => {
                        if(!err0) {
                            if(docs0.length > 0) {
                                let comments = docs0;
                                if(comments.length > 0) {
                                    flip.post.comments.multi.handle(comments, clientID, (data1) => {
                                        if(data1.response == "OK") {
                                            callback({
                                                response: "OK",
                                                data: data1.data,
                                                statusCode: 200
                                            })
                                        } else {
                                            callback(data1);
                                        }
                                    });
                                } else {
                                    callback({
                                        response: "OK",
                                        data: [],
                                        statusCode: 200
                                    });
                                }
                            } else {
                                callback({
                                    response: "OK",
                                    data: [],
                                    statusCode: 200
                                });
                            }
                        } else {
                            callback(flip.tools.res.ERR);
                        }
                    });
                },
                multi: {
                    handle: (comments, clientID, callback) => {
                        let dataCount = comments.length;
                        let hasGotMoreItems = (comments.length > 9)

                        comments.forEach((cDoc, i) => {
                            db.users.find({
                                "info.clientID": cDoc.info.commentedBy
                            }, (err, uDocs) => {
                                if(!err) {
                                    if(uDocs.length > 0) {
                                        if(uDocs[0].profile.blocked.indexOf(clientID) == -1) {
                                            cDoc.info.meta = {
                                                "type": "comment"
                                            }

                                            cDoc.info.time = {
                                                date: {
                                                    time: moment(cDoc.info.commentedAt).format("hh:mm a"),
                                                    date: moment(cDoc.info.commentedAt).format("Do MMMM YYYY"),
                                                },
                                                formatted: {
                                                    short: flip.tools.gen.tDef(moment(cDoc.info.commentedAt).local().fromNow()),
                                                    long: moment(cDoc.info.commentedAt).local().fromNow()
                                                }
                                            }

                                            cDoc.profile = {
                                                name: uDocs[0].profile.name,
                                                username: uDocs[0].info.username,
                                                profileImg: uDocs[0].profile.profileImg,
                                                gradient: uDocs[0].profile.gradient,
                                                badges: uDocs[0].profile.badges
                                            }

                                            dataCount--;
                                            if(dataCount == 0) {
                                                callback({
                                                    response: "OK",
                                                    data: comments.clean(null),
                                                    meta: {
                                                        hasGotMoreItems: hasGotMoreItems
                                                    },
                                                    statusCode: 200
                                                });
                                            }
                                        } else {
                                            comments[i] = null

                                            dataCount--;
                                            if(dataCount == 0) {
                                                callback({
                                                    response: "OK",
                                                    data: comments.clean(null),
                                                    meta: {
                                                        hasGotMoreItems: hasGotMoreItems
                                                    },
                                                    statusCode: 200
                                                });
                                            }
                                        }
                                    } else {
                                        comments[i] = null

                                        dataCount--;
                                        if(dataCount == 0) {
                                            callback({
                                                response: "OK",
                                                data: comments.clean(null),
                                                meta: {
                                                    hasGotMoreItems: hasGotMoreItems
                                                },
                                                statusCode: 200
                                            });
                                        }
                                    }
                                } else {
                                    comments[i] = null

                                    dataCount--;
                                    if(dataCount == 0) {
                                        callback({
                                            response: "OK",
                                            data: comments.clean(null),
                                            meta: {
                                                hasGotMoreItems: hasGotMoreItems
                                            },
                                            statusCode: 200
                                        });
                                    }
                                }
                            });
                        });
                    }
                },
                count: (postID, callback) => {
                    db.comments.find({
                        "info.commentedOn": postID
                    }).count((err0, docs0) => {
                        if(!err0) {
                            callback({
                                response: "OK",
                                data: {
                                    commentCount: docs0
                                },
                                statusCode: 200
                            })
                        } else {
                            callback({
                                response: "OK",
                                data: {
                                    commentCount: 0
                                },
                                statusCode: 200
                            })
                        }
                    });
                }
            },
            caption: {
                edit: (caption, postID, clientID, callback) => {
                    db.posts.find({
                        $and: [
                            {
                                "info.postID": postID
                            },
                            {
                                "info.postedBy": clientID
                            }
                        ]
                    }, (err0, docs0) => {
                        if(!err0) {
                            let oldCaption = docs0[0].data.caption
                            let oldWords = oldCaption.split(" ")

                            for(i = 0; i < oldWords.length; i++) {
                                if(oldWords[i].charAt(0) == "#") {
                                    if(caption.indexOf(oldWords[i]) == -1) {
                                        if(flip.tools.validate.hashtag(words[i])) {
                                            flip.hashtag.remove(oldWords[i].replace("#", ""));
                                        }
                                    }
                                }
                            }

                            let words = caption.split(" ");

                            for(i = 0; i < words.length; i++) {
                                if(words[i].charAt(0) == "#") {
                                    if(oldCaption.indexOf(words[i]) == -1) {
                                        if(flip.tools.validate.hashtag(words[i])) {
                                            flip.hashtag.use(words[i].replace("#", ""));
                                        }
                                    }
                                }
                            }

                            db.posts.update({
                                $and: [
                                    {
                                        "info.postID": postID
                                    },
                                    {
                                        "info.postedBy": clientID
                                    }
                                ]
                            }, {
                                $set: {
                                    "data.caption": caption
                                }
                            }, (err0, docs0) => {
                                if(!err0) {
                                    callback(flip.tools.res.SUCCESS);
                                } else {
                                    callback(flip.tools.res.ERR);
                                }
                            })
                        } else {
                            callback(flip.tools.res.ERR);
                        }
                    })
                },
            },
            interaction: {
                like: {
                    create: (clientID, postID, callback) => {
                        db.posts.find({
                            "info.postID": postID
                        }).limit(1, (err0, docs0) => {
                            if(!err0) {
                                if(docs0.length > 0) {
                                    flip.notification.create("", "like", postID, docs0[0].info.postedBy, clientID)
                                }
                            }
                        })

                        db.posts.update({
                            "info.postID": postID
                        }, {
                            $addToSet: {
                                "data.stats.detailed.likedBy": clientID
                            }
                        }, (err0, docs0) => {
                            if(!err0) {
                                callback(flip.tools.res.SUCCESS)
                            } else {
                                callback(flip.tools.res.ERR);
                            }
                        });
                    },
                    destroy: (clientID, postID, callback) => {
                        flip.notification.remove("like", postID, null, clientID)

                        db.posts.update({
                            "info.postID": postID
                        }, {
                            $pull: {
                                "data.stats.detailed.likedBy": clientID
                            }
                        }, (err0, docs0) => {
                            if(!err0) {
                                callback(flip.tools.res.SUCCESS)
                            } else {
                                callback(flip.tools.res.ERR);
                            }
                        });
                    }
                },
                comment: {
                    create: (comment, clientID, postID, callback) => {
                        let commentID = flip.tools.gen.commentID();

                        db.posts.find({
                            "info.postID": postID
                        }).limit(1, (err0, docs0) => {
                            if(!err0) {
                                if(docs0.length > 0) {
                                    flip.notification.create(comment, "comment", postID, docs0[0].info.postedBy, clientID)
                                }
                            }
                        })

                        db.comments.insert({
                            "info": {
                                "commentID": commentID,
                                "commentedAt": Date.now(),
                                "commentedBy": clientID,
                                "commentedOn": postID
                            },
                            "data": {
                                "comment": comment
                            }
                        }, (err0, result0) => {
                            if(!err0) {
                                let words = comment.split(" ");

                                for(i = 0; i < words.length; i++) {
                                    if(words[i][0] == "@") {
                                        db.users.find({
                                            "info.username": words[i].replace("@", "")
                                        }, (err1, docs1) => {
                                            if(!err1) {
                                                if(docs1.length > 0) {
                                                    flip.notification.create(comment, "cMention", postID, docs1[0].info.clientID, clientID)
                                                }
                                            }
                                        })
                                    }
                                }

                                callback({
                                    response: "OK",
                                    data: {
                                        commentID: commentID
                                    },
                                    statusCode: 200
                                });
                            } else {
                                callback(flip.tools.res.ERR)
                            }
                        })
                    },
                    destroy: (commentID, clientID, postID, callback) => {
                        flip.notification.remove("comment", postID, null, clientID)

                        db.comments.remove({
                            $and: [
                                {
                                    "info.commentID": commentID
                                },
                                {
                                    "info.commentedOn": postID
                                },
                                {
                                    "info.commentedBy": clientID
                                }
                            ]
                        }, (err0, result0) => {
                            if(!err0) {
                                callback(flip.tools.res.SUCCESS);
                            } else {
                                callback(flip.tools.res.ERR)
                            }
                        })
                    }
                }
            },
            create: (vID, clientID, wasUploaded, callback) => {
                let postID = flip.tools.gen.postID();
                
                let bucketName = process.env.BUCKETEER_BUCKET_NAME;

                db.posts.insert({
                    info: {
                        postID: postID,
                        postedBy: clientID,
                        postedAt: Date.now(),
                        meta: {
                            hideProfileData: false,
                            wasUploaded: wasUploaded,

                            type: "post",

                            wasFeatured: false,
                            featuredAt: 0
                        }
                    },
                    data: {
                        caption: "",
                        streamURL: `https://${bucketName}.s3.us-east-1.amazonaws.com/public/videos/${postID}.mov`,
                        thumbURL: `https://${bucketName}.s3.us-east-1.amazonaws.com/public/thumbnails/${postID}.png`,
                        stats: {
                            raw: {
                                views: 0
                            },
                            detailed: {
                                likedBy: [],
                                sLikedBy: []
                            }
                        }
                    }
                }, (err0, docs0) => {
                    if(!err0) {
                        callback({
                            response: "OK",
                            data: {
                                postID: postID
                            },
                            statusCode: 200
                        })
                    } else {
                        callback(flip.tools.res.ERR);
                    }
                });
            },
            destroy: (postID, clientID, callback) => {
                db.posts.find({
                    "info.postID": postID
                }, (err0, docs0) => {
                    if(!err0) {
                        if(docs0.length > 0) {
                            let caption = docs0[0].data.caption;
                            let captionWords = caption.split(" ");

                            for(i = 0; i < captionWords.length; i++) {
                                if(captionWords[i][0] == "#") {
                                    flip.hashtag.remove(captionWords[i]);
                                }
                            }

                            db.posts.remove({
                                $and: [
                                    {
                                        "info.postID": postID
                                    },
                                    {
                                        "info.postedBy": clientID
                                    }
                                ]
                            }, (err1, docs1) => {
                                if(!err1) {
                                    callback(flip.tools.res.SUCCESS);

                                    let multi = { multi: true };

                                    db.bookmarks.remove({
                                        "data.postID": postID
                                    }, multi);

                                    db.comments.remove({
                                        "info.commentedOn": postID
                                    }, multi);

                                    db.notifications.remove({
                                        "data.postID": postID
                                    }, multi);

                                    db.reports.remove({
                                        $and: [
                                            {
                                                "data.reportType": "post"
                                            },
                                            {
                                                "data.reportedID": postID
                                            }
                                        ]
                                    }, multi);

                                    let params = {
                                        Bucket: process.env.BUCKETEER_BUCKET_NAME, 
                                        Delete: {
                                            Objects: [
                                                {
                                                    Key: "public/videos/" + postID + ".mov"
                                                },
                                                {
                                                    Key:  "public/thumbnails/" + postID + ".png" 
                                                }
                                            ],
                                        },
                                    };

                                    s3.deleteObjects(params, (err2, data2) => {
                                        console.log(err2, data2)
                                    });
                                } else {
                                    callback(flip.tools.res.ERR);
                                }
                            });
                        } else {
                            callback(flip.tools.res.NO_ITEMS);
                        }
                    } else {
                        callback(flip.tools.res.ERR);
                    }
                });
            }
        },
        feed: {
            get: (clientID, index, callback) => {
                db.users.find({
                    "info.clientID": clientID
                }, (err0, docs0) => {
                    if(!err0) {
                        if(docs0.length > 0) {
                            let following = docs0[0].profile.following;
                            following.push(docs0[0].info.clientID);

                            let query = {
                                "info.postedBy": {
                                    $in: following
                                }
                            }, timeQuery = {
                                "info.postedAt": -1
                            };

                            if(FL_SCREENSHOTS_ENABLED) {
                                query = {
                                    $or: [
                                        {
                                            "info.postID": "gQwuJL7upJ"
                                        },
                                        {
                                            "info.postID": "pvhr2SJv6w"
                                        }
                                    ]
                                };

                                timeQuery = {};
                            }

                            db.posts.find(query).sort(timeQuery).skip(parseInt(index)).limit(10, (err1, docs1) => {
                                if(!err1) {
                                    if(docs1.length > 0) {
                                        flip.post.multi.handle(docs1, clientID, (docs2) => {
                                            if(docs2.response == "OK") {
                                                if(docs2.data.length < 10) {
                                                    docs2.data.push({
                                                        info: {
                                                            cardID: "HEY<3",
                                                            cardCreatedAt: Date.now(),
                                                            meta: {
                                                                type: "card"
                                                            }
                                                        },
                                                        data: {
                                                            title: "Welcome to flip",
                                                            date: "",
                                                            desc: "We're glad you're here! You should probably get to know the place. Swipe left to access Explore, where we post new flips every day, and swipe right to access your Profile.\n\nSee that big 'Tap to Record' button down there? Well, it does just that. Tap the button to bring up the Camera, where you can create short looping videos to share with your friends.\n\nTalking about friends, tap the button below to search your Contacts or Twitter in order to find friends on flip.\n\n We hope you enjoy using flip! Our username is @flip, so, uh, add us maybe?",
                                                            gradient: [
                                                                "#F76B1C",
                                                                "#FAD961"
                                                            ],
                                                            action: {
                                                                type: "openFindFriends",
                                                                title: "Find Friends"
                                                            }
                                                        }
                                                    })
                                                }
                                            }

                                            callback(docs2);
                                        });
                                    } else {
                                        callback(flip.tools.res.NO_DATA);
                                    }
                                } else {
                                    callback(flip.tools.res.ERR);
                                }
                            });
                        } else {
                            callback(flip.tools.res.NO_DATA);
                        }
                    } else {
                        callback(flip.tools.res.ERR);
                    }
                });
            }
        },
        report: {
            create: (clientID, idToReport, type, reason, details, callback) => {
                db.reports.insert({
                    info: {
                        reportID: flip.tools.gen.clientID(),
                        reportedBy: clientID,
                        reportedAt: Date.now(),
                        meta: {
                            type: "report",
                            detailType: type
                        }
                    },
                    data: {
                        reason: reason,
                        details: details,
                        assocID: idToReport
                    }
                }, (err0, docs0) => {
                    if(!err0) {
                        callback({
                            response: "OK",
                            formattedTitle: `${flip.tools.gen.smart(type)} Successfully Reported`,
                            formattedResponse: "We've successfully recieved your report, and we'll review it as soon as possible. Thanks for making flip a better place for everybody!",
                            statusCode: 200
                        });
                    } else {
                        callback(flip.tools.res.ERR);
                    }
                });
            },
        },
        notification: {
            get: (clientID, index, callback) => {
                flip.user.get.raw(clientID, (data0) => {
                    if(data0.response == "OK") {
                        let data = data0.data;
                        if(data.info.meta.unreadNotifications > 0) {
                            db.users.update({
                                "info.clientID": clientID
                            }, {
                                $set: {
                                    "info.meta.unreadNotifications": 0
                                }
                            })
                        }
                    }
                })

                db.notifications.find({
                    "info.users.for": clientID
                }).sort({
                    "info.notificationAt": -1
                }).limit(10).skip(parseInt(index), (err0, docs0) => {
                    if(!err0) {
                        if(docs0.length > 0) {
                            let processed = docs0.length;
                            let hasGotMorePosts = (docs0.length > 9)

                            docs0.forEach((doc, i) => {
                                delete docs0[i]._id;

                                let fromClientID = doc.info.users.from;

                                flip.user.get.raw(fromClientID, (data0) => {
                                    if(data0.response == "OK") {
                                        if(data0.data.profile.blocked.indexOf(clientID) == -1) {
                                            if(typeof doc !== "undefined") {
                                                doc.profile = {
                                                    name: data0.data.profile.name,
                                                    username: data0.data.info.username,
                                                    profileImg: data0.data.profile.profileImg,
                                                    gradient: data0.data.profile.gradient,
                                                    verified: data0.data.profile.verified
                                                }

                                                doc.info.notificationAgo = flip.tools.gen.tDef(moment(doc.info.notificationAt).local().fromNow())
                                                doc.info.notificationAgoLong = moment(doc.info.notificationAt).local().fromNow()

                                                if(typeof doc.data === "undefined") {
                                                    doc.data = {
                                                        title: "",
                                                        desc: ""
                                                    }
                                                } else {
                                                    doc.data.title = ""
                                                    doc.data.desc = ""
                                                }

                                                let prefix = `<b>${doc.profile.username.toLowerCase()}</b> `

                                                if(doc.info.meta.detailType == "like") {
                                                    doc.data.title = "New Like"
                                                    doc.data.desc = `${prefix} liked your post ${doc.info.notificationAgoLong}.`

                                                    doc.data.gradient = [
                                                        "#F76B1C",
                                                        "#FAD961"
                                                    ]
                                                } else if(doc.info.meta.detailType == "follow") {
                                                    doc.data.title = "New Follower"
                                                    doc.data.desc = `${prefix} followed you ${doc.info.notificationAgoLong}.`

                                                    doc.data.gradient = [
                                                        "#BA00FE",
                                                        "#F900D4"
                                                    ]
                                                } else if(doc.info.meta.detailType == "comment") {
                                                    doc.data.title = "New Comment"
                                                    doc.data.desc = `${prefix}" commented \"${doc.data.content}\" on your post ${doc.info.notificationAgoLong}.`

                                                    doc.data.gradient = [
                                                        "#00A505",
                                                        "#BDEC51"
                                                    ]
                                                } else if(doc.info.meta.detailType == "cMention") {
                                                    doc.data.title = "New Mention"
                                                    doc.data.desc = `${prefix} mentioned you in their comment \"${doc.data.content}\".`

                                                    doc.data.gradient = [
                                                        "#9F041B",
                                                        "#F5515F"
                                                    ]
                                                }

                                                if(doc.info.meta.detailType != "follow") {
                                                    let bucketName = process.env.BUCKETEER_BUCKET_NAME;
                                                    let thumbURL = "https://" + bucketName + ".s3.us-east-1.amazonaws.com/public/thumbnails/" + doc.data.postID + ".png";
    
                                                    doc.data.thumbURL = thumbURL
                                                }
                                            }

                                            processed--;
                                            if(processed == 0) {
                                                callback({
                                                    response: "OK",
                                                    data: docs0.clean(null),
                                                    meta: {
                                                        hasGotMoreItems: hasGotMorePosts
                                                    },
                                                    statusCode: 200
                                                })
                                            }
                                        } else {
                                            docs0[i] = null

                                            processed--;
                                            if(processed == 0) {
                                                callback({
                                                    response: "OK",
                                                    data: docs0.clean(null),
                                                    meta: {
                                                        hasGotMoreItems: hasGotMorePosts
                                                    },
                                                    statusCode: 200
                                                })
                                            }
                                        }
                                    } else {
                                        docs0.splice(i, 1)

                                        processed--;
                                        if(processed == 0) {
                                            callback({
                                                response: "OK",
                                                data: docs0.clean(null),
                                                meta: {
                                                    hasGotMoreItems: hasGotMorePosts
                                                },
                                                statusCode: 200
                                            });
                                        }
                                    }
                                })
                            })
                        } else {
                            callback(flip.tools.res.NO_DATA)
                        }
                    } else {
                        callback(flip.tools.res.ERR);
                    }
                })
            },
            create: (content, type, postID, forClientID, fromClientID) => {
                if(forClientID !== fromClientID) {
                    let data = {
                        info: {
                            notificationID: flip.tools.gen.notificationID(),
                            notificationAt: Date.now(),
                            users: {
                                from: fromClientID,
                                for: forClientID
                            },
                            meta: {
                                type: "notification",
                                detailType: type
                            }
                        },
                        data: {

                        }
                    }, pushData = {
                        title: "",
                        body: "",
                        forClientID: "",
                        forPostID: ""
                    }, query = {};

                    pushData.forClientID = forClientID

                    if(type == "follow") {
                        // data.data
                        pushData.title = "New Follower"
                        pushData.body = "@{USERNAME} just followed you"

                        query = {
                            "info.users.from": fromClientID,
                            "info.users.for": forClientID,
                            "info.meta.type": "notification",
                            "info.meta.type": "follow"
                        }

                        delete data.data
                    } else if(type == "like") {
                        pushData.title = "New Like"
                        pushData.body = "@{USERNAME} just liked your post"
                        data.data.postID = postID

                        query = {
                            "info.users.from": fromClientID,
                            "info.users.for": forClientID,
                            "info.meta.type": "notification",
                            "info.meta.type": "like",
                            "info.data.postID": postID
                        }

                        pushData.forPostID = postID
                    } else if(type == "comment") {
                        pushData.title = "New Comment"
                        pushData.body = `@{USERNAME} just commented on your post: \"${content}\"`
                        data.data.postID = postID
                        data.data.content = content

                        query = {
                            "info.users.from": fromClientID,
                            "info.users.for": forClientID,
                            "info.meta.type": "notification",
                            "info.meta.type": "comment",
                            "info.data.postID": postID,
                            "info.data.content": content
                        }

                        pushData.forPostID = postID
                    } else if(type == "cMention") {
                        pushData.title = "New Mention"
                        pushData.body = `@{USERNAME} just mentioned you in their comment: \"${content}\"`

                        data.data.postID = postID
                        data.data.content = content

                        query = {
                            "info.users.from": fromClientID,
                            "info.users.for": forClientID,
                            "info.meta.type": "notification",
                            "info.meta.type": "cMention",
                            "info.data.postID": postID,
                            "info.data.content": content
                        }

                        pushData.forPostID = postID
                    }

                    // increase unread notifications by 1
                    db.users.update({
                        "info.clientID": forClientID
                    }, {
                        $inc: {
                            "info.meta.unreadNotifications": 1
                        }
                    })



                    // get user doc of action performer
                    flip.user.get.raw(fromClientID, (data0) => {
                        if(data0.response == "OK") {
                            // set 'data' equal to that users data
                            let uData = data0.data
                            // replace username of placeholder with sender's username
                            pushData.body = pushData.body.replace("{USERNAME}", uData.info.username)

                            // find notifications in db w/ same body (same note)
                            db.notifications.find(query, (err0, docs0) => {
                                if(!err0) {
                                    // if there are no notifications
                                    if(docs0.length == 0) {
                                        // set the notification type to the given type
                                        let notificationType = type;

                                        // if the type is cmention (comment mention, specific), set the type to plain "mention"
                                        if(notificationType == "cMention") {
                                            notificationType = "mention";
                                        }

                                        // add to db
                                        db.notifications.insert(data);

                                        // get the setting of the users preference if that type of notification should be sent
                                        flip.user.setting.get(forClientID, notificationType, "notification", (shouldSend) => {
                                            // set a variable indicating this
                                            pushData.alertDevice = shouldSend

                                            // get the user document of the user who is recieving the notification
                                            flip.user.get.raw(forClientID, (data1) => {
                                                // if all is okay
                                                if(data1.response == "OK") {
                                                    // set unread notifications count to the amount of unread notifications that user has
                                                    pushData.unreadNotifications = data1.data.info.meta.unreadNotifications

                                                    // send notification
                                                    flip.notification.send(pushData)
                                                }
                                            })
                                        })
                                    }
                                }
                            })
                        }
                    })
                }
            },
            remove: (type, postID, forClientID, fromClientID) => {
                let query = {}

                if(type == "follow") {
                    query = {
                        $and: [
                            {
                                "info.meta.detailType": type
                            },
                            {
                                "info.users.from": fromClientID
                            },
                            {
                                "info.users.for": forClientID
                            }
                        ]
                    }
                } else if(type == "like") {
                    query = {
                        $and: [
                            {
                                "info.meta.detailType": type
                            },
                            {
                                "data.postID": postID
                            },
                            {
                                "info.users.from": fromClientID
                            }
                        ]
                    }
                } else if(type == "comment") {
                    query = {
                        $and: [
                            {
                                "info.meta.detailType": type
                            },
                            {
                                "data.postID": postID
                            },
                            {
                                "info.users.from": fromClientID
                            }
                        ]
                    }
                }

                db.notifications.remove(query)

                db.users.update({
                    "info.clientID": forClientID
                }, {
                    $inc: {
                        "info.meta.unreadNotifications": 1
                    }
                })
            },
            send: (data) => {
                db.users.find({
                    "info.clientID": data.forClientID
                }, (err0, docs0) => {
                    if(!err0) {
                        if(docs0.length > 0) {
                            if(docs0[0].info.deviceToken !== null && docs0[0].info.deviceToken !== "") {
                                let deviceToken = docs0[0].info.deviceToken;
                                let note = new apn.Notification();

                                if(data.alertDevice || typeof data.alertDevice == "undefined") {
                                    note.mutableContent = 1;

                                    if(data.forPostID != "") {
                                        note.aps["attachment-url"] = `https://flip.wtf/thumbnails/${data.forPostID}.png`
                                        note.aps["imageIs3by4"] = true
                                    } else {
                                        note.aps["imageIs3by4"] = false
                                    }

                                    note.sound = "flip_sound";
                                    note.alert = data.body;

                                    if(data.title) {
                                        data.title.replace("{NAME}", docs0[0].profile.name)

                                        note.title = data.title;
                                    }
                                }

                                if(typeof note.badge !== "undefined") {
                                    note.badge = data.unreadNotifications
                                }

                                note.topic = "wtf.flip.ios";

                                productionAPNSProvider.send(note, deviceToken).then((result0) => {
                                    if(result0.failed.length > 0) {
                                        console.log("Failed! Attempting resend to developer device...");
                                        developmentAPNSProvider.send(note, deviceToken).then((result1) => {
                                            console.log(`Sent sent developer notification to ${docs0[0].info.username}!`)
                                        });
                                    } else {
                                        console.log(`Sent notification to ${docs0[0].info.username}!`)
                                    }
                                });
                            }
                        }
                    }
                })
            },
            sendToPoster: (body, postID) => {
                db.posts.find({
                    "info.postID": postID
                }, (err0, docs0) => {
                    if(!err0) {
                        if(docs0.length > 0) {
                            flip.notification.send(body, docs0[0].info.postedBy);
                        }
                    }
                })
            }
        },
        chat: {
            FL_LIVE_TYPING_KEYS: {},
            FL_LIVE_TYPING_USERS: {},
            user: {
                auth: (clientID, threadID, callback) => {
                    db.chat.find({
                        $and: [
                            {
                                "info.threadParticipents": clientID
                            },
                            {
                                "info.threadID": threadID
                            }
                        ]
                    }, (err0, docs0) => {
                        if(!err0) {
                            if(docs0.length > 0) {
                                callback(flip.tools.res.SUCCESS);
                            } else {
                                callback(flip.tools.res.NO_CHAT_AUTH);
                            }
                        } else {
                            callback(flip.tools.res.ERR);
                        }
                    })
                },
                threads: {
                    get: (clientID, index, callback) => {
                        db.chat.find({
                            "info.threadParticipents": clientID
                        }).sort({
                            "info.threadLastUpdatedAt": -1
                        }).skip(parseInt(index)).limit(10, (err0, docs0) => {
                            if(!err0) {
                                if(docs0.length > 0) {
                                    flip.chat.threads.handle.multi(docs0, clientID, 10, (data0) => {
                                        callback(data0);
                                    })
                                } else {
                                    callback(flip.tools.res.NO_DATA)
                                }
                            } else {
                                callback(flip.tools.res.ERR)
                            }
                        })
                    }
                }
            },
            threads: {
                handle: {
                    multi: (docs, clientID, totalMessageCount, callback) => {
                        let processed = docs.length;

                        docs.forEach((doc, i) => {
                            let participents = doc.info.threadParticipents;
                            let messages = doc.data.messages;
                            let messageCount = messages.length;

                            let liveTypingKey = md5(participents.join(doc.info.threadID))

                            doc.info.threadLiveTypingKey = liveTypingKey

                            if(typeof flip.chat.FL_LIVE_TYPING_KEYS[liveTypingKey] == "undefined") {
                                flip.chat.FL_LIVE_TYPING_KEYS[liveTypingKey] = doc.info.threadID;
                            }

                            doc.participents = {};

                            if(messages.length >= totalMessageCount) {
                                doc.data.messages = messages.slice(messages.length - totalMessageCount, messages.length)
                            }

                            doc.info.threadCreatedAgo = flip.tools.gen.tDef(moment(doc.info.threadCreatedAt).local().fromNow())

                            delete doc._id;

                            if(participents.length == 2) {
                                let otherParticipent = "";

                                if(participents[0] == clientID) {
                                    otherParticipent = participents[1]
                                } else {
                                    otherParticipent = participents[0]
                                }

                                flip.user.get.safe.clientID(otherParticipent, clientID, (data0) => {
                                    if(data0.response == "OK") {
                                        doc.participents[otherParticipent] = data0.data

                                        flip.chat.messages.handle.multi(doc.data.messages, clientID, (data1) => {
                                            if(data1.response == "OK") {
                                                doc.data.messages = data1.data

                                                processed--;
                                                if(processed == 0) {
                                                    callback({
                                                        response: "OK",
                                                        data: docs
                                                    })
                                                }
                                            } else {
                                                // error
                                            }
                                        })
                                    } else {
                                        // error
                                    }
                                })
                            }
                        })
                    }
                }
            },
            messages: {
                handle: {
                    multi: (docs, clientID, callback) => {
                        let processed = docs.length;

                        let newMessages = [];

                        if(docs.length > 0) {
                            docs.forEach((doc, i) => {
                                doc.info.messageSentAgo = flip.tools.gen.tDef(moment(doc.info.messageSentAt).local().fromNow())

                                newMessages.splice(0, 0, doc)

                                processed--;
                                if(processed == 0) {
                                    callback({
                                        response: "OK",
                                        data: newMessages
                                    })
                                }
                            })
                        } else {
                            callback({
                                response: "OK",
                                data: []
                            })
                        }
                    }
                }
            },
            thread: {
                create: (clientID, assocID, callback) => {
                    // check for existing chats, might have conflict in the future w/ group chats
                    db.chat.find({
                        $and: [
                            {
                                "info.threadParticipents": clientID
                            },
                            {
                                "info.threadParticipents": assocID
                            }
                        ]
                    }, (err0, docs0) => {
                        if(!err0) {
                            if(docs0.length == 0) {
                                let thread = {
                                    info: {
                                        threadID: flip.tools.gen.threadID(),
                                        threadCreatedAt: Date.now(),
                                        threadLastUpdatedAt: Date.now(),
                                        threadParticipents: [
                                            clientID,
                                            assocID
                                        ]
                                    },
                                    data: {
                                        messages: []
                                    }
                                }

                                db.chat.insert(thread, (err1, docs1) => {
                                    if(!err1) {
                                        flip.chat.threads.handle.multi([thread], clientID, 10, (data0) => {
                                            if(data0.response == "OK") {
                                                callback({
                                                    response: "OK",
                                                    data: data0.data[0]
                                                })
                                            } else {
                                                callback(flip.tools.res.ERR);
                                            }
                                        })
                                    } else {
                                        callback(flip.tools.res.ERR);
                                    }
                                })
                            } else {
                                flip.chat.threads.handle.multi(docs0, clientID, 10, (data0) => {
                                    callback(data0);
                                })
                            }
                        } else {
                            callback(flip.tools.res.ERR);
                        }
                    });
                },
                destroy: (threadID, callback) => {
                    db.chat.find({
                        "info.threadID": threadID
                    }, (err0, docs0) => {
                        if(!err0) {
                            if(docs0.length > 0) {
                                db.chat.remove({
                                    "info.threadID": threadID
                                }, (err1, docs1) => {
                                    if(!err1) {
                                        callback({
                                            response: "OK"
                                        })
                                    } else {
                                        callback(flip.tools.res.ERR)
                                    }
                                })
                            } else {
                                callback(flip.tools.res.NO_CHAT_AUTH)
                            }
                        } else {
                            callback(flip.tools.res.ERR)
                        }
                    })
                },
                get: (threadID, clientID, callback) => {
                    db.chat.find({
                        $and: [
                            {
                                "info.threadID": threadID
                            },
                            {
                                "info.threadParticipents": clientID
                            }
                        ]
                    }, (err0, docs0) => {
                        if(!err0) {
                            if(docs0.length > 0) {
                                flip.chat.threads.handle.multi(docs0, clientID, 100, (data0) => {
                                    data0.data = data0.data[0];

                                    callback(data0);
                                })
                            } else {
                                callback(flip.tools.res.NO_DATA)
                            }
                        } else {
                            callback(flip.tools.res.ERR)
                        }
                    })
                },
                gen: {
                    socketKey: (threadID, participents) => {
                        let key = md5(participents.join(threadID))

                        return key
                    }
                },
                message: {
                    send: (message, threadID, clientID, callback) => {
                        let messageData = {
                            info: {
                                messageID: flip.tools.gen.messageID(),
                                messageSentAt: Date.now(),
                                messageLastUpdatedAt: Date.now(),
                                messageSentBy: clientID,
                                meta: {
                                    type: "text"
                                }
                            },
                            data: {
                                content: message
                            }
                        }

                        db.chat.find({
                            "info.threadID": threadID
                        }, (err0, docs0) => {
                            if(!err0) {
                                if(docs0.length > 0) {
                                    let socketKey = flip.chat.thread.gen.socketKey(docs0[0].info.threadID, docs0[0].info.threadParticipents)

                                    for(i = 0; i < docs0[0].info.threadParticipents.length; i++) {
                                        let participentID = docs0[0].info.threadParticipents[i];

                                        if(participentID != clientID) {
                                            flip.notification.send({
                                                forClientID: participentID,
                                                title: "New Message from {NAME}",
                                                body: messageData.data.content
                                            })
                                        }
                                    }
                                }
                            }
                        })

                        db.chat.update({
                            "info.threadID": threadID
                        }, {
                            $set: {
                                "info.threadLastUpdatedAt": Date.now()
                            },
                            $push: {
                                "data.messages": messageData
                            }
                        }, (err0, docs0) => {
                            if(!err0) {
                                flip.chat.messages.handle.multi([messageData], clientID, (data0) => {
                                    if(data0.response == "OK") {



                                        callback({
                                            response: "OK",
                                            data: data0.data[0]
                                        })
                                    } else {
                                        callback({
                                            response: "OK",
                                            data: message
                                        })
                                    }
                                })
                            } else {
                                callback(flip.tools.res.ERR)
                            }
                        })
                    },
                    destroy: (messageID, threadID, clientID, callback) => {
                        db.chat.update({
                            "info.threadID": threadID
                        }, {
                            $pull: {
                                "data.messages": {
                                    $and: [
                                        {
                                            "info.messageID": messageID,
                                        },
                                        {
                                            "info.messageSentBy": clientID
                                        }
                                    ]
                                }
                            }
                        }, (err0, docs0) => {
                            if(!err0) {
                                callback({
                                    response: "OK"
                                })
                            } else {
                                callback(flip.tools.res.ERR)
                            }
                        })
                    }
                }
            }
        },
        tools: {
            res: {
                SUCCESS: {
                    response: "OK",
                    statusCode: 200
                },
                TEMP_SUSPENDED: {
                    response: "TEMP_SUSPENDED",
                    formattedTitle: "Temporarily Suspended",
                    formattedDesc: "Your account has been temporarily suspended.\n\nIf you think this has been done in error, please contact support@flip.wtf.",
                    statusCode: 401
                },
                ERR: {
                    response: "ERR",
                    formattedTitle: "An Error Occured",
                    formattedResponse: "Looks like an error occured, try again later.",
                    statusCode: 500
                },
                INVALID_LOGIN: {
                    response: "INPUT_NOT_VALID",
                    formattedTitle: "Email/Password Not Valid",
                    formattedResponse: "Your email or password is not valid. Please try again.",
                    statusCode: 406
                },
                NO_CHAT_AUTH: {
                    response: "NO_CHAT_AUTH",
                    formattedTitle: "No Chat Permissions",
                    formattedResponse: "You don't have permission to view or send messages to this chat.",
                    statusCode: 406
                },
                EMAIL_ALREADY_IN_USE: {
                    response: "EMAIL_ALREADY_IN_USE",
                    formattedTitle: "Email/Password Already In Use",
                    formattedResponse: "This email address is already being used by another account. Please try again.",
                    statusCode: 406
                },
                INVALID_CREDENTIALS: {
                    response: "CREDENTIALS_NOT_VALID",
                    formattedTitle: "Session Not Valid",
                    formattedResponse: "Your session is no longer valid. Please log back in.",
                    statusCode: 401
                },
                NO_ITEMS: {
                    response: "NO_ITEMS",
                    formattedTitle: "No Items Found",
                    formattedResponse: "Your query returned no items. Please adjust your query and try again.",
                    statusCode: 200
                },
                NO_DATA: {
                    response: "OK",
                    data: [],
                    meta: {
                        hasGotMoreItems: false
                    },
                    statusCode: 200
                },
                SERVICE_UNKNOWN: {
                    response: "SERVICE_UNKNOWN",
                    formattedTitle: "Service Unknown",
                    formattedResponse: "The service you tried to link was unknown, please try again later.",
                    statusCode: 404
                },
                NO_AUTH: {
                    response: "NO_AUTH",
                    formattedTitle: "Authentication Revoked",
                    formattedResponse: "As you are not authenticated, we've automatically logged you out, so please log in again.\n\nStill facing issues? Email support@flip.wtf and we'll help you out.",
                    statusCode: 401
                },
                ACCOUNT_ALREADY_EXISTS: {
                    response: "ACCOUNT_ALREADY_EXISTS",
                    formattedTitle: "Username/Email Already Exists",
                    formattedResponse: "An account with this username or email already exists.",
                    statusCode: 403
                },
                LOGIN_ERR: {
                    response: "LOGIN_ERR",
                    formattedTitle: "Email/Password Incorrect",
                    formattedResponse: "Your email or password is incorrect. Please try again.",
                    statusCode: 403
                },
                INSUFFICIANT_PARAMS: {
                    response: "INSUFFICIANT_PARAMS",
                    formattedTitle: "Insufficiant Parameters",
                    formattedResponse: "The parameters sent with this request were insufficiant. Please try again.",
                    statusCode: 400
                },
                INVALID_PARAMS: {
                    response: "INVALID_PARAMS",
                    formattedTitle: "Invalid Parameters",
                    formattedResponse: "The parameters sent with this request were invalid. Please try again.",
                    statusCode: 400
                },
                RESERVATION_ALREADY_EXISTS: {
                    response: "RESERVATION_ALREADY_EXISTS",
                    formattedTitle: "Reservation Already Exists",
                    formattedResponse: "This username/email has already been reserved. Try a different username or email.",
                    statusCode: 403
                },
                SETTINGS_NOT_VALID: {
                    response: "SETTINGS_NOT_VALID",
                    formattedTitle: "Settings Invalid",
                    formattedResponse: "The settings entered are not valid. Please look over the inputted settings and try again.",
                    statusCode: 400
                },
                USERNAME_INVALID_CHAR: {
                    response: "USERNAME_INVALID_CHAR",
                    formattedTitle: "Username Invalid",
                    formattedResponse: "Your username is invalid. It can only contain the following: \"0-9, a-z, A-Z, . _\".",
                    statusCode: 400
                },
                TWITTER_ACCOUNT_ALREADY_LINKED: {
                    response: "USER_LINKED_ACCOUNT",
                    formattedTitle: "Twitter Account In Use",
                    formattedResponse: "Another user has already linked this Twitter account to this flip account, please try again",
                    statusCode: 406
                },
                USERNAME_INVALID_LENGTH: {
                    prep: (inp) => {
                        return {
                            response: "USERNAME_INVALID",
                            formattedTitle: "Username Invalid",
                            formattedResponse: `Your username is invalid. It has to contain 15 or less characters. It is currently ${inp.length} characters long.`,
                            statusCode: 400
                        }
                    }
                },
                EMAIL_INVALID: {
                    response: "EMAIL_INVALID",
                    formattedTitle: "Email Invalid",
                    formattedResponse: "Your email is invalid. Please ensure it takes the form of a valid email address.",
                    statusCode: 400
                },
                PASSWORD_INVALID: {
                    response: "PASSWORD_INVALID",
                    formattedTitle: "Password Invalid",
                    formattedResponse: "Your password is invalid. It has to contain more than 5 characters and less than 100.",
                    statusCode: 400
                },
                SIGNUP_NEEDED: {
                    response: "SIGNUP_NEEDED",
                    formattedTitle: "Signup Needed",
                    formattedResponse: "",
                    statusCode: 200
                }
            },
            indexGradient: (arrayMaster, array) => {
                for(i = 0; i < arrayMaster.length; i++) {
                    if(typeof array !== "undefined") {
                        if(arrayMaster[i][0] == array[0]) {
                            if(arrayMaster[i][1] == array [1]) {
                                return i
                            }
                        }
                    }

                    if(i == arrayMaster.length) {
                        return 0
                    }
                }
            },
            validate: {
                message: (inp) => {
                    if(inp) {
                        if(inp.length > 0 && inp.length < 500) {
                            return true;
                        }
                    }

                    return false;
                },
                threadID: (inp) => {
                    if(inp) {
                        if(inp.length == 10) {
                            return true;
                        }
                    }

                    return false;
                },
                messageID: (inp) => {
                    if(inp) {
                        if(inp.length == 5) {
                            return true;
                        }
                    }

                    return false;
                },
                key: (inp) => {
                    if(inp) {
                        if(inp.length > 0 && inp.length < 30) {
                            return true;
                        }
                    }

                    return false;
                },
                query: (inp) => {
                    if(inp) {
                        if(inp.length > 0 && inp.length < 20) {
                            return true;
                        }
                    }

                    return false;
                },
                hashtag: (inp) => {
                    if(inp) {
                        if(inp.length > 0) {
                            inp = inp.replace("#", "")
                            if(/^[0-9a-zA-Z]+$/.test(inp)) {
                                return inp
                            }
                        }
                    }

                    return false;
                },
                serviceName: (inp) => {
                    if(inp) {
                        if(inp.length > 0 && inp.length < 50) {
                            if(inp == "twitter" || inp == "contacts") {
                                return true
                            }
                        }
                    }

                    return false
                },
                username: (inp) => {
                    if(inp) {
                        if(typeof inp == "string") {
                            if(inp.length > 0 && inp.length < 16) {
                                inp = inp.replace("@", "");
                                inp = inp.trim();

                                if(/^[0-9a-zA-Z_.-]+$/.test(inp)) {
                                    return true;
                                }
                            }
                        }
                    }

                    return false;
                },
                email: (inp) => {
                    if(inp) {
                        if(inp.length > 0 && inp.length < 100) {
                            inp = inp.trim();
                            if(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(inp)) {
                                return true;
                            }
                        }
                    }

                    return false;
                },
                password: (inp) => {
                    if(inp) {
                        if(inp.length > 8 && inp.length < 100) {
                            return true;
                        }
                    }

                    return false;
                },
                bio: (inp) => {
                    if(typeof inp === "string") {
                        if(inp.length < 140) {
                            return true;
                        }
                    }

                    return false;
                },
                clientID: (inp) => {
                    if(inp) {
                        if(inp.length == 15) {
                            return true;
                        }
                    }

                    return false;
                },
                sessionID: (inp) => {
                    if(inp) {
                        if(inp.length == 25 || inp.length == 75) {
                            return true;
                        }
                    }

                    return false;
                },
                postID: (inp) => {
                    if(inp) {
                        if(inp.length == 10) {
                            return true;
                        }
                    }

                    return false;
                },
                name: (inp) => {
                    if(inp) {
                        if(inp.length < 20 && /^[a-zA-Z ]+$/.test(inp)) {
                            return true;
                        }
                    }

                    return false;
                },
                caption: (inp) => {
                    if(inp.length < 150) {
                        return true;
                    }

                    return false;
                },
                comment: (inp) => {
                    if(inp) {
                        if(inp.length <= 500) {
                            return true;
                        }
                    }

                    return false;
                },
                commentID: (inp) => {
                    if(inp) {
                        if(inp.length == 5) {
                            return true;
                        }
                    }

                    return false;
                },
                index: (inp) => {
                    if(inp) {
                        if(inp.match(/^-{0,1}\d+$/)) {
                            return true;
                        }
                    }

                    return false;
                },
                json: (inp) => {
                    try {
                        JSON.parse(inp);
                    } catch (e) {
                        return false;
                    }

                    return true;
                }
            },
            gen: {
                name: (inp) => {
                    let name = inp;
                    let undSplitted = flip.tools.gen.splitAtCharacter(name, "_");
                    let dotSplitted = flip.tools.gen.splitAtCharacter(undSplitted, ".");
                    let trimmed = dotSplitted.trim().replace(/\s{2,}/g, " ");

                    return trimmed
                },
                splitAtCharacter: (string, char) => {
                    let splitted = string.split(char).map((word) => { return word[0].toUpperCase() + word.substr(1).toLowerCase(); }).join(" ");
                    return splitted
                },
                randomGradient: () => {
                    let index = Math.floor(Math.random() * gradients.length);
                    return gradients[index];
                },
                smart: (inp) => {
                    if(inp.length > 0) {
                        return inp.charAt(0).toUpperCase() + inp.substr(1);
                    } else {
                        return inp;
                    }
                },
                user: (username, email) => {
                    let clientID = flip.tools.gen.clientID();
                    let sessionID = flip.tools.gen.sessionID();

                    let token = flip.user.token.generate(clientID, sessionID)

                    return {
                        info: {
                            clientID: clientID,
                            username: username,
                            joinedAt: Date.now(),
                            meta: {
                                unreadNotifications: 0
                            }
                        },
                        security: {
                            sessionID: this.sessionID,
                            email: email,
                            isUsingJWTAuth: true,
                            token: token
                        },
                        profile: {
                            name: flip.tools.gen.name(username),
                            bio: "This user has no bio.",
                            profileImg: "https://cdn.nuyr.io/img/flip_defaultUserIcon.png",
                            gradient: flip.tools.gen.randomGradient(),
                            badges: [],
                            followers: [],
                            following: ["gcVKSxFv2hk3o8V"],
                            blocked: []
                        },
                        session: {
                            isLoggedIn: false,
                            lastLoggedOutAt: 0,
                            lastOpenedAppAt: Date.now(),
                            UUID: "",
                            lastUsedVersion: ""
                        },
                        services: {
                            connected: []
                        },
                        settings: {
                            notification: {
                                explore: true,
                                mention: true,
                                comment: true,
                                like: true,
                                follow: true
                            },
                            discovery: {
                                letFriendsFindMe: true,
                                allowFeatureOnExplore: true
                            }
                        }
                    }
                },
                numberWithCommas: (x) => {
                    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                },
                randomString: (length) => {
                    return flip.tools.gen.customRandomString(possible, length);
                },
                customRandomString: (lPossible, length) => {
                    let text = "";
                    for (let i = 0; i < length; i++) {
                        let newChar = lPossible.charAt(Math.floor(Math.random() * lPossible.length));
                        if (newChar == text[text.length - 1]) {
                            i--;
                        } else {
                            text += newChar;
                        }
                    }
                    return text;
                },
                clientID: (inp) => {
                    return flip.tools.gen.randomString(15);
                },
                sessionID: (inp) => {
                    return flip.tools.gen.randomString(75);
                },
                postID: () => {
                    return flip.tools.gen.randomString(10);
                },
                commentID: () => {
                    return flip.tools.gen.randomString(5);
                },
                bookmarkID: () => {
                    return flip.tools.gen.randomString(5);
                },
                cardID: () => {
                    return flip.tools.gen.randomString(5);
                },
                splitterID: () => {
                    return flip.tools.gen.randomString(5);
                },
                notificationID: () => {
                    return flip.tools.gen.randomString(5);
                },
                threadID: () => {
                    return flip.tools.gen.randomString(10);
                },
                messageID: () => {
                    return flip.tools.gen.randomString(5);
                },
                tDef: (inp) => {
                    let possibleT = [
                        "s",
                        "m",
                        "h",
                        "d",
                        "y"
                    ];

                    if(inp == "a few seconds ago") {
                        return "5s"
                    } else if(inp == "a minute ago") {
                        return "1m"
                    } else if(inp == "an hour ago") {
                        return "1h"
                    } else if(inp == "a day ago") {
                        return "1d"
                    } else if(inp == "a month ago") {
                        return "1mth"
                    } else if(inp == "a year ago") {
                        return "1y"
                    } else if(possibleT.indexOf(inp.split(" ")[1][0])) {
                        let timeType = inp.split(" ")[1][0];

                        if(timeType == "m") {
                            if(inp.indexOf("minute") == -1) {
                                timeType = "mth"
                            }
                        }

                        return inp.split(" ")[0] + timeType;
                    }
                }
            }
        },
        addFieldToAllDocs: () => {
            db.users.update({}, {
                $set: {
                    "security.isUsingJWTAuth": false,
                },
                $unset: {
                    "security.discovery": ""
                }
            }, { multi: true }, (err0, docs0) => {
                console.log(err0, docs0)
            })
        }
    };

    return flip;   
}
