import React from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import UserDashboard from './UserDashboard';

const Dashboard = () => {
    const { user } = useAuth();
    
    // Safety check, though ProtectedRoute should handle this
    if (!user) return null;

    return user.role === 'admin' ? <AdminDashboard /> : <UserDashboard />;
};

export default Dashboard;
