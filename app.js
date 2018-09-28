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

const flip = require("./FLKit/FLKit.js");

const v3 = require("./routes/apiV3.js");
const v4 = require("./routes/apiV4.js")(flip);

app.use("/api/v3/", v3);
app.use("/api/v4/", v4);
app.use("/api/v4/admin/", require("./routes/admin.js"));

let http = require("http");
let server = http.createServer(app);
let io = require("socket.io")(server);

flip.io = io;

io.on("connection", function(socket) {
    console.log("A user connected");

    socket.on("FL_CH_SUBSCRIBE_TO_THREAD", function(threadData) {
        socket.join(threadData.threadLiveTypingKey);

        flip.chat.FL_LIVE_TYPING_KEYS[socket.id] = threadData.threadLiveTypingKey
        flip.chat.FL_LIVE_TYPING_USERS[socket.id] = threadData.clientID
    });

    socket.on("FL_CH_NEW_MESSAGE_SENT", function(data) {
        console.log(datas)
        if(typeof flip.chat.FL_LIVE_TYPING_USERS[socket.id] !== "undefined") {
            let liveTypingData = {
                info: {
                    messageID: "",
                    messageSentAt: Date.now(),
                    messageLastUpdatedAt: Date.now(),
                    messageSentAgo: "just now",
                    messageSentBy: flip.chat.FL_LIVE_TYPING_USERS[socket.id]
                },
                data: {
                    content: data.content.trim()
                }
            };

            io.to(flip.chat.FL_LIVE_TYPING_KEYS[socket.id]).emit("FL_CH_NEW_MESSAGE_SENT", liveTypingData)
        }
    })

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

            console.log(data.content.trim());

            io.to(flip.chat.FL_LIVE_TYPING_KEYS[socket.id]).emit("FL_CH_LT_DID_TYPING_OCCUR", liveTypingData)
        }
    });

    socket.on("disconnect", function() {
        delete flip.chat.FL_LIVE_TYPING_USERS[socket.id]
        delete flip.chat.FL_LIVE_TYPING_KEYS[socket.id]
    })
});

server.listen(4000, function() {
    console.log("Listening on :4000");
});