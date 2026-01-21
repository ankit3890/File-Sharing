const User = require('../models/User');
const Project = require('../models/Project');
const File = require('../models/File');
const Attendance = require('../models/Attendance');
const Log = require('../models/Log');

// @desc    Get User Dashboard Summary
// @route   GET /api/dashboard/user-summary
// @access  Private
exports.getUserSummary = async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. Project Count
        const projectCount = await Project.countDocuments({ members: userId });

        // 2. File Count & Storage (Storage is already in req.user usually, but let's refresh)
        const user = await User.findById(userId).select('storageUsed storageLimit');
        const fileCount = await File.countDocuments({ uploader: userId, deletedByAdmin: false });

        // 3. Attendance Status for Today
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;

        const todayAttendance = await Attendance.findOne({
            userId: userId,
            date: todayStr
        });

        const attendanceStatus = todayAttendance ? todayAttendance.status : 'Not Marked';

        res.json({
            projects: projectCount,
            storage: {
                used: user.storageUsed,
                limit: user.storageLimit || (100 * 1024 * 1024),
                percent: Math.round((user.storageUsed / (user.storageLimit || (100 * 1024 * 1024))) * 100)
            },
            files: fileCount,
            attendance: attendanceStatus
        });
    } catch (err) {
        console.error('User Summary Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get User Recent Activity
// @route   GET /api/dashboard/user-activity
// @access  Private
exports.getUserActivity = async (req, res) => {
    try {
        const userId = req.user._id;

        // Find projects user belongs to, to show team activity
        const userProjects = await Project.find({ members: userId }).select('_id');
        const projectIds = userProjects.map(p => p._id);

        const logs = await Log.find({
            $or: [
                { actor: userId }, // Actions by user
                { project: { $in: projectIds } }, // Actions in user's projects
                { target: userId } // Actions targeting user (e.g. admin edited user)
            ]
        })
        .sort({ timestamp: -1 })
        .limit(10)
        .populate('actor', 'username')
        .populate('project', 'name');

        res.json(logs);
    } catch (err) {
        console.error('User Activity Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get User Recent Files
// @route   GET /api/dashboard/user-recent-files
// @access  Private
exports.getUserRecentFiles = async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. Find all projects where the user is a member
        const userProjects = await Project.find({ members: userId }).select('_id');
        const projectIds = userProjects.map(p => p._id);

        // 2. Find files in those projects (regardless of uploader)
        // If you still only want files uploaded by user, keep the old query.
        // But "Recent Files" usually implies "What's new in my projects"
        const files = await File.find({ 
            project: { $in: projectIds }, 
            deletedByAdmin: false 
        })
        .sort({ uploadedAt: -1 })
        .limit(10) // Increased limit slightly
        .populate('project', 'name')
        .populate('uploader', 'userId'); // Helpful to see who uploaded it
            
        res.json(files);
    } catch (err) {
        console.error('Recent Files Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Admin Dashboard Summary
// @route   GET /api/dashboard/admin-summary
// @access  Admin
exports.getAdminSummary = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalProjects = await Project.countDocuments();
        const totalFiles = await File.countDocuments({ deletedByAdmin: false });
        
        // Calculate total system storage used
        // Aggregate file sizes for accuracy or sum user storageUsed
        const storageAgg = await User.aggregate([
            { $group: { _id: null, totalUsed: { $sum: "$storageUsed" } } }
        ]);
        const totalStorage = storageAgg.length > 0 ? storageAgg[0].totalUsed : 0;

        res.json({
            users: totalUsers,
            projects: totalProjects,
            files: totalFiles,
            storage: totalStorage
        });
    } catch (err) {
        console.error('Admin Summary Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Admin Action Queue & Storage Monitor
// @route   GET /api/dashboard/admin-queue
// @access  Admin
exports.getAdminQueue = async (req, res) => {
    try {
        // 1. Pending Attendance
        const pendingAttendance = await Attendance.find({ status: 'pending' }) // Case sensitive check
            .populate('userId', 'userId email')
            .limit(5);

        // 2. High Storage Users (>80%)
        // We can't easily query calculated fields in standard find without $expr, 
        // effectively finding users where storageUsed / storageLimit > 0.8
        const users = await User.find();
        const dangerUsers = users.filter(u => (u.storageUsed / (u.storageLimit || (100 * 1024 * 1024))) > 0.8)
            .map(u => ({
                _id: u._id,
                userId: u.userId,
                storageUsed: u.storageUsed,
                storageLimit: u.storageLimit || (100 * 1024 * 1024),
                percent: Math.round((u.storageUsed / (u.storageLimit || (100 * 1024 * 1024))) * 100)
            }))
            .sort((a, b) => b.percent - a.percent) // Highest usage first
            .slice(0, 5);

        // 3. Recently Uploaded Files (System wide)
        const newFiles = await File.find({ deletedByAdmin: false })
            .sort({ uploadedAt: -1 })
            .limit(5)
            .populate('uploader', 'userId')
            .populate('project', 'name');

        res.json({
            pendingAttendance,
            storageAlerts: dangerUsers,
            recentFiles: newFiles
        });
    } catch (err) {
        console.error('Admin Queue Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
};
