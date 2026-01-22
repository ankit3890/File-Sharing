import React, { useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Info, Code, Users } from 'lucide-react';

const AboutModal = ({ isOpen, onClose }) => {
    const shouldReduceMotion = useReducedMotion();

    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', onKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

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
                    
                    {/* Modal Content */}
                    <motion.div 
                        initial={shouldReduceMotion ? false : { scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={shouldReduceMotion ? false : { scale: 0.9, opacity: 0, y: 20 }}
                        className="glass"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="about-title"
                        tabIndex={-1}
                        style={{ position: 'relative', width: '90%', maxWidth: '600px', padding: '1.5rem', borderRadius: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}
                    >
                        <button 
                            onClick={onClose}
                            aria-label="Close About modal"
                            style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                            <X size={24} />
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.75rem' }}>
                                <Info size={28} color="#3b82f6" />
                            </div>
                            <div>
                                <h2 id="about-title" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>About The App</h2>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Version 1.0.0</p>
                            </div>
                        </div>

                        <div style={{ lineHeight: '1.6', color: '#cbd5e1', fontSize: '0.95rem' }}>
                            <p style={{ marginBottom: '1.5rem' }}>
                                A secure, admin-controlled file sharing platform for team project collaboration. Users can upload, manage, and share files within assigned projects with strict storage limits and usage logging to ensure accountability.
                            </p>

                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'white', fontWeight: 'bold' }}>
                                    <Code size={20} color="#60a5fa" /> Source Code
                                </div>
                                <p style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>This project is open-source and available on GitHub:</p>
                                <a 
                                    href="https://github.com/ankit3890/File-Sharing" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style={{ color: '#60a5fa', textDecoration: 'none', wordBreak: 'break-all' }}
                                >
                                    https://github.com/ankit3890/File-Sharing
                                </a>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: 'white', fontWeight: 'bold' }}>
                                    <Users size={20} color="#60a5fa" /> Developers
                                </div>
                                <p style={{ fontSize: '0.9rem' }}>Built by <strong>Ankit Kumar Singh</strong> in partnership with <strong>Deepak Kumar Singh</strong>.</p>
                            </div>
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AboutModal;
