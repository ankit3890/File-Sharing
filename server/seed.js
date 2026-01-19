require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');

const seedAdmin = async () => {
    await connectDB();

    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
        console.log('Admin already exists');
        process.exit();
    }

    // Create Admin
    // Passwords are hashed by pre-save hook in User.js
    const admin = new User({
        userId: 'Deepak389',
        password: '@deepak', // Will be hashed
        role: 'admin',
        mustChangePassword: false
    });

    await admin.save();
    console.log('Admin user created: admin / admin123');
    process.exit();
};

seedAdmin();
