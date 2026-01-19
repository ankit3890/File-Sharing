const Log = require('../models/Log');

const logger = async (req, res, next) => {
    // We will call this explicitly in controllers to log specific actions
    // This helper function allows easy logging from any controller
    req.logAction = async ({ action, targetUser, project, file, details }) => {
        try {
            await Log.create({
                action,
                actor: req.user._id, // Assumes auth middleware populates req.user
                targetUser,
                project,
                file,
                details,
                ipAddress: req.ip
            });
        } catch (error) {
            console.error('Logging failed:', error);
        }
    };
    next();
};

module.exports = logger;
