import React, { useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const ResetPasswordModal = ({ user }) => {
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const { updateUserLocal } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirm) return setError("Passwords don't match");
        if (password.length < 6) return setError("Password too short");

        try {
            const res = await api.put('/auth/change-password', {
                currentPassword: '123', // Default for first login
                newPassword: password
            });
            updateUserLocal({ mustChangePassword: false, mustChangePassword_Completed: true });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update password');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)'}}>
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="glass p-8 rounded-xl max-w-md w-full"
                style={{ background: '#1e293b', padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.1)' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                        <Lock color="#3b82f6" size={30} />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Security Update Required</h2>
                    <p style={{ color: '#94a3b8' }}>Please set a new secure password to continue.</p>
                </div>

                {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        placeholder="New Password"
                        className="input-field"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Confirm Password"
                        className="input-field"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                    />
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                        Update Password
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default ResetPasswordModal;
