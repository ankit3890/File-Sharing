import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import AdminPanel from './pages/AdminPanel';
import Projects from './pages/Projects';
import ProjectView from './pages/ProjectView';
import ManageSpace from './pages/ManageSpace';
import Terms from './pages/Terms';

const AdminRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="center-screen">Loading...</div>;
    if (user && user.role === 'admin') return children;
    return <Navigate to="/projects" />;
};

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div className="center-screen">Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    return children;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/terms" element={<Terms />} />
                    
                    <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                        <Route index element={<Navigate to="/projects" />} />
                        <Route path="dashboard" element={<Navigate to="/projects" replace />} />
                        <Route path="projects" element={<Projects />} />
                        <Route path="projects/:id" element={<ProjectView />} />
                        <Route path="manage-space" element={<ManageSpace />} />
                        
                        <Route path="admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
                    </Route>
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
