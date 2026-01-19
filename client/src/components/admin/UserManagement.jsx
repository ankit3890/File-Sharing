import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Trash2, UserPlus, User } from 'lucide-react';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/users', { userId: newUser });
            setNewUser('');
            fetchUsers();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to add user');
        }
    };

    const handleDeleteUser = async (id) => {
        if (window.confirm('Are you sure? This will delete all their files!')) {
            try {
                await api.delete(`/users/${id}`);
                fetchUsers();
            } catch (error) {
                alert('Failed to delete user');
            }
        }
    };

    const handleImpersonate = async (id) => {
        // Not implemented in UI yet
        // await impersonate(id);
        // navigate('/dashboard');
        alert("Impersonation feature ready pending UI integration");
    };

    return (
        <div style={{ color: 'white' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>User Management</h3>
            
            <form onSubmit={handleAddUser} style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
                <input 
                    type="text" 
                    value={newUser} 
                    onChange={(e) => setNewUser(e.target.value)} 
                    placeholder="New User ID" 
                    className="input-field" 
                    style={{ marginBottom: 0, width: '300px' }}
                />
                <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <UserPlus size={18} /> Add User
                </button>
            </form>

            <div className="glass" style={{ padding: '1rem', borderRadius: '0.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', color: '#94a3b8' }}>
                            <th style={{ padding: '1rem' }}>User ID</th>
                            <th style={{ padding: '1rem' }}>Role</th>
                            <th style={{ padding: '1rem' }}>Storage</th>
                            <th style={{ padding: '1rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user._id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}><User size={16} /></div>
                                    {user.userId}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ padding: '0.25rem 0.75rem', borderRadius: '1rem', background: user.role === 'admin' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.1)', color: user.role === 'admin' ? '#60a5fa' : 'white', fontSize: '0.8rem' }}>
                                        {user.role}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>{(user.storageUsed / 1024 / 1024).toFixed(2)} MB</td>
                                <td style={{ padding: '1rem' }}>
                                    {user.role !== 'admin' && (
                                        <button onClick={() => handleDeleteUser(user._id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem', borderRadius: '0.25rem' }}>
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManagement;
