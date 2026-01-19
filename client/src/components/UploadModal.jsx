import React from 'react';
import { X } from 'lucide-react';
import UploadWidget from './UploadWidget';
import { motion, AnimatePresence } from 'framer-motion';

const UploadModal = ({ isOpen, onClose, projectId, onUploadComplete }) => {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
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
                onClick={onClose}
            >
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    style={{
                        background: '#0f172a',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '1rem',
                        padding: '1.5rem',
                        width: '90%',
                        maxWidth: '500px',
                        position: 'relative',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    <button 
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '1rem',
                            right: '1rem',
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer'
                        }}
                    >
                        <X size={20} />
                    </button>
                    
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Upload Files</h2>
                    <UploadWidget projectId={projectId} onUploadComplete={() => { onUploadComplete(); onClose(); }} />
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default UploadModal;
