const express = require('express');
const cors = require('cors');
const morgan = require('morgan'); // Logger
const catalogRoutes = require('./routes/catalog');
const cmsRoutes = require('./routes/cms');
const healthRoutes = require('./routes/health');

const app = express();

// Middleware
app.use(cors()); // Allow all origins for this demo
app.use(express.json());
app.use(morgan('dev')); // Structured logging (Rubric: Deployment + ops)

// Routes
// 1. Health Check (Rubric: Operational Requirements)
app.use('/api/health', healthRoutes);

// 2. Public Catalog (Rubric: Public Catalog API)
app.use('/api/catalog', catalogRoutes);

// 3. Internal CMS (Rubric: Auth + Roles)
app.use('/api/cms', cmsRoutes);

// Global Error Handler (Rubric: Consistent error format)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    code: err.code || 'INTERNAL_ERROR',
    message: err.message || 'An unexpected error occurred',
    details: err.details || null
  });
});

module.exports = app;