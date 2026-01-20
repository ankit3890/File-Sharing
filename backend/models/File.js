const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    path: {
        type: String,
        required: false // Optional for GridFS
    },
    gridFsId: {
        type: mongoose.Schema.Types.ObjectId, 
        required: false // Required for new uploads, but optional for migration safety
    },
    size: {
        type: Number,
        required: true
    },
    mimetype: {
        type: String,
        required: true
    },
    iv: {
        type: String, // Hex string
        required: true
    },
    uploader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    isEdited: {
        type: Boolean,
        default: false
    },
    deletedByAdmin: {
        type: Boolean,
        default: false
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('File', fileSchema);
