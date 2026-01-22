import React from 'react';
import { motion } from 'framer-motion';

const SummaryCard = ({ title, value, subtext, icon: Icon, color, onClick }) => {
    return (
        <motion.div
            whileHover={{ y: onClick ? -8 : -5, scale: onClick ? 1.02 : 1 }}
            whileTap={{ scale: onClick ? 0.98 : 1 }}
            className="glass summary-card-inner"
            onClick={onClick}
            style={{
                borderTop: `4px solid ${color}`,
                background: `linear-gradient(145deg, ${color}10 0%, rgba(255,255,255,0.01) 100%)`,
                cursor: onClick ? 'pointer' : 'default',
                boxShadow: onClick ? `0 4px 6px -1px ${color}10, 0 2px 4px -1px ${color}05` : 'none',
            }}
        >
            <div className="summary-card-header">
                <span className="summary-card-title">{title}</span>
                <div className="summary-card-icon" style={{ background: `${color}15` }}>
                    <Icon size={18} color={color} />
                </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                <h3 className="summary-card-value">{value}</h3>
                {subtext && <span className="summary-card-subtext">{subtext}</span>}
            </div>
        </motion.div>
    );
};

export default SummaryCard;
