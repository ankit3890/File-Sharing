import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AboutModal from './AboutModal';
import { LayoutDashboard, Users, FileText, Settings, LogOut, Menu, Info, CalendarCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(window.innerWidth < 768);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [showAbout, setShowAbout] = useState(false);

    React.useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile) setCollapsed(true);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
        justifyContent: (collapsed && !isMobile) ? 'center' : 'flex-start'
    };

    const handleNavClick = () => {
        setCollapsed(true);
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-dark)' }}>
            <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />

            {/* Sidebar Overlay for Mobile */}
            {isMobile && !collapsed && (
                <div 
                    onClick={() => setCollapsed(true)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
                />
            )}

            {/* Sidebar */}
            <motion.aside 
                initial={false}
                animate={{ 
                    width: collapsed ? 0 : '260px',
                    translateX: isMobile && collapsed ? '-100%' : '0%'
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                style={{ 
                    background: 'var(--bg-card)', 
                    borderRight: '1px solid var(--border)', 
                    display: 'flex', 
                    flexDirection: 'column',
                    overflow: 'hidden',
                    position: isMobile ? 'fixed' : 'sticky',
                    top: 0,
                    height: '100vh',
                    flexShrink: 0,
                    zIndex: 50
                }}
            >
                {/* Nav */}
                <nav style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', scrollbarWidth: 'none', whiteSpace: 'nowrap' }}>
                    <NavLink to="/dashboard" className={navItemClass} style={navItemStyle} title="Dashboard" onClick={handleNavClick}>
                        <LayoutDashboard size={20} /> 
                        <span>Dashboard</span>
                    </NavLink>
                    <NavLink to="/projects" className={navItemClass} style={navItemStyle} title="Projects" onClick={handleNavClick}>
                        <FileText size={20} /> 
                        <span>Projects</span>
                    </NavLink>

                    <NavLink to="/manage-space" className={navItemClass} style={navItemStyle} title="Manage Space" onClick={handleNavClick}>
                        <Settings size={20} /> 
                        <span>Manage Space</span>
                    </NavLink>

                    <NavLink to="/attendance" className={navItemClass} style={navItemStyle} title="Attendance" onClick={handleNavClick}>
                        <CalendarCheck size={20} /> 
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span>Attendance</span>
                            <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Track and manage daily attendance</span>
                        </div>
                    </NavLink>

                    {user.role === 'admin' && (
                        <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                            <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', paddingLeft: '0.75rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>Admin</p>
                            <NavLink to="/admin" className={navItemClass} style={navItemStyle} title="Admin Panel" onClick={handleNavClick}>
                                <Users size={20} /> 
                                <span>Admin Panel</span>
                            </NavLink>
                        </div>
                    )}
                    
                    <button 
                        onClick={() => { setShowAbout(true); handleNavClick(); }} 
                        className={navItemClass} 
                        style={{ ...navItemStyle, background: 'none', border: 'none', cursor: 'pointer', width: '100%', marginTop: 'auto' }}
                        title="About"
                    >
                        <Info size={20} />
                        <span>About </span>
                    </button>
                </nav>

                {/* Footer User Profile */}
                <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>
                            {user.userId.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.userId}</p>
                            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{user.role}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '0.5rem', color: '#94a3b8', cursor: 'pointer', justifyContent: 'center' }}>
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main 
                style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
                onClick={() => {
                    if (!collapsed) setCollapsed(true);
                }}
            >
                <header style={{ padding: '1.5rem 2rem', background: 'var(--bg-dark)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem', position: 'sticky', top: 0, zIndex: 10 }}>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setCollapsed(!collapsed); }}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                        title={collapsed ? "Open Menu" : "Close Menu"}
                    >
                        <Menu size={24} />
                    </button>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>P.C Bindal and Co.</h1>
                </header>
                <div style={{ padding: '2rem', flex: 1 }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
