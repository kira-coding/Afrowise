# AfroWise

## setup

currently mongodb  server should run `127.0.0.1:27017` since it is hard coded.
this will install all the node dependencies. <br>
`npm i`

## project structure

- app.js - contains the main server and global level imports.
- db.js - sets up the database
- routes - contains all the routes
- models - contains all the models
- config - contains the base environment variables.
- contains some middlewares

## db.js

- establishes a connection to a MongoDB database and logs success or failure messages.

## Run

`node app.js`

- To get to the teacher dashboard first you will have to create a teacher object. And that there is the fact that the OTP functionality haven't been implemented. So the process will be manual. there is a sample teacher.json file copy that files content and edit it for your use case. Then use `postman` or the vscode `thunder client` extetion to send a `POST` request to the route `localhost:3000/user/teacher` with a `json body` of the json object you copied previously.

## About

### There are server markdown files for the respective source code

