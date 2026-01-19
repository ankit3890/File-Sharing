require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');

const app = express();

// Connect Database
connectDB();

// Middleware
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});
app.use(express.json());
app.use(cors());
app.use(helmet({
    crossOriginResourcePolicy: false, // Allow resource loading (images) if needed, though we use stream
}));
app.use(morgan('dev'));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/files', require('./routes/fileRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Health Check
app.get('/', (req, res) => {
    res.send('API is running successfully.');
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: err.message || 'Server Error',
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
