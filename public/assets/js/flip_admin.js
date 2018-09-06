let baseURL = "http://localhost:5000/api/v3/admin/"

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
}

let f = {
    user: {
        login: function() {

        },
        logout: function() {

        }
    },
    load: function(url, data, callback) {
        $.post(baseURL + url, data, function(data) {
            if(data.response == "OK") {
                callback(data.data)
            } else {
                f.handle.error(data);
            }
        })
    },
    compile: {
        do: function(data, div) {
            for(i = 0; i < data.length; i++) {
                let type = data[i].info.meta.type;
                
                if(type == "post") {
                    div.append(f.compile.type.post(data[i]))
                } else if(type == "user") {
                    div.append(f.compile.type.user(data[i]))
                } else if(type == "card") {
                    div.append(f.compile.type.card(data[i]))
                } else if(type == "header") {
                    div.append(f.compile.type.header(data[i]))
                } else if(type == "footer") {
                    div.append(f.compile.type.footer(data[i]))
                } else if(type == "splitter") {
                    div.append(f.compile.type.splitter(data[i]))
                } else if(type == "banner") {
                    div.append(f.compile.type.banner(data[i]))
                } else if(type == "trending") {
                    div.append(f.compile.type.trending(data[i]))
                }
            }
        },
        type: {
            post: function(data) {
                return `
                <div class="card f-card f-cardSortable" style="padding-top: 0px;">
                    <div class="card-image">
                        <figure class="image">
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
                                <p class="subtitle is-6">@` + data.profile.username.toLowerCase().replace("@", "") + `</p>
                            </div>
                        </div>
                        <div class="content">
                            <p><b>` + data.data.caption + `</b></p>
                            <p>` + data.data.stats.raw.views + ` views - ` + data.data.stats.raw.likes + ` likes - ` + data.data.stats.raw.comments + ` comments</p>
                            <p>Uploaded: ` + data.info.meta.wasUploaded + `. Featured: ` + data.info.meta.wasFeatured + `.</p>
                            <time class="f-time">` + data.info.time.formatted.long + `</time>
                        </div>
                    </div>
                </div>
                `
            },
            user: function(data) {
                return `
                <div class="card f-card f-cardSortable">
                    <button class="delete f-deleteButton-thin is-small" onclick="f.explore.delete('` + data.info.cardID + `');"></button>
                    <div class="f-cardInner">
                        <div class="media">
                            <div class="media-left">
                                <figure class="image is-48x48">
                                    <img src="` + data.profile.profileImg + `" />
                                </figure>
                            </div>
                            <div class="media-content">
                                <p class="title is-4">` + data.profile.name + `</p>
                                <p class="subtitle is-6">@` + data.info.username.toLowerCase().replace("@", "") + `</p>
                                <p>` + data.profile.followers + ` followers and ` + data.profile.following + ` following</p>
                                <p>Joined ` + data.info.joinedAgo + `</p>
                            </div>
                        </div>
                    </div>
                </div>
                `;
            },
            card: function(data) {
                return `
                <div class="card f-card f-info` + data.info.cardID + ` f-cardSortable">
                    <button class="delete f-deleteButton-thin is-small" onclick="f.explore.delete('` + data.info.cardID + `');"></button>
                    <div class="f-cardInner">
                        <h3 class="title is-4">` + data.data.title + `</h3>
                        <p>` + data.data.desc.replaceAll("\n", "</br>") + `</p>
                        </br>
                        <time class="f-time">` + data.data.date + `</time>
                    </div>
                </div>
                `;
            },
            header: function(data) {
                return `
                <div class="card f-card f-cardSortable">
                    <button class="delete f-deleteButton-thin is-small" onclick="f.explore.delete('` + data.info.cardID + `');"></button>
                    <div class="f-cardInner">
                        <h3 class="title is-4">` + data.data.content + `</h3>
                    </div>
                </div>
                `;
            },
            footer: function(data) {
                return `
                <div class="card f-card f-cardSortable">
                    <button class="delete f-deleteButton-thin is-small" onclick="f.explore.delete('` + data.info.cardID + `');"></button>
                    <div class="f-cardInner">
                        <p>` + data.data.content + `</p>
                    </div>
                </div>
                `;
            },
            splitter: function(data) {
                return `<div class="is-divider"></div>`;
            },
            banner: function(data) {
                return data.data.bannerImgURL + "</br>";
            },
            trending: function(data) {
                return "trending</br>";
            }
        }
    },
    home: {
        load: function() {
            f.load("users/get", {}, function(data) {
                f.compile.do(data, $("div.f-newUsers"))
            })

            f.load("posts/get", {}, function(data) {
                f.compile.do(data, $("div.f-newPosts"))
            })
        }
    },
    explore: {
        load: function() {
            f.load("explore/get", {}, function(data) {
                let explore = data.explore;
                let posts = data.posts;

                f.compile.do(explore, $("div.f-explore"));
                f.compile.do(posts, $("div.f-popular"));
            })
        },
        create: {

        },
        delete: function(cardID) {
            f.load("explore/card/delete", { cardID: cardID }, function(data) {
                f.explore.load();
            });
        }
    },
    handle: {
        error: function(data) {
            console.log(data)
        }
    }
}