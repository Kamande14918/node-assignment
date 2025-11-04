const express = require('express');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const authMiddleware = require('./middleware/auth');
const errorHandlerMiddleware = require('./middleware/errorHandler');
const pool = require('./db');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
 

// Routes
app.use('/users', userRoutes);

// Also mount user routes at the root so legacy endpoints like POST /login still work.
app.use('/', userRoutes);

// Tasks are protected by auth middleware
app.use('/tasks', authMiddleware, taskRoutes);

// Health check endpoint
app.get('/health', async (req, res) =>{
  try{
    await pool.query('SELECT 1');
    res.status(200).json({status: 'Ok',db:'Connected'})
  } catch(err){
    console.error('Database connection error:',
      res.status(500).json({
        status: 'Error',
        db:'not connected',
        error: err.message
      })
    )
  }
})

  


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Register the error handler last so it receives errors from routes/middleware above.
app.use(errorHandlerMiddleware);

module.exports = app;