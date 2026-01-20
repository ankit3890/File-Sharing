import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare } from 'lucide-react';

const PromptModal = ({ isOpen, onClose, onConfirm, title, message, placeholder = 'Type here...', initialValue = '' }) => {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        if (isOpen) setValue(initialValue);
    }, [isOpen, initialValue]);

    const handleConfirm = () => {
        onConfirm(value);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                        style={{ position: 'relative', width: '90%', maxWidth: '400px', padding: '2rem', borderRadius: '1rem' }}
                    >
                        <div style={{ margin: '0 auto 1.5rem', width: '3rem', height: '3rem', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <MessageSquare size={24} color="#3b82f6" />
                        </div>
                        
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem', textAlign: 'center' }}>{title}</h3>
                        <p style={{ color: '#94a3b8', marginBottom: '1.5rem', textAlign: 'center' }}>{message}</p>
                        
                        <input 
                            autoFocus
                            type="text"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder={placeholder}
                            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                            style={{ 
                                width: '100%', 
                                background: 'rgba(0,0,0,0.2)', 
                                border: '1px solid rgba(255,255,255,0.1)', 
                                color: 'white', 
                                padding: '0.8rem', 
                                borderRadius: '0.5rem',
                                marginBottom: '2rem',
                                outline: 'none'
                            }}
                        />

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button 
                                onClick={onClose}
                                style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '0.5rem', color: '#94a3b8', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleConfirm}
                                className="btn-primary"
                                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}
                            >
                                Submit
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default PromptModal;
