import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, FileText } from 'lucide-react';

const EditFileModal = ({ isOpen, onClose, file, onSave }) => {
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (file) {
            setDescription(file.description || '');
        }
    }, [file]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(file._id, description);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)' }}
                    />
                    
                    {/* Modal */}
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="glass"
                        style={{ position: 'relative', width: '90%', maxWidth: '400px', padding: '2rem', borderRadius: '1.5rem' }}
                    >
                        <button 
                            onClick={onClose}
                            style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                        >
                            <X size={24} />
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.75rem' }}>
                                <FileText size={24} color="#3b82f6" />
                            </div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Edit Description</h2>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="input-field"
                                    rows={4}
                                    style={{ width: '100%', resize: 'none' }}
                                    placeholder="Enter file description..."
                                    autoFocus
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button 
                                    type="button" 
                                    onClick={onClose}
                                    style={{ padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid #475569', color: '#cbd5e1', borderRadius: '0.5rem', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn-primary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}
                                >
                                    <Save size={18} /> Save Changes
                                </button>
                            </div>
                        </form>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default EditFileModal;
