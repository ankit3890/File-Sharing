require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');

const resetAdmin = async () => {
    try {
        await connectDB();
        
        const userId = 'Deepak389';
        const newPassword = '@deepak';

        const user = await User.findOne({ userId });

        if (user) {
            user.password = newPassword;
            // Pre-save hook will hash this
            await user.save();
            console.log(`Password for ${userId} reset successfully.`);
        } else {
            console.log(`User ${userId} not found. Creating...`);
            await User.create({
                userId,
                password: newPassword,
                role: 'admin',
                mustChangePassword: false
            });
            console.log(`User ${userId} created.`);
        }
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        process.exit();
    }
};

resetAdmin();
