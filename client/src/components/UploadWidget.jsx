import React, { useState, useRef, useEffect } from 'react';
import api from '../utils/api';
import { UploadCloud, File, X, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import AlertModal from './AlertModal';

const UploadWidget = ({ projectId, onUploadComplete, initialFile, onStatusChange }) => {
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(initialFile || null);
    const [description, setDescription] = useState('');
    const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '', type: 'error' });
    const inputRef = useRef(null);

    // Progress State
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadSpeed, setUploadSpeed] = useState('');
    const [uploadedAmount, setUploadedAmount] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    
    // Refs for optimization and control
    const startTimeRef = useRef(null);
    const lastUpdateRef = useRef(0);
    const abortControllerRef = useRef(null);

    useEffect(() => {
        if (initialFile) setSelectedFile(initialFile);
    }, [initialFile]);

    // Notify parent about uploading state
    useEffect(() => {
        if (onStatusChange) {
            onStatusChange(uploading);
        }
    }, [uploading, onStatusChange]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const validateFile = (file) => {
        if (file.size > 15 * 1024 * 1024) {
            setAlertState({ 
                isOpen: true, 
                title: 'File Too Large', 
                message: `This file is ${formatBytes(file.size)}. The maximum allowed size is 15.00 MB.`, 
                type: 'error' 
            });
            return false;
        }
        return true;
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (validateFile(file)) {
                setSelectedFile(file);
            }
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (validateFile(file)) {
                setSelectedFile(file);
            } else {
                if (inputRef.current) inputRef.current.value = '';
            }
        }
    };

    const cancelUpload = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        setUploading(false);
        setUploadProgress(0);
        setUploadSpeed('');
        setUploadedAmount('');
        setTotalAmount('');
        setSelectedFile(null);
        setDescription('');
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        setUploadProgress(0);
        setUploadedAmount('0 B');
        setTotalAmount(formatBytes(selectedFile.size));
        setUploadSpeed('Starting...');
        
        startTimeRef.current = Date.now();
        lastUpdateRef.current = 0;
        abortControllerRef.current = new AbortController();

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('projectId', projectId);
        formData.append('description', description || 'Uploaded via Web');
        
        // Ensure totalAmount is set immediately
        setTotalAmount(formatBytes(selectedFile.size));

        try {
            await api.post('/files', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                signal: abortControllerRef.current.signal,
                onUploadProgress: (progressEvent) => {
                    // Throttling updates to 5 times per second (200ms)
                    const now = Date.now();
                    if (now - lastUpdateRef.current < 200 && progressEvent.loaded !== progressEvent.total) return;
                    lastUpdateRef.current = now;

                    const { loaded, total } = progressEvent;
                    const percent = Math.floor((loaded * 100) / total);
                    setUploadProgress(percent);
                    
                    setUploadedAmount(formatBytes(loaded));
                    
                    // Calculate Speed
                    const diffTime = (now - startTimeRef.current) / 1000; // seconds
                    if (diffTime > 0) {
                        const speed = loaded / diffTime; // bytes per second
                        setUploadSpeed(`${formatBytes(speed)}/s`);
                    }
                }
            });
            onUploadComplete();
            // Reset state handled by parent closing usually, but safe to clear local too
            setSelectedFile(null);
            setDescription('');
        } catch (error) {
            if (error.name === 'CanceledError' || error.message === 'canceled' || error.code === 'ERR_CANCELED') {
                console.log('Upload cancelled');
                return;
            }

            console.error('[UPLOAD_ERROR]', error);
            
            let errorMessage = 'Failed to upload file. Please check storage limits or file size.';
            let errorTitle = 'Upload Failed';

            // Specific check for Vercel/Server payload limits (413 Payload Too Large)
            if (error.response?.status === 413) {
                errorTitle = 'File Too Large (Platform Limit)';
                errorMessage = `Vercel rejected this upload (${formatBytes(selectedFile.size)}) because it exceeds the platform's payload limit (including overhead). Try a smaller file (< 14MB) or compress it.`;
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }

            setAlertState({ 
                isOpen: true, 
                title: errorTitle, 
                message: errorMessage, 
                type: 'error' 
            });
        } finally {
            setUploading(false);
            abortControllerRef.current = null;
        }
    };

    const handleCancelFile = (e) => {
        e.stopPropagation();
        setSelectedFile(null);
        setDescription('');
        if (inputRef.current) inputRef.current.value = '';
    };

    return (
        <div className="glass" style={{ padding: '0', borderRadius: '1rem', overflow: 'hidden' }}>
            {uploading ? (
                <div style={{ padding: '2rem 1.5rem', textAlign: 'center' }} role="status" aria-busy="true">
                    <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#cbd5e1' }}>
                            <span style={{ fontWeight: 600, color: uploadProgress === 100 ? '#10b981' : 'inherit' }}>
                                {uploadProgress === 100 ? 'Finalizing...' : 'Uploading...'}
                            </span>
                            <span>{uploadProgress}%</span>
                        </div>
                        
                        {/* Progress Bar Container */}
                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${uploadProgress}%` }}
                                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                                style={{ height: '100%', background: uploadProgress === 100 ? '#10b981' : '#ffffff' }}
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                            <span>{uploadProgress === 100 ? 'Finishing up...' : uploadSpeed}</span>
                            <span>{uploadedAmount} of {totalAmount}</span>
                        </div>
                        
                        <div style={{ marginTop: '1.5rem' }}>
                            <button 
                                onClick={cancelUpload}
                                style={{
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    color: '#ef4444',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: 600
                                }}
                            >
                                Cancel Upload
                            </button>
                        </div>
                    </div>
                </div>
            ) : selectedFile ? (
                <div style={{ padding: '1.5rem', textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '0.75rem' }}>
                        <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '0.75rem', borderRadius: '0.5rem', color: '#ffffff' }}>
                            <File size={24} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedFile.name}</p>
                            <p style={{ fontSize: '0.8rem', color: selectedFile.size > 14 * 1024 * 1024 ? '#f59e0b' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                {formatBytes(selectedFile.size)}
                                {selectedFile.size > 14 * 1024 * 1024 && (
                                    <span title="This file is close to Vercel's 15MB limit and might be rejected due to upload overhead." style={{ cursor: 'help' }}>⚠️ Risky</span>
                                )}
                            </p>
                        </div>
                        <button onClick={handleCancelFile} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }} aria-label="Remove selected file">
                            <X size={20} />
                        </button>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: '#cbd5e1' }}>Description (Optional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add a description for this file..."
                            rows="3"
                            aria-label="File description"
                            style={{ 
                                width: '100%', 
                                padding: '0.75rem', 
                                borderRadius: '0.75rem', 
                                border: '1px solid rgba(255,255,255,0.1)', 
                                background: 'rgba(0,0,0,0.2)', 
                                color: 'white',
                                resize: 'none',
                                fontFamily: 'inherit'
                            }}
                        />
                    </div>

                    <button 
                        onClick={handleUpload}
                        disabled={uploading}
                        style={{ 
                            width: '100%', 
                            padding: '0.75rem', 
                            background: '#ffffff', 
                            color: 'black', 
                            border: 'none', 
                            borderRadius: '0.75rem', 
                            fontSize: '1rem', 
                            fontWeight: 600, 
                            cursor: uploading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            opacity: uploading ? 0.7 : 1
                        }}
                    >
                        {uploading ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={20} />} 
                        {uploading ? 'Uploading...' : 'Upload File'}
                    </button>
                </div>
            ) : (
                <form 
                    onDragEnter={handleDrag} 
                    onDragOver={handleDrag} 
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current.click()}
                    aria-label="File upload dropzone"
                    style={{ 
                        padding: '3rem 2rem', 
                        textAlign: 'center', 
                        border: dragActive ? '2px dashed #ffffff' : '2px dashed rgba(255,255,255,0.1)',
                        borderRadius: '1rem',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.2s'
                    }}
                >
                    <input 
                        ref={inputRef}
                        type="file" 
                        style={{ display: 'none' }} 
                        onChange={handleChange} 
                        aria-hidden="true"
                    />
                    
                    <UploadCloud size={48} style={{ color: dragActive ? '#ffffff' : '#475569', margin: '0 auto 1rem', transition: 'color 0.2s' }} />
                    <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Click or Drag file to upload</p>
                    <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Max 15MB per file</p>
                    
                    {dragActive && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255, 255, 255, 0.05)', pointerEvents: 'none' }}></div>}
                </form>
            )}
            
            <AlertModal 
                isOpen={alertState.isOpen}
                onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
            />
        </div>
    );
};

export default UploadWidget;
