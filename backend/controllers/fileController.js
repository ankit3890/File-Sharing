const File = require('../models/File');
const User = require('../models/User');
const Project = require('../models/Project');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { Readable } = require('stream');
const jwt = require('jsonwebtoken');
const connectDB = require('../config/db');

// Encryption Settings
const ALGORITHM = 'aes-256-cbc';
const SECRET = process.env.ADMIN_SECRET || 'fallback_secret';
const ENCRYPTION_KEY = crypto.createHash('sha256').update(SECRET).digest();

console.log('--- ENCRYPTION SETUP (GridFS) ---');
console.log('Secret used:', SECRET === 'fallback_secret' ? 'FALLBACK' : 'ENV_VAR');
console.log('Key Hash:', crypto.createHash('md5').update(ENCRYPTION_KEY).digest('hex'));
console.log('------------------------'); 

// Helper to get GridFS Bucket with Connection Check
const getBucket = async () => {
    if (mongoose.connection.readyState !== 1) {
        console.log('[GridFS] Database not ready, reconnecting...');
        await connectDB();
    }
    // Double check after connect attempt
    if (!mongoose.connection.db) {
         // Attempt to wait a moment? Or just throw.
         throw new Error('Database connection failed - cannot create GridFSBucket');
    }
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

        const project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (!project.members.includes(req.user._id) && req.user.role !== 'admin') {
             return res.status(403).json({ message: 'Not a member of this project' });
        }

        const STORAGE_LIMIT = 100 * 1024 * 1024;
        const user = await User.findById(req.user._id);
        if (user.storageUsed + fileSize > STORAGE_LIMIT) {
            return res.status(400).json({ message: 'Storage limit exceeded (100MB)' });
        }

        const iv = crypto.randomBytes(16);
        const filename = `${Date.now()}-${req.file.originalname}`;
        
        const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
        const bucket = await getBucket();
        
        const uploadStream = bucket.openUploadStream(filename, {
            metadata: {
                originalName: req.file.originalname,
                mimetype: req.file.mimetype,
                uploader: req.user._id,
                projectId: projectId
            }
        });

        const bufferStream = new Readable();
        bufferStream.push(req.file.buffer);
        bufferStream.push(null); 

        console.log(`[UPLOAD] Streaming encrypted ${filename} to GridFS`);

        bufferStream
            .pipe(cipher)
            .pipe(uploadStream)
            .on('error', (error) => {
                console.error('[UPLOAD] Stream Error:', error);
                return res.status(500).json({ message: 'Upload failed during streaming' });
            })
            .on('finish', async () => {
                console.log(`[UPLOAD] Finished: ${uploadStream.id}`);

                const newFile = await File.create({
                    filename: filename,
                    originalName: req.file.originalname,
                    gridFsId: uploadStream.id,
                    path: 'GRIDFS', 
                    size: fileSize,
                    mimetype: req.file.mimetype,
                    iv: iv.toString('hex'),
                    uploader: req.user._id,
                    project: projectId,
                    description: description || ''
                });

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

// @desc    Generate Download Token (No changes needed)
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
             return res.status(500).send('Legacy file system storage not supported in this environment');
        }

        const bucket = await getBucket();
        
        // Ensure file exists in bucket before opening stream
        // Note: bucket.find returns a Cursor.
        const fileDocs = await bucket.find({ _id: file.gridFsId }).toArray();
        if (!fileDocs || fileDocs.length === 0) {
            console.error(`[DOWNLOAD] GridFS Missing File: ${file.gridFsId} for ${file.filename}`);
            return res.status(404).send('File content not found in storage');
        }

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
const deleteFile = async (req, res, next) => {
    try {
        const file = await File.findById(req.params.id);
        if (!file) return res.status(404).json({ message: 'File not found' });

        if (req.user.role !== 'admin' && file.uploader.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (req.user.role === 'admin' && file.uploader.toString() !== req.user._id.toString()) {
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
             if (file.gridFsId) {
                 const bucket = await getBucket();
                 try {
                     await bucket.delete(file.gridFsId);
                 } catch (err) {
                     console.warn('GridFS Delete Warning:', err.message);
                 }
             }

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

        const bucket = await getBucket();

        const fileDocs = await bucket.find({ _id: file.gridFsId }).toArray();
        if (!fileDocs || fileDocs.length === 0) {
            console.error(`[PREVIEW] GridFS Missing File: ${file.gridFsId}`);
            return res.status(404).send('File content missing');
        }

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

const getUserFiles = async (req, res, next) => {
    try {
        const files = await File.find({ uploader: req.user._id }).sort({ uploadedAt: -1 }).populate('uploader', 'userId');
        res.json(files);
    } catch (error) {
        next(error);
    }
};

const deleteAllUserFiles = async (req, res, next) => {
    try {
        const { password } = req.body;
        const user = await User.findById(req.user._id).select('+password');

        if (!(await user.matchPassword(password))) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        const files = await File.find({ uploader: req.user._id });
        const bucket = await getBucket();

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
