let f = {
    warn: function(className, msg, success) {
        $(className).html(msg);

        if(msg.trim() == "") {
            $(className).css({
                "display": "none"
            })
        } else {
            $(className).css({
                "display": "block"
            })
        }

        if(success) {
            $(className).addClass("is-success").removeClass("is-danger");
        } else {
            $(className).removeClass("is-success").addClass("is-danger");
        }
    },
    change: {
        password: function() {

        },
        email: function() {
            let email = $("input.f-email").val();

            $("button.f-emailButton").addClass("is-loading")

            if(f.validate.email(email)) {
                $("input.f-email").removeClass("is-danger");

                $.post("/api/v2/user/change/email", {
                    email: email
                }, function(res) {
                    $("button.f-emailButton").removeClass("is-loading")

                    if(res.response == "OK") {
                        $("input.f-email").val("");

                        f.warn("p.f-emailHelp", "Your email address has been successfully updated.", true)
                    } else {
                        f.warn("p.f-emailHelp", res.formattedResponse, false)
                    }
                });
            } else {
                f.warn("p.f-emailHelp", "This email is invalid.", false)
            }
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

                $.post("/api/v2/user/login", {
                    email: email,
                    password: md5(password).toUpperCase(),
                    setCookies: true
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
        $.post("/logout", function(data0){
            window.location.reload(true);
        })
    }
}

$(function(){
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
        }
    }
});