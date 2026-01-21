const Log = require('../models/Log');
const User = require('../models/User');
const Project = require('../models/Project');
const File = require('../models/File');
const jwt = require('jsonwebtoken');

/* =========================================================
   GET AUDIT LOGS (WITH PROJECT / SYSTEM SEPARATION)
   =========================================================
   Query params:
   - page (number)
   - limit (number)
   - scope = all | project | system
   - projectId (optional)
   ========================================================= */
const getLogs = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 25,
            scope = 'all',
            projectId
        } = req.query;

        const query = {};

        // Card-based filtering
        if (scope === 'project') {
            query.project = { $ne: null };
        }

        if (scope === 'system') {
            query.project = null;
            query.action = { $not: /ATTENDANCE/ }; // Exclude attendance from system logs if they overlap
        }

        if (scope === 'attendance') {
            query.action = /ATTENDANCE/;
        }

        // Project dropdown filter
        if (projectId) {
            query.project = projectId;
        }

        const logs = await Log.find(query)
            .sort({ timestamp: -1 })
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit))
            .populate('actor', 'userId')
            .populate('targetUser', 'userId')
            .populate('project', 'name')
            .populate('file', 'originalName');

        const total = await Log.countDocuments(query);

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

/* =========================================================
   GET ADMIN DASHBOARD STATS + LOG CARDS
   ========================================================= */
const getStats = async (req, res, next) => {
    try {
        const userCount = await User.countDocuments({});
        const projectCount = await Project.countDocuments({});
        const fileCount = await File.countDocuments({});

        // Total storage used
        const totalStorage = await User.aggregate([
            { $group: { _id: null, total: { $sum: '$storageUsed' } } }
        ]);
        const storageBytes = totalStorage[0]?.total || 0;

        // LOG CARDS
        const [totalLogs, projectLogs, systemLogs, attendanceLogs] = await Promise.all([
            Log.countDocuments({}),
            Log.countDocuments({ project: { $ne: null } }),
            Log.countDocuments({ project: null, action: { $not: /ATTENDANCE/ } }),
            Log.countDocuments({ action: /ATTENDANCE/ })
        ]);

        res.json({
            // Existing dashboard stats
            userCount,
            projectCount,
            fileCount,
            storageUsedMessages: (storageBytes / 1024 / 1024).toFixed(2) + ' MB',

            // NEW: Log cards
            logs: {
                total: totalLogs,
                project: projectLogs,
                system: systemLogs,
                attendance: attendanceLogs
            }
        });
    } catch (error) {
        next(error);
    }
};

/* =========================================================
   IMPERSONATE USER
   ========================================================= */
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

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        if (req.logAction) {
            await req.logAction({
                action: 'IMPERSONATE_USER',
                targetUser: user._id,
                details: `Admin ${req.user.userId} is now impersonating ${user.userId}`
            });
        }

        res.json({
            _id: user._id,
            userId: user.userId,
            role: user.role,
            mustChangePassword: user.mustChangePassword,
            token,
            isImpersonated: true
        });
    } catch (error) {
        next(error);
    }
};

/* =========================================================
   CLEAR ALL LOGS
   ========================================================= */
const clearLogs = async (req, res, next) => {
    try {
        await Log.deleteMany({});
        res.json({ message: 'All logs cleared' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getLogs,
    getStats,
    impersonateUser,
    clearLogs
};
