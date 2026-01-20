const File = require('../models/File');
const User = require('../models/User');
const Project = require('../models/Project');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { Readable } = require('stream');
const jwt = require('jsonwebtoken');

// Encryption Settings
const ALGORITHM = 'aes-256-cbc';
const SECRET = process.env.ADMIN_SECRET || 'fallback_secret';
const ENCRYPTION_KEY = crypto.createHash('sha256').update(SECRET).digest();

console.log('--- ENCRYPTION SETUP (GridFS) ---');
console.log('Secret used:', SECRET === 'fallback_secret' ? 'FALLBACK' : 'ENV_VAR');
console.log('Key Hash:', crypto.createHash('md5').update(ENCRYPTION_KEY).digest('hex'));
console.log('------------------------'); 

// Helper to get GridFS Bucket
const getBucket = () => {
    return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
        bucketName: 'uploads'
    });
};

// @desc    Upload File
// @route   POST /api/files
// @access  Private
const uploadFile = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { projectId, description } = req.body;
        const fileSize = req.file.size;

        // 1. Check Project Membership
        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (!project.members.includes(req.user._id) && req.user.role !== 'admin') {
             return res.status(403).json({ message: 'Not a member of this project' });
        }

        // 2. Check User Storage Limit (100MB)
        const STORAGE_LIMIT = 100 * 1024 * 1024;
        const user = await User.findById(req.user._id);
        if (user.storageUsed + fileSize > STORAGE_LIMIT) {
            return res.status(400).json({ message: 'Storage limit exceeded (100MB)' });
        }

        // 3. Encrypt and Save to GridFS
        const iv = crypto.randomBytes(16);
        const filename = `${Date.now()}-${req.file.originalname}`;
        
        const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
        const bucket = getBucket();
        
        // Create Upload Stream
        const uploadStream = bucket.openUploadStream(filename, {
            metadata: {
                originalName: req.file.originalname,
                mimetype: req.file.mimetype,
                uploader: req.user._id,
                projectId: projectId
            }
        });

        // Readable Stream from Buffer
        const bufferStream = new Readable();
        bufferStream.push(req.file.buffer);
        bufferStream.push(null); // End of stream

        console.log(`[UPLOAD] Streaming encrypted ${filename} to GridFS`);

        // Pipe: Buffer -> Cipher -> GridFS
        bufferStream
            .pipe(cipher)
            .pipe(uploadStream)
            .on('error', (error) => {
                console.error('[UPLOAD] Stream Error:', error);
                return res.status(500).json({ message: 'Upload failed during streaming' });
            })
            .on('finish', async () => {
                console.log(`[UPLOAD] Finished: ${uploadStream.id}`);

                // 4. Update Database (Metadata)
                const newFile = await File.create({
                    filename: filename,
                    originalName: req.file.originalname,
                    gridFsId: uploadStream.id, // Store GridFS ID
                    path: 'GRIDFS', // Placeholder
                    size: fileSize,
                    mimetype: req.file.mimetype,
                    iv: iv.toString('hex'),
                    uploader: req.user._id,
                    project: projectId,
                    description: description || ''
                });

                // Update User Storage
                user.storageUsed += fileSize;
                await user.save();

                if (req.logAction) {
                    await req.logAction({
                         action: 'UPLOAD_FILE',
                         file: newFile._id,
                         project: projectId,
                         details: `Uploaded ${req.file.originalname} (${(fileSize/1024/1024).toFixed(2)} MB)`
                    });
                }

                res.status(201).json(newFile);
            });

    } catch (error) {
        next(error);
    }
};

// @desc    Generate Download Token
// @route   GET /api/files/:id/download_token
// @access  Private
const getDownloadToken = async (req, res, next) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) return res.status(404).json({ message: 'File not found' });

        const project = await Project.findById(file.project);
        if (req.user.role !== 'admin' && !project.members.includes(req.user._id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const token = jwt.sign(
            { fileId: file._id, userId: req.user._id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1m' }
        );

        res.json({ token });

    } catch (error) {
        next(error);
    }
};

// @desc    Download/Preview File (Stream)
// @route   GET /api/files/download/:token
// @access  Public (protected by token)
const downloadFile = async (req, res, next) => {
    try {
        const { token } = req.params;
        const { preview } = req.query;

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (e) {
            return res.status(401).send('Invalid or expired download token');
        }

        const file = await File.findById(decoded.fileId);
        if (!file) return res.status(404).send('File not found');

        if (!file.gridFsId) {
             // Fallback for legacy local files (won't work on Vercel but good for local dev history)
             return res.status(500).send('Legacy file system storage not supported in this environment');
        }

        const bucket = getBucket();
        
        // Check if file exists in GridFS
        // const files = await bucket.find({ _id: file.gridFsId }).toArray();
        // if (!files.length) return res.status(404).send('File content missing in Storage');

        const iv = Buffer.from(file.iv, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
        const downloadStream = bucket.openDownloadStream(file.gridFsId);

        res.setHeader('Content-Type', file.mimetype);
        if (preview) {
             res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`);
        } else {
             res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
        }

        downloadStream
            .pipe(decipher)
            .pipe(res)
            .on('error', (err) => {
                console.error('Download/Decryption Error:', err);
                if (!res.headersSent) res.status(500).end();
            });

    } catch (error) {
        console.error('Download error:', error);
        if (!res.headersSent) res.status(500).send('Server Error during download');
    }
};

// @desc    Get Files for Project
// @route   GET /api/files/project/:projectId
// @access  Private
const getProjectFiles = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const project = await Project.findById(projectId);
        
        if (!project) return res.status(404).json({ message: 'Project not found' });

        if (req.user.role !== 'admin' && !project.members.includes(req.user._id)) {
            return res.status(403).json({ message: 'Not authorized for this project' });
        }

        const files = await File.find({ project: projectId }).populate('uploader', 'userId');
        res.json(files);

    } catch (error) {
        next(error);
    }
};

// @desc    Delete File
// @route   DELETE /api/files/:id
// @access  Private (Owner or Admin)
const deleteFile = async (req, res, next) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) return res.status(404).json({ message: 'File not found' });

        if (req.user.role !== 'admin' && file.uploader.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (req.user.role === 'admin' && file.uploader.toString() !== req.user._id.toString()) {
            // Soft Delete for Admin
            file.deletedByAdmin = true;
            await file.save();
             if (req.logAction) {
                await req.logAction({
                    action: 'DELETE_FILE_ADMIN',
                    file: file._id,
                    project: file.project,
                    details: `Admin marked ${file.originalName} as deleted`
                });
            }
             res.json({ message: 'File marked as deleted by admin' });
        } else {
             // Hard Delete
             if (file.gridFsId) {
                 const bucket = getBucket();
                 try {
                     await bucket.delete(file.gridFsId);
                 } catch (err) {
                     console.warn('GridFS Delete Warning:', err.message);
                 }
             }

             // Storage Update
            const uploader = await User.findById(file.uploader);
            if (uploader) {
                uploader.storageUsed = Math.max(0, uploader.storageUsed - file.size);
                await uploader.save();
            }

             if (req.logAction) {
                await req.logAction({
                    action: 'DELETE_FILE',
                    file: file._id,
                    project: file.project,
                    details: `Deleted ${file.originalName}`
                });
            }

            await file.deleteOne();
            res.json({ message: 'File deleted' });
        }

    } catch (error) {
        next(error);
    }
};

// @desc    Update File Metadata
// @route   PUT /api/files/:id
// @access  Private
const updateFile = async (req, res, next) => {
    try {
        const { description } = req.body;
        const file = await File.findById(req.params.id);
        
        if (!file) return res.status(404).json({ message: 'File not found' });
        if (req.user.role !== 'admin' && file.uploader.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        file.description = description;
        file.isEdited = true;
        await file.save();

         if (req.logAction) {
            await req.logAction({
                action: 'EDIT_FILE',
                file: file._id,
                project: file.project,
                details: `Updated description for ${file.originalName}`
            });
        }
        res.json(file);
    } catch (error) {
        next(error);
    }
};

// @desc    Preview File (Stream)
// @route   GET /api/files/:id/preview
// @access  Private
const getPreview = async (req, res, next) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) return res.status(404).json({ message: 'File not found' });

        const project = await Project.findById(file.project);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (req.user.role !== 'admin' && !project.members.includes(req.user._id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        if (!file.gridFsId) {
             return res.status(500).send('Legacy file system storage not supported');
        }

        const bucket = getBucket();
        const iv = Buffer.from(file.iv, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
        const downloadStream = bucket.openDownloadStream(file.gridFsId);

        res.setHeader('Content-Type', file.mimetype);
        res.setHeader('Content-Disposition', `inline; filename="${file.originalName}"`);

        downloadStream
            .pipe(decipher)
            .pipe(res)
            .on('error', (err) => {
                console.error('Preview Error:', err);
                if (!res.headersSent) res.status(500).end();
            });

    } catch (error) {
        if (!res.headersSent) res.status(500).send('Server Error during preview');
    }
};

// @desc    Get Files for Current User
// @route   GET /api/files/mine
// @access  Private
const getUserFiles = async (req, res, next) => {
    try {
        const files = await File.find({ uploader: req.user._id }).sort({ uploadedAt: -1 }).populate('uploader', 'userId');
        res.json(files);
    } catch (error) {
        next(error);
    }
};

// @desc    Delete All User Files
// @route   DELETE /api/files/mine
// @access  Private
const deleteAllUserFiles = async (req, res, next) => {
    try {
        const { password } = req.body;
        const user = await User.findById(req.user._id).select('+password');

        if (!(await user.matchPassword(password))) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        const files = await File.find({ uploader: req.user._id });
        const bucket = getBucket();

        for (const file of files) {
            if (file.gridFsId) {
                try {
                    await bucket.delete(file.gridFsId);
                } catch (err) {
                    console.warn(`Failed to delete GridFS file ${file.gridFsId}:`, err.message);
                }
            }
            await file.deleteOne();
        }

        user.storageUsed = 0;
        await user.save();

        if (req.logAction) {
            await req.logAction({
                action: 'BULK_DELETE',
                details: `User deleted all their files (${files.length} files)`
            });
        }

        res.json({ message: `Successfully deleted ${files.length} files` });

    } catch (error) {
        next(error);
    }
};

module.exports = { uploadFile, getDownloadToken, downloadFile, getProjectFiles, deleteFile, updateFile, getPreview, getUserFiles, deleteAllUserFiles };
