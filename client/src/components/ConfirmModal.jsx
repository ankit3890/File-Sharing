import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', isDanger = false }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)' }}
                    />
                    
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="glass"
                        style={{ position: 'relative', width: '90%', maxWidth: '400px', padding: '2rem', borderRadius: '1rem', textAlign: 'center' }}
                    >
                        <div style={{ margin: '0 auto 1.5rem', width: '3rem', height: '3rem', borderRadius: '50%', background: isDanger ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <AlertTriangle size={24} color={isDanger ? '#ef4444' : '#3b82f6'} />
                        </div>
                        
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>{title}</h3>
                        <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>{message}</p>
                        
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button 
                                onClick={onClose}
                                style={{ padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid #475569', color: '#cbd5e1', borderRadius: '0.5rem', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => { onConfirm(); onClose(); }}
                                className="btn-primary"
                                style={{ 
                                    padding: '0.6rem 1.2rem', 
                                    borderRadius: '0.5rem', 
                                    border: 'none', 
                                    cursor: 'pointer',
                                    background: isDanger ? '#ef4444' : undefined 
                                }}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmModal;
