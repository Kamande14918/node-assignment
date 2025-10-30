const express = require('express');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const authMiddleware = require('./middleware/auth');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Routes
app.use('/users', userRoutes);
app.use('/',authMiddleware, taskRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app; 