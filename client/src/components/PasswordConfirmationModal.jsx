import React, { useState } from 'react';
import { Lock, X } from 'lucide-react';

const PasswordConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await onConfirm(password);
            // Don't close here, let parent close on success
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="glass" style={{ width: '100%', maxWidth: '400px', padding: '2rem', borderRadius: '1rem', position: 'relative' }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                    <X size={20} />
                </button>

                <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Lock className="text-red-500" size={24} /> 
                    {title || 'Confirm Action'}
                </h3>
                
                <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
                    {message || 'Please enter your password to continue.'}
                </p>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <input 
                            type="password" 
                            className="input-field"
                            placeholder="Current Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    
                    {error && <p className="text-red-500" style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button type="button" onClick={onClose} className="btn" style={{ flex: 1, background: '#334155' }}>Cancel</button>
                        <button type="submit" disabled={loading} className="btn" style={{ flex: 1, background: '#ef4444' }}>
                            {loading ? 'Verifying...' : 'Confirm'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PasswordConfirmationModal;
