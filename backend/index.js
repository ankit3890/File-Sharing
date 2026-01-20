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
app.use('/api/attendance', require('./routes/attendanceRoutes'));

// API Health Check (Moved from root to avoid conflict with UI)
app.get('/api/health', (req, res) => {
    res.send('API is running successfully.');
});

// Serve Static Assets in Production
if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, '../client/dist');
    app.use(express.static(distPath));
    
    // Handle React routing - only for non-API routes
    app.use((req, res, next) => {
        if (!req.url.startsWith('/api')) {
            res.sendFile(path.resolve(distPath, 'index.html'));
        } else {
            next();
        }
    });
}

module.exports = app;
