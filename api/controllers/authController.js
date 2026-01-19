const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d' // Fixed typo in .env check
    });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
    try {
        const { userId, password } = req.body;

        const user = await User.findOne({ userId });

        if (user && (await user.matchPassword(password))) {
            // Log successful login
            if (req.logAction) {
                await req.logAction({
                    action: 'LOGIN',
                    targetUser: user._id,
                    details: 'User logged in'
                });
            }

            res.json({
                _id: user._id,
                userId: user.userId,
                role: user.role,
                storageUsed: user.storageUsed,
                mustChangePassword: user.mustChangePassword,
                token: generateToken(user._id)
            });
        } else {
            // Log failed attempt??? (Requires user lookup or generic log)
             res.status(401).json({ message: 'Invalid userId or password' });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Change Password (Mandatory for first time)
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);

        if (user && (await user.matchPassword(currentPassword))) {
            user.password = newPassword;
            user.mustChangePassword = false; // Reset the flag
            await user.save();

             // Log password change
             if (req.logAction) {
                await req.logAction({
                    action: 'PASSWORD_CHANGE',
                    targetUser: user._id,
                    details: 'Password changed successfully'
                });
            }

            res.json({
                _id: user._id,
                userId: user.userId,
                role: user.role,
                mustChangePassword: user.mustChangePassword,
                token: generateToken(user._id)
            });
        } else {
            res.status(401).json({ message: 'Invalid current password' });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        res.json({
            _id: user._id,
            userId: user.userId,
            role: user.role,
            storageUsed: user.storageUsed,
            mustChangePassword: user.mustChangePassword
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { loginUser, changePassword, getMe };
