var express = require("express");
var router = express.Router();

const fs = require("fs");
const dbConfig = require("../config.json");

const mongojs = require("mongojs")
const db = mongojs(dbConfig.mDB, [ "users", "posts", "reservations", "featured", "reports" ])

const bcrypt = require("bcrypt");

const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

const ffmpeg = require("fluent-ffmpeg");

const validator = require("validator");

const moment = require("moment");

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(dbConfig.sgKey);

var apn = require("apn");
var options = {
	token: {
		key: "AuthKey_F222L3UN88.p8",
		keyId: "F222L3UN88",
		teamId: "TR3V3JFX6K"
	},
	production: false
};
var apnProvider = new apn.Provider(options);

function print(inp){
	console.log(inp)
}

const Twitter = require("twitter");
var client = new Twitter(dbConfig.twitter);

const flip = {
	auth: function(body, callback){
		var clientID = body.clientID;
		var sessionID = body.sessionID;

		if(clientID && sessionID){
			if(flip.tools.validate.clientID(clientID) && flip.tools.validate.sessionID(sessionID)){
				flip.user.auth(clientID, sessionID, function(data0){
					callback(data0);
				})
			} else {
				callback(flip.tools.res.INVALID_CREDENTIALS)
			}
		} else {
			callback(flip.tools.res.INVALID_CREDENTIALS)
		}
	},
	tools: {
		numberWithCommas: function(x) {
		  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		},
		res: {
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
			NO_AUTH: {
				response: "NO_AUTH",
				formattedTitle: "Authentication Revoked",
				formattedResponse: "You are not authenticated. Try logging out and logging back in."
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
				formattedResponse: "The request send did not have the sufficiant parameters in order to get a response."
			},
			RESERVATION_ALREADY_EXISTS: {
				response: "RESERVATION_ALREADY_EXISTS",
				formattedTitle: "Reservation Already Exists",
				formattedResponse: "This username/email has already been reserved. Try a different username or email."
			}
		},
		validate: {
			username: function(inp) {				
				if(inp.length > 0 && inp.length < 16){
					inp = inp.replace("@", "");
					inp = inp.trim()

					if(/^[0-9a-zA-Z_.-]+$/.test(inp)){
						return true;
					}
				}

				return false;
			},
			email: function(inp) {
				if(inp.length > 0 && inp.length < 100){
					inp = inp.trim();
					if(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(inp)){
						return true;
					}
				}

				return false;
			},
			password: function(inp) {
				if(inp.length > 0 && inp.length < 100){
					return true;
				}

				return false;
			},
			clientID: function(inp) {
				if(inp.length == 15 || inp == "feed" || inp == "featured"){
					return true;
				}

				return false;
			},
			sessionID: function(inp) {
				if(inp.length == 25){
				   return true;
				}

				return false;
			},
			postID: function(inp) {
				if(inp.length == 10){
				   return true;
				}

				return false;
			},
			name: function(inp) {
				if(inp.length < 20 && /^[a-z ,.'-]+$/i.test(inp)){
					return true;
				}

				return false;
			},
			caption: function(inp) {
				if(inp.length < 150){
					return true;
				}

				return false;
			},
			index: function(inp) {
				if(inp.match(/^-{0,1}\d+$/)){
					return true;
				}

				return false;
			}
		},
		gen: {
			user: function (username, email) {
				var clientID = flip.tools.gen.clientID();
				var sessionID = flip.tools.gen.sessionID();

				return {
					info: {
						clientID: clientID,
						username: username,
						joinedAt: Date.now()
					},
					security: {
						email: email,
						sessionID: sessionID,
						password: ""
					},
					profile: {
						name: username.charAt(0).toUpperCase() + username.substr(1, username.length).toLowerCase(),
						bio: "This user has no bio.",
						profileImg: "https://flip.wtf/assets/img/flip_defaultUserIcon.png",
						verified: false,
						followers: [],
						following: ["gcVKSxFv2hk3o8V"]
					}
				}
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
			clientID: function(){
				return flip.tools.gen.randomString(15);
			},
			sessionID: function(){
				return flip.tools.gen.randomString(25);
			},
			postID: function(){
				return flip.tools.gen.randomString(10);
			},
			tDef: function(inp){
				var possibleT = [
					"s",
					"m",
					"h",
					"d",
					"y"
				];

				if(inp == "a few seconds ago"){
					return "5s"
				} else if(inp == "a minute ago"){
					return "1m"
				} else if(inp == "an hour ago"){
					return "1h"
				} else if(inp == "a day ago"){
					return "1d"
				} else if(inp == "a month ago"){
					return "1mth"
				} else if(inp == "a year ago"){
					return "1y"
				} else if(possibleT.indexOf(inp.split(" ")[1][0])){
					var timeType = inp.split(" ")[1][0];

					if(timeType == "m"){
						if(inp.indexOf("minute") == -1){
							timeType = "mth"
						}
					}

					return inp.split(" ")[0] + timeType;
				}
			}
		}
	},
	explore: {
		getFeaturedPosts: function(clientID, index, callback) {
			db.featured.find({}).sort({
				"info.featuredDate": -1
			}, function(err0, docs0) {
				if(!err0){
					db.posts.find({
						"info.postID": {
							$in: docs0[0].data.posts
						}
					}).skip(parseInt(index)).limit(10, function(err1, docs1){
						if(!err1){
							if(docs1.length > 0){
								flip.feed.handlePosts(docs1, clientID, function(docs2) {
									docs2.meta = docs0[0].info;
									callback(docs2);
								});
							} else {
								callback(flip.tools.res.NO_ITEMS);
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
		getFeaturedMeta: function(callback) {
			db.featured.find({}).sort({
				"info.featuredDate": -1
			}, function(err0, docs0) {
				if(!err0){
					callback({
						response: "OK",
						data: docs0[0].info
					})
				} else {
					callback(flip.tools.res.ERR);
				}
			})
		},
		search: function(query, index, callback) {
			if(query.length > 0){
				var searchRe = new RegExp(query, "i");

				db.users.find({
					"info.username": searchRe
				}).skip(parseInt(index)).limit(10, function(err, docs) {
					if(!err){
						if(docs.length > 0){
							for(i = 0; i < docs.length; i++){
								docs[i].profile = {
									name: docs[i].profile.name,
									profileImg: docs[i].profile.profileImg,
									verified: docs[i].profile.verified
								};

								delete docs[i].info.deviceToken;

								docs[i].info = {
									clientID: docs[i].info.clientID,
									username: docs[i].info.username,
									joinedAt: docs[i].info.joinedAt
								}

								docs[i] = {
									info: docs[i].info,
									profile: docs[i].profile
								};

								if(i == docs.length - 1){
									callback({
										response: "OK",
										data: docs
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
			} else {
				callback({
					response: "OK",
					data: []
				});
			}
		}
	},
	user: {
		get: function(clientID, callback){
			db.users.find({
				"info.clientID": clientID
			}, function (err, docs) {
				if(!err){
					if(docs.length > 0){
						callback({
							response: "OK",
							data: docs
						});
					} else {
						callback(flip.tools.res.NO_ITEMS);
					}
				} else {
					callback(flip.tools.res.ERR);
				}
			});
		},
		getSafe: function(clientID, requesterClientID, callback){
			db.users.find({
				"info.clientID": clientID
			}, function (err0, docs0) {
				if(!err0){
					if(docs0.length > 0){
						db.posts.find({
							"info.postedBy": clientID
						}).count(function(err1, docs1) {
							if(!err1){
								if(clientID == requesterClientID){
									var safeData = {
										info: docs0[0].info
									};

									delete safeData.info.deviceToken;
								} else {
									var safeData = {
										info: {
											username: docs0[0].info.username,
											joinedAt: docs0[0].info.joinedAt
										}
									};
								}

								if(docs0[0].profile.followers.indexOf(requesterClientID) > -1){
									safeData.isFollowing = true;
								} else {
									safeData.isFollowing = false;
								}

								docs0[0].profile.posts = docs1;
								docs0[0].profile.followers = docs0[0].profile.followers.length;
								docs0[0].profile.following = docs0[0].profile.following.length;

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
						callback(flip.tools.res.NO_ITEMS);
					}
				} else {
					callback(flip.tools.res.ERR);
				}
			});
		},
		updateDeviceToken: function(clientID, deviceToken) {
			db.users.update({
				"info.clientID": clientID
			}, {
				$set: {
					"info.deviceToken": deviceToken
				}
			});
		},
		getRelationships: function(clientID, index, callback) {
			db.users.find({
				"info.clientID": clientID
			}, function (err0, docs0) {
				if(!err0){
					if(docs0.length > 0){
						var followers = docs0[0].profile.followers;
						var following = docs0[0].profile.following;

						var relationships = {
							followers: [],
							following: []
						};

						flip.user.getMinifiedBulkData(followers, index, function(data0) {
							if(data0.data != null){
								relationships.followers = data0.data;								
							}
							flip.user.getMinifiedBulkData(following, index, function(data1) {
								if(data1.data != null){
									relationships.following = data1.data;
								}
								callback({
									response: "OK",
									data: relationships
								});
							});
						});
					} else {
						callback(flip.tools.res.NO_ITEMS);
					}
				} else {
					callback(flip.tools.res.ERR);
				}
			});
		},
		getMinifiedBulkData: function(clientIDs, index, callback) {
			db.users.find({
				"info.clientID": {
					$in: clientIDs
				}
			}).skip(parseInt(index)).limit(10, function(err1, docs1) {
				if(!err1){
					if(docs1.length > 0){
						var result = [];
						var max0 = docs1.length;
						for(let i = 0; i < docs1.length; i++){
							var profile = {
								name: docs1[i].profile.name,
								profileImg: docs1[i].profile.profileImg,
								verified: docs1[i].profile.verified
							};

							delete docs1[i].info.deviceToken;

							result.push({
								info: docs1[i].info,
								profile: profile
							});

							max0--;
							if(max0 == 0){
								callback({
									response: "OK",
									data: result
								})
							}
						}
					} else {
						callback(flip.tools.res.NO_ITEMS);
					}
				} else {
					callback(flip.tools.res.ERR);
				}
			});
		},
		login: function(email, password, callback){
			db.users.find({
				$and: [
					{
						"security.email": email
					}
				]
			}, function (err, docs) {
				if(!err){
					if(docs.length > 0){
						if(bcrypt.compareSync(password, docs[0].security.password)){
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
		twitter: {
			login: function(tAuthToken, tAuthTokenSecret, tUserID, username, email, callback) {
				db.users.find({
					$and: [
						{
							"info.type": "twitter"
						},
						{
							"info.tAuthToken": tAuthToken
						}
					]
				}, function(err0, docs0) {
					if(!err0){
						if(docs0.length > 0){
							if(docs0[0].info.tAuthTokenSecret != tAuthTokenSecret){
								db.users.update({
									"info.clientID": docs0[0].info.clientID
								}, {
									$set: {
										"info.tAuthTokenSecret": tAuthTokenSecret
									}
								});
							}
							callback({
								response: "OK",
								data: {
									clientID: docs0[0].info.clientID,
									sessionID: docs0[0].security.sessionID
								}
							})
						} else {
							db.users.find({
								"info.username": username
							}, function(err1, docs1) {
								if(!err1){
									if(docs1.length > 0){
										callback({
											response: "USERNAME_ALREADY_TAKEN",
											responseScope: "FIELD_ALREADY_TAKEN",
											formattedTitle: "Username Already Taken",
											formattedResponse: "An account on flip has already got the username @" + username + ", please choose another one."
										});
									} else {
										db.users.find({
											"security.email": email
										}, function(err2, docs2) {
											if(!err2){
												if(docs2.length > 0){
													callback({
														response: "EMAIL_ALREADY_TAKEN",
														responseScope: "FIELD_ALREADY_TAKEN",
														formattedTitle: "Email Already Taken",
														formattedResponse: "An account on flip has already used the email " + email + ". If this was you, please login to flip with this email and select 'Link to Twitter' in Settings. If this was not you, please type in another email below."
													});
												} else {
													var userObj = flip.tools.gen.user(username, email);
													userObj.info.type = "twitter";
													userObj.info.tUserID = tUserID;
													userObj.info.tAuthToken = tAuthToken;
													userObj.info.tAuthTokenSecret = tAuthTokenSecret;

													client.get("users/show", { user_id: tUserID },  function(err, user, res) {
														if(!err) {
															userObj.profile.name = user.name;
															userObj.profile.bio = user.description;
															userObj.profile.profileImg = user.profile_image_url_https;
															userObj.profile.verified = user.verified;
														}

														db.users.insert(userObj);

														callback({
															response: "OK",
															data: {
																clientID: userObj.info.clientID,
																sessionID: userObj.security.sessionID
															}
														})
													});
												}
											} else {
												callback(flip.tools.res.ERR);
											}
										})
										
									}
								} else {
									callback(flip.tools.res.ERR);
								}
							})
						}
					} else {
						callback(flip.tools.res.ERR);
					}
				});
			},
			connect: function(clientID, tUserID, tAuthToken, tAuthTokenSecret, callback) {
				db.users.find({
					"info.tUserID": tUserID
				}, function(err0, data0){
					if(!err0){
						if(data0.length > 0){
							callback({
								response: "ACCOUNT_ALREADY_LINKED",
								formattedTitle: "Account Already Linked",
								formattedResponse: "A flip account has already been linked with this Twitter account. To unlink it, please email: support@flip.wtf."
							});
						} else {
							var isVerified = false;

							client.get("users/show", { user_id: tUserID },  function(err, user, res) {
								if(!err) {
									isVerified = user.verified;
								}
							});
						
							db.users.update({
								"info.clientID": clientID
							}, {
								$set: {
									"info.type": "twitter",
									"info.tUserID": tUserID,
									"info.tAuthToken": tAuthToken,
									"info.tAuthTokenSecret": tAuthTokenSecret,
									"profile.verified": isVerified
								}
							}, function(err1, data1) {
								if(!err1){
									callback({
										response: "OK"
									})
								} else {
									callback(flip.tools.res.ERR);
								}
							})
						}
					} else {
						callback(flip.tools.res.ERR);
					}
				})	
			},
			disconnect: function(clientID, callback) {
				db.users.find({
					"info.clientID": clientID
				}, function(err0, data0){
					if(!err0){
						if(data0.length > 0){
							if(data0[0].security.password.length > 0){
								db.users.update({
									"info.clientID": clientID
								}, {
									$set: {
										"info.type": "normal"
									},
									$unset: {
										"info.tUserID": "",
										"info.tConsumerKey": "",
										"info.tConsumerSecret": ""
									}
								}, function(err1, data1) {
									if(!err1){
										callback({
											response: "OK"
										})
									} else {
										callback({
											response: "ERR1"
										})
									}
								})
							} else {
								db.users.update({
									"info.clientID": clientID
								}, {
									$set: {
										"info.twitterUnlink": true
									}
								});

								callback({
									response: "PASSWORD_NOT_SET",
									formattedTitle: "Set A Password",
									formattedResponse: "Because you created your flip account with Twitter, you will need to set a password alongside your email when logging into flip."
								});	
							}
						} else {
							callback(flip.tools.res.NO_ITEMS);
						}
					} else {
						callback({
							response: "ERR0"
						})
					}
				})
			},
			setPassword: function(clientID, password, callback) {
				db.users.find({
					"info.clientID": clientID
				}, function(err0, data0){
					if(!err0){
						if(data0.length > 0){
							if(data0[0].info.twitterUnlink == true){
								const saltRounds = 10;
								var salt = bcrypt.genSaltSync(saltRounds);
								var hash = bcrypt.hashSync(password, salt);

								db.users.update({
									"info.clientID": clientID
								}, {
									$set: {
										"security.password": hash
									},
									$unset: {
										"info.twitterUnlink": ""
									}
								}, function(err1, data1) {
									if(!err1){
										callback({
											response: "OK"
										});
									} else {
										callback({
											response: "ERR1"
										})
									}
								});
							} else {
								callback(flip.tools.res.NO_AUTH)
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
		auth: function(clientID, sessionID, callback){
			flip.user.get(clientID, function(data0){
				if(data0.response == "OK"){
					console.log("@" + data0.data[0].info.username + " just made a request!")
					if(data0.data[0].security.sessionID == sessionID){
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
		create: function(username, email, password, callback){
			var usernameRe = new RegExp(["^", username, "$"].join(""), "i");
			var emailRe = new RegExp(["^", email, "$"].join(""), "i");

			db.users.find({
				$or: [
					{
						"info.username": usernameRe
					},
					{
						"security.email": emailRe
					}
				]
			}, function (err, docs) {
				if(!err){
					if(docs.length == 0){
						flip.user.reservation.check(username, email, function(data0) {
							if(data0.response == "OK"){
								const saltRounds = 10;
								var salt = bcrypt.genSaltSync(saltRounds);
								var hash = bcrypt.hashSync(password, salt);
								var userObj = flip.tools.gen.user(username, email);
								userObj.security.password = hash

								db.users.insert(userObj);

								const msg = {
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
		reservation: {
			create: function(username, email, callback) {
				var usernameRe = new RegExp(["^", username, "$"].join(""), "i");
				var emailRe = new RegExp(["^", email, "$"].join(""), "i");
			
				db.reservations.find({
					$or: [
						{
							"data.username": usernameRe
						},
						{
							"data.email": emailRe
						}
					]
				},function (err, docs) {
					if(!err){
						if(docs.length == 0){
							var reservationID = flip.tools.gen.clientID();

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

							print("New Reservation: @" + username + " reserved under " + email + ".")

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
				}, function(err, docs) {
					if(!err){
						if(docs.length > 0){
							var hasCalledback = false;
							for(i = 0; i < docs.length; i++){
								if(docs[i].data.username.trim() == username.trim() && docs[i].data.email.trim() == email.trim()){
									if(!hasCalledback){
										hasCalledback = true;
										callback({
											response: "OK"
										});
									}
								}
								if(i == docs.length - 1 && !hasCalledback){
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
				db.users.update({
					"info.clientID": otherClientID
				}, {
					$addToSet: {
						"profile.followers": clientID
					}
				}, function(err0, doc0) {
					if(!err0){
						flip.user.get(clientID, function(data0) {
							if(data0.response == "OK"){
								flip.notification.send("@" + data0.data[0].info.username + " just followed you", otherClientID);
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
				}, function (err0, doc0) {
					if(!err0){
						flip.user.getSafe(otherClientID, clientID, function(data0) {
							if(data0.response == "OK"){
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
						callback(flip.tools.res.ERR);
					}
				});
			},
			unfollow: function(clientID, otherClientID, callback) {
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
				}, function (err, docs) {
					if(!err){
						flip.user.getSafe(otherClientID, clientID, function(data0) {
							if(data0.response == "OK"){
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
						callback(flip.tools.res.ERR);
					}
				});
			}
		},
		settings: {
			update: function(clientID, settings, callback) {
				var masterSettings = {};

				if(typeof settings.name !== "undefined" && settings.name.trim() !== ""){
					masterSettings["profile.name"] = settings.name;
				}

				if(typeof settings.bio !== "undefined" && settings.bio.trim() !== ""){
					masterSettings["profile.bio"] = settings.bio;
				}

				if(typeof settings.profileImgUrl !== "undefined" && settings.profileImgUrl.trim() !== ""){
					masterSettings["profile.profileImg"] = settings.profileImgUrl;
				}

				db.users.update({
					"info.clientID": clientID
				}, {
					$set: masterSettings
				}, function(err0, doc0){
					if(!err0){
						callback({
							response: "OK"
						})
					} else {
						callback(flip.tools.res.ERR);
					}
				});
			}
		}
	},
	post: {
		get: function(postID, callback) {
			db.posts.find({
				"info.postID": postID
			}, function(err, docs) {
				if(!err){
					if(docs.length > 0){
						flip.feed.handlePosts(docs, "", function(data0) {
							if(data0.response == "OK"){
								callback({
									response: "OK",
									data: data0.data[0]
								})
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
		view: function(postID, callback) {
			db.posts.update({
				"info.postID": postID
			}, {
				$inc: {
					"data.views": 1
				}
			}, function(err0, data0) {
				if(!err0){
					callback({
						response: "OK"
					});
				} else {
					callback(flip.tools.res.ERR)
				}
			});
		},
		getLikers: function(postID, index, callback) {
			db.posts.find({
				"info.postID": postID
			}, function(err0, data0) {
				if(!err0){
					if(data0.length > 0){
						flip.user.getMinifiedBulkData(data0[0].data.likedBy, index, function(data1) {
							callback(data1);
						})
					} else {
						callback(flip.tools.res.ERR);
					}
				} else {
					callback(flip.tools.res.ERR);
				}			
			})
		},
		editCaption: function(caption, postID, clientID, callback) {
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
			}, function(err0, data0) {
				if(!err0){
					callback({
						response: "OK"
					});
				} else {
					callback(flip.tools.res.ERR);
				}
			})
		},
		interaction: {
			like: function(clientID, postID, callback) {
				db.posts.update({
					"info.postID": postID
				}, {
					$addToSet: {
						"data.sLikedBy": clientID
					}
				}, function(err0, doc0) {
					if(!err0){
						if(doc0.nModified > 0){
							flip.user.get(clientID, function(data0) {
								if(data0.response == "OK"){
									if(clientID !== data0.data[0].info.clientID){
										flip.notification.sendToPoster("@" + data0.data[0].info.username + " just liked your post", postID);
									}
								}
							})
						}
					}
				});

				db.posts.update({
					"info.postID": postID
				}, {
					$addToSet: {
						"data.likedBy": clientID
					}
				}, function(err0, doc0){
					if(!err0){
						callback({
							response: "OK"
						})
					} else {
						callback(flip.tools.res.ERR);
					}
				});
			},
			unlike: function(clientID, postID, callback) {
				db.posts.update({
					"info.postID": postID
				}, {
					$pull: {
						"data.likedBy": clientID
					}
				}, function(err0, doc0){
					if(!err0){
						callback({
							response: "OK"
						})
					} else {
						callback(flip.tools.res.ERR);
					}
				});
			}
		},
		new: function(vID, clientID, callback){
			var postID = flip.tools.gen.postID();
			db.posts.insert({
				info: {
					postID: postID,
					postedBy: clientID,
					postedAt: Date.now(),
                    hideProfileData: false,
                    postType: "post"
				},
				data: {
					caption: "",
					streamURL: "/stream/" + postID,
					views: 0,
					likedBy: [],
					sLikedBy: []
                },
                comments: []
			}, function(err0, doc0){
				if(!err0){
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
		delete: function(postID, clientID, callback){
			db.posts.remove({
				$and: [
					{
						"info.postID": postID
					},
					{
						"info.postedBy": clientID
					}
				]
			}, function (err0, docs0) {
				if(!err0){
					callback({
						response: "OK"
					});
					fs.unlink("./videos/" + postID + ".mov", (err) => {
						if(!err){
							// deleted successfully
						}
					});
					fs.unlink("./thumbnails/" + postID + ".png", (err) => {
						if(!err){
							// deleted successfully
						}
					});
				} else {
					callback(flip.tools.res.ERR);
				}
			});
		}
	},
	feed: {
		get: function(clientID, index, callback){
			db.users.find({
				"info.clientID": clientID
			}, function (err0, docs0) {
				if(!err0){
					if(docs0.length > 0){
						var following = docs0[0].profile.following;
						following.push(docs0[0].info.clientID);

						db.posts.find({
							"info.postedBy": {
								$in: following
							}
						}).sort({
							"info.postedAt": -1
						}).skip(parseInt(index)).limit(10, function(err1, docs1){
							if(!err1){
								if(docs1.length > 0){
									flip.feed.handlePosts(docs1, clientID, function(docs2) {
										callback(docs2);
									});
								} else {
									callback(flip.tools.res.NO_ITEMS);
								}
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
		},
		getForClientID: function(clientID, index, callback){
			db.posts.find({
				"info.postedBy": clientID
			}).sort({
				"info.postedAt": -1
			}).skip(parseInt(index)).limit(10, function(err1, docs1){
				if(!err1){
					if(docs1.length > 0){
						flip.feed.handlePosts(docs1, clientID, function(docs2) {
							callback(docs2);
						});
					} else {
						callback(flip.tools.res.NO_ITEMS);
					}
				} else {
					callback(flip.tools.res.ERR);
				}
			});
		},
		handlePosts: function(docs, cID, callback) {
			var dataCount = docs.length;
			docs.forEach(function(cDoc, i) {
				db.users.find({
					"info.clientID": cDoc.info.postedBy
				}, function (err, uDocs) {
					if(!err){
						if(uDocs.length > 0){
							cDoc.info.postedAgo = flip.tools.gen.tDef(moment(cDoc.info.postedAt).local().fromNow())
							cDoc.info.postedAgoLong = moment(cDoc.info.postedAt).local().fromNow()

							cDoc.profile = {
								name: uDocs[0].profile.name,
								username: uDocs[0].info.username,
								profileImg: uDocs[0].profile.profileImg,
								verified: uDocs[0].profile.verified
							}

							if(cDoc.data.likedBy.indexOf(cID) > -1){
								cDoc.info.hasLiked = true
							} else {
								cDoc.info.hasLiked = false
                            }
                            
                            //V2 TRANSLATION

                            cDoc.data = {
								caption: cDoc.data.caption,
								streamURL: cDoc.data.streamURL,
								views: flip.tools.numberWithCommas(Math.round(cDoc.data.views)),
								viewsRaw: Math.round(cDoc.data.views),
								likes: flip.tools.numberWithCommas(Math.round(cDoc.data.likedBy.length)),
								likesRaw: cDoc.data.likedBy.length
							}

							dataCount--;
							if(dataCount == 0){
								callback({
									response: "OK",
									data: docs
								});
							}
						}
					}
				});
			});
		}
	},
	report: function(clientID, idToReport, type, reason, callback) {
		db.reports.insert({
			info: {
				reportID: flip.tools.gen.clientID(), 
				reportedBy: clientID,
				reportedAt: Date.now()
			},
			data: {
				reportType: type,
				reportedID: idToReport,
				reportReason: reason
			}
		}, function(err1, docs1){
			if(!err1){
				callback({
					response: "OK"
				});
			} else {
				callback(flip.tools.res.ERR);
			}
		});
	},
	notification: {
		send: function(body, clientID) {
			db.users.find({
				"info.clientID": clientID
			}, function(err1, docs1){
				if(!err1){
					if(docs1.length > 0){
						if(docs1[0].info.deviceToken !== null && docs1[0].info.deviceToken !== ""){
							var deviceToken = docs1[0].info.deviceToken;
							var note = new apn.Notification();

							note.sound = "flip_sound.aiff";
							note.alert = body;
							note.topic = "wtf.flip.ios";

							apnProvider.send(note, deviceToken).then( (result) => {
								console.log(result)
								if(result.failed.length > 0){
									console.log(result.failed[0])
								}
							});
						}
					}
				}
			})
		},
		sendToPoster: function(body, postID) {
			db.posts.find({
				"info.postID": postID
			}, function(err1, docs1){
				if(!err1){
					if(docs1.length > 0){
						flip.notification.send(body, docs1[0].info.postedBy);
					}
				}
			})
		}
	},
	// addFieldToAllDocs: function() {
	// 	db.posts.update({}, {
	// 		$set: {
	// 			"comments": []
	// 		}
	// 	}, {
	// 		multi: true
	// 	}, function(err, docs){
	// 		console.log(err, docs);
	// 	});
	// }
}

router.post("/reserveUsername", function(req, res, next) {
	var username = req.body.username;
	var email = req.body.email;

	if(username && email){
		username = username.replace("@", "");
		if(flip.tools.validate.username(username) && flip.tools.validate.email(email)){
			flip.user.reservation.create(username, email, function(data) {
				res.send(data);
			});
		} else {
			res.send({
				response: "INPUT_NOT_VALID",
				formattedTitle: "Username/Email Not Valid",
				formattedResponse: "Your username or email is not valid. Please try again."
			})
		}
	} else {
		res.send({
			response: "INPUT_NOT_VALID",
			formattedTitle: "Username/Email Not Valid",
			formattedResponse: "Your username or email is not valid. Please try again."
		})
	}
})

// Auth

router.post("/login", function(req, res, next){
	var email = req.body.email;
	var password = req.body.password;

	if(email && password){
		if(flip.tools.validate.email(email) && flip.tools.validate.password(password)){
			flip.user.login(email, password, function(data0){
				res.send(data0);
			});
		} else {
			res.send(flip.tools.res.INVALID_LOGIN);
		}
	} else {
		res.send(flip.tools.res.INVALID_LOGIN);
	}
});

router.post("/tw-connect", function(req, res, next) {
	var clientID = req.body.clientID;
	var sessionID = req.body.sessionID;

	var tUserID = req.body.tUserID;
	var tAuthToken = req.body.tAuthToken;
	var tAuthTokenSecret = req.body.tAuthTokenSecret;

	if(tUserID && tAuthToken && tAuthTokenSecret){
		flip.auth(req.body, function(auth) {
			if(auth.response == "OK"){
				flip.user.twitter.connect(clientID, tUserID, tAuthToken, tAuthTokenSecret, function(data0) {
					res.send(data0);
				})
			} else {
				res.send(auth);
			}
		});
	} else {
		res.send(flip.tools.res.INSUFFICIANT_PARAMS);
	}
});

router.post("/tw-disconnect", function(req, res, next) {
	var clientID = req.body.clientID;
	var sessionID = req.body.sessionID;

	flip.auth(req.body, function(auth){
		if(auth.response == "OK"){
			flip.user.twitter.disconnect(clientID, function(data0) {
				res.send(data0);
			})
		} else {
			res.send(auth);
		}
	});
});

router.post("/tw-setPassword", function(req, res, next) {
	var clientID = req.body.clientID;
	var sessionID = req.body.sessionID;

	var password = req.body.password;

	flip.auth(req.body, function(auth){
		if(auth.response == "OK"){
			flip.user.twitter.setPassword(clientID, password, function(data0) {
				res.send(data0);
			})
		} else {
			res.send(auth);
		}
	});
})

router.post("/tw-login", function(req, res, next) {
	var tUserID = req.body.tUserID;
	var username = req.body.username;
	var email = req.body.email;

	var tAuthToken = req.body.tAuthToken;
	var tAuthTokenSecret = req.body.tAuthTokenSecret;

	if(tUserID && username && email){
		if(flip.tools.validate.email(email) && tUserID.length > 0 && username.length > 0){
			flip.user.twitter.login(tAuthToken, tAuthTokenSecret, tUserID, username, email, function(data0) {
				res.send(data0)
			});
		} else {
			res.send(flip.tools.res.INVALID_LOGIN)
		}
	} else {
		res.send(flip.tools.res.INVALID_LOGIN)
	}
})

router.post("/auth", function(req, res, next){
	flip.auth(req.body, function(data0){
		if(typeof req.body.deviceToken !== "undefined"){
			if(req.body.deviceToken !== null){
				if(req.body.deviceToken.length > 0){
					flip.user.updateDeviceToken(req.body.clientID, req.body.deviceToken);
				}
			}
		}

		res.send(data0);
	});
})

// Signup

router.post("/signup", function(req, res, next) {
	var username = req.body.username;
	var email = req.body.email;
	var password = req.body.password;

	if(username && email && password){
		if(flip.tools.validate.username(username) && flip.tools.validate.email(email) && flip.tools.validate.password(password)){
			username = username.replace("@", "");
			flip.user.create(username, email, password, function(data) {
				res.send(data);
			});
		} else {
			res.send(flip.tools.res.INVALID_LOGIN)
		}
	} else {
		res.send(flip.tools.res.INSUFFICIANT_PARAMS);
	}
})

// Explore

router.post("/search", function(req, res, next) {
	var query = req.body.query;
	var index = req.body.index;

	if(query){
		if(query.length > 0 && query.length < 20){
			flip.auth(req.body, function(data0){
				if(data0.response == "OK"){
					flip.explore.search(query, index, function(data1) {
						res.send(data1);
					})
				} else {
					res.send(data0);
				}
			});
		} else {
			res.send(flip.tools.res.INSUFFICIANT_PARAMS);
		}
	} else {
		res.send(flip.tools.res.INSUFFICIANT_PARAMS);
	}
});

// Feed

router.post("/getPosts", function(req, res, next){
	var forClientID = req.body.forClientID;
	var index = req.body.index;

	if(forClientID && index){
		if(flip.tools.validate.clientID(forClientID) && flip.tools.validate.index(index)){
			flip.auth(req.body, function(data0){
				if(data0.response == "OK"){
					if(forClientID == "feed"){
						flip.feed.get(req.body.clientID, index, function(data1){
							res.send(data1);
						});
					} else if(forClientID == "featured"){
						flip.explore.getFeaturedPosts(req.body.clientID, index, function(data1) {
							res.send(data1);
						})
					} else {
						flip.feed.getForClientID(forClientID, index, function(data1){
							res.send(data1);
						});
					}
				} else {
					res.send(data0);
				}
			});
		} else {
			res.send(flip.tools.res.INSUFFICIANT_PARAMS);
		}
	} else {
		res.send(flip.tools.res.INSUFFICIANT_PARAMS);		
	}
});

router.post("/getFeaturedMeta", function(req, res, next) {
	flip.auth(req.body, function(data0){
		if(data0.response == "OK"){
			flip.explore.getFeaturedMeta(function(data1) {
				res.send(data1);
			})
		} else {
			res.send(data0);
		}
	});
});

router.post("/view", function(req, res, next) {
	var postID = req.body.postID;

	if(postID){
		if(flip.tools.validate.postID(postID)){
			flip.auth(req.body, function(data0){
				if(data0.response == "OK"){
					flip.post.view(postID, function(data1) {
						res.send(data1)
					});
				} else {
					res.send(data0);
				}
			});
		} else {
			res.send(flip.tools.res.INSUFFICIANT_PARAMS);
		}
	} else {
		res.send(flip.tools.res.INSUFFICIANT_PARAMS);
	}
})

// Video Data

// moved to index.js

// Profile

router.post("/getProfile", function(req, res, next){
	var cIDFor = req.body.cIDFor;

	if(cIDFor){
		if(flip.tools.validate.clientID(cIDFor)){
			flip.auth(req.body, function(auth){
				if(auth.response == "OK"){
					flip.user.getSafe(cIDFor, req.body.clientID, function(data0){
						res.send(data0);
					});
				} else {
					res.send(auth);
				}
			});
		} else {
			res.send(flip.tools.res.INSUFFICIANT_PARAMS);
		}
	} else {
		res.send(flip.tools.res.INSUFFICIANT_PARAMS);
	}
});

router.post("/settings", function(req, res, next) {
	var clientID = req.body.clientID;
	var sessionID = req.body.sessionID;

	var name = req.body.name;
	var bio = req.body.bio;
	var profileImgUrl = req.body.profileImgUrl;

	flip.auth(req.body, function(auth){
		if(auth.response == "OK"){
			var settings = {
				name: name,
				bio: bio,
				profileImgUrl: profileImgUrl
			};

			flip.user.settings.update(clientID, settings, function(data0){
				res.send(data0);
			});
		} else {
			res.send(auth);
		}
	});
});

// Interactions

router.post("/follow", function(req, res, next){
	var clientIDAssoc = req.body.clientIDAssoc;

	if(clientIDAssoc){
		if(flip.tools.validate.clientID(clientIDAssoc)){
			flip.auth(req.body, function(auth){
				if(auth.response == "OK"){
					flip.user.interaction.follow(req.body.clientID, clientIDAssoc, function(data0){
						res.send(data0);
					});
				} else {
					res.send(auth);
				}
			});
		} else {
			res.send(flip.tools.res.INSUFFICIANT_PARAMS);
		}
	} else {
		res.send(flip.tools.res.INSUFFICIANT_PARAMS);
	}
});

router.post("/unfollow", function(req, res, next){
	var clientIDAssoc = req.body.clientIDAssoc;

	if(clientIDAssoc){
		if(flip.tools.validate.clientID(clientIDAssoc)){
			flip.auth(req.body, function(auth){
				if(auth.response == "OK"){
					flip.user.interaction.unfollow(req.body.clientID, clientIDAssoc, function(data0){
						res.send(data0);
					});
				} else {
					res.send(auth);
				}
			});
		} else {
			res.send(flip.tools.res.INSUFFICIANT_PARAMS);
		}
	} else {
		res.send(flip.tools.res.INSUFFICIANT_PARAMS);
	}
});

router.post("/like", function(req, res, next){
	var postID = req.body.postID;

	if(postID){
		if(flip.tools.validate.postID(postID)){
			flip.auth(req.body, function(auth){
				if(auth.response == "OK"){
					flip.post.interaction.like(req.body.clientID, postID, function(data0){
						res.send(data0);
					});
				} else {
					res.send(auth);
				}
			});
		} else {
			res.send(flip.tools.res.INSUFFICIANT_PARAMS);
		}
	} else {
		res.send(flip.tools.res.INSUFFICIANT_PARAMS);
	}
});

router.post("/unlike", function(req, res, next){
	var postID = req.body.postID;

	if(postID){
		if(flip.tools.validate.postID(postID)){
			flip.auth(req.body, function(auth){
				if(auth.response == "OK"){
					flip.post.interaction.unlike(req.body.clientID, postID, function(data0){
						res.send(data0);
					});
				} else {
					res.send(auth);
				}
			});
		} else {
			res.send(flip.tools.res.INSUFFICIANT_PARAMS);
		}
	} else {
		res.send(flip.tools.res.INSUFFICIANT_PARAMS);
	}
});

router.post("/getRelationships", function(req, res, next) {
	var clientID = req.body.clientID;
	var sessionID = req.body.sessionID;

	var forClientID = req.body.forClientID;
	var index = req.body.index;

	console.log(req.body.index)

	if(forClientID && index){
		if(flip.tools.validate.clientID(forClientID) && flip.tools.validate.index(index)){
			flip.auth(req.body, function(auth){
				if(auth.response == "OK"){
					flip.user.getRelationships(forClientID, index, function(data0) {
						res.send(data0);
					});
				} else {
					res.send(auth);
				}
			});
		} else {
			res.send(flip.tools.res.INSUFFICIANT_PARAMS)
		}
	} else {
		res.send(flip.tools.res.INSUFFICIANT_PARAMS)
	}
});

router.post("/getLikers", function(req, res, next) {
	var clientID = req.body.clientID;
	var sessionID = req.body.sessionID;

	var forPostID = req.body.forPostID;
	var index = req.body.index;

	if(forPostID && index){
		if(flip.tools.validate.postID(forPostID) && flip.tools.validate.index(index)){
			flip.auth(req.body, function(auth){
				if(auth.response == "OK"){
					flip.post.getLikers(forPostID, index, function(data0) {
						res.send(data0);
					});
				} else {
					res.send(auth);
				}
			});
		} else {
			res.send(flip.tools.res.INSUFFICIANT_PARAMS)
		}
	} else {
		res.send(flip.tools.res.INSUFFICIANT_PARAMS)
	}
});

router.post("/report", function(req, res, next) {
	var clientID = req.body.clientID;
	var sessionID = req.body.sessionID;

	var idToReport = req.body.idToReport;
	var type = req.body.type;
	var reason = req.body.reason;

	flip.auth(req.body, function(auth){
		if(auth.response == "OK"){
			flip.report(clientID, idToReport, type, reason, function(data0) {
				res.send(data0);
			});
		} else {
			res.send(auth);
		}
	});
});

router.post("/getReportTypes", function(req, res, next) {
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
		]
	};

	res.send({
		response: "OK",
		data: reportReasons[req.body.for]
	})
})

// Posts

router.post("/upload", function(req, res, next){
	var clientID = req.body.clientID;
	var sessionID = req.body.sessionID;

	var vid = req.files.flipVid;

	flip.auth(req.body, function(auth){
		if(auth.response == "OK"){
			flip.post.new(vid.name, clientID, function(data0){
				if(data0.response == "OK"){
					vid.mv("./videos/" + data0.data.postID + ".mov", function(err) {
						if(!err){
							new ffmpeg("./videos/" + data0.data.postID + ".mov").screenshots({
								timestamps: [ 0 ],
								filename: data0.data.postID + ".png",
								folder: "./thumbnails/"
							});
		
							res.send({
								response: "OK"
							});
						} else {
							res.send({
								response: "ERR"
							});
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
});

router.post("/editCaption", function(req, res, next) {
	var postID = req.body.postID;
	var caption = req.body.caption;

	if(postID){
		if(flip.tools.validate.postID(postID) && flip.tools.validate.caption(caption)){
			flip.auth(req.body, function(auth){
				if(auth.response == "OK"){
					flip.post.editCaption(caption, postID, req.body.clientID, function(data0) {
						res.send(data0);
					});
				} else {
					res.send(auth);
				}
			});
		} else {
			res.send(flip.tools.res.INSUFFICIANT_PARAMS);
		}
	} else {
		res.send(flip.tools.res.INSUFFICIANT_PARAMS);
	}
})

router.post("/deletePost", function(req, res, next){
	var postID = req.body.postID;

	if(postID){
		if(flip.tools.validate.postID(postID)){
			flip.auth(req.body, function(auth){
				if(auth.response == "OK"){
					flip.post.delete(postID, req.body.clientID, function(data0){
						res.send(data0);
					})
				} else {
					res.send(auth);
				}
			});
		} else {
			res.send(flip.tools.res.INSUFFICIANT_PARAMS);
		}
	} else {
		res.send(flip.tools.res.INSUFFICIANT_PARAMS);
	}
});

module.exports = router;