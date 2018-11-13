# flip-Server
The source of the official flip Server.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://github.com/flipwtf/server)

## What does this do?

flip is a video sharing app, sort of like Vine, but a lot faster paced (it's quicker to create + publish a video). This server handles requests.

## How do I build this on my computer?

1. Run the following commands: `git clone https://github.com/flipwtf/server.git && cd server && npm install`
2. Run `node app.js` and voila!

## Do I need anything else for this to work?

Probably not, but you may need a copy of the flip iOS App, see https://github.com/flipwtf/app. change the URL in flip/flip.swift under the 'flStore' struct: `static let BASE_API_URL: String = (YOUR URL)`. 
