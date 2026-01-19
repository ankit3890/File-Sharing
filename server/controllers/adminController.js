const Log = require('../models/Log');
const User = require('../models/User');
const Project = require('../models/Project');
const File = require('../models/File');
const jwt = require('jsonwebtoken');

// @desc    Get System Logs
// @route   GET /api/admin/logs
// @access  Private/Admin
const getLogs = async (req, res, next) => {
    try {
        const { limit = 100, page = 1 } = req.query;
        // Simple pagination
        const logs = await Log.find({})
            .sort({ timestamp: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit))
            .populate('actor', 'userId')
            .populate('targetUser', 'userId')
            .populate('project', 'name')
            .populate('file', 'originalName');
        
        const total = await Log.countDocuments({});

        res.json({
            logs,
            page: Number(page),
            pages: Math.ceil(total / Number(limit)),
            total
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get Dashboard Stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getStats = async (req, res, next) => {
    try {
        const userCount = await User.countDocuments({});
        const projectCount = await Project.countDocuments({});
        const fileCount = await File.countDocuments({});
        
        // Aggregate total storage used
        const totalStorage = await User.aggregate([
            { $group: { _id: null, total: { $sum: '$storageUsed' } } }
        ]);

        const storageBytes = totalStorage[0] ? totalStorage[0].total : 0;

        res.json({
            userCount,
            projectCount,
            fileCount,
            storageUsedMessages: (storageBytes / 1024 / 1024).toFixed(2) + ' MB'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Impersonate User (Login as...)
// @route   POST /api/admin/impersonate
// @access  Private/Admin
const impersonateUser = async (req, res, next) => {
    try {
        const { userId } = req.body;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role === 'admin') {
             return res.status(400).json({ message: 'Cannot impersonate another admin' });
        }

        // Generate token for this user
        const token = jwt.sign(
            { id: user._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' } // Short session
        );

        // Limit data returned to avoid confusion
        res.json({
            _id: user._id,
            userId: user.userId,
            role: user.role,
            token,
            isImpersonated: true
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Clear All System Logs
// @route   DELETE /api/admin/logs
// @access  Private/Admin
const clearLogs = async (req, res, next) => {
    try {
        await Log.deleteMany({});
        res.json({ message: 'All logs cleared' });
    } catch (error) {
        next(error);
    }
};

module.exports = { getLogs, getStats, impersonateUser, clearLogs };
