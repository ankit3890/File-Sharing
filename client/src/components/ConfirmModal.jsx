import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Check, Info } from 'lucide-react';

const ConfirmModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmText = 'Confirm', 
    isDanger = false, // Deprecated, use variant="danger"
    variant = 'info' 
}) => {
    // backward compatibility
    const effectiveVariant = isDanger ? 'danger' : variant;

    const getVariantStyles = () => {
        switch (effectiveVariant) {
            case 'danger':
                return {
                    bg: 'rgba(239, 68, 68, 0.1)',
                    color: '#ef4444',
                    icon: AlertTriangle,
                    btnBg: '#ef4444'
                };
            case 'success':
                return {
                    bg: 'rgba(16, 185, 129, 0.1)',
                    color: '#10b981',
                    icon: Check,
                    btnBg: '#10b981'
                };
            default:
                return {
                    bg: 'rgba(59, 130, 246, 0.1)',
                    color: '#3b82f6',
                    icon: Info,
                    btnBg: '#3b82f6'
                };
        }
    };

    const styles = getVariantStyles();
    const Icon = styles.icon;

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
                        <div style={{ margin: '0 auto 1.5rem', width: '3.5rem', height: '3.5rem', borderRadius: '50%', background: styles.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon size={28} color={styles.color} />
                        </div>
                        
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>{title}</h3>
                        <p style={{ color: '#94a3b8', marginBottom: '2rem', lineHeight: '1.5' }}>{message}</p>
                        
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button 
                                onClick={onClose}
                                style={{ padding: '0.6rem 1.5rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 500 }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => { onConfirm(); onClose(); }}
                                className="btn-primary"
                                style={{ 
                                    padding: '0.6rem 1.5rem', 
                                    borderRadius: '0.5rem', 
                                    border: 'none', 
                                    cursor: 'pointer',
                                    background: styles.btnBg,
                                    fontWeight: 600,
                                    color: 'white'
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
