import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import UploadWidget from './UploadWidget';
import { motion, AnimatePresence } from 'framer-motion';

const UploadModal = ({ isOpen, onClose, projectId, onUploadComplete, initialFile }) => {
    const [isUploading, setIsUploading] = useState(false);

    const handleUploadComplete = () => {
        onUploadComplete();
        onClose();
    };

    const handleClose = () => {
        if (!isUploading) {
            onClose();
        }
    };

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape' && !isUploading) {
                onClose();
            }
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
        }
        return () => document.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose, isUploading]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    key="upload-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="modal-backdrop"
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(5px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}
                    onClick={handleClose}
                >
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        style={{
                            background: '#18181b',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '1rem',
                            padding: '1.5rem',
                            width: '90%',
                            maxWidth: '500px',
                            position: 'relative',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                        }}
                        onClick={e => e.stopPropagation()}
                        role="dialog" 
                        aria-modal="true"
                    >
                        <button 
                            onClick={handleClose}
                            style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                background: 'none',
                                border: 'none',
                                color: isUploading ? '#475569' : '#94a3b8',
                                cursor: isUploading ? 'not-allowed' : 'pointer',
                                transition: 'color 0.2s'
                            }}
                            disabled={isUploading}
                            aria-label="Close modal"
                        >
                            <X size={20} />
                        </button>
                        
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'white' }}>Upload Files</h2>
                        
                        <UploadWidget 
                            projectId={projectId} 
                            onUploadComplete={handleUploadComplete} 
                            initialFile={initialFile}
                            onStatusChange={setIsUploading}
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default UploadModal;
