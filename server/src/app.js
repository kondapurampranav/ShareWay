// server/src/app.js
// Express application setup — middleware registration and route mounting.

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const routes = require('./routes/index');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ─── Global Middleware ────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api', routes);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ─── Global Error Handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

module.exports = app;
