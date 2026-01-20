import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import AdminPanel from './pages/AdminPanel';
import Projects from './pages/Projects';
import ProjectView from './pages/ProjectView';
import ManageSpace from './pages/ManageSpace';
import Attendance from './pages/Attendance';
import Terms from './pages/Terms';
import ResetPassword from './pages/ResetPassword';

const AdminRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="center-screen">Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    
    // Strict enforcement: Direct to reset if needed
    if (user.mustChangePassword) return <Navigate to="/reset-password" />;
    
    if (user && user.role === 'admin') return children;
    return <Navigate to="/projects" />;
};

const ProtectedRoute = ({ children, forceAllowed }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="center-screen">Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    
    // Strict enforcement: Direct to reset if needed
    // Unless we are on the reset page itself (forceAllowed)
    if (user.mustChangePassword && !forceAllowed) return <Navigate to="/reset-password" />;
    
    return children;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/reset-password" element={
                        <ProtectedRoute forceAllowed={true}>
                            {/* We bypass the usual reset check inside ProtectedRoute for this specific path in App logic */}
                            <ResetPassword />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                        <Route index element={<Navigate to="/projects" />} />
                        <Route path="dashboard" element={<Navigate to="/projects" replace />} />
                        <Route path="projects" element={<Projects />} />
                        <Route path="projects/:id" element={<ProjectView />} />
                        <Route path="manage-space" element={<ManageSpace />} />
                        <Route path="attendance" element={<Attendance />} />
                        
                        <Route path="admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
                    </Route>
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
