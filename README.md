# flip-Server
The source of the official flip Server.

## What does this do?

flip is a video sharing app, sort of like Vine, but a lot faster paced (it's quicker to create + publish a video). This server handles requests.

## How do I build this on my computer?

1. Run the following commands: `git clone https://github.com/williamsthing/flip-Server.git && cd flip-Server && npm install`
2. Run `node app.js` and voila!

## Do I need anything else for this to work?

Probably not, but you may need a copy of the flip iOS App, see https://github.com/williamsthing/flip-iOS. change the URL in flip/flip.swift under the 'flStore' struct: `static let BASE_API_URL: String = (YOUR URL)`. 
