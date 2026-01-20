import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Lock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
    const [userId, setUserId] = useState(localStorage.getItem('savedUserId') || '');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [error, setError] = useState('');
    const { login, user } = useAuth();
    const navigate = useNavigate();

    React.useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login(userId, password, rememberMe);
            
            if (rememberMe) {
                localStorage.setItem('savedUserId', userId);
            } else {
                localStorage.removeItem('savedUserId');
            }

            if (userData.mustChangePassword) {
                navigate('/reset-password');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="center-screen" style={{ background: 'radial-gradient(circle at top right, #1e1b4b, #0f172a)' }}>
            <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="glass"
                style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', borderRadius: '1.5rem' }}
            >
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', textAlign: 'center' }}>Welcome Back</h1>
                <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: '2rem' }}>P.C Bindal and Co.</p>

                {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={{ position: 'relative', marginBottom: '1rem' }}>
                        <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="User ID"
                            className="input-field"
                            style={{ paddingLeft: '3rem' }}
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            required
                        />
                    </div>
                    <div style={{ position: 'relative', marginBottom: '2rem' }}>
                        <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                        <input
                            type="password"
                            placeholder="Password"
                            className="input-field"
                            style={{ paddingLeft: '3rem' }}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
                        <input 
                            type="checkbox" 
                            id="remember" 
                            checked={rememberMe} 
                            onChange={(e) => setRememberMe(e.target.checked)}
                            style={{ width: '1rem', height: '1rem', cursor: 'pointer', accentColor: '#3b82f6' }}
                        />
                        <label htmlFor="remember" style={{ color: '#cbd5e1', fontSize: '0.9rem', cursor: 'pointer' }}>
                            Remember Me
                        </label>
                    </div>

                    <button 
                        type="submit" 
                        className="btn btn-primary" 
                        style={{ 
                            width: '100%', 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center', 
                            gap: '0.5rem',
                            cursor: 'pointer'
                        }}
                    >
                        Sign In <ArrowRight size={18} />
                    </button>
                </form>
            </motion.div>
        </div>
    );
};

export default Login;
