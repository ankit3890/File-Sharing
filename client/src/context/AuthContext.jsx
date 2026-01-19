import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (userId, password) => {
        const res = await api.post('/auth/login', { userId, password });
        const { token, ...userData } = res.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        return userData;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
    };

    const updateUserLocal = (newData) => {
        const updatedUser = { ...user, ...newData };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
    };

    const impersonate = async (targetUserId) => {
        const res = await api.post('/admin/impersonate', { userId: targetUserId });
        const { token, ...userData } = res.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
    };

    const refreshUser = async () => {
        try {
            const res = await api.get('/auth/me');
            updateUserLocal(res.data);
            return res.data;
        } catch (err) {
            console.error('Failed to refresh user:', err);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, updateUserLocal, impersonate, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};
