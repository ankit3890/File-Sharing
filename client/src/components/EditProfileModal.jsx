import React, { useState } from 'react';
import { X, User, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const EditProfileModal = ({ isOpen, onClose }) => {
    const { user, updateUserLocal } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    React.useEffect(() => {
        if (isOpen && user) {
            setName(user.name || '');
        }
    }, [isOpen, user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await api.put('/users/profile', { name });
            updateUserLocal({ name: res.data.name });
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(4px)'
            }}>
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    style={{ 
                        width: '90%', 
                        maxWidth: '400px', 
                        background: '#1e293b', 
                        border: '1px solid rgba(255, 255, 255, 0.1)', 
                        borderRadius: '1rem',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        overflow: 'hidden'
                    }}
                >
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '1.25rem 1.5rem',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 'bold', color: 'white', margin: 0 }}>
                            <User size={18} className="text-blue-400" style={{ color: '#60a5fa' }} /> 
                            Edit Profile
                        </h2>
                        <button 
                            onClick={onClose} 
                            style={{ 
                                background: 'transparent', 
                                border: 'none', 
                                color: '#94a3b8', 
                                cursor: 'pointer', 
                                padding: '4px', 
                                display: 'flex',
                                borderRadius: '4px',
                                transition: 'color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.color = '#fff'}
                            onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div style={{ padding: '1.5rem' }}>
                        {error && (
                            <div style={{ 
                                padding: '0.75rem', 
                                marginBottom: '1rem', 
                                fontSize: '0.875rem', 
                                color: '#fca5a5', 
                                background: 'rgba(239, 68, 68, 0.1)', 
                                border: '1px solid rgba(239, 68, 68, 0.2)', 
                                borderRadius: '0.5rem' 
                            }}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem', fontWeight: '500' }}>Display Name</label>
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your name"
                                    style={{ 
                                        width: '100%', 
                                        padding: '0.625rem 1rem', 
                                        borderRadius: '0.5rem',
                                        background: '#0f172a',
                                        border: '1px solid #334155',
                                        color: 'white',
                                        fontSize: '0.95rem',
                                        outline: 'none'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                    onBlur={(e) => e.target.style.borderColor = '#334155'}
                                    required
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                                <button 
                                    type="button" 
                                    onClick={onClose}
                                    style={{ 
                                        background: 'transparent', 
                                        border: '1px solid #475569', 
                                        color: '#cbd5e1', 
                                        padding: '0.5rem 1rem', 
                                        fontSize: '0.85rem', 
                                        cursor: 'pointer', 
                                        borderRadius: '0.5rem',
                                        fontWeight: '500'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '0.5rem', 
                                        padding: '0.5rem 1.25rem', 
                                        fontSize: '0.85rem', 
                                        cursor: 'pointer', 
                                        borderRadius: '0.5rem',
                                        background: '#3b82f6', 
                                        border: 'none',
                                        color: 'white',
                                        fontWeight: '500'
                                    }}
                                >
                                    {loading ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default EditProfileModal;
