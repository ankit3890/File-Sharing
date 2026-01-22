import React from 'react';

const SkeletonLoader = ({ mode = 'full' }) => {
    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', background: 'var(--bg-dark)', overflow: 'hidden' }}>
            {/* Sidebar Skeleton */}
            <div style={{ width: '250px', borderRight: '1px solid rgba(255,255,255,0.1)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Logo Area */}
                <div className="shimmer" style={{ width: '70%', height: '32px', borderRadius: '8px' }}></div>
                
                {/* Nav Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="shimmer" style={{ width: '100%', height: '40px', borderRadius: '8px', opacity: 0.6 }}></div>
                    ))}
                </div>

                {/* Bottom Profile Area */}
                <div style={{ marginTop: 'auto', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="shimmer" style={{ width: '40px', height: '40px', borderRadius: '50%' }}></div>
                    <div className="shimmer" style={{ width: '60%', height: '20px', borderRadius: '4px' }}></div>
                </div>
            </div>

            {/* Main Content Skeleton */}
            <div style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="shimmer" style={{ width: '200px', height: '40px', borderRadius: '8px' }}></div>
                    <div className="shimmer" style={{ width: '120px', height: '40px', borderRadius: '8px' }}></div>
                </div>

                {/* Grid Content */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="shimmer" style={{ height: '180px', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}></div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SkeletonLoader;
