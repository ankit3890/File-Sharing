import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AboutModal from './AboutModal';
import EditProfileModal from './EditProfileModal';
import { LayoutDashboard, Users, FileText, Settings, LogOut, Menu, Info, CalendarCheck, Edit2 } from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '../assets/logo.png';

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(window.innerWidth < 768);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [showAbout, setShowAbout] = useState(false);
    const [showEditProfile, setShowEditProfile] = useState(false);

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
        `flex items-center gap-3 p-3 rounded-lg mb-1 transition-colors ${isActive ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-slate-400 hover:bg-slate-800'}`;

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
            <EditProfileModal isOpen={showEditProfile} onClose={() => setShowEditProfile(false)} />

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
                    
                    <NavLink to="/attendance" className={navItemClass} style={navItemStyle} title="Attendance" onClick={handleNavClick}>
                        <CalendarCheck size={20} /> 
                        <span>Attendance</span>
                    </NavLink>

                    {/* Spacer for Hierarchy */}
                    <div style={{ height: '0.5rem' }} />

                    <NavLink to="/manage-space" className={navItemClass} style={navItemStyle} title="Manage Space" onClick={handleNavClick}>
                        <Settings size={20} /> 
                        <span>Manage Space</span>
                    </NavLink>

                    {user.role === 'admin' && (
                        <div style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
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
                        style={{ ...navItemStyle, background: 'none', border: 'none', cursor: 'pointer', width: '100%', marginTop: 'auto', paddingTop: '1rem' }}
                        title="About"
                    >
                        <Info size={20} />
                        <span>About </span>
                    </button>
                </nav>

                {/* Footer User Profile */}
                <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        {/* Avatar */}
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#27272a', border: '1px solid #3f3f46', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0, color: 'white', fontSize: '0.9rem' }}>
                            {user.userId.charAt(0).toUpperCase()}
                        </div>
                        
                        {/* Info Column */}
                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'white', lineHeight: '1.2', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                {user.name || 'Set Name'}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#a1a1aa', lineHeight: '1.2' }}>{user.userId}</span>
                            <div style={{ marginTop: '2px' }}>
                                <span style={{ 
                                    fontSize: '0.6rem', 
                                    textTransform: 'uppercase', 
                                    fontWeight: 'bold', 
                                    color: user.role === 'admin' ? '#fbbf24' : '#52525b',
                                    letterSpacing: '0.5px'
                                }}>
                                    {user.role}
                                </span>
                            </div>
                        </div>

                        {/* Edit Button (Right Aligned) */}
                        <button 
                            onClick={() => setShowEditProfile(true)}
                            style={{ 
                                marginLeft: 'auto',
                                background: 'transparent', 
                                border: 'none', 
                                padding: '6px', 
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '6px',
                                color: '#52525b',
                                transition: 'color 0.2s, background 0.2s'
                            }}
                            className="hover:bg-zinc-800 hover:text-white"
                            title="Edit Profile"
                        >
                            <Edit2 size={16} />
                        </button>
                    </div>

                    <button 
                        onClick={handleLogout} 
                        className="hover:bg-zinc-800 hover:text-white transition-colors"
                        style={{ 
                            width: '100%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.5rem', 
                            padding: '0.6rem', 
                            background: 'transparent', 
                            border: '1px solid #3f3f46', 
                            borderRadius: '0.5rem', 
                            color: '#a1a1aa', 
                            cursor: 'pointer', 
                            justifyContent: 'center', 
                            fontSize: '0.85rem',
                            fontWeight: '500'
                        }}
                    >
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
                <header style={{ padding: '1.75rem 2rem', background: 'var(--bg-dark)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem', position: 'sticky', top: 0, zIndex: 10 }}>
                    <button 
                        onClick={(e) => { e.stopPropagation(); setCollapsed(!collapsed); }}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                        title={collapsed ? "Open Menu" : "Close Menu"}
                    >
                        <Menu size={24} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <img src={logo} alt="Logo" style={{ height: '40px', objectFit: 'contain' }} />
                        {(!isMobile || collapsed) && <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>P.C Bindal and Co.</h1>}
                    </div>
                </header>
                <div style={{ padding: '2rem', flex: 1 }}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default Layout;
