var express = require("express");
var path = require("path");
var logger = require("morgan");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");

const fileUpload = require("express-fileupload");

var http = require("http");
var app = express();
var server = http.createServer(app);

var RateLimit = require("express-rate-limit");
 
app.enable("trust proxy");

var limiter = new RateLimit({
	windowMs: 1000 * 60 * 5, // 1 minute
	max: 180, // limit each IP to 75 requests per windowMs
	delayMs: 0, // disable delaying - full speed until the max limit is reached
    message: {
        response: "RATE_LIMIT_REACHED",
        formattedTitle: "Rate Limit Reached",
        formttedResponse: "Your rate limit has been reached for this window. Please try again in 5 minutes."
    }
});
 
//  apply to all requests
// app.use(limiter);

// default options
app.use(fileUpload());

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/videos", express.static(path.join(__dirname, "videos")))
app.use("/thumbnails", express.static(path.join(__dirname, "thumbnails")))

var io = require('socket.io')(server);
app.io = io;

app.use("/", require("./routes/index"));
app.use("/api/", require("./routes/api"))
app.use("/api/v1/", require("./routes/apiV1"));
app.use("/api/v2/", require("./routes/apiV2"));
app.use("/api/v3/", require("./routes/apiV3")(io));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error("Not Found");
	err.status = 404;
	next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    // console.log(err)

    // render the error page
    res.status(err.status || 500);
    res.render("error", {
        title: err.status + " - flip"
    });
});

module.exports = app;
