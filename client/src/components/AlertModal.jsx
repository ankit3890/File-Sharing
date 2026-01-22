import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

const AlertModal = ({ isOpen, onClose, title, message, type = 'error' }) => {
    // Determine if we can render the portal (client-side check)
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle size={24} color="#22c55e" />;
            case 'info': return <Info size={24} color="#3b82f6" />;
            default: return <AlertCircle size={24} color="#ef4444" />;
        }
    };

    const getBgColor = () => {
        switch (type) {
            case 'success': return 'rgba(34, 197, 94, 0.1)';
            case 'info': return 'rgba(59, 130, 246, 0.1)';
            default: return 'rgba(239, 68, 68, 0.1)';
        }
    };

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                        role="alertdialog"
                        aria-modal="true"
                        style={{ position: 'relative', width: '90%', maxWidth: '400px', padding: '2rem', borderRadius: '1rem', textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
                    >
                        <div style={{ margin: '0 auto 1.5rem', width: '3rem', height: '3rem', borderRadius: '50%', background: getBgColor(), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {getIcon()}
                        </div>
                        
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>{title}</h3>
                        <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>{message}</p>
                        
                        <button 
                            onClick={onClose}
                            className="btn-primary"
                            style={{ padding: '0.6rem 2rem', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', minWidth: '100px' }}
                        >
                            OK
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default AlertModal;
