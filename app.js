const express = require('express');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const authMiddleware = require('./middleware/auth');
const pool = require('./db');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Routes
app.use('/users', userRoutes);

app.use('/tasks', authMiddleware, taskRoutes);

// Health check endpoint
app.get('/health', async (req, res) =>{
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'OK',db: 'Connected'});
  } catch (err){
    res.status(500).json({ status:"ERROR", db:'not connected',error: err.message});
  }
})


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app; 