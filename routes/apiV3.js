// EXPRESS
var express = require("express");
var app = express();
var router = express.Router();

// PROHIBITED USERNAMES
let prohibitedUsers = [
    "7Gqertfaqdgo1wN", //BabyMarina
    // "8cUybaUC0ZBPLv5" //william
]

// FS
let fs = require("fs");

// DATABASE CONFIG
let dbConfig = require("../config.json");

// MONGO JS
let mongojs = require("mongojs")
let db = mongojs(dbConfig.mDB, [ "users", "posts", "reservations", "featured", "reports", "hashtags", "bookmarks", "notifications" ])

// BCRYPT
let bcrypt = require("bcrypt");

// RANDOM POSSIBLE CHARACTERS
let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

// FFMPEG
let ffmpeg = require("fluent-ffmpeg");

// VALIDATOR
let validator = require("validator");

// MOMENT
let moment = require("moment");

// SHORT NUMBER
let shortNumber = require("short-number");

// SENDGRID
let sgMail = require("@sendgrid/mail");
sgMail.setApiKey(dbConfig.sgKey);

// TWIT
let Twit = require("twit");

// GRADIENTS
let gradients = [
    [
        "#9F041B",
        "#F5515F"
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
        "#0000FF",
        "#00C4FF"
    ],
    [
        "#BA00FE",
        "#F900D4"
    ],
    [
        "#EC5173",
        "#A000A5"
    ],
    [
        "#B06AB3",
        "#4568DC"
    ],
    [
        "#FF6A00",
        "#EE0979"
    ],
    [
        "#333399",
        "#FF00CC"
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
    for(var i = 0; i < this.length; i++) {
        if(this[i] == deleteValue) {
            this.splice(i, 1);
            i--;
        }
    }

    return this;
};

// FLIP
let flip = {
	auth: function(body, callback) {
		let clientID = body.clientID;
        let sessionID = body.sessionID;

		if(clientID && sessionID) {
            if(flip.tools.validate.clientID(clientID) && flip.tools.validate.sessionID(sessionID)) {
                db.users.find({
                    $and: [
                        {
                            "info.clientID": clientID,
                        },
                        {
                            "security.sessionID": sessionID
                        }
                    ]
                }, function(err0, docs0) {
                    if(!err0) {
                        if(docs0.length > 0) {
                            console.log("@" + docs0[0].info.username + " just made a request!")
    
                            flip.user.get.safe.clientID(clientID, clientID, function(data0) {
                                if(data0.response == "OK") {
                                    callback({
                                        response: "OK",
                                        data: data0.data
                                    });
                                } else {
                                    callback({
                                        response: "OK"
                                    });
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
                callback(flip.tools.res.INVALID_PARAMS);
            }
        } else {
            callback(flip.tools.res.INSUFFICIANT_PARAMS);
        }
    },
    admin: {
        auth: function(body, callback) {
            flip.auth(body, function(auth) {
                if(auth.response == "OK") {
                    db.admins.find({
                        "info.clientID": body.clientID
                    }, function(err0, docs0) {
                        if(!err0) {
                            if(docs0.length > 0) {
                                callback({
                                    response: "OK"
                                })
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
            get: function(clientID, callback) {
                db.users.find({}).limit(10).sort({
                    "info.joinedAt": -1
                }, function(err0, docs0) {
                    if(!err0) {
                        if(docs0.length > 0) {
                            var clientIDs = [];

                            for(i = 0; i < docs0.length; i++) {
                                clientIDs.splice(i, 0, docs0[i].info.clientID)

                                if(i == docs0.length - 1) {
                                    flip.user.get.multi.minified(clientIDs, 0, clientID, function(data0) {
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
            get: function(clientID, fromClientID, callback) {
                db.posts.find({
                    $and: [
                        {
                            "info.postedAt": {
                                $gt: Date.now() - (86400000)
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
                }).limit(10, function(err0, docs0) {
                    if(!err0) {
                        if(docs0.length > 0) {
                            flip.post.multi.handle(docs0, fromClientID, function(data0) {
                                if(data0.response == "OK") {
                                    callback(data0);
                                } else {
                                    callback({
                                        response: "OK",
                                        data: []
                                    })
                                }
                            })
                        } else {
                            callback({
                                response: "OK",
                                data: []
                            })
                        }
                    } else {
                        callback(flip.tools.res.ERR)
                    }
                })
            }
        }
    },
    onboarding: {
        get: function(callback) {
            flip.explore.latestID(function(feedID) {
                db.explore.find({
                    "info.feedID": feedID
                }).limit(1, function(err0, docs0) {
                    if(!err0) {
                        if(docs0.length > 0) {
                            var exploreLimit = 10
                            var exploreData = docs0[0].data

                            exploreData = exploreData.slice(0, 10)

                            if(exploreData.length > 0) {
                                var posts = []
                                var processed = exploreData.length

                                exploreData.forEach(function(doc, i) {
                                    if(doc.info.meta.type == "post") {
                                        flip.post.get(doc.info.postID, "", function(data0) {
                                            if(data0.response == "OK") {
                                                posts.push(data0.data)
                                            }

                                            processed--;
                                            if(processed == 0) {
                                                callback({
                                                    response: "OK",
                                                    data: posts
                                                })
                                            }
                                        })
                                    } else {
                                        processed--;
                                        if(processed == 0) {
                                            callback({
                                                response: "OK",
                                                data: posts
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
        latestID: function(callback) {
            db.explore.find({}).sort({
                "info.feedCreatedAt": -1
            }).limit(1, function(err0, docs0) {
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
        },
        create: {
            feed: function(callback) {
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
                }, function(err0, docs0) {
                    if(!err0) {
                        callback({
                            response: "OK"
                        })
                    } else {
                        callback(flip.tools.res.ERR)
                    }
                });
            },
            post: function(postID, callback) {
                flip.explore.latestID(function(feedID) {
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
                    }, function(err0, docs0) {
                        if(!err0) {
                            db.posts.find({
                                "info.postID": postID
                            }, function(err1, docs1) {
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

                            callback({
                                response: "OK"
                            })
                        } else {
                            callback(flip.tools.res.ERR)
                        }
                    })
                })
            },
            info: function(title, body, gradient, callback) {
                flip.explore.latestID(function(feedID) {
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
                    }, function(err0, docs0) {
                        if(!err0) {
                            callback({
                                response: "OK"
                            })
                        } else {
                            callback(flip.tools.res.ERR)
                        }
                    })
                })
            },
            user: function(username, callback) {
                db.users.find({
                    "info.username": username
                }, function(err0, docs0) {
                    if(!err0) {
                        if(docs0.length > 0) {
                            flip.explore.latestID(function(feedID) {
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
                                }, function(err1, docs1) {
                                    if(!err1) {
                                        callback({
                                            response: "OK"
                                        })
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
            splitter: function(callback) {
                flip.explore.latestID(function(feedID) {
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
                    }, function(err0, docs0) {
                        if(!err0) {
                            callback({
                                response: "OK"
                            })
                        } else {
                            callback(flip.tools.res.ERR)
                        }
                    })
                })
            }
        },
        delete: function(cardID, callback) {
            flip.explore.latestID(function(feedID) {
                db.explore.find({
                    "info.feedID": feedID
                }, function(err0, docs0) {
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
                    }, function(err1, docs1) {
                        if(!err1) {
                            callback({
                                response: "OK"
                            })
                        } else {
                            callback(flip.tools.res.ERR)
                        }
                    })
                })
            })
        },
        rearrange: function(cardID, newIndex, callback) {
            flip.explore.latestID(function(feedID) {
                let query = {
                    "info.feedID": feedID
                }

                db.explore.find(query, function(err0, docs0) {
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
                                }, function(err1, data1) {
                                    if(!err1) {
                                        db.explore.update(query, {
                                            $push: {
                                                "data": {
                                                    $each: [ oldElem ],
                                                    $position: parseInt(newIndex)
                                                }
                                            }
                                        }, function(err2, data2) {
                                            if(!err2) {
                                                callback({
                                                    response: "OK"
                                                })
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
        compile: function(data, clientID, hasGotMoreItems, callback) {
            var processed = data.length;

            var meta = {
                hasGotMoreItems: hasGotMoreItems
            }

            data.forEach(function(doc, i) {
                if(doc != null) {
                    if(doc.info.meta.type == "post") {
                        flip.post.get(doc.info.postID, clientID, function(data0) {
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
                                    meta: meta
                                })
                            }
                        })
                    } else if(doc.info.meta.type == "user") {
                        flip.user.get.safe.clientID(doc.info.clientID, clientID, function(data0) {
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
                                    meta: meta
                                })
                            }
                        })
                    } else if(doc.info.meta.type == "trending") {
                        flip.hashtag.get(function(data0) {
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
                                    meta: meta
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
                                meta: meta
                            })
                        }
                    } else {
                        processed--;

                        if(processed == 0) {
                            callback({
                                response: "OK",
                                data: data.clean(null),
                                meta: meta
                            })
                        }
                    }
                } else {
                    processed--;

                    if(processed == 0) {
                        callback({
                            response: "OK",
                            data: data.clean(null),
                            meta: meta
                        })
                    }
                }
            })
        },
        get: function(clientID, index, inf, callback) {
            flip.explore.latestID(function(feedID) {
                db.explore.find({
                    "info.feedID": feedID
                }).limit(1, function(err0, docs0) {
                    if(!err0) {
                        if(docs0.length > 0) {
                            var exploreLimit = 10
                            var exploreData = docs0[0].data

                            if(!inf) {
                                exploreData = exploreData.slice(parseInt(index), parseInt(index) + 10)
                            }

                            if(exploreData.length > 0) {
                                flip.explore.compile(exploreData, clientID, !(exploreData.length < 10), function(data0) {
                                    if(data0.response == "OK") {
                                        callback(data0)
                                    } else {
                                        callback(data0)
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
	user: {
        service: {
            get: {
                contacts: function(clientID, emailAddresses, callback) {
                    db.users.find({
                        "security.email": {
                            $in: emailAddresses
                        }
                    }, function(err0, docs0) {
                        if(!err0) {
                            if(docs0.length > 0) {
                                let clientIDs = [];
                                var processed = docs0.length;

                                for(i = 0; i < docs0.length; i++) {
                                    clientIDs.push(docs0[i].info.clientID);

                                    processed--;
                                    if(processed == 0) {
                                        flip.user.get.multi.minified(clientIDs, 0, clientID, function(data0) {
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
                twitter: function(clientID, callback) {
                    flip.user.get.raw(clientID, function(data0) {
                        if(data0.response == "OK") {
                            let data = data0.data;

                            let connectedServices = data.services.connected;

                            if(connectedServices.includes("twitter")) {
                                let credentials = data.services["twitter"];

                                var T = new Twit({
                                    consumer_key: dbConfig.twitter.consumer_key,
                                    consumer_secret: dbConfig.twitter.consumer_secret,
                                    access_token: credentials.accessToken,
                                    access_token_secret: credentials.accessTokenSecret
                                })

                                T.get("account/verify_credentials", function(err1, data1, res1) {
                                    if(!err1) {
                                        if(data1.friends_count > 0) {
                                            let userID = data1.id;

                                            T.get("friends/ids", { user_id: userID }, function(err2, data2, res2) {
                                                if(!err2) {
                                                    let following = data2.ids;

                                                    db.users.find({
                                                        "services.twitter.userID": {
                                                            $in: following
                                                        }
                                                    }, function(err3, docs3) {
                                                        if(!err3) {
                                                            flip.user.get.multi.raw(docs3, clientID, function(data4) {
                                                                callback(data4);
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
                                            callback(flip.tools.res.NO_DATA);
                                        }
                                    } else {
                                        callback(flip.tools.res.ERR);
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
            connect: function(clientID, data, callback) {
                let name = data.name;
                let token = data.tokens.token;
                let secret = data.tokens.secret;

                let id = name.toLowerCase();

                if(id == "twitter") {
                    var T = new Twit({
                        consumer_key: dbConfig.twitter.consumer_key,
                        consumer_secret: dbConfig.twitter.consumer_secret,
                        access_token: token,
                        access_token_secret: secret
                    })

                    T.get("account/verify_credentials", function(err0, data0, res0) {
                        if(!err0) {
                            let userID = data0.id;

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
                            }, function(err1, docs1) {
                                if(!err1) {
                                    callback({
                                        response: "OK"
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
                    callback(flip.tools.res.SERVICE_UNKNOWN)
                }
            },
            disconnect: function(clientID, data, callback) {
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
                }, function(err0, docs0) {
                    if(!err0) {
                        callback({
                            response: "OK"
                        });
                    } else {
                        callback(flip.tools.res.ERR);
                    }
                })
            }
        },
        settings: {
            get: function(clientID, callback) {
                // flip.user.get.raw(clientID, function(data0) {
                //     if(data0.response == "OK") {

                //     } else {}
                // })
                db.users.find({
                    "info.clientID": clientID
                }, function(err0, docs0) {
                    if(!err0) {
                        if(docs0.length > 0) {
                            let selectedGradientIndex = flip.tools.indexGradient(gradients, docs0[0].profile.gradient)

                            callback({
                                response: "OK",
                                data: {
                                    name: docs0[0].profile.name,
                                    bio: docs0[0].profile.bio,
                                    gradients: {
                                        type: "gradient",
                                        selectedIndex: selectedGradientIndex,
                                        gradients: gradients
                                    },
                                    connectedServices: docs0[0].services.connected,
                                    settings: docs0[0].settings
                                }
                            });
                        } else {
                            callback(flip.tools.res.NO_ITEMS);
                        }
                    } else {
                        callback(flip.tools.res.ERR);
                    }
                })
            },
            update: function(clientID, settings, callback) {
				var masterSettings = {};
                var hasUpdated = false;

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
                    }, function(err0, docs0) {
                        if(!err0) {
                            callback({
                                response: "OK"
                            })
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
            get: function (clientID, key, type, callback) {
                flip.user.get.raw(clientID, function(data0) {
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
            set: function(clientID, key, state, type, callback) {
                var data = {
                    $set: {}
                };

                data["$set"]["settings." + type + "." + key] = state;
                
                db.users.update({
                    "info.clientID": clientID
                }, data, function(err0, docs0) {
                    if(!err0) {
                        callback({
                            response: "OK"
                        });
                    } else {
                        callback(flip.tools.res.ERR);
                    }
                });
            }
        },
        get: {
            raw: function(clientID, callback) {
                db.users.find({
                    "info.clientID": clientID
                }, function(err, docs) {
                    if(!err) {
                        if(docs.length > 0) {
                            callback({
                                response: "OK",
                                data: docs[0]
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
                clientID: function(clientID, requesterClientID, callback) {
                    db.users.find({
                        "info.clientID": clientID
                    }, function(err0, docs0) {
                        if(!err0) {
                            if(docs0.length > 0) {
                                if(docs0[0].profile.blocked.indexOf(requesterClientID) == -1) {
                                    db.posts.find({
                                        "info.postedBy": clientID
                                    }).count(function(err1, docs1) {
                                        if(!err1) {
                                            db.users.find({
                                                "info.clientID": requesterClientID
                                            }, function(err2, docs2) {
                                                if(!err2) {
                                                    var safeData = {};
                                                    var isFollowing = (docs0[0].profile.followers.indexOf(requesterClientID) > -1);
                                                    var followsYou = (docs0[0].profile.following.indexOf(requesterClientID) > -1);
                                                    var isBlocked = (docs2[0].profile.blocked.indexOf(clientID) > -1);

                                                    safeData.info = {
                                                        clientID: docs0[0].info.clientID,
                                                        username: docs0[0].info.username,
                                                        joinedAt: docs0[0].info.joinedAt,
                                                        meta: {
                                                            type: "user",
                                                            isFollowing: isFollowing,
                                                            followsYou: followsYou,
                                                            isBlocked: isBlocked,
                                                            hasUnreadNotifications: false
                                                        }
                                                    }

                                                    docs0[0].profile.posts = docs1;
                                                    docs0[0].profile.followers = docs0[0].profile.followers.length;
                                                    docs0[0].profile.following = docs0[0].profile.following.length;
                                                    delete docs0[0].profile.blocked;
                                                    
                                                    if(docs0[0].profile.bio == "This user has no bio.") {
                                                        docs0[0].profile.bio = "";
                                                    }

                                                    safeData.profile = docs0[0].profile;

                                                    callback({
                                                        response: "OK",
                                                        data: safeData
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
                username: function(username, requesterClientID, callback) {
                    db.users.find({
                        "info.username": new RegExp(["^", username, "$"].join(""), "i")
                    }, function(err0, docs0) {
                        if(!err0) {
                            if(docs0.length > 0) {
                                flip.user.get.safe.clientID(docs0[0].info.clientID, requesterClientID, function(data0) {
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
            bookmarks: function(clientID, index, callback) {
                db.bookmarks.find({
                    "info.bookmarkedBy": clientID
                }).skip(parseInt(index)).limit(parseInt(index) + 20).sort({
                    "info.bookmarkedAt": -1
                }, function(err0, docs0) {
                    if(!err0) {
                        if(docs0.length > 0) {
                            var postIDs = []

                            docs0.forEach(function(cDoc, i) {
                                postIDs.splice(i, 0, cDoc.data.postID)

                                if(i == docs0.length - 1) {
                                    db.posts.find({
                                        "info.postID": {
                                            $in: postIDs
                                        }
                                    }).sort({
                                        "info.postedAt": -1
                                    }, function(err1, docs1) {
                                        if(!err1) {
                                            if(docs1.length > 0) {
                                                flip.post.multi.handle(docs1, clientID, function(data0) {
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
            posts: function(clientID, index, fromClientID, callback) {
                db.posts.find({
                    "info.postedBy": clientID
                }).sort({
                    "info.postedAt": -1
                }).skip(parseInt(index)).limit(20, function(err0, docs0) {
                    if(!err0) {
                        if(docs0.length > 0) {
                            flip.post.multi.handle(docs0, fromClientID, function(docs2) {
                                callback(docs2);
                            });
                        } else {
                            callback({
                                response: "OK",
                                data: []
                            });
                        }
                    } else {
                        callback(flip.tools.res.ERR);
                    }
                });
            },
            multi: {
                raw: function(docs, clientID, callback) {
                    var result = [];
                    var max0 = docs.length;
                    var hasGotMoreItems = (docs.length > 9);

                    flip.user.get.raw(clientID, function(data0) {
                        if(data0.response == "OK") {
                            let user = data0.data;

                            docs.forEach(function(doc, i) {
                                if(doc.profile.blocked.indexOf(clientID) == -1) {
                                    var isFollowing = doc.profile.followers.indexOf(clientID) > -1;
                                    var isBlocked = user.profile.blocked.indexOf(doc.info.clientID) > -1;
        
                                    let info = {
                                        clientID: doc.info.clientID,
                                        username: doc.info.username,
                                        joinedAt: doc.info.joinedAt,
                                        meta: {
                                            type: "user",
                                            isFollowing: isFollowing,
                                            isBlocked: isBlocked
                                        }
                                    };
        
                                    let profile = {
                                        name: doc.profile.name,
                                        profileImg: doc.profile.profileImg,
                                        gradient: doc.profile.gradient,
                                        verified: doc.profile.verified
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
                                            }
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
                                            }
                                        })
                                    }
                                }
                            })
                        }
                    })
                },
                minified: function(clientIDs, index, clientID, callback) {
                    db.users.find({
                        "info.clientID": clientID
                    }, function(err0, docs0) {
                        if(!err0) {
                            if(docs0.length > 0) {
                                db.users.find({
                                    "info.clientID": {
                                        $in: clientIDs
                                    }
                                }).skip(parseInt(index)).limit(10, function(err1, docs1) {
                                    if(!err1) {
                                        if(docs1.length > 0) {
                                            flip.user.get.multi.raw(docs1, clientID, function(data0) {
                                                callback(data0);
                                            })
                                        } else {
                                            callback({
                                                response: "OK",
                                                data: [],
                                                meta: {
                                                    hasGotMoreItems: false
                                                }
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
                                    meta: {
                                        hasGotMoreItems: false
                                    }
                                });
                            }
                        } else {
                            callback(flip.tools.res.ERR);
                        }
                    })
                },
                search: function(query, index, clientID, callback) {
                    if(query.length > 0) {
                        let searchRe = new RegExp("^" + query, "i");

                        db.users.find({
                            $or: [
                                {
                                    "info.username": searchRe
                                },
                                {
                                    "profile.name": searchRe
                                }
                            ]
                        }).limit(10, function(err, docs) {
                            if(!err) {
                                if(docs.length > 0) {
                                    var processing = docs.length;
                                    let clientIDs = [];

                                    flip.user.get.multi.raw(docs, clientID, function(data0) {
                                        callback(data0);
                                    })

                                    // for(i = 0; i < docs.length; i++) {

                                    //     clientIDs.push(docs[i].info.clientID);

                                    //     processing--;
                                    //     if(processing == 0) {
                                    //         flip.user.get.multi.minified(clientIDs, index, clientID, function(data0) {
                                    //             // data0.data = data0.data.concat(flip.user.get.multi.prepare(query))
                                    //             if(data0.response == "OK") {
                                    //                 callback({
                                    //                     response: "OK",
                                    //                     data: data0.data
                                    //                 })
                                    //             } else {
                                    //                 callback(flip.tools.res.ERR);
                                    //             }
                                    //         })
                                    //     }
                                    // }
                                } else {
                                    callback({
                                        response: "OK",
                                        data: []
                                    });
                                }
                            } else {
                                callback(flip.tools.res.ERR);
                            }
                        });
                    } else {
                        callback({
                            response: "OK",
                            data: []
                        });
                    }
                },
                prepare: function(query) {
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
                                title: "@" + query.replace("@", "")
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
                                title: "#" + query.replace("#", "")
                            }
                        }
                    ];
                }
            }
        },
        bookmark: {
            create: function(postID, clientID, callback) {
                db.bookmarks.insert({
                    info: {
                        bookmarkID: flip.tools.gen.bookmarkID(),
                        bookmarkedBy: clientID,
                        bookmarkedAt: Date.now()
                    },
                    data: {
                        postID: postID
                    }
                }, function(err0, docs0) {
                    if(!err0) {
                        callback({
                            response: "OK"
                        });
                    } else {
                        callback(flip.tools.res.ERR);
                    }
                });
            },
            destroy: function(postID, clientID, callback) {
                db.bookmarks.remove({
                    $and: [
                        {
                            "data.postID": postID
                        },
                        {
                            "info.bookmarkedBy": clientID
                        }
                    ]
                }, function(err0, docs0) {
                    if(!err0) {
                        callback({
                            response: "OK"
                        });
                    } else {
                        callback(flip.tools.res.ERR);
                    }
                });
            }
        },
        block: {
            create: function(forClientID, fromClientID, callback) {
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
                }, function(err0, docs0) {
                    if(!err0) {
                        callback({
                            response: "OK"
                        });
                    } else {
                        callback(flip.tools.res.ERR);
                    }
                })
            },
            destroy: function(forClientID, fromClientID, callback) {
                db.users.update({
                    "info.clientID": fromClientID
                }, {
                    $pull: {
                        "profile.blocked": forClientID,
                        "profile.followers": forClientID
                    }
                }, function(err0, docs0) {
                    if(!err0) {
                        callback({
                            response: "OK"
                        });
                    } else {
                        callback(flip.tools.res.ERR);
                    }
                })
            }
        },
        update: {
            deviceToken: function(clientID, deviceToken) {
                db.users.update({
                    "info.clientID": clientID
                }, {
                    $set: {
                        "info.deviceToken": deviceToken
                    }
                });
            },
            email: function(clientID, email, callback) {
                db.users.find({
                    "security.email": email
                }, function(err0, docs0) {
                    if(!err0) {
                        if(docs0.length == 0) {
                            db.users.update({
                                "info.clientID": clientID
                            }, {
                                $set: {
                                    "security.email": email
                                }
                            }, function(err1, docs1) {
                                if(!err1) {
                                    callback({
                                        response: "OK"
                                    });
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
            username: function(clientID, username, callback) {
                flip.user.get.raw(clientID, function(data0) {
                    if(data0.response == "OK") {
                        if(username.toLowerCase() == data0.data.info.username.toLowerCase()) {
                            db.users.update({
                                "info.clientID": clientID
                            }, {
                                $set: {
                                    "info.username": username
                                }
                            }, function(err1, docs1) {
                                if(!err1) {
                                    callback({
                                        response: "OK"
                                    });
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
            get: function(clientID, index, requesterClientID, callback) {
                db.users.find({
                    "info.clientID": clientID
                }, function(err0, docs0) {
                    if(!err0) {
                        if(docs0.length > 0) {
                            var followers = docs0[0].profile.followers;
                            var following = docs0[0].profile.following;

                            var relationships = {
                                followers: [],
                                following: []
                            };

                            var hasGotMoreItems = false;

                            flip.user.get.multi.minified(followers, index, requesterClientID, function(data0) {
                                if(data0.data != null) {
                                    relationships.followers = data0.data;

                                    if(data0.meta.hasGotMoreItems) {
                                        hasGotMoreItems = data0.meta.hasGotMoreItems;
                                    }
                                }

                                flip.user.get.multi.minified(following, index, requesterClientID, function(data1) {
                                    if(data1.data != null) {
                                        relationships.following = data1.data;

                                        if(data1.meta.hasGotMoreItems) {
                                            hasGotMoreItems = data1.meta.hasGotMoreItems;
                                        }
                                    }

                                    callback({
                                        response: "OK",
                                        data: relationships,
                                        meta: {
                                            hasGotMoreItems: hasGotMoreItems
                                        }
                                    });
                                });
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
		login: function(email, password, callback) {
			db.users.find({
				$and: [
					{
						"security.email": email
					}
				]
			}, function(err, docs) {
				if(!err) {
					if(docs.length > 0) {
						if(bcrypt.compareSync(password, docs[0].security.password)) {
							callback({
								response: "OK",
								data: {
									clientID: docs[0].info.clientID,
									sessionID: docs[0].security.sessionID
								}
							})
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
        create: function(username, email, password, callback) {
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
			}, function(err, docs) {
				if(!err) {
					if(docs.length == 0) {
						flip.user.reservation.check(username, email, function(data0) {
							if(data0.response == "OK") {
								let saltRounds = 10;
								let salt = bcrypt.genSaltSync(saltRounds);
                                let hash = bcrypt.hashSync(password, salt);

                                let userObj = flip.tools.gen.user(username, email);

								userObj.security.password = hash

                                db.users.insert(userObj);

                                db.users.update({
                                    "info.clientID": "gcVKSxFv2hk3o8V"
                                }, {
                                    $push: {
                                        "profile.followers": userObj.info.clientID
                                    }
                                })

								let msg = {
									to: email,
									from: "flip <support@flip.wtf>",
									subject: "👋 Welcome to flip, @" + username + "!",
									html: `
										<img src="https://flip.wtf/assets/img/flip_logoDark.png" style="height: 100px" />
										<h3>Hey @` + username + `, welcome to flip!</h3>
										We're so happy that you're here. If you need any help, just email us at <a href="mailto:support@flip.wtf">support@flip.wtf</a> and we'll be happy to help.</br>
										We can't wait to see what you post on flip. See you there!</br></br>
										-Team Flip
									`
								}

								sgMail.send(msg)

								callback({
									response: "OK"
								});
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
        auth: function(clientID, sessionID, callback) {
			flip.user.get(clientID, function(data0) {
				if(data0.response == "OK") {
					if(data0.data[0].security.sessionID == sessionID) {
                        console.log(data0.data[0].info.username + " just made a request!")
						callback({
							response: "OK"
						});
					} else {
						callback(flip.tools.res.INVALID_CREDENTIALS);
					}
				} else {
					callback(data0);
				}
			})
		},
		reservation: {
			create: function(username, email, callback) {
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
				},function(err0, docs0) {
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

							callback({
								response: "OK"
							});
						} else {
							callback(flip.tools.res.RESERVATION_ALREADY_EXISTS);
						}
					} else {
						callback(flip.tools.res.ERR);
					}
				});
			},
			check: function(username, email, callback) {
				db.reservations.find({
					$or: [
						{
							"data.username": username
						},
						{
							"data.email": email
						}
					]
				}, function(err0, docs0) {
					if(!err0) {
						if(docs0.length > 0) {
							var hasCalledback = false;
							for(i = 0; i < docs0.length; i++) {
								if(docs0[i].data.username.trim() == username.trim() && docs0[i].data.email.trim() == email.trim()) {
									if(!hasCalledback) {
										hasCalledback = true;
										callback({
											response: "OK"
										});
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
							callback({
								response: "OK"
							});
						}
					} else {
						callback(flip.tools.res.ERR);
					}
				});
			}
		},
		interaction: {
			follow: function(clientID, otherClientID, callback) {
                flip.notification.create("", "follow", "", otherClientID, clientID)

				db.users.update({
					"info.clientID": otherClientID
				}, {
					$addToSet: {
						"profile.followers": clientID
					}
				}, function(err0, docs0) {
					if(!err0) {
						flip.user.get.raw(clientID, function(data0) {
							if(data0.response == "OK") {
								flip.notification.send("@" + data0.data.info.username + " just followed you", otherClientID);
							}
						});
					}
				});

				db.users.update({
					"info.clientID": clientID
				},
				{
					$addToSet: {
						"profile.following": otherClientID
					}
				}, function(err0, docs0) {
					if(!err0) {
						callback({
                            response: "OK"
                        });
					} else {
						callback(flip.tools.res.ERR);
					}
				});
			},
			unfollow: function(clientID, otherClientID, callback) {
                flip.notification.remove("follow", null, otherClientID, clientID)

				db.users.update({
					"info.clientID": otherClientID
				}, {
					$pull: {
						"profile.followers": clientID
					}
				});

				db.users.update({
					"info.clientID": clientID
				},{
					$pull: {
						"profile.following": otherClientID
					}
				}, function(err, docs0) {
					if(!err) {
						callback({
                            response: "OK"
                        });
					} else {
						callback(flip.tools.res.ERR);
					}
				});
			}
		}
    },
    hashtag: {
        get: function(callback) {
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
            }).limit(15, function(err0, docs0) {
                if(!err0) {
                    if(docs0.length > 0) {
                        var processed = docs0.length;

                        for(i = 0; i < docs0.length; i++) {
                            docs0[i].data.posts = docs0[i].data.uses.last24h + ""

                            delete docs0[i]._id;

                            processed--;
                            if(processed == 0) {
                                callback({
                                    response: "OK",
                                    data: docs0
                                })
                            }
                        }
                    } else {
                        callback({
                            response: "OK",
                            data: []
                        });
                    }
                } else {
                    callback(flip.tools.res.ERR);
                }
            });
        },
        create: function(hashtag) {
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
        remove: function(hashtag) {
            hashtag = hashtag.toLowerCase()

            if(hashtag.length > 0) {
                db.hashtags.find({
                    "data.hashtag": hashtag
                }, function(err0, docs0) {
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
        use: function(hashtag) {
            if(hashtag.length > 0) {
                hashtag = hashtag.toLowerCase()

                db.hashtags.find({
                    "data.hashtag": hashtag
                }, function(err0, docs0) {
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
		get: function(postID, fromClientID, callback) {
			db.posts.find({
				"info.postID": postID
			}, function(err, docs0) {
				if(!err) {
					if(docs0.length > 0) {
						flip.post.multi.handle(docs0, fromClientID, function(data0) {
							if(data0.response == "OK") {
								if(data0.data.length > 0) {
                                    callback({
                                        response: "OK",
                                        data: data0.data[0]
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
            hashtag: function(hashtag, index, clientID, callback) {
                hashtag = hashtag.toLowerCase()

                db.posts.find({
                    "data.caption": {
                        $regex: new RegExp(".*#" + hashtag + ".*", "i")
                    },
                }).sort({
                    "data.uses.last24h": -1,
                }).skip(parseInt(index)).limit(10, function(err0, docs0) {
                    if(!err0) {
                        if(docs0.length == 0) {
                            callback({
                                response: "OK",
                                data: []
                            });
                        } else {
                            flip.post.multi.handle(docs0, clientID, function(data0) {
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
            handle: function(docs, cID, callback) {
                var dataCount = docs.length;
                var hasGotMorePosts = (docs.length > 9)

                docs.forEach(function(cDoc, i) {
                    if(cDoc.info.meta.type == "post") {
                        db.users.find({
                            "info.clientID": cDoc.info.postedBy
                        }, function(err0, uDocs) {
                            if(!err0) {
                                if(uDocs.length > 0) {
                                    if(uDocs[0].profile.blocked.indexOf(cID) == -1) {
                                        flip.post.comments.count(cDoc.info.postID, function(data0) {
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
                                                }, function(err1, docs1) {
                                                    if(!err1) {
                                                        cDoc.profile = {
                                                            name: uDocs[0].profile.name,
                                                            username: uDocs[0].info.username,
                                                            profileImg: uDocs[0].profile.profileImg,
                                                            gradient: uDocs[0].profile.gradient,
                                                            verified: uDocs[0].profile.verified
                                                        }

                                                        // v1 translation
                                                        if(typeof cDoc.data.stats === "undefined" || typeof cDoc.data.stats.raw === "undefined") {
                                                            cDoc.data.stats = {
                                                                raw: {
                                                                    views: cDoc.data.views
                                                                },
                                                                detailed: {
                                                                    likedBy: cDoc.data.likedBy,
                                                                    sLikedBy: cDoc.data.sLikedBy
                                                                }
                                                            }
                                                        }

                                                        cDoc.info = {
                                                            postID: cDoc.info.postID,
                                                            postedBy: cDoc.info.postedBy,
                                                            postedAt: cDoc.info.postedAt,
                                                            time: {
                                                                date: {
                                                                    time: moment(cDoc.info.postedAt).format("h:m a"),
                                                                    date: moment(cDoc.info.postedAt).format("Do MMMM YYYY"),
                                                                },
                                                                formatted: {
                                                                    short: flip.tools.gen.tDef(moment(cDoc.info.postedAt).local().fromNow()),
                                                                    long: moment(cDoc.info.postedAt).local().fromNow()
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

                                                        cDoc.data = {
                                                            caption: cDoc.data.caption,
                                                            streamURL: "https://api.flip.wtf/v3/post/stream/" + cDoc.info.postID,
                                                            thumbURL: "https://api.flip.wtf/v3/post/thumb/" + cDoc.info.postID,
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

                                                        dataCount--;
                                                        
                                                        if(dataCount == 0) {
                                                            callback({
                                                                response: "OK",
                                                                data: docs.clean(null),
                                                                meta: {
                                                                    hasGotMoreItems: hasGotMorePosts
                                                                }
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
                                                }
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
                                    }
                            });
                        }
                    }
                });
            }
        },
		view: function(postID, callback) {
			db.posts.update({
				"info.postID": postID
			}, {
				$inc: {
					"data.stats.raw.views": 1
				}
			}, function(err0, docs0) {
				if(!err0) {
					callback({
						response: "OK"
					});
				} else {
					callback(flip.tools.res.ERR)
				}
			});
        },
        likes: {
            get: function(postID, index, clientID, callback) {
                db.posts.find({
                    "info.postID": postID
                }, function(err0, docs0) {
                    if(!err0) {
                        if(docs0.length > 0) {
                            flip.user.get.multi.minified(docs0[0].data.stats.detailed.likedBy, index, clientID, function(data0) {
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
            get: function(postID, index, clientID, callback) {
                db.comments.find({
                    "info.commentedOn": postID
                }).sort({
                    "info.commentedAt": -1
                }).skip(parseInt(index)).limit(10, function(err0, docs0) {
                    if(!err0) {
                        if(docs0.length > 0) {
                            var comments = docs0;
                            if(comments.length > 0) {
                                flip.post.comments.multi.handle(comments, clientID, function(data1) {
                                    if(data1.response == "OK") {
                                        callback({
                                            response: "OK",
                                            data: data1.data
                                        })
                                    } else {
                                        callback(data1);
                                    }
                                });
                            } else {
                                callback({
                                    response: "OK",
                                    data: []
                                });
                            }
                        } else {
                            callback({
                                response: "OK",
                                data: []
                            });
                        }
                    } else {
                        callback({
                            response: "ERR0"
                        });
                    }
                });
            },
            multi: {
                handle: function(comments, clientID, callback) {
                    var dataCount = comments.length;
                    var hasGotMoreItems = (comments.length > 9)

                    comments.forEach(function(cDoc, i) {
                        db.users.find({
                            "info.clientID": cDoc.info.commentedBy
                        }, function(err, uDocs) {
                            if(!err) {
                                if(uDocs.length > 0) {
                                    if(uDocs[0].profile.blocked.indexOf(clientID) == -1) {
                                        cDoc.info.commentedAgo = flip.tools.gen.tDef(moment(cDoc.info.commentedAt).local().fromNow())
                                        cDoc.info.commentedAgoLong = moment(cDoc.info.commentedAt).local().fromNow()

                                        cDoc.info.meta = {
                                            "type": "comment"
                                        }

                                        cDoc.profile = {
                                            name: uDocs[0].profile.name,
                                            username: uDocs[0].info.username,
                                            profileImg: uDocs[0].profile.profileImg,
                                            gradient: uDocs[0].profile.gradient,
                                            verified: uDocs[0].profile.verified
                                        }

                                        dataCount--;
                                        if(dataCount == 0) {
                                            callback({
                                                response: "OK",
                                                data: comments.clean(null),
                                                meta: {
                                                    hasGotMoreItems: hasGotMoreItems
                                                }
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
                                                }
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
                                            }
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
                                        }
                                    });
                                }
                            }
                        });
                    });
                }
            },
            count: function(postID, callback) {
                db.comments.find({
                    "info.commentedOn": postID
                }).count(function(err0, docs0) {
                    if(!err0) {
                        callback({
                            response: "OK",
                            data: {
                                commentCount: docs0
                            }
                        })
                    } else {
                        callback({
                            response: "OK",
                            data: {
                                commentCount: 0
                            }
                        })
                    }
                });
            }
        },
        caption: {
            edit: function(caption, postID, clientID, callback) {
                db.posts.find({
                    $and: [
                        {
                            "info.postID": postID
                        },
                        {
                            "info.postedBy": clientID
                        }
                    ]
                }, function(err0, docs0) {
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
                        }, function(err0, docs0) {
                            if(!err0) {
                                callback({
                                    response: "OK"
                                });
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
                create: function(clientID, postID, callback) {
                    db.posts.find({
                        "info.postID": postID
                    }).limit(1, function(err0, docs0) {
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
                    }, function(err0, docs0) {
                        if(!err0) {
                            callback({
                                response: "OK"
                            })
                        } else {
                            callback(flip.tools.res.ERR);
                        }
                    });
                },
                destroy: function(clientID, postID, callback) {
                    flip.notification.remove("like", postID, null, clientID)

                    db.posts.update({
                        "info.postID": postID
                    }, {
                        $pull: {
                            "data.stats.detailed.likedBy": clientID
                        }
                    }, function(err0, docs0) {
                        if(!err0) {
                            callback({
                                response: "OK"
                            })
                        } else {
                            callback(flip.tools.res.ERR);
                        }
                    });
                }
            },
            comment: {
                create: function(comment, clientID, postID, callback) {
                    var commentID = flip.tools.gen.commentID();

                    db.posts.find({
                        "info.postID": postID
                    }).limit(1, function(err0, docs0) {
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
                    }, function(err0, result0) {
                        if(!err0) {
                            let words = comment.split(" ");

                            for(i = 0; i < words.length; i++) {
                                if(words[i][0] == "@") {
                                    db.users.find({
                                        "info.username": words[i].replace("@", "")
                                    }, function(err1, docs1) {
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
                                }
                            });
                        } else {
                            callback({
                                response: "ERR0"
                            })
                        }
                    })
                },
                destroy: function(commentID, clientID, postID, callback) {
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
                    }, function(err0, result0) {
                        if(!err0) {
                            callback({
                                response: "OK"
                            });
                        } else {
                            callback({
                                response: "ERR0"
                            })
                        }
                    })
                }
            }
		},
		create: function(vID, clientID, wasUploaded, callback) {
            var postID = flip.tools.gen.postID();

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
					streamURL: "/api/v2/post/stream/" + postID,
					thumbURL: "/api/v2/post/thumb/" + postID,
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
			}, function(err0, docs0) {
				if(!err0) {
					callback({
						response: "OK",
						data: {
							postID: postID
						}
					})
				} else {
					callback(flip.tools.res.ERR);
				}
			});
		},
		destroy: function(postID, clientID, callback) {
            db.posts.find({
                "info.postID": postID
            }, function(err0, docs0) {
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
                        }, function(err1, docs1) {
                            if(!err1) {
                                callback({
                                    response: "OK"
                                });

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

                                fs.unlink("./videos/" + postID + ".mov", (err) => {
                                    if(!err) {
                                        // deleted successfully
                                    }
                                });

                                fs.unlink("./thumbnails/" + postID + ".png", (err) => {
                                    if(!err) {
                                        // deleted successfully
                                    }
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
		get: function(clientID, index, callback) {
			db.users.find({
				"info.clientID": clientID
			}, function(err0, docs0) {
				if(!err0) {
					if(docs0.length > 0) {
						var following = docs0[0].profile.following;
						following.push(docs0[0].info.clientID);

						db.posts.find({
							"info.postedBy": {
								$in: following
							}
						}).sort({
							"info.postedAt": -1
						}).skip(parseInt(index)).limit(10, function(err1, docs1) {
							if(!err1) {
								if(docs1.length > 0) {
									flip.post.multi.handle(docs1, clientID, function(docs2) {
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
                                                        desc: "We're glad you're here! You should probably get to know the place. Swipe left to access Explore, where we post new flips every day, and swipe right to access your Profile.\n\nSee that big 'Tap to Record' button down there? Well, it does just that. Tap the button to bring up the Camera view, where you can create short looping videos to share with your friends.\n\nTalking about friends, tap the button below to search your Contacts or Twitter in order to find friends on flip.\n\n We hope you enjoy using flip! Our username is @flip, so, uh, add us maybe?",
                                                        gradient: [ 
                                                            "#F76B1C", 
                                                            "#FAD961"
                                                        ]
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
        create: function(clientID, idToReport, type, reason, details, callback) {
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
            }, function(err0, docs0) {
                if(!err0) {
                    callback({
                        response: "OK",
                        formattedTitle: flip.tools.gen.smart(type) + " Successfully Reported",
                        formattedResponse: "We've successfully recieved your report, and we'll review it as soon as possible. Thanks for making flip a better place for everybody!"
                    });
                } else {
                    callback(flip.tools.res.ERR);
                }
            });
        },
    },
	notification: {
        get: function(clientID, index, callback) {
            db.notifications.find({
                "info.users.for": clientID
            }).sort({
                "info.notificationAt": -1
            }).limit(10).skip(parseInt(index), function(err0, docs0) {
                if(!err0) {
                    if(docs0.length > 0) {
                        var processed = docs0.length;
                        var hasGotMorePosts = (docs0.length > 9)

                        docs0.forEach(function(doc, i) {
                            delete docs0[i]._id;

                            let fromClientID = doc.info.users.from;

                            flip.user.get.raw(fromClientID, function(data0) {
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

                                            let prefix = "@" + doc.profile.username + " "

                                            if(doc.info.meta.detailType == "like") {
                                                doc.data.title = "New Like"
                                                doc.data.desc = prefix + "liked your post " + doc.info.notificationAgoLong + "."

                                                doc.data.gradient = [
                                                    "#F76B1C",
                                                    "#FAD961"
                                                ]
                                            } else if(doc.info.meta.detailType == "follow") {
                                                doc.data.title = "New Follower"
                                                doc.data.desc = prefix + "followed you " + doc.info.notificationAgoLong + "."

                                                doc.data.gradient = [
                                                    "#BA00FE",
                                                    "#F900D4"
                                                ]
                                            } else if(doc.info.meta.detailType == "comment") {
                                                doc.data.title = "New Comment"
                                                doc.data.desc = prefix + "commented \"" + doc.data.content + "\" on your post " + doc.info.notificationAgoLong + "."

                                                doc.data.gradient = [
                                                    "#00A505",
                                                    "#BDEC51"
                                                ]
                                            } else if(doc.info.meta.detailType == "cMention") {
                                                doc.data.title = "New Mention"
                                                doc.data.desc = prefix + "mentioned you in their comment \"" + doc.data.content + "\"."

                                                doc.data.gradient = [
                                                    "#9F041B",
                                                    "#F5515F"
                                                ]
                                            }
                                        }


                                        processed--;
                                        if(processed == 0) {
                                            callback({
                                                response: "OK",
                                                data: docs0.clean(null),
                                                meta: {
                                                    hasGotMorePosts: hasGotMorePosts,
                                                    hasGotMoreItems: hasGotMorePosts
                                                }
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
                                                    hasGotMorePosts: hasGotMorePosts,
                                                    hasGotMoreItems: hasGotMorePosts
                                                }
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
                                                hasGotMorePosts: hasGotMorePosts,
                                                hasGotMoreItems: hasGotMorePosts
                                            }
                                        });
                                    }
                                }
                            })
                        })
                    } else {
                        callback({
                            response: "OK",
                            data: []
                        })
                    }
                } else {
                    callback(flip.tools.res.ERR);
                }
            })
        },
        create: function(content, type, postID, forClientID, fromClientID) {
            if(forClientID !== fromClientID) {
                var data = {
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
                }

                var pushData = {
                    title: "",
                    body: "",
                    forClientID: "",
                    forPostID: ""
                }

                var query = {}

                var pushBody = ""

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
                    pushData.body = "@{USERNAME} just commented on your post: \"" + content + "\""
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
                    pushData.body = "@{USERNAME} just mentioned you in their comment: \"" + content + "\""

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

                db.users.find({
                    "info.clientID": fromClientID
                }, function(err0, docs0) {
                    if(!err0) {
                        if(docs0.length > 0) {
                            pushData.body = pushData.body.replace("{USERNAME}", docs0[0].info.username)

                            db.notifications.find(query, function(err0, docs0) {
                                if(!err0) {
                                    if(docs0.length == 0) {
                                        db.notifications.insert(data, function(err1, docs1) {
                                            if(!err0) {
                                                var notificationType = type;

                                                if(notificationType == "cMention") {
                                                    notificationType = "mention";
                                                }

                                                flip.user.setting.get(forClientID, notificationType, "notification", function(shouldSend) {
                                                    if(shouldSend) {
                                                        flip.notification.send(pushData)
                                                    }
                                                })
                                            }
                                        })
                                    }
                                }
                            })
                        }
                    }
                })
            }
        },
        remove: function(type, postID, forClientID, fromClientID) {
            var query = {}

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
        },
		send: function(data) {
			db.users.find({
				"info.clientID": data.forClientID
			}, function(err0, docs0) {
				if(!err0) {
					if(docs0.length > 0) {
						if(docs0[0].info.deviceToken !== null && docs0[0].info.deviceToken !== "") {
							var deviceToken = docs0[0].info.deviceToken;
                            var note = new apn.Notification();

                            note.mutableContent = 1;

                            if(data.forPostID != "") {
                                note.aps["attachment-url"] = "https://flip.wtf/thumbnails/" + data.forPostID + ".png"
                            }

                            note.sound = "flip_sound";
                            note.alert = data.body;
                            note.topic = "wtf.flip.ios";

                            if(data.title) {
                                note.title = data.title;
                            }

							productionAPNSProvider.send(note, deviceToken).then((result0) => {
                                console.log(result0)
                                if(result.failed.length > 0) {
                                    console.log("Failed! Attempting resend to developer device...");
                                    developmentAPNSProvider.send(note, deviceToken).then((result1) => {
                                        console.log(result1)
                                    });;
                                } else {
                                    console.log("Success! Notification sent successfully.")
                                }
                            });;
						}
					}
				}
			})
		},
		sendToPoster: function(body, postID) {
			db.posts.find({
				"info.postID": postID
			}, function(err0, docs0) {
				if(!err0) {
					if(docs0.length > 0) {
						flip.notification.send(body, docs0[0].info.postedBy);
					}
				}
			})
		}
	},
	tools: {
		res: {
            SUCCESS: {
                response: "OK",
                formattedTitle: "Success",
                formattedResponse: "The request was recieved and processed successfully."
            },
			ERR: {
				response: "ERR",
				formattedTitle: "An Error Occured",
				formattedResponse: "Looks like an error occured, try again later."
			},
			INVALID_LOGIN: {
				response: "INPUT_NOT_VALID",
				formattedTitle: "Email/Password Not Valid",
				formattedResponse: "Your email or password is not valid. Please try again."
            },
            EMAIL_ALREADY_IN_USE: {
				response: "EMAIL_ALREADY_IN_USE",
				formattedTitle: "Email/Password Already In Use",
				formattedResponse: "This email address is already being used by another account. Please try again."
            },
			INVALID_CREDENTIALS: {
				response: "CREDENTIALS_NOT_VALID",
				formattedTitle: "Session Not Valid",
				formattedResponse: "Your session is no longer valid. Please log back in."
			},
			NO_ITEMS: {
				response: "NO_ITEMS",
				formattedTitle: "No Items Found",
				formattedResponse: "Your query returned no items. Please adjust your query and try again."
            },
            NO_DATA: {
                response: "OK",
                data: [],
                meta: {
                    hasGotMoreItems: false
                }
            },
            SERVICE_UNKNOWN: {
                response: "SERVICE_UNKNOWN",
                formattedTitle: "Service Unknown",
                formattedResponse: "The service you tried to link was unknow, please try again later."
            },
			NO_AUTH: {
				response: "NO_AUTH",
				formattedTitle: "Authentication Revoked",
				formattedResponse: "As you are not authenticated, we've automatically logged you out, so please log in again.\n\nStill facing issues? Email support@flip.wtf and we'll help you out."
			},
			ACCOUNT_ALREADY_EXISTS: {
				response: "ACCOUNT_ALREADY_EXISTS",
				formattedTitle: "Username/Email Already Exists",
				formattedResponse: "An account with this username or email already exists."
			},
			LOGIN_ERR: {
				response: "LOGIN_ERR",
				formattedTitle: "Email/Password Incorrect",
				formattedResponse: "Your email or password is incorrect. Please try again."
			},
			INSUFFICIANT_PARAMS: {
				response: "INSUFFICIANT_PARAMS",
				formattedTitle: "Insufficiant Parameters",
				formattedResponse: "The parameters sent with this request were insufficiant. Please try again."
            },
            INVALID_PARAMS: {
                response: "INVALID_PARAMS",
                formattedTitle: "Invalid Parameters",
				formattedResponse: "The parameters sent with this request were invalid. Please try again."
            },
			RESERVATION_ALREADY_EXISTS: {
				response: "RESERVATION_ALREADY_EXISTS",
				formattedTitle: "Reservation Already Exists",
				formattedResponse: "This username/email has already been reserved. Try a different username or email."
            },
            SETTINGS_NOT_VALID: {
                response: "SETTINGS_NOT_VALID",
                formattedTitle: "Settings Invalid",
                formattedResponse: "The settings entered are not valid. Please look over the inputted settings and try again."
            },
            //
            USERNAME_INVALID_CHAR: {
                response: "USERNAME_INVALID_CHAR",
                formattedTitle: "Username Invalid",
                formattedResponse: "Your username is invalid. It can only contain the following: \"0-9, a-z, A-Z, . _\"."
            },
            USERNAME_INVALID_LENGTH: {
                prep: function(inp) {
                    return {
                        response: "USERNAME_INVALID",
                        formattedTitle: "Username Invalid",
                        formattedResponse: "Your username is invalid. It has to contain 15 or less characters. It is currently " + inp.length + " characters long."
                    }
                }
            },
            EMAIL_INVALID: {
                response: "EMAIL_INVALID",
                formattedTitle: "Email Invalid",
                formattedResponse: "Your email is invalid. Please ensure it takes the form of a valid email address."
            },
            PASSWORD_INVALID: {
                response: "PASSWORD_INVALID",
                formattedTitle: "Password Invalid",
                formattedResponse: "Your password is invalid. It has to contain more than 0 characters and less than 100."
            }
        },
        indexGradient: function(arrayMaster, array) {
            for(i = 0; i < arrayMaster.length; i++) {
                if(arrayMaster[i][0] == array[0]) {
                    if(arrayMaster[i][1] == array [1]) {
                        return i
                    }
                }

                if(i == arrayMaster.length) {
                    return 0
                }
            }
        },
		validate: {
            key: function(inp) {
                if(inp) {
                    if(inp.length > 0 && inp.length < 20) {
                        return true;
                    }
                }

                return false;
            },
            query: function(inp) {
                if(inp) { 
                    if(inp.length > 0 && inp.length < 20) {
                        return true;
                    }
                }

                return false;
            },
            hashtag: function(inp) {
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
            serviceName: function(inp) {
                if(inp) {
                    if(inp.length > 0 && inp.length < 50) {
                        if(inp == "twitter" || inp == "contacts") {
                            return true
                        }
                    }
                }
                
                return false
            },
			username: function(inp) {
				if(inp) {
                    if(inp.length > 0 && inp.length < 16) {
                        inp = inp.replace("@", "");
                        inp = inp.trim();

                        if(/^[0-9a-zA-Z_.-]+$/.test(inp)) {
                            return true;
                        }
                    }
                }

				return false;
			},
			email: function(inp) {
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
			password: function(inp) {
				if(inp) {
                    if(inp.length > 0 && inp.length < 100) {
                        return true;
                    }
                }

				return false;
            },
            bio: function(inp) {
                if(typeof inp === "string") {
                    if(inp.length < 140) {
                        return true;
                    }
                }

                return false;
            },
			clientID: function(inp) {
				if(inp) {
                    if(inp.length == 15) {
                        return true;
                    }
                }

				return false;
			},
			sessionID: function(inp) {
				if(inp) {
                    if(inp.length == 25) {
                        return true;
                     }
                }

				return false;
			},
			postID: function(inp) {
                if(inp) {
                    if(inp.length == 10) {
                        return true;
                     }
                }

				return false;
			},
			name: function(inp) {
				if(inp) {
                    if(inp.length < 20 && /^[a-z ,.'-]+$/i.test(inp)) {
                        return true;
                    }
                }

				return false;
			},
			caption: function(inp) {
                if(inp.length < 150) {
                    return true;
                }

				return false;
            },
            comment: function(inp) {
                if(inp) {
                    if(inp.length <= 500) {
                        return true;
                    }
                }

                return false;
            },
            commentID: function(inp) {
                if(inp) {
                    if(inp.length == 5) {
                        return true;
                    }
                }

                return false;
            },
			index: function(inp) {
				if(inp) {
                    if(inp.match(/^-{0,1}\d+$/)) {
                        return true;
                    }
                }

                return false;
            },
            json: function(inp) {
                try {
                    JSON.parse(inp);
                } catch (e) {
                    return false;
                }

                return true;
            }
		},
		gen: {
            randomGradient: function() {
                let index = Math.floor(Math.random() * gradients.length);
                return gradients[index];
            },
            smart: function(inp) {
                if(inp.length > 0) {
                    return inp.charAt(0).toUpperCase() + inp.substr(1);
                } else {
                    return inp;
                }
            },
			user: function(username, email) {
				return {
					info: {
						clientID: flip.tools.gen.clientID(),
						username: username,
						joinedAt: Date.now()
					},
					security: {
                        email: email,
                        sessionID: flip.tools.gen.sessionID()
					},
					profile: {
						name: username.charAt(0).toUpperCase() + username.substr(1, username.length).toLowerCase(),
						bio: "This user has no bio.",
                        profileImg: "https://flip.wtf/assets/img/flip_defaultUserIcon.png",
                        gradient: flip.tools.gen.randomGradient(),
						verified: false,
						followers: [],
                        following: ["gcVKSxFv2hk3o8V"],
                        blocked: []
                    },
                    services: {
                        connected: []
                    },
                    settings: {
                        notification: {
                            "follow": true,
                            "like": true,
                            "comment": true,
                            "mention": true,
                            "explore": true
                        }
                    }
				}
            },
            numberWithCommas: function(x) {
                return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            },
			randomString: function(length) {
				return flip.tools.gen.customRandomString(possible, length);
			},
			customRandomString: function(lPossible, length) {
				var text = "";
				for (var i = 0; i < length; i++) {
					var newChar = lPossible.charAt(Math.floor(Math.random() * lPossible.length));
					if (newChar == text[text.length - 1]) {
						i--;
					} else {
						text += newChar;
					}
				}
				return text;
            },
            clientID: function(inp) {
				return flip.tools.gen.randomString(15);
			},
			sessionID: function(inp) {
				return flip.tools.gen.randomString(25);
			},
			postID: function() {
				return flip.tools.gen.randomString(10);
            },
            commentID: function() {
                return flip.tools.gen.randomString(5);
            },
            bookmarkID: function() {
                return flip.tools.gen.randomString(5);
            },
            cardID: function() {
                return flip.tools.gen.randomString(5);
            },
            splitterID: function() {
                return flip.tools.gen.randomString(5);
            },
            notificationID: function() {
                return flip.tools.gen.randomString(5);
            },
			tDef: function(inp) {
				var possibleT = [
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
					var timeType = inp.split(" ")[1][0];

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
    addFieldToAllDocs: function() {
        db.users.update({}, {
            $set: {
                "settings": {
                    "notification": {
                        "explore": true,
                        "mention": true,
                        "comment": true,
                        "like": true,
                        "follow": true
                    }
                }
            }
        }, { multi: true }, function(err0, docs0) {
            console.log(err0, docs0)
        })
    }
};

// var deviceToken = "3ADA099F60B1AD5FB733957CBCE7B7F734061DCDCAFCF9A9F26EC6E16BAAD03B";
// var note = new apn.Notification();

// note.mutableContent = 1;

// note.sound = "flip_sound.wav";
// note.alert = "@william just liked your post";
// note.topic = "wtf.flip.ios";
// note.aps["attachmentURL"] = "https://i.imgur.com/YZAdad2.png"
// note.aps["notificationID"] = "1YG7J"
// note.title = "New Like"

// developmentAPNSProvider.send(note, deviceToken).then((result1) => {
//     console.log(result1)
// });

router.post("/user/login", function(req, res, next) {
	let email = req.body.email;
    let password = req.body.password;
    let setCookies = req.body.setCookies;

    let options = {
        httpOnly: true,
        secure: false,
    }

	if(email && password) {
		if(flip.tools.validate.email(email) && flip.tools.validate.password(password)) {
			flip.user.login(email, password, function(data0) {
                if(data0.response == "OK") {
                    if(typeof setCookies !== "undefined") {
                        if(setCookies == "true") {
                            res.cookie("clientID", data0.data.clientID, options);
                            res.cookie("sessionID", data0.data.sessionID, options);
                        }
                    }
                }

                res.send(data0);
			});
		} else {
			res.send(flip.tools.res.INVALID_PARAMS);
		}
	} else {
		res.send(flip.tools.res.INSUFFICIANT_PARAMS);
	}
});

router.post("/user/signup", function(req, res, next) {
	let username = req.body.username;
	let email = req.body.email;
    let password = req.body.password;

	if(username && email && password) {
        username = username.replace("@", "");

        if(flip.tools.validate.username(username) && flip.tools.validate.email(email) && flip.tools.validate.password(password)) {
			flip.user.create(username, email, password, function(data) {
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

router.post("/user/username/update", function(req, res, next) {
    let clientID = req.cookies.clientID;
    let sessionID = req.cookies.sessionID;

    let username = req.body.username;

    if(username) {
        if(flip.tools.validate.username(username)) {
            flip.auth(req.cookies, function(auth) {
                if(auth.response == "OK") {
                    flip.user.update.username(clientID, username, function(data0) {
                        res.send(data0);
                    });
                } else {
                    res.send(auth);
                }
            });
        } else {
            res.send(flip.tools.res.INVALID_PARAMS);
        }
    } else {
		res.send(flip.tools.res.INSUFFICIANT_PARAMS);
	}
});

router.post("/user/email/update", function(req, res, next) {
    let clientID = req.cookies.clientID;
    let sessionID = req.cookies.sessionID;

    let email = req.body.email;

    if(email) {
        if(flip.tools.validate.email(email)) {
            flip.auth(req.cookies, function(auth) {
                if(auth.response == "OK") {
                    flip.user.update.email(clientID, email, function(data0) {
                        res.send(data0);
                    });
                } else {
                    res.send(auth);
                }
            });
        } else {
            res.send(flip.tools.res.INVALID_PARAMS);
        }
    } else {
		res.send(flip.tools.res.INSUFFICIANT_PARAMS);
	}
});

router.post("/user/auth", function(req, res, next) {
    let clientID = req.body.clientID;
    let sessionID = req.body.sessionID;

    flip.auth(req.body, function(auth) {
        if(typeof req.body.deviceToken !== "undefined") {
            if(req.body.deviceToken !== null) {
                if(req.body.deviceToken.length > 0) {
                    flip.user.update.deviceToken(req.body.clientID, req.body.deviceToken);
                }
            }
        }

        res.send(auth);
    });
});

router.post("/user/profile/get", function(req, res, next) {
    let clientID = req.body.clientID;
    let sessionID = req.body.sessionID;

    let forClientID = req.body.forClientID;
    let forUsername = req.body.forUsername;

    if(forClientID || forUsername) {
        if(flip.tools.validate.clientID(forClientID) || flip.tools.validate.username(forUsername)) {
            flip.auth(req.body, function(auth) {
                if(auth.response == "OK") {
                    if(typeof forClientID !== "undefined") {
                        flip.user.get.safe.clientID(forClientID, clientID, function(data0) {
                            if(data0.response == "OK") {
                                res.send(data0);
                            } else {
                                res.send(data0);
                            }
                        });
                    } else if(typeof forUsername !== "undefined") {
                        flip.user.get.safe.username(forUsername, clientID, function(data0) {
                            if(data0.response == "OK") {
                                res.send(data0);
                            } else {
                                res.send(data0);
                            }
                        });
                    } else {
                        res.send(flip.tools.res.INVALID_PARAMS);
                    }
                } else {
                    res.send(auth);
                }
            });
        } else {
            res.send(flip.tools.res.INVALID_PARAMS);
        }
    } else {
		res.send(flip.tools.res.INSUFFICIANT_PARAMS);
    }
});

// /user/settings/get

router.post("/user/settings/get", function(req, res, next) {
    let clientID = req.body.clientID;
    let sessionID = req.body.sessionID;

    flip.auth(req.body, function(auth) {
        if(auth.response == "OK") {
            flip.user.settings.get(clientID, function(data0) {
                if(data0.response == "OK") {
                    res.send(data0);
                } else {
                    res.send(data0);
                }
            });
        } else {
            res.send(auth);
        }
    });
})

// /user/services/*

router.post("/user/services/:name/get", function(req, res, next) {
    let clientID = req.body.clientID;
    let sessionID = req.body.sessionID;

    let name = req.params.name;

    if(name) {
        if(flip.tools.validate.serviceName(name)) {
            flip.auth(req.body, function(auth) {
                if(auth.response == "OK") {
                    if(name == "contacts") {
                        let emailAddresses = req.body["emailAddresses[]"];
        
                        flip.user.service.get.contacts(clientID, emailAddresses, function(data0) {
                            if(data0.response == "OK") {
                                res.send(data0);
                            } else {
                                res.send(data0);
                            }
                        })
                    } else if(name == "twitter") {
                        flip.user.service.get.twitter(clientID, function(data0) {
                            if(data0.response == "OK") {
                                res.send(data0);
                            } else {
                                res.send(data0);
                            }
                        })
                    } else {
                        res.send(flip.tools.res.SERVICE_UNKNOWN)
                    }
                } else {
                    res.send(auth);
                }
            });
        } else {
            res.send(flip.tools.res.INVALID_PARAMS);
        }
    } else {
        res.send(flip.tools.res.INSUFFICIANT_PARAMS);
    }
});

router.post("/user/service/connect", function(req, res, next) {
    let clientID = req.body.clientID;
    let sessionID = req.body.sessionID;

    let name = req.body.name;
    let token = req.body.token;
    let secret = req.body.secret;

    if(name && token && secret) {
        if(flip.tools.validate.serviceName(name.toLowerCase())) {
            flip.auth(req.body, function(auth) {
                if(auth.response == "OK") {
                    let data = {
                        name: name,
                        tokens: {
                            token: token,
                            secret: secret
                        }
                    };
        
                    flip.user.service.connect(clientID, data, function(data0) {
                        if(data0.response == "OK") {
                            res.send(data0);
                        } else {
                            res.send(data0);
                        }
                    });
                }
            })
        } else {
            res.send(flip.tools.res.INVALID_PARAMS);
        }
    } else {
        res.send(flip.tools.res.INSUFFICIANT_PARAMS);
    }
});

router.post("/user/service/disconnect", function(req, res, next) {
    let clientID = req.body.clientID;
    let sessionID = req.body.sessionID;

    let name = req.body.name;

    if(name) {
        if(flip.tools.validate.serviceName(name)) {
            flip.auth(req.body, function(auth) {
                if(auth.response == "OK") {
                    let data = {
                        name: name
                    }
        
                    flip.user.service.disconnect(clientID, data, function(data0) {
                        if(data0.response == "OK") {
                            res.send(data0);
                        } else {
                            res.send(data0);
                        }
                    });
                }
            });
        } else {
            res.send(flip.tools.res.INVALID_PARAMS);
        }
    } else {
        res.send(flip.tools.res.INSUFFICIANT_PARAMS);
    }
});

// /user/relationships/*

router.post("/user/relationships/get", function(req, res, next) {
    let clientID = req.body.clientID;
    let sessionID = req.body.sessionID;

	let forClientID = req.body.forClientID;
    let index = req.body.index;

    if(forClientID && index) {
        if(flip.tools.validate.clientID(forClientID) && flip.tools.validate.index(index)) {
            flip.auth(req.body, function(auth) {
                if(auth.response == "OK") {
                    flip.user.relationships.get(forClientID, index, clientID, function(data0) {
                        if(data0.response == "OK") {
                            res.send(data0);
                        } else {
                            res.send(data0);
                        }
                    });
                } else {
                    res.send(auth);
                }
            });
        } else {
            res.send(flip.tools.res.INVALID_PARAMS)
        }
    } else {
        res.send(flip.tools.res.INSUFFICIANT_PARAMS);
    }
});

router.post("/user/relationship/create", function(req, res, next) {
    let clientID = req.body.clientID;
    let sessionID = req.body.sessionID;

    let forClientID = req.body.forClientID;
    
    if(forClientID) {
        if(flip.tools.validate.clientID(forClientID)) {
            flip.auth(req.body, function(auth) {
                if(auth.response == "OK") {
                    if(clientID != forClientID) {
                        flip.user.interaction.follow(clientID, forClientID, function(data0) {
                            if(data0.response == "OK") {
                                res.send(data0);
                            } else {
                                res.send(data0);
                            }
                        });
                    } else {
    
                    }
                } else {
                    res.send(auth);
                }
            });
        } else {
            res.send(flip.tools.res.INVALID_PARAMS);
        }
    }

});

// BLOCK

router.post("/user/block/create", function(req, res, next) {
    let clientID = req.body.clientID;
    let sessionID = req.body.sessionID;

	let forClientID = req.body.forClientID;

    if(forClientID) {
        if(flip.tools.validate.clientID(forClientID)) {
            flip.auth(req.body, function(auth) {
                if(auth.response == "OK") {
                    if(clientID != forClientID) {
                        flip.user.block.create(forClientID, clientID, function(data0) {
                            if(data0.response == "OK") {
                                res.send(data0);
                            } else {
                                res.send(data0);
                            }
                        })
                    } else {
                        res.send(flip.tools.res.INVALID_PARAMS);
                    }
                } else {
                    res.send(auth);
                }
            });
        } else {
            res.send(flip.tools.res.INVALID_PARAMS);
        }
    } else {
        res.send(flip.tools.res.INSUFFICIANT_PARAMS);
    }
})

router.post("/user/block/destroy", function(req, res, next) {
    let clientID = req.body.clientID;
    let sessionID = req.body.sessionID;

	let forClientID = req.body.forClientID;

    if(forClientID) {
        if(flip.tools.validate.clientID(forClientID)) {
            flip.auth(req.body, function(auth) {
                if(auth.response == "OK") {
                    if(clientID != forClientID) {
                        flip.user.block.destroy(forClientID, clientID, function(data0) {
                            if(data0.response == "OK") {
                                res.send(data0);
                            } else {
                                res.send(data0);
                            }
                        });
                    } else {
                        res.send(flip.tools.res.INVALID_PARAMS);
                    }
                } else {
                    res.send(auth);
                }
            });
        } else {
            res.send(flip.tools.res.INVALID_PARAMS);
        }
    } else {
        res.send(flip.tools.res.INSUFFICIANT_PARAMS);
    }
})

// BLOCK END

router.post("/user/relationship/destroy", function(req, res, next) {
    let clientID = req.body.clientID;
    let sessionID = req.body.sessionID;

	let forClientID = req.body.forClientID;

    if(forClientID) {
        if(flip.tools.validate.clientID(forClientID)) {
            flip.auth(req.body, function(auth) {
                if(auth.response == "OK") {
                    if(clientID != forClientID) {
                        flip.user.interaction.unfollow(clientID, forClientID, function(data0) {
                            if(data0.response == "OK") {
                                res.send(data0);
                            } else {
                                res.send(data0);
                            }
                        });
                    } else {
                        res.send(flip.tools.res.INVALID_PARAMS);
                    }
                } else {
                    res.send(auth);
                }
            });
        } else {
            res.send(flip.tools.res.INVALID_PARAMS);
        }
    } else {
        res.send(flip.tools.res.INSUFFICIANT_PARAMS);
    }
});

// /user/settings/*

router.post("/user/settings/update", function(req, res, next) {
	let clientID = req.body.clientID;
	let sessionID = req.body.sessionID;

	var name = req.body.name;
	var bio = req.body.bio;
	var profileImgUrl = req.body.profileImgUrl;
    var gradient = req.body["gradient[]"];

	flip.auth(req.body, function(auth) {
		if(auth.response == "OK") {
			let settings = {
				name: name,
				bio: bio,
                profileImgUrl: profileImgUrl,
                gradient: gradient
			};

			flip.user.settings.update(clientID, settings, function(data0) {
				res.send(data0);
			});
		} else {
			res.send(auth);
		}
	});
});

router.post("/user/setting/update", function(req, res, next) {
    let clientID = req.body.clientID;
	let sessionID = req.body.sessionID;

    let type = req.body.type;
    let key = req.body.key;
    let rawState = req.body.state;

    var state = !(rawState == 1)
    
	if(type && key) {
        if(type == "notification" && flip.tools.validate.key(key)) {
            flip.user.setting.set(clientID, key, state, type, function(data0) {
                if(data0.response == "OK") {
                    res.send(data0);
                } else {
                    res.send(data0);
                }
            })
        } else {
            res.send(flip.tools.res.INVALID_PARAMS);
        }
    } else {
        res.send(flip.tools.res.INSUFFICIANT_PARAMS);
    }
})

// /users/*

router.post("/users/search/get", function(req, res, next) {
    let clientID = req.body.clientID;
    let sessionID = req.body.sessionID;
    
	let query = req.body.query;
    let index = req.body.index;
    
    if(query) {
        if(flip.tools.validate.query(query)) {
            flip.auth(req.body, function(auth) {
                if(auth.response == "OK") {
                    if(flip.tools.validate.username(query)) {
                        flip.user.get.multi.search(query, index, clientID, function(data0) {
                            if(data0.response == "OK") {
                                res.send(data0);
                            } else {
                                res.send(data0);
                            }
                        })
                    } else {
                        res.send(flip.tools.res.NO_DATA)
                    }
                } else {
                    res.send(auth);
                }
            });
        } else {
            res.send(flip.tools.res.INVALID_PARAMS);
        }
    } else {
        res.send(flip.tools.res.INSUFFICIANT_PARAMS);
    }
});

router.post("/user/notifications/get", function(req, res, next) {
    let clientID = req.body.clientID;
    let sessionID = req.body.sessionID;

    let index = req.body.index;

    if(index) {
        if(flip.tools.validate.index(index)) {
            flip.auth(req.body, function(auth) {
                if(auth.response == "OK") {
                    flip.notification.get(clientID, index, function(data0) {
                        if(data0.response == "OK") {
                            res.send(data0)
                        } else {
                            res.send(data0)
                        }
                    })
                } else {
                    res.send(auth);
                }
            });
        } else {
            res.send(flip.tools.res.INVALID_PARAMS);
        }
    } else {
        res.send(flip.tools.res.INSUFFICIANT_PARAMS);
    }
})

// /post/*

router.post("/post/get", function(req, res, next) {
    let clientID = req.body.clientID;
    let sessionID = req.body.sessionID;

    let postID = req.body.postID;

    if(postID) {
        if(flip.tools.validate.postID(postID)) {
            flip.auth(req.body, function(auth) {
                if(auth.response == "OK") {
                    flip.post.get(postID, clientID, function(data0) {
                        if(data0.response == "OK") {
                            data0.data = [data0.data]
                            res.send(data0);
                        } else {
                            res.send(data0);
                        }
                    });
                } else {
                    res.send(auth);
                }
            });
        } else {
            res.send(flip.tools.res.INVALID_PARAMS);
        }
    } else {
        res.send(flip.tools.res.INSUFFICIANT_PARAMS);
    }
})

router.post("/user/bookmark/create", function(req, res, next) {
    let clientID = req.body.clientID;
    let sessionID = req.body.sessionID;

    let postID = req.body.postID;

    if(postID) {
        if(flip.tools.validate.postID(postID)) {
            flip.auth(req.body, function(auth) {
                if(auth.response == "OK") {
                    flip.user.bookmark.create(postID, clientID, function(data0) {
                        if(data0.response == "OK") {
                            res.send(data0);
                        } else {
                            res.send(data0);
                        }
                    })
                } else {
                    res.send(auth);
                }
            })
        } else {
            res.send(flip.tools.res.INVALID_PARAMS);
        }
    } else {
        res.send(flip.tools.res.INSUFFICIANT_PARAMS);
    }
});

router.post("/user/bookmark/destroy", function(req, res, next) {
    let clientID = req.body.clientID;
    let sessionID = req.body.sessionID;

    let postID = req.body.postID;

    if(postID) {
        if(flip.tools.validate.postID(postID)) {
            flip.auth(req.body, function(auth) {
                if(auth.response == "OK") {
                    flip.user.bookmark.destroy(postID, clientID, function(data0) {
                        if(data0.response == "OK") {
                            res.send(data0);
                        } else {
                            res.send(data0);
                        }
                    })
                } else {
                    res.send(auth);
                }
            })
        } else {
            res.send(flip.tools.res.INVALID_PARAMS);
        }
    } else {
        res.send(flip.tools.res.INSUFFICIANT_PARAMS);
    }
});

router.post("/user/bookmarks/get", function(req, res, next) {
    let clientID = req.body.clientID;
    let sessionID = req.body.sessionID;

    let index = req.body.index;

    if(index) {
        if(flip.tools.validate.index(index)) {
            flip.auth(req.body, function(auth) {
                if(auth.response == "OK") {
                    flip.user.get.bookmarks(clientID, index, function(data0) {
                        if(data0.response == "OK") {
                            res.send(data0);
                        } else {
                            res.send(data0);
                        }
                    })
                } else {
                    res.send(auth);
                }
            })
        } else {
            res.send(flip.tools.res.INVALID_PARAMS);
        }
    } else {
        res.send(flip.tools.res.INSUFFICIANT_PARAMS);
    }
})


router.get("/post/stream/:vID", function(req, res, next) {
	var vID = req.params.vID;

	var path = "./videos/" + vID + ".mov";
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

router.get("/post/thumb/:tID", function(req, res, next) {
	var tID = req.params.tID;

	fs.readFile("./thumbnails/" + tID + ".png", function(err, data) {
		if(!err) {
			res.send(data);
		}
	});
})

router.post("/post/view", function(req, res, next) {
    let clientID = req.body.clientID;
    let sessionID = req.body.sessionID;

	var postID = req.body.postID;

    if(postID) {
        if(flip.tools.validate.postID(postID)) {
            flip.auth(req.body, function(auth) {
                if(auth.response == "OK") {
                    flip.post.view(postID, function(data0) {
                        if(data0.response == "OK") {
                            res.send(data0);
                        } else {
                            res.send(data0);
                        }
                    });
                } else {
                    res.send(auth);
                }
            });
        } else {
            res.send(flip.tools.res.INVALID_PARAMS);
        }
    } else {
        res.send(flip.tools.res.INSUFFICIANT_PARAMS);
    }
})

router.post("/post/upload", function(req, res, next) {
	let clientID = req.body.clientID;
	let sessionID = req.body.sessionID;

    let vid = req.files.flipVid;
    let wasUploaded = req.body.uploadedFromCameraRoll;

    if(vid && wasUploaded) {
        flip.auth(req.body, function(auth) {
            if(auth.response == "OK") {
                flip.post.create(vid.name, clientID, wasUploaded, function(data0) {
                    if(data0.response == "OK") {
                        vid.mv("./videos/" + data0.data.postID + ".mov", function(err) {
                            if(!err) {
                                new ffmpeg("./videos/" + data0.data.postID + ".mov").screenshots({
                                    timestamps: [ 0 ],
                                    filename: data0.data.postID + ".png",
                                    folder: "./thumbnails/"
                                });
    
                                res.send({
                                    response: "OK"
                                });
                            } else {
                                res.send(flip.tools.res.ERR);
                            }
                        });
                    } else {
                        res.send(data0)
                    }
                });
            } else {
                res.send(auth);
            }
        });
    } else {
        res.send(flip.tools.res.INSUFFICIANT_PARAMS);
    }
});

router.post("/post/destroy", function(req, res, next) {
    let clientID = req.body.clientID;
    let sessionID = req.body.sessionID;

	let postID = req.body.postID;

    if(postID) {
        if(flip.tools.validate.postID(postID)) {
            flip.auth(req.body, function(auth) {
                if(auth.response == "OK") {
                    flip.post.destroy(postID, clientID, function(data0) {
                        if(data0.response == "OK") {
                            res.send(data0);
                        } else {
                            res.send(data0);
                        }
                    })
                } else {
                    res.send(auth);
                }
            });
        } else {
            res.send(flip.tools.res.INVALID_PARAMS);
        }
    } else {
        res.send(flip.tools.res.INSUFFICIANT_PARAMS);
    }
});

// /post/caption/*

router.post("/post/caption/update", function(req, res, next) {
    let clientID = req.body.clientID;
    let sessionID = req.body.sessionID;

	let postID = req.body.postID;
	let caption = req.body.caption;

    if(postID && caption) {
        if(flip.tools.validate.postID(postID) && flip.tools.validate.caption(caption)) {
            flip.auth(req.body, function(auth) {
                if(auth.response == "OK") {
                    flip.post.caption.edit(caption, postID, req.body.clientID, function(data0) {
                        if(data0.response == "OK") {
                            res.send(data0);
                        } else {
                            res.send(data0);
                        }
                    });
                } else {
                    res.send(auth);
                }
            });
        } else {
            res.send(flip.tools.res.INVALID_PARAMS);
        }
    } else {
        res.send(flip.tools.res.INSUFFICIANT_PARAMS);
    }
})

// /posts/hashtag/*

router.post("/posts/hashtag/get", function(req, res, next) {
    let clientID = req.body.clientID;
    let sessionID = req.body.sessionID;

	let hashtag = req.body.hashtag;
	let index = req.body.index;

    if(hashtag && index) {
        if(hashtag.length > 0 && hashtag.length < 20) {
            flip.auth(req.body, function(auth) {
                if(auth.response == "OK") {
                    flip.post.search.hashtag(hashtag, index, clientID, function(data0) {
                        if(data0.response == "OK") {
                            res.send(data0);
                        } else {
                            res.send(data0);
                        }
                    })
                } else {
                    res.send(auth);
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

router.post("/post/like/create", function(req, res, next) {
    let clientID = req.body.clientID;
    let sessionID = req.body.sessionID;

	var postID = req.body.postID;

    if(postID) {
        if(flip.tools.validate.postID(postID)) {
            flip.auth(req.body, function(auth) {
                if(auth.response == "OK") {
                    flip.post.interaction.like.create(clientID, postID, function(data0) {
                        if(data0.response == "OK") {
                            res.send(data0);
                        } else {
                            res.send(data0);
                        }
                    });
                } else {
                    res.send(auth);
                }
            });
        } else {
            res.send(flip.tools.res.INVALID_PARAMS);
        }
    } else {
        res.send(flip.tools.res.INSUFFICIANT_PARAMS);
    }
});

router.post("/post/like/destroy", function(req, res, next) {
    let clientID = req.body.clientID;
    let sessionID = req.body.sessionID;

	var postID = req.body.postID;

    if(postID) {
        if(flip.tools.validate.postID(postID)) {
            flip.auth(req.body, function(auth) {
                if(auth.response == "OK") {
                    flip.post.interaction.like.destroy(clientID, postID, function(data0) {
                        if(data0.response == "OK") {
                            res.send(data0);
                        } else {
                            res.send(data0);
                        }
                    });
                } else {
                    res.send(auth);
                }
            });
        } else {
            res.send(flip.tools.res.INVALID_PARAMS);
        }
    } else {
        res.send(flip.tools.res.INSUFFICIANT_PARAMS);
    }
});

// /post/likes/get

router.post("/post/likes/get", function(req, res, next) {
	let clientID = req.body.clientID;
	let sessionID = req.body.sessionID;

	let postID = req.body.postID;
	let index = req.body.index;

    if(postID) {
        if(flip.tools.validate.postID(postID) && flip.tools.validate.index(index)) {
            flip.auth(req.body, function(auth) {
                if(auth.response == "OK") {
                    flip.post.likes.get(postID, index, clientID, function(data0) {
                        if(data0.response == "OK") {
                            res.send(data0);
                        } else {
                            res.send(data0);
                        }
                    });
                } else {
                    res.send(auth);
                }
            });
        } else {
            res.send(flip.tools.res.INVALID_PARAMS);
        }
    } else {
        res.send(flip.tools.res.INSUFFICIANT_PARAMS);
    }
});

// /post/comments/get

router.post("/post/comments/get", function(req, res, next) {
	let clientID = req.body.clientID;
	let sessionID = req.body.sessionID;

	let postID = req.body.postID;
	let index = req.body.index;

    if(postID && index) {
        if(flip.tools.validate.postID(postID) && flip.tools.validate.index(index)) {
            flip.auth(req.body, function(auth) {
                if(auth.response == "OK") {
                    flip.post.comments.get(postID, index, clientID, function(data0) {
                        if(data0.response == "OK") {
                            res.send(data0);
                        } else {
                            res.send(data0);
                        }
                    });
                } else {
                    res.send(auth);
                }
            });
        } else {
            res.send(flip.tools.res.INVALID_PARAMS);
        }
    } else {
        res.send(flip.tools.res.INSUFFICIANT_PARAMS);
    }
});

// /post/comment/create

router.post("/post/comment/create", function(req, res, next) {
	let clientID = req.body.clientID;
	let sessionID = req.body.sessionID;

    let comment = req.body.comment;
	let postID = req.body.postID;

    if(comment && postID) {
        if(flip.tools.validate.comment(comment) && flip.tools.validate.postID(postID)) {
            flip.auth(req.body, function(auth) {
                if(auth.response == "OK") {
                    flip.post.interaction.comment.create(comment, clientID, postID, function(data0) {
                        if(data0.response == "OK") {
                            res.send(data0);
                        } else {
                            res.send(data0);
                        }
                    });
                } else {
                    res.send(auth);
                }
            });
        } else {
            res.send(flip.tools.res.INVALID_PARAMS);
        }
    } else {
        res.send(flip.tools.res.INSUFFICIANT_PARAMS);
    }
});

// /post/comment/destroy

router.post("/post/comment/destroy", function(req, res, next) {
	let clientID = req.body.clientID;
	let sessionID = req.body.sessionID;

    var commentID = req.body.commentID;
	var postID = req.body.postID;

    if(commentID && postID) {
        if(flip.tools.validate.commentID(commentID) && flip.tools.validate.postID(postID)) {
            flip.auth(req.body, function(auth) {
                if(auth.response == "OK") {
                    flip.post.interaction.comment.destroy(commentID, clientID, postID, function(data0) {
                        if(data0.response == "OK") {
                            res.send(data0);
                        } else {
                            res.send(data0);
                        }
                    });
                } else {
                    res.send(auth);
                }
            });
        } else {
            res.send(flip.tools.res.INVALID_PARAMS);
        }
    } else {
        res.send(flip.tools.res.INSUFFICIANT_PARAMS);
    }
});

// /posts/*

router.post("/user/feed/get", function(req, res, next) {
    let clientID = req.body.clientID;
    let sessionID = req.body.sessionID;

	let index = req.body.index;

    if(index) {
        if(flip.tools.validate.index(index)) {
            flip.auth(req.body, function(auth) {
                if(auth.response == "OK") {
                    flip.feed.get(clientID, index, function(data0) {
                        if(data0.response == "OK") {
                            res.send(data0);
                        } else {
                            res.send(data0);
                        }
                    });
                } else {
                    res.send(auth);
                }
            });
        } else {
            res.send(flip.tools.res.INVALID_PARAMS);
        }
    } else {
        res.send(flip.tools.res.INSUFFICIANT_PARAMS);
    }
});

router.post("/posts/explore/get", function(req, res, next) {
    let clientID = req.body.clientID;
    let sessionID = req.body.sessionID;

    let index = req.body.index;

    if(index) {
        if(flip.tools.validate.index(index)) {
            flip.auth(req.body, function(auth) {
                if(auth.response == "OK") {
                    flip.explore.get(req.body.clientID, index, false, function(data0) {
    
                        if(data0.response == "OK") {
                            res.send(data0)
                        } else {
                            res.send(data0);
                        }
                    });
                } else {
                    res.send(auth);
                }
            });
        } else {
            res.send(flip.tools.res.INVALID_PARAMS);
        }
    } else {
        res.send(flip.tools.res.INSUFFICIANT_PARAMS);
    }
});

router.post("/onboarding/posts/get", function(req, res, next) {
    flip.onboarding.get(function(data0) {
        data0.meta = {};
        data0.meta.tagline = "A new home for short, looping videos.";
        
        res.send(data0);
    })
})

router.post("/user/posts/get", function(req, res, next) {
    let clientID = req.body.clientID;
    let sessionID = req.body.sessionID;
    
    let forClientID = req.body.forClientID;
    let index = req.body.index;

    if(forClientID && index) {
        if(flip.tools.validate.clientID(forClientID) && flip.tools.validate.index(index)) {
            flip.auth(req.body, function(auth) {
                if(auth.response == "OK") {
                    flip.user.get.posts(forClientID, index, req.body.clientID, function(data0) {
                        if(data0.response == "OK") {
                            res.send(data0);
                        } else {
                            res.send(data0);
                        }
                    });
                } else {
                    res.send(auth);
                }
            });
        } else {
            res.send(flip.tools.res.INVALID_PARAMS);
        }
    } else {
        res.send(flip.tools.res.INSUFFICIANT_PARAMS);
    }
});


// /report/*

router.post("/report/create", function(req, res, next) {
	let clientID = req.body.clientID;
	let sessionID = req.body.sessionID;

	var idToReport = req.body.idToReport;
	var type = req.body.type;
    var reason = req.body.reason;
    var details = req.body.details;

	if(idToReport && type && reason) {
        flip.auth(req.body, function(auth) {
            if(auth.response == "OK") {
                flip.report.create(clientID, idToReport, type, reason, details, function(data0) {
                    if(data0.response == "OK") {
                        res.send(data0);
                    } else {
                        res.send(data0);
                    }
                });
            } else {
                res.send(auth);
            }
        });
    } else {
        res.send(flip.tools.res.INSUFFICIANT_PARAMS);
    }
});

router.post("/report/types/get", function(req, res, next) {
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
                shortCode: "copyright-infringement"
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

	res.send({
		response: "OK",
		data: reportReasons[req.body.for]
	})
})

// ADMIN

router.post("/admin/login", function(req, res, next) {
    let email = req.body.email;
    let password = req.body.password.toUpperCase();

    let options = {
        httpOnly: true,
        secure: false,
        maxAge: 31536000000
    };

    if(email && password) {
        if(flip.tools.validate.email(email) && flip.tools.validate.password(password)) {
            flip.user.login(email, password, function(data0) {
                if(data0.response == "OK") {
                    flip.admin.auth({
                        clientID: data0.data.clientID,
                        sessionID: data0.data.sessionID
                    }, function(data1) {
                        if(data1.response == "OK") {
                            res.cookie("clientID", data0.data.clientID, options);
                            res.cookie("sessionID", data0.data.sessionID, options);
    
                            res.send({
                                response: "OK"
                            })
                        } else {
                            res.send(flip.tools.res.LOGIN_ERR)
                        }
                    })
                } else {
                    res.send(flip.tools.res.LOGIN_ERR)
                }
            })
        } else {
            res.send(flip.tools.res.INVALID_PARAMS);
        }
    } else {
        res.send(flip.tools.res.INSUFFICIANT_PARAMS);
    }
})

router.post("/admin/users/get", function(req, res, next) {
    let clientID = req.cookies.clientID;
	let sessionID = req.cookies.sessionID;

	flip.admin.auth(req.cookies, function(auth) {
		if(auth.response == "OK") {
            flip.admin.users.get(clientID, function(data0) {
                res.send(data0)
            })
        } else {
			res.send(auth);
		}
	});
})

router.post("/admin/explore/get", function(req, res, next) {
    let clientID = req.cookies.clientID;
	let sessionID = req.cookies.sessionID;

	flip.admin.auth(req.cookies, function(auth) {
		if(auth.response == "OK") {
            flip.explore.get(clientID, 0, true, function(data0) {
                if(data0.response == "OK") {
                    flip.admin.posts.get(clientID, clientID, function(data1) {
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
                    res.send(data0)
                }
            })
        } else {
			res.send(auth);
		}
	});
})

router.post("/admin/explore/feed/create", function(req, res, next) {
    let clientID = req.cookies.clientID;
	let sessionID = req.cookies.sessionID;

	flip.admin.auth(req.cookies, function(auth) {
		if(auth.response == "OK") {
            flip.explore.create.feed(function(data0) {
                if(data0.response == "OK") {
                    res.send(data0);
                } else {
                    res.send(data0);
                }
            })
        } else {
			res.send(auth);
		}
	});
})

router.post("/admin/explore/card/info/create", function(req, res, next) {
    let clientID = req.cookies.clientID;
    let sessionID = req.cookies.sessionID;

    let title = req.body.title;
    let body = req.body.body;

    let gradient = req.body["gradient[]"]

	flip.admin.auth(req.cookies, function(auth) {
		if(auth.response == "OK") {
            flip.explore.create.info(title, body, gradient, function(data0) {
                res.send(data0)
            })
        } else {
			res.send(auth);
		}
    });
});

router.post("/admin/explore/card/delete", function(req, res, next) {
    let clientID = req.cookies.clientID;
    let sessionID = req.cookies.sessionID;

    var cardID = req.body.cardID;

	flip.admin.auth(req.cookies, function(auth) {
		if(auth.response == "OK") {
            flip.explore.delete(cardID, function(data0) {
                res.send(data0)
            })
        } else {
			res.send(auth);
		}
    });
});

router.post("/admin/explore/card/user/create", function(req, res, next) {
    let clientID = req.cookies.clientID;
    let sessionID = req.cookies.sessionID;

    var username = req.body.username;

	flip.admin.auth(req.cookies, function(auth) {
		if(auth.response == "OK") {
            flip.explore.create.user(username, function(data0) {
                res.send(data0)
            })
        } else {
			res.send(auth);
		}
    });
});

router.post("/admin/explore/card/splitter/create", function(req, res, next) {
    let clientID = req.cookies.clientID;
    let sessionID = req.cookies.sessionID;

	flip.admin.auth(req.cookies, function(auth) {
		if(auth.response == "OK") {
            flip.explore.create.splitter(function(data0) {
                res.send(data0)
            })
        } else {
			res.send(auth);
		}
    });
});

router.post("/admin/explore/card/splitter/delete", function(req, res, next) {
    let clientID = req.cookies.clientID;
    let sessionID = req.cookies.sessionID;

	flip.admin.auth(req.cookies, function(auth) {
		if(auth.response == "OK") {
            flip.explore.delete.splitter(function(data0) {
                res.send(data0)
            })
        } else {
			res.send(auth);
		}
    });
});

router.post("/admin/explore/rearrange", function(req, res, next) {
    let clientID = req.cookies.clientID;
    let sessionID = req.cookies.sessionID;

    let cardID = req.body.cardID;
    let newIndex = req.body.newIndex;

	flip.admin.auth(req.cookies, function(auth) {
		if(auth.response == "OK") {
            flip.explore.rearrange(cardID, newIndex, function(data0) {
                res.send(data0);
            })
        } else {
			res.send(auth);
		}
    });
})

router.post("/admin/explore/post/create", function(req, res, next) {
    let clientID = req.cookies.clientID;
    let sessionID = req.cookies.sessionID;

    let postID = req.body.postID;

	flip.admin.auth(req.cookies, function(auth) {
		if(auth.response == "OK") {
            flip.explore.create.post(postID, function(data0) {
                res.send(data0);
            });
        } else {
			res.send(auth);
		}
    });
});

// /watch/*

router.get("/watch/:postID", function(req, res, next) {
    let postID = req.params.postID;

    flip.post.get(postID, "", function(data0) {
        res.render("video", {
            data: data0.data
        });
    });
});

module.exports = function(io) {
	var app = require("express");
    var socket = io.sockets;

    socket.on("like", function(data) {
        console.log(data)
    })

	return router;
}