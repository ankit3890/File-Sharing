const User = require('../models/User');

// @desc    Register a new user (Admin only)
// @route   POST /api/users
// @access  Private/Admin
const registerUser = async (req, res, next) => {
    try {
        const { userId } = req.body;
        
        const userExists = await User.findOne({ userId });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Default password '123' - Hashed by pre-save hook
        const user = await User.create({
            userId,
            password: '123',
            mustChangePassword: true
        });

        if (user) {
             if (req.logAction) {
                await req.logAction({
                    action: 'CREATE_USER',
                    targetUser: user._id,
                    details: `Created user ${userId}`
                });
            }
            res.status(201).json({
                _id: user._id,
                userId: user.userId,
                role: user.role
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = async (req, res, next) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            await user.deleteOne();
             if (req.logAction) {
                await req.logAction({
                    action: 'DELETE_USER',
                    targetUser: user._id,
                    details: `Deleted user ${user.userId}`
                });
            }
            res.json({ message: 'User removed' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Update user profile (Name)
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                userId: updatedUser.userId,
                name: updatedUser.name,
                role: updatedUser.role
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        next(error);
    }
};

// Start export block replacement
module.exports = { registerUser, getUsers, deleteUser, updateProfile };
