const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const dogsRouter = require('./routes/dogs');

const app = express();

// Request ID middleware - adds x-request-id header and makes id available on req
app.use((req, res, next) => {
	const id = uuidv4();
	req.requestId = id;
	res.setHeader('x-request-id', id);
	next();
});

// Logging middleware - logs request with method, path and requestId
app.use((req, res, next) => {
	console.log(`[${req.requestId}]: ${req.method} ${req.path} (${new Date().toISOString()})`);
	next();
});

// Built-in middleware to parse JSON bodies (needed for POST /adopt)
app.use(express.json({ limit: '1kb' }));



// Static middleware to serve images from the repo public/images folder
// Tests request /images/dachshund.png
app.use('/images', express.static(path.join(__dirname, 'public', 'images'))); // Corrected path to images

// Mount routes
app.use('/', dogsRouter); // Do not remove this line

// Error handling middleware - must be after routes
app.use((err, req, res, next) => {
	// log the error for debugging
	console.error(err && err.stack ? err.stack : err);
	const requestId = req.requestId || req.headers['x-request-id'];
	res.status(500).json({ requestId, error: 'Internal Server Error' });
	next();
});

module.exports = app; // Do not remove this line

// When running directly, start server
if (require.main === module) {
	app.listen(3000, () => console.log('Server listening on port 3000'));
}