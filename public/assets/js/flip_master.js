var flip = {
	reserveUsername: function() {
		var username = $("input.fl-inputUsername").val();
		var email = $("input.fl-inputEmail").val();

		$.post("/api/v2/reserve/username", {
			username: username,
			email: email
		}, function(res) {
			if(res.response == "OK"){
				$("div.fl-reserveInp").hide();
				$("p.fl-warn").html("Your username has been successfully reserved. We'll email you when flip opens.</br></br>To claim your username, register with the username and email you used here.</br></br>Follow <a href=\"https://twitter.com/getflipwtf\" target=\"_blank\">@getflipwtf</a> on Twitter for updates.").css("color", "white");
			} else {
				$("p.fl-warn").html(res.formattedResponse).css("color", "orange");
			}
		})
	}
};

$(document).ready(function() {
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
    
	$("input.fl-inputUsername").keyup(function(event) {
		var uInput = $("input.fl-inputUsername").val();

		if(uInput == "@"){
			$("input.fl-inputUsername").val("")
		} else if(uInput.length > 0) {
			$("input.fl-inputUsername").val("@" + uInput.replace("@", ""));
		}
	});
});