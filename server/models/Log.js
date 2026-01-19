const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true
    },
    actor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    targetUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    },
    file: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File'
    },
    details: {
        type: String,
        default: ''
    },
    ipAddress: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Append-only enforcement: This fits naturally with Mongo as we won't create update routes for Logs
module.exports = mongoose.model('Log', logSchema);
