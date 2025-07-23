const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const dogsRouter = require('./routes/dogs');

const app = express();

// Your middleware here

app.use('/', dogsRouter); // Do not remove this line

module.exports = app; // Do not remove this line

// Do not remove this line
if (require.main === module) {
	app.listen(3000, () => console.log("Server listening on port 3000"));
}