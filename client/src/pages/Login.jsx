import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '../assets/logo.png';

const Login = () => {
    // Security: Use sessionStorage instead of localStorage for shared environment safety
    const [userId, setUserId] = useState(sessionStorage.getItem('savedUserId') || '');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Only redirect authenticated users who DON'T need to change their password
        if (user && !user.mustChangePassword) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        
        setLoading(true);
        setError('');
        
        try {
            const userData = await login(userId, password, rememberMe);
            
            if (rememberMe) {
                sessionStorage.setItem('savedUserId', userId);
            } else {
                sessionStorage.removeItem('savedUserId');
            }

            if (userData.mustChangePassword) {
                navigate('/reset-password');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="center-screen" style={{ background: 'radial-gradient(circle at top right, #27272a, #000000)' }}>
            <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="glass"
                style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', borderRadius: '1.5rem' }}
            >
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                    <img src={logo} alt="Logo" style={{ height: '60px', objectFit: 'contain' }} />
                </div>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', textAlign: 'center' }}>Welcome Back</h1>
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem' }}>P.C Bindal and Co.</p>

                {error && (
                    <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                    <div style={{ position: 'relative', marginBottom: '1rem' }}>
                        <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="User ID"
                            className="input-field"
                            style={{ paddingLeft: '3rem' }}
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            required
                            autoComplete="username"
                        />
                    </div>
                    <div style={{ position: 'relative', marginBottom: '2rem' }}>
                        <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="password"
                            placeholder="Password"
                            className="input-field"
                            style={{ paddingLeft: '3rem' }}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
                        <input 
                            type="checkbox" 
                            id="remember" 
                            checked={rememberMe} 
                            onChange={(e) => setRememberMe(e.target.checked)}
                            style={{ width: '1rem', height: '1rem', cursor: 'pointer', accentColor: '#ffffff' }}
                        />
                        <label htmlFor="remember" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', cursor: 'pointer' }}>
                            Remember Me
                        </label>
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
                            gap: '0.5rem',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Signing in...' : 'Sign In'} {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                    </button>
                    
                    <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                        <Link 
                            to="/terms" 
                            style={{ 
                                color: 'var(--text-muted)', 
                                fontSize: '0.85rem', 
                                textDecoration: 'none',
                                transition: 'color 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.color = '#cbd5e1'}
                            onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
                        >
                            Terms & Conditions
                        </Link>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default Login;
