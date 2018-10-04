var express = require("express");
var cookieParser = require("cookie-parser");
let logger = require("morgan");
let bodyParser = require("body-parser");

var app = express();

let cors = require("cors");

app.use(cors({
    origin: "https://admin.flip.wtf"
}));

let fileUpload = require("express-fileupload");
let RateLimit = require("express-rate-limit");
 
let limiter = new RateLimit({
    windowMs: 1000 * 60 * 5,
    max: 180,
    delayMs: 0,
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

let http = require("http");
let server = http.createServer(app);
let io = require("socket.io")(server);

const flip = require("./FLKit/FLKit.js")(io);

// const v3 = require("./routes/apiV3.js");
const v4 = require("./routes/apiV4.js")(flip);

// app.use("/api/v3/", v3);
app.post("/api/v3/", (req, res) => {
    res.send({
        response: "DEPRECATED",
        formattedTitle: "Version Depricated",
        formattedResponse: "This version of the app has been discontinued. Please upgrade to the latest version through the App Store."
    })
});

app.use("/api/v4/", v4);
app.use("/api/v4/admin/", require("./routes/admin.js"));

app.get("/", (req, res) => {
    res.redirect("/api/");
});

app.get("/api/", (req, res) => {
    res.redirect("https://www.youtube.com/watch?v=-BzyCf0pjUA");
});

io.on("connection", function(socket) {
    console.log("A user connected");

    socket.on("FL_CH_SUBSCRIBE_TO_THREAD", function(threadData) {
        socket.join(threadData.threadLiveTypingKey);

        flip.chat.FL_LIVE_TYPING_KEYS[socket.id] = threadData.threadLiveTypingKey
        flip.chat.FL_LIVE_TYPING_USERS[socket.id] = threadData.clientID
    });

    socket.on("FL_CH_LT_DID_TYPING_OCCUR", function(data) {
        if(typeof flip.chat.FL_LIVE_TYPING_USERS[socket.id] !== "undefined") {
            let liveTypingData = {
                info: {
                    messageID: "",
                    messageSentAt: Date.now(),
                    messageLastUpdatedAt: Date.now(),
                    messageSentAgo: "live",
                    messageSentBy: flip.chat.FL_LIVE_TYPING_USERS[socket.id]
                },
                data: {
                    content: data.content.trim()
                }
            };

            io.to(flip.chat.FL_LIVE_TYPING_KEYS[socket.id]).emit("FL_CH_LT_DID_TYPING_OCCUR", liveTypingData)
        }
    });

    socket.on("disconnect", function() {
        console.log("A user disconnected");

        delete flip.chat.FL_LIVE_TYPING_USERS[socket.id]
        delete flip.chat.FL_LIVE_TYPING_KEYS[socket.id]
    })
});

let port = process.env.PORT || 3000;

server.listen(port, function() {
    console.log("Listening on :" + port);
});