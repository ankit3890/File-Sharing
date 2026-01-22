import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const ResetPassword = () => {
    const { user, updateUserLocal, logout } = useAuth();
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (user && !user.mustChangePassword) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (password !== confirm) return setError("Passwords don't match");
        if (password.length < 6) return setError("Password must be at least 6 characters");
        if (password === '123') return setError("Please choose a password different from the default");

        setLoading(true);
        try {
            const res = await api.put('/auth/change-password', {
                currentPassword: '123', // Default for first login
                newPassword: password,
                name: name
            });
            
            updateUserLocal({ 
                mustChangePassword: false,
                ...res.data // Sync other data just in case
            });
            
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update password. Ensure you are using the default "123" as target.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="center-screen" style={{ background: 'radial-gradient(circle at top right, #1e1b4b, #0f172a)' }}>
            <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="glass"
                style={{ width: '100%', maxWidth: '450px', padding: '3rem', borderRadius: '1.5rem' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', width: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                        <ShieldCheck color="#3b82f6" size={40} />
                    </div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Security Required</h1>
                    <p style={{ color: '#94a3b8' }}>For your security, you must change your default password before accessing the workspace.</p>
                </div>

                {error && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Your Name (e.g. Ankit)"
                            className="input-field"
                            style={{ paddingLeft: '3rem' }}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                        <input
                            type="password"
                            placeholder="New Secure Password"
                            className="input-field"
                            style={{ paddingLeft: '3rem' }}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                        <input
                            type="password"
                            placeholder="Confirm Password"
                            className="input-field"
                            style={{ paddingLeft: '3rem' }}
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            required
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="btn btn-primary" 
                        style={{ 
                            width: '100%', 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center', 
                            gap: '0.75rem',
                            marginTop: '1rem',
                            height: '3.5rem',
                            fontSize: '1.1rem'
                        }}
                    >
                        {loading ? 'Updating...' : 'Set New Password'} <ArrowRight size={20} />
                    </button>

                    <button 
                        type="button"
                        onClick={logout}
                        style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '0.9rem', cursor: 'pointer', marginTop: '1rem', textDecoration: 'underline' }}
                    >
                        Cancel and Logout
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default ResetPassword;
