const mongoose = require('mongoose');
const User = require('./models/User');
const File = require('./models/File');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

const inspect = async () => {
    await connectDB();

    const users = await User.find({});
    console.log('--- USERS ---');
    users.forEach(u => console.log(`${u._id} | ${u.userId} | ${u.role}`));

    const files = await File.find({}).populate('uploader', 'userId');
    console.log('\n--- FILES ---');
    files.forEach(f => {
        const uploaderName = f.uploader ? f.uploader.userId : 'UNKNOWN_UPLOADER';
        const uploaderId = f.uploader ? f.uploader._id : f.uploader;
        console.log(`${f._id} | ${f.originalName} | Uploader: ${uploaderName} (${uploaderId})`);
    });

    process.exit();
};

inspect();
