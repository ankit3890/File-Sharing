import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ResetPasswordModal from './ResetPasswordModal';
import { LayoutDashboard, Users, FileText, Settings, LogOut, Menu } from 'lucide-react';
import { motion } from 'framer-motion';

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) return null;

    const navItemClass = ({ isActive }) => 
        `flex items-center gap-3 p-3 rounded-lg mb-1 transition-colors ${isActive ? 'bg-blue-600/10 text-blue-500' : 'text-slate-400 hover:bg-slate-800'}`;

    const navItemStyle = { 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.75rem', 
        padding: '0.75rem', 
        borderRadius: '0.5rem', 
        marginBottom: '0.25rem', 
        textDecoration: 'none', 
        color: 'inherit',
        justifyContent: collapsed ? 'center' : 'flex-start'
    };

    const handleNavClick = () => {
        if (!collapsed) setCollapsed(true);
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-dark)' }}>
            {/* Force Password Reset Overlay */}
            {user.mustChangePassword && <ResetPasswordModal user={user} />}

            {/* Sidebar */}
            <motion.aside 
                initial={{ width: '260px' }}
                animate={{ width: collapsed ? '80px' : '260px' }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                style={{ 
                    background: 'var(--bg-card)', 
                    borderRight: '1px solid var(--border)', 
                    display: 'flex', 
                    flexDirection: 'column',
                    overflow: 'hidden',
                    position: 'relative',
                    flexShrink: 0
                }}
            >
                {/* Header & Toggle */}
                <div style={{ padding: '2rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80px' }}>
                    <button 
                        onClick={() => setCollapsed(!collapsed)}
                        style={{ 
                            background: 'transparent', 
                            border: 'none', 
                            color: '#94a3b8', 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            // hover effect handled by css or standard browser behavior
                        }}
                        title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        <Menu size={24} />
                    </button>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <NavLink to="/projects" className={navItemClass} style={navItemStyle} title="Projects" onClick={handleNavClick}>
                        <FileText size={20} /> 
                        {!collapsed && <span>Projects</span>}
                    </NavLink>

                    <NavLink to="/manage-space" className={navItemClass} style={navItemStyle} title="Manage Space" onClick={handleNavClick}>
                        <Settings size={20} /> 
                        {!collapsed && <span>Manage Space</span>}
                    </NavLink>

                    {user.role === 'admin' && (
                        <div style={{ marginTop: '2rem', borderTop: collapsed ? '1px solid rgba(255,255,255,0.05)' : 'none', paddingTop: collapsed ? '1rem' : '0' }}>
                            {!collapsed && <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', paddingLeft: '0.75rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Admin</p>}
                            <NavLink to="/admin" className={navItemClass} style={navItemStyle} title="Admin Panel" onClick={handleNavClick}>
                                <Users size={20} /> 
                                {!collapsed && <span>Admin Panel</span>}
                            </NavLink>
                        </div>
                    )}
                </nav>

                {/* Footer User Profile */}
                <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', justifyContent: collapsed ? 'center' : 'flex-start' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>
                            {user.userId.charAt(0).toUpperCase()}
                        </div>
                        {!collapsed && (
                            <div style={{ minWidth: 0 }}>
                                <p style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.userId}</p>
                                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{user.role}</p>
                            </div>
                        )}
                    </div>
                    {!collapsed ? (
                        <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '0.5rem', color: '#94a3b8', cursor: 'pointer', justifyContent: 'center' }}>
                            <LogOut size={16} /> Logout
                        </button>
                    ) : (
                        <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="Logout">
                            <LogOut size={20} />
                        </button>
                    )}
                </div>
            </motion.aside>

            {/* Main Content */}
            <main 
                style={{ flex: 1, overflowY: 'auto' }}
                onClick={() => {
                    if (!collapsed) setCollapsed(true);
                }}
            >
                <header style={{ padding: '1.5rem 2rem', background: 'var(--bg-dark)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Workspace</h1>
                </header>
                <div style={{ padding: '2rem' }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
