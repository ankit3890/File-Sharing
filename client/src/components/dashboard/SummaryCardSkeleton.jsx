import React from 'react';

const SummaryCardSkeleton = () => {
    return (
        <div
            className="glass"
            style={{
                padding: '1.25rem',
                borderRadius: '1rem',
                height: '110px',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
            }}
        >
            <div className="skeleton-line" style={{ width: '40%' }} />
            <div className="skeleton-line" style={{ width: '60%', height: '28px' }} />
            <div className="skeleton-line" style={{ width: '50%' }} />
        </div>
    );
};

export default SummaryCardSkeleton;
