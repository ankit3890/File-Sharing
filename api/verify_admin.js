require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');

const verify = async () => {
    await connectDB();
    const admin = await User.findOne({ role: 'admin' });
    if (admin) {
        console.log(`VERIFIED_ADMIN: ${admin.userId}`);
    } else {
        console.log('VERIFIED_ADMIN: NONE');
    }
    process.exit();
};

verify();
