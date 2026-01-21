import React from 'react';
import { motion } from 'framer-motion';

const SummaryCard = ({ title, value, subtext, icon: Icon, color, onClick }) => {
    return (
        <motion.div
            whileHover={{ y: onClick ? -8 : -5, scale: onClick ? 1.02 : 1 }}
            whileTap={{ scale: onClick ? 0.98 : 1 }}
            className="glass summary-card"
            onClick={onClick}
            style={{
                padding: '1.25rem',
                borderRadius: '1rem',
                borderTop: `4px solid ${color}`,
                background: `linear-gradient(145deg, ${color}10 0%, rgba(255,255,255,0.01) 100%)`,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                flex: 1,
                cursor: onClick ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                boxShadow: onClick ? `0 4px 6px -1px ${color}10, 0 2px 4px -1px ${color}05` : 'none',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.025em' }}>{title}</span>
                <div style={{ padding: '0.4rem', borderRadius: '0.5rem', background: `${color}15` }}>
                    <Icon size={18} color={color} />
                </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'white', lineHeight: 1.2 }}>{value}</h3>
                {subtext && <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>{subtext}</span>}
            </div>
        </motion.div>
    );
};

export default SummaryCard;
