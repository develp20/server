# flip-Server
The source of the official flip Server.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/flipwtf/server)

## What does this do?

flip is a video sharing app, sort of like Vine, but a lot faster paced (it's quicker to create + publish a video). This server handles requests.

## How do I build this on my computer?

1. Run the following commands: `git clone https://github.com/flipwtf/server.git && cd server && npm install`
2. Run `node app.js` and voila!

## Do I need anything else for this to work?

Probably not, but you may need a copy of the flip iOS App, see https://github.com/flipwtf/app. change the URL in [flip/Content\ Classes/Manager\ Classes/FLPrivilegeManager.swift](https://github.com/flipwtf/app/blob/master/flip/Content%20Classes/Manager%20Classes/FLPrivilegeManager.swift) under the following variables:
```swift
var BASE_URL: String = "https://flip.wtf" // home page
var BASE_API_URL: String = "https://api.flip.wtf/v4/" // api url
var BASE_SOCKET_URL: String = "https://api.flip.wtf/" // socket io url
```
