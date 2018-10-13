const express = require("express");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

const app = express();

require("dotenv").config();

app.use(require("cors")({
    origin: "https://admin.flip.wtf"
}));

const fileUpload = require("express-fileupload");
const RateLimit = require("express-rate-limit");
 
const limiter = new RateLimit({
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

const path = require("path");
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.enable("trust proxy");

app.get("/", (req, res) => {
    res.render("home", {
        env: process.env.NODE_ENV
    });
});

const AWS = require("aws-sdk");

const s3 = new AWS.S3({
    accessKeyId: process.env.BUCKETEER_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.BUCKETEER_AWS_SECRET_ACCESS_KEY,
    region: process.env.BUCKETEER_AWS_REGION
});

const http = require("http");
const server = http.createServer(app);
const io = require("socket.io")(server);

const flip = require("./FLKit/FLKit.js")(io, s3);

const v4 = require("./routes/apiV4.js")(flip, s3);

app.post("/v3/", (req, res) => {
    res.send({
        response: "DEPRECATED",
        formattedTitle: "Version Depricated",
        formattedResponse: "This version of the app has been discontinued. Please upgrade to the latest version through the App Store."
    })
});

app.use("/v4/", v4);
app.use("/v4/admin/", require("./routes/admin.js"));

io.on("connection", function(socket) {
    socket.on("FL_CH_SUBSCRIBE_TO_THREAD", function(threadData) {
        socket.join(threadData.threadLiveTypingKey);

        flip.chat.FL_LIVE_TYPING_KEYS[socket.id] = threadData.threadLiveTypingKey
        flip.chat.FL_LIVE_TYPING_USERS[socket.id] = threadData.clientID
    });

    socket.on("FL_CH_LT_DID_TYPING_OCCUR", function(data) {
        if(typeof flip.chat.FL_LIVE_TYPING_USERS[socket.id] !== "undefined") {
            const liveTypingData = {
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
        delete flip.chat.FL_LIVE_TYPING_USERS[socket.id]
        delete flip.chat.FL_LIVE_TYPING_KEYS[socket.id]
    })
});

const port = process.env.PORT || 4000;

server.listen(port, function() {
    console.log("[FL-" + process.env.NODE_ENV + "] Listening on :" + port);
});