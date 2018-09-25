var express = require("express");
var cookieParser = require("cookie-parser");
let logger = require("morgan");
let bodyParser = require("body-parser");

var app = express();

let cors = require("cors");
app.use(cors({
    origin: "https://flip-admin.herokuapp.com"
}));

let fileUpload = require("express-fileupload");
let RateLimit = require("express-rate-limit");
 
let limiter = new RateLimit({
    windowMs: 1000 * 60 * 5, // 1 minute
    max: 180, // limit each IP to 75 requests per windowMs
    delayMs: 0, // disable delaying - full speed until the max limit is reached
    message: {
        response: "RATE_LIMIT_REACHED",
        formattedTitle: "Rate Limit Reached",
        formttedResponse: "Your rate limit has been reached for this window. Please try again in 5 minutes."
    }
});

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(fileUpload());

app.use(limiter);

app.enable("trust proxy");

app.use("/api/v3/", require("./routes/apiV3.js"));
app.use("/api/v4/", require("./routes/apiV4.js"));
app.use("/api/v4/admin/", require("./routes/admin.js"));

app.listen(4000, function() {
    console.log("Listening on :4000");
})