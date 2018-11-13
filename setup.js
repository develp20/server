const fs = require("fs");
const http = require("https");

if(!fs.existsSync("node_modules")) {
    throw "Run 'npm install' to install the modules required for setup.js to function."
}

const envExists = fs.existsSync(".env");
const envExamplesExists = fs.existsSync(".env-example");

if(!envExists) {
    const envErr = "Please insert information such as your MONGODB_URI and Bucketeer access keys into .env. This can be found by running 'heroku config' if Heroku Toolbelt (https://toolbelt.heroku.com) has been setup with this directory."
    if(envExamplesExists) {
        fs.renameSync(".env-example", ".env");
        throw envErr;
    } else {
        http.get("https://raw.githubusercontent.com/flipwtf/server/master/.env-example", res => {
            res.pipe(fs.createWriteStream(".env"))
            throw envErr;
        });
    }
} else {
    require("dotenv").config();

    const MONGO_URI = process.env.MONGODB_URI;

    if(!MONGO_URI) { 
        throw "Please insert your MongoDB URI into .env."
    }
}

