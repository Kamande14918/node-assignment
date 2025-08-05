const express = require('express');

// Import both database connections
const pool = require('./db');              // PostgreSQL direct connection
const prisma = require('./prisma/db');     // Prisma connection

const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Make both database connections available to routes
app.locals.pool = pool;
app.locals.prisma = prisma;

// Routes
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);

// Health check endpoint for PostgreSQL
app.get('/health/postgres', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'postgres connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'postgres not connected', error: err.message });
  }
});

// Health check endpoint for Prisma
app.get('/health/prisma', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'prisma connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'prisma not connected', error: err.message });
  }
});

// Combined health check endpoint
app.get('/health', async (req, res) => {
  const results = {
    postgres: { status: 'unknown', connected: false },
    prisma: { status: 'unknown', connected: false }
  };

  // Test PostgreSQL connection
  try {
    await pool.query('SELECT 1');
    results.postgres = { status: 'ok', connected: true };
  } catch (err) {
    results.postgres = { status: 'error', connected: false, error: err.message };
  }

  // Test Prisma connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    results.prisma = { status: 'ok', connected: true };
  } catch (err) {
    results.prisma = { status: 'error', connected: false, error: err.message };
  }

  // Overall status
  const overallStatus = results.postgres.connected && results.prisma.connected ? 'ok' : 'partial';
  
  res.json({
    status: overallStatus,
    databases: results
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port} with both PostgreSQL and Prisma`);
});

module.exports = app;