var exploreData = {}
var exploreRaw = [];
var postToDelete = null;

var selectedGradient = []

var baseURL = "/api/v3/"

var gradients = [
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
    ]
];

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

let f = {
    play: function(streamURL){
        window.open(streamURL)
    },
    users: {
        load: function() {
            $.post(baseURL + "admin/users/get", function(data0) {
                if(data0.response == "OK") {
                    let data = data0.data;

                    for(i = data.length - 1; i >= 0; i--) {
                        $("div.f-newUsers").append(`
                            <div class="card f-card f-cardSortable">
                                <button class="delete f-deleteButton-thin is-small" onclick="f.explore.delete('` + data[i].info.cardID + `');"></button>
                                <div class="f-cardInner">
                                    <div class="media">
                                        <div class="media-left">
                                            <figure class="image is-48x48">
                                                <img src="` + data[i].profile.profileImg + `" />
                                            </figure>
                                        </div>
                                        <div class="media-content">
                                            <p class="title is-4">` + data[i].profile.name + `</p>
                                            <p class="subtitle is-6">@` + data[i].info.username + `</p>
                                            <p>Joined ` + moment(data[i].info.joinedAt).fromNow() + `</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `);
                    }
                } else {
                    // handle error
                }
            })
        }
    },
    posts: {
        load: function() {
            $.post(baseURL + "admin/posts/get", function(data0) {
                if(data0.response == "OK") {
                    let data = data0.data;

                    for(i = 0; i < data.length; i++) {
                        $("div.f-newPosts").append(f.explore.compile.post(data[i], true))
                    }
                } else {
                    // handle error
                }
            })
        }
    },
    explore: {
        feed: {
            create: function(){
                $.post(baseURL + "admin/explore/feed/create", function(data0){
                    if(data0.response == "OK"){
                        f.explore.handle(data0.data.explore)
                        f.explore.popular.handle(data0.data.posts)
                    } else {
                        // handle error
                    }  
                })
            }
        },
        load: function(){
            $.post(baseURL + "admin/explore/get", function(data0){
                if(data0.response == "OK"){
                    f.explore.handle(data0.data.explore)
                    f.explore.popular.handle(data0.data.posts)
                } else {
                    // handle error
                }
            })
        },
        popular: {
            handle: function(data){
                $("div.f-popular").empty();
                console.log(data.length)
                for(i = data.length - 1; i > 0; i--){
                    console.log(data[i], i)
                    if(data[i].info.meta.type == "post"){
                        $("div.f-popular").append(f.explore.compile.post(data[i], false))
                    }
                }
            }
        },
        handle: function(data){
            $("div.f-sortable").empty();
            exploreRaw = [];
            exploreRaw = data
            for(i = 0; i < data.length; i++){
                if(data[i] != null){
                    exploreData[data[i].info.cardID] = data[i]

                    let type = data[i].info.meta.type

                    if(type == "card"){
                        $("div.f-sortable").append(`
                            <div class="card f-card f-info` + data[i].info.cardID + ` f-cardSortable">
                                <button class="delete f-deleteButton-thin is-small" onclick="f.explore.delete('` + data[i].info.cardID + `');"></button>
                                <div class="f-cardInner">
                                    <h3 class="title is-4">` + data[i].data.title + `</h3>
                                    <p>` + data[i].data.desc.replaceAll("\n", "</br>") + `</p>
                                    </br>
                                    <time class="f-time">` + data[i].data.date + `</time>
                                </div>
                            </div>
                        `);
                    } else if(type == "user"){
                        $("div.f-sortable").append(`
                            <div class="card f-card f-cardSortable">
                                <button class="delete f-deleteButton-thin is-small" onclick="f.explore.delete('` + data[i].info.cardID + `');"></button>
                                <div class="f-cardInner">
                                    <div class="media">
                                        <div class="media-left">
                                            <figure class="image is-48x48">
                                                <img src="` + data[i].profile.profileImg + `" />
                                            </figure>
                                        </div>
                                        <div class="media-content">
                                            <p class="title is-4">` + data[i].profile.name + `</p>
                                            <p class="subtitle is-6">@` + data[i].info.username + `</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `);
                    } else if(type == "post"){
                        $("div.f-sortable").append(f.explore.compile.post(data[i], true))
                    } else if(type == "splitter"){
                        $("div.f-sortable").append(`
                            <div class="card f-card f-cardSortable">
                                <button class="delete f-deleteButton-thin is-small" onclick="f.explore.delete('` + data[i].info.cardID + `');"></button>
                                <div class="f-cardInner">
                                    <h3 class="title is-5">Splitter</h3>
                                </div>
                            </div>
                        `);
                    } else if(type == "trending"){
                        $("div.f-sortable").append(`
                            <div class="card f-card f-cardSortable">
                                <div class="f-cardInner">
                                    <h3 class="title is-4">Trending</h3>
                                </div>
                            </div>
                        `);
                    } else if(type == "header") {
                        $("div.f-sortable").append(`
                            <div class="card f-card f-cardSortable">
                                <button class="delete f-deleteButton-thin is-small" onclick="f.explore.delete('` + data[i].info.cardID + `');"></button>
                                <div class="f-cardInner">
                                    <h3 class="title is-4">` + data[i].data.content + `</h3>
                                </div>
                            </div>
                        `);
                    } else if(type == "footer") {
                        $("div.f-sortable").append(`
                            <div class="card f-card f-cardSortable">
                                <button class="delete f-deleteButton-thin is-small" onclick="f.explore.delete('` + data[i].info.cardID + `');"></button>
                                <div class="f-cardInner">
                                    <p>` + data[i].data.content + `</p>
                                </div>
                            </div>
                        `);
                    } else if(type == "banner") {
                        $("div.f-sortable").append(`
                        <div class="card f-card f-cardSortable">
                            <button class="delete f-deleteButton-thin is-small" onclick="f.explore.delete('` + data[i].info.cardID + `');"></button>
                            <img class="fl-banner" src="` + data[i].data.bannerImgURL + `" />
                        </div>
                    `);
                    } else {
                        $("div.f-sortable").append("<div></div>")
                    }
                }
            }
        },
        compile: {
            post: function(data, isInComposer){
                var controls = `<a href="#" class="card-footer-item" onclick="f.explore.add.post('` + data.info.postID + `');">Add to Explore</a>`

                if(isInComposer){
                    controls = `<a href="#" class="card-footer-item" onclick="f.explore.delete('` + data.info.cardID + `');">Remove</a>`
                }

                return `
                    <div class="card f-card f-cardSortable" style="padding-top: 0px;">
                        <div class="card-image">
                            <figure class="image is-3by4">
                                <a href="#" onclick="f.play('` + data.data.streamURL + `');">
                                    <img src="` + data.data.thumbURL + `" />
                                    
                                </a>
                            </figure>
                        </div>
                        <div class="card-content">
                            <div class="media">
                                <div class="media-left">
                                    <figure class="image is-48x48">
                                        <img src="` + data.profile.profileImg + `" />
                                    </figure>
                                </div>
                                <div class="media-content">
                                    <p class="title is-4">` + data.profile.name + `</p>
                                    <p class="subtitle is-6">@` + data.profile.username + `</p>
                                </div>
                            </div>
                            <div class="content">
                                <p><b>` + data.data.caption + `</b></p>
                                <p>` + data.data.stats.raw.views + ` views - ` + data.data.stats.raw.likes + ` likes - ` + data.data.stats.raw.comments + ` comments</p>
                                <p>Uploaded: ` + data.info.meta.wasUploaded + `. Featured: ` + data.info.meta.wasFeatured + `.</p>
                                <time class="f-time">` + data.info.time.formatted.long + `</time>
                            </div>
                        </div>
                        <footer class="card-footer">
                            ` + controls + `
                        </footer>
                    </div>
                `
            }
        },
        edit: {
            info: function(cardID){
                f.explore.create.info();

                postToDelete = exploreData[cardID]

                $("div.f-info" + cardID).css({
                    "display": "none"
                })
                
                $("input.f-cardTitleInput").val(exploreData[cardID].data.title)
                $("textarea.f-cardBodyinput").val(exploreData[cardID].data.desc)
            }
        },
        gradient: {
            select: function(index){
                let gradientElems = $("div.f-gradients").children()

                for(i in gradientElems){
                    if(i < gradients.length){
                        let gradientElem = gradientElems[i]

                        if(i == index){
                            gradientElem.style.opacity = 1
                            selectedGradient = gradients[i]
                        } else {
                            gradientElem.style.opacity = 0.5
                        }
                    }
                }
            }
        },
        create: {
            minimal: function(type) {
                $("div.f-createCardSelector").css({
                    "display": "none"
                })

                $("div.f-createMinimalCard").css({
                    "display": "block"
                })
            },
            info: function(){
                $("div.f-createCardSelector").css({
                    "display": "none"
                })

                $("div.f-createInfoCard").css({
                    "display": "block"
                })

                $("div.f-gradients").empty()

                for(i in gradients){
                    let gradient = gradients[i]

                    $("div.f-gradients").append(`
                        <div class="control f-gradient` + i + `" style="width: 100%">
                            <a class="button is-fullwidth" onclick="f.explore.gradient.select(` + i + `);" style="margin-bottom: 10px; background: linear-gradient(` + gradient[0] + `, ` + gradient[1] + `)"></a>                    
                        </div>
                    `)
                }

                f.explore.gradient.select(0)
            },
            user: function(){
                $("div.f-createCardSelector").css({
                    "display": "none"
                })

                $("div.f-createUserCard").css({
                    "display": "block"
                })
            }
        },
        dismiss: {
            info: function(){
                if(postToDelete != null){
                    $("div.f-info" + postToDelete.cardID).css({
                        "display": "block"
                    })
                    postToDelete = null
                }

                $("div.f-createCardSelector").css({
                    "display": "block"
                })

                $("div.f-createInfoCard").css({
                    "display": "none"
                })
            },
            user: function(){
                $("div.f-createCardSelector").css({
                    "display": "block"
                })

                $("div.f-createUserCard").css({
                    "display": "none"
                })
            },
            minimal: function() {
                $("div.f-createCardSelector").css({
                    "display": "block"
                })

                $("div.f-createMinimalCard").css({
                    "display": "none"
                })
            }
        },
        add: {
            post: function(postID){
                if(confirm("Adding this card to Explore will send a notification to the user device instantly, and mark the post as featured. Are you sure you want to do this?")) {
                    $.post(baseURL + "admin/explore/post/create", {
                        postID: postID
                    }, function(data0){
                        if(data0.response == "OK"){
                            f.explore.load()
                        } else {
                            alert(data0.formattedResponse)
                        }
                    })
                }
            },
        },
        post: {
            info: function(){
                let title = $("input.f-cardTitleInput").val()
                let body = $("textarea.f-cardBodyinput").val()

                if(postToDelete != null){
                    f.explore.delete(postToDelete.cardID);
                    postToDelete = null;
                }
                
                if(f.validate.basic(title) && f.validate.basic(body)){
                    $.post(baseURL + "admin/explore/card/info/create", {
                        title: title,
                        body: body,
                        gradient: selectedGradient
                    }, function(data0){
                        if(data0.response == "OK"){
                            f.explore.dismiss.info();
                            f.explore.load()
                        } else {
                            alert(data0.formattedResponse)
                            // handle error
                        }
                    })
                }
            },
            user: function(){
                let username = $("input.f-userUsernameInput").val()

                if(f.validate.basic(username)){
                    $("p.f-userUsernameInputHelp").css("display", "none")

                    $.post(baseURL + "admin/explore/card/user/create", {
                        username: username,
                    }, function(data0){
                        if(data0.response == "OK"){
                            f.explore.dismiss.user();
                            f.explore.load()
                        } else {
                            if(data0.response == "NO_ITEMS"){
                                $("p.f-userUsernameInputHelp").css("display", "block")
                            } else {
                                alert(data0.formattedResponse)
                            }
                        }
                    })
                } 
            },
            splitter: function(){
                $.post(baseURL + "admin/explore/card/splitter/create", function(data0){
                    if(data0.response == "OK"){
                        f.explore.dismiss.user();
                        f.explore.load()
                    } else {
                        alert(data0.formattedResponse)
                    }
                })
            }
        },
        delete: function(cardID){
            $.post(baseURL + "admin/explore/card/delete", {
                cardID: cardID
            }, function(data0){
                if(data0.response == "OK"){
                    f.explore.load()
                } else {
                    // handle error
                }
            })
        }
    },
    login: function(){
        let email = $("input.f-email").val()
        let password = $("input.f-password").val()

        $("button.f-loginButton").addClass("is-loading")

        if(f.validate.email(email)){
            $("input.f-email").removeClass("is-danger");
            $("p.f-emailHelp").css({
                "display": "none"
            })

            if(f.validate.password(password)){
                $("input.f-password").removeClass("is-danger");
                $("p.f-passwordHelp").css({
                    "display": "none"
                })

                $.post(baseURL + "admin/login", {
                    email: email,
                    password: md5(password)
                }, function(res){
                    if(res.response == "OK"){
                        window.location.reload(true)
                    } else {
                        $("p.f-loginHelp").css({
                            "display": "block"
                        }).html(res.formattedResponse);
                        $("button.f-loginButton").removeClass("is-loading")
                    }
                })
            } else {
                $("input.f-password").addClass("is-danger");
                $("p.f-passwordHelp").css({
                    "display": "block"
                })
                $("button.f-loginButton").removeClass("is-loading")
            }
        } else {
            $("input.f-email").addClass("is-danger");
            $("p.f-emailHelp").css({
                "display": "block"
            })
            $("button.f-loginButton").removeClass("is-loading")
        }
    },
    validate: {
        basic: function(inp){
            if(inp != null){
                if(inp.length > 0){
                    return true
                }
            }

            return false
        },
        email: function(inp){
            if(f.validate.basic(inp)){
                return true
            }

            return false;
        },
        password: function(inp){
            if(f.validate.basic(inp)){
                return true
            }

            return false;
        }
    },
    logout: function(){
        $.post(baseURL + "admin/logout", function(data0){
            window.location.reload(true);
        })
    }
}

var oldIndex = 0;
var newIndex = 1;

$(function(){
    $("div.f-sortable").sortable({
        revert: true
    });

    $("div.f-cardSortable").draggable({
        connectToSortable: "div.f-sortable",
        helper: "clone",
        revert: "invalid",
    });

    $("div.f-sortable").sortable({
        start: function (event, ui) {
            oldIndex = ui.item.index();
        },
        stop:  function (event, ui) {
            newIndex = ui.item.index();
            if(oldIndex != newIndex){
                $.post(baseURL + "admin/explore/rearrange", {
                    cardID: exploreRaw[oldIndex].info.cardID,
                    newIndex: newIndex
                })
            }
        }
    });

    $(document).ajaxStart(function() {
		$("body").css({
			"pointer-events": "none"
		}).animate({
			"opacity": "0.75"
		}, 640 / 4);
	});

	$(document).ajaxComplete(function() {
		$("body").css({
			"pointer-events": "all"
		}).animate({
			"opacity": "1"
		}, 640 / 4);
    });
});

$(document).keyup(function(e) {
    if(e.which == 13) {
        if($("input.f-password").is(":focus")){
            f.login()
        } else if($("input.f-userUsernameInput").is(":focus")){
            f.explore.post.user();
        }
    }

    if($("input.f-cardTitleInput").val().length > 0 && $("textarea.f-cardBodyinput").val().length > 0){
        $("button.f-postButton").attr("disabled", false)
    } else {
        $("button.f-postButton").attr("disabled", true)
    }

    if($("input.f-userUsernameInput").val().length > 0){
        $("button.f-userPostButton").attr("disabled", false)
    } else {
        $("button.f-userPostButton").attr("disabled", false)
    }
});
