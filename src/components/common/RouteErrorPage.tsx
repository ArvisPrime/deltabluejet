import React from 'react';
import { useRouteError, isRouteErrorResponse } from 'react-router';
import { BRAND } from '../../config/brand';

/**
 * Detect chunk / dynamic-import failures (stale deploy cache).
 */
function isChunkLoadError(error: unknown): boolean {
    if (error instanceof Error) {
        const msg = error.message?.toLowerCase() ?? '';
        return (
            msg.includes('failed to fetch dynamically imported module') ||
            msg.includes('loading chunk') ||
            msg.includes('loading css chunk') ||
            msg.includes('dynamically imported module')
        );
    }
    return false;
}

/**
 * Route-level error element for React Router.
 * Catches errors thrown in routes/loaders/actions that the class-based
 * ErrorBoundary in App.tsx cannot catch.
 *
 * Premium airline-branded design with two modes:
 *  - Chunk error → amber "Page Update Available" with auto-reload
 *  - Other error → red "Unexpected Turbulence"
 */
const RouteErrorPage: React.FC = () => {
    const error = useRouteError();

    const isChunk = isChunkLoadError(error);
    const is404 = isRouteErrorResponse(error) && error.status === 404;

    // Auto-reload once for chunk load errors
    React.useEffect(() => {
        if (isChunk) {
            const reloaded = sessionStorage.getItem('__db_chunk_retry');
            if (!reloaded) {
                sessionStorage.setItem('__db_chunk_retry', '1');
                window.location.reload();
            } else {
                sessionStorage.removeItem('__db_chunk_retry');
            }
        }
    }, [isChunk]);

    const handleRetry = () => window.location.reload();
    const handleGoHome = () => { window.location.href = '/'; };
    const handleGoBack = () => { window.history.back(); };

    // Resolve display text
    let heading = 'Unexpected Turbulence';
    let description = `We apologise for the inconvenience. ${BRAND.name} encountered a temporary issue. Please try again or return to the home page.`;
    let icon = 'flight_land';
    let iconGradient = 'linear-gradient(135deg, #ef4444, #dc2626)';
    let iconShadow = '0 12px 30px rgba(239,68,68,0.3)';

    if (isChunk) {
        heading = 'Page Update Available';
        description = `${BRAND.name} has been updated since your last visit. Please refresh to load the latest version.`;
        icon = 'sync_problem';
        iconGradient = 'linear-gradient(135deg, #f59e0b, #d97706)';
        iconShadow = '0 12px 30px rgba(245,158,11,0.3)';
    } else if (is404) {
        heading = 'Route Not Found';
        description = `The page you're looking for doesn't exist or has been moved. Please check the URL or return to the home page.`;
        icon = 'explore_off';
        iconGradient = 'linear-gradient(135deg, #6366f1, #4f46e5)';
        iconShadow = '0 12px 30px rgba(99,102,241,0.3)';
    }

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(160deg, #050d1d 0%, #0c1a36 40%, #111f42 100%)',
                fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
                color: '#e2e8f0',
                padding: '2rem',
                overflow: 'hidden',
                position: 'relative',
            }}
        >
            {/* Decorative background orbs */}
            <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-15%', left: '-5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

            <div
                style={{
                    maxWidth: '520px',
                    width: '100%',
                    textAlign: 'center',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '2rem',
                    padding: '3.5rem 2.5rem',
                    border: '1px solid rgba(255,255,255,0.06)',
                    backdropFilter: 'blur(20px)',
                    position: 'relative',
                    zIndex: 1,
                    boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
                }}
            >
                {/* Icon */}
                <div
                    style={{
                        width: '80px',
                        height: '80px',
                        margin: '0 auto 1.5rem',
                        borderRadius: '1.5rem',
                        background: iconGradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: iconShadow,
                    }}
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '2.25rem', color: '#fff', fontWeight: 700 }}>
                        {icon}
                    </span>
                </div>

                {/* Heading */}
                <h1
                    style={{
                        fontSize: '1.5rem',
                        fontWeight: 900,
                        margin: '0 0 0.5rem',
                        letterSpacing: '-0.03em',
                        lineHeight: 1.2,
                        textTransform: 'uppercase',
                        background: 'linear-gradient(135deg, #fff, #94a3b8)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}
                >
                    {heading}
                </h1>

                {/* Description */}
                <p
                    style={{
                        color: '#64748b',
                        fontSize: '0.85rem',
                        lineHeight: 1.7,
                        margin: '0 0 2rem',
                        maxWidth: '380px',
                        marginLeft: 'auto',
                        marginRight: 'auto',
                    }}
                >
                    {description}
                </p>

                {/* Action buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'stretch' }}>
                    <button
                        onClick={handleRetry}
                        style={{
                            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '1rem',
                            padding: '1rem 2rem',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                            letterSpacing: '0.15em',
                            transition: 'all 0.2s',
                            boxShadow: '0 8px 25px rgba(37,99,235,0.3)',
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 12px 30px rgba(37,99,235,0.4)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(37,99,235,0.3)';
                        }}
                    >
                        {isChunk ? '↻ Refresh Page' : '↻ Try Again'}
                    </button>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                            onClick={handleGoBack}
                            style={{
                                flex: 1,
                                background: 'rgba(255,255,255,0.06)',
                                color: '#94a3b8',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '1rem',
                                padding: '0.85rem 1.5rem',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                transition: 'all 0.2s',
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                                e.currentTarget.style.color = '#e2e8f0';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                                e.currentTarget.style.color = '#94a3b8';
                            }}
                        >
                            ← Go Back
                        </button>
                        <button
                            onClick={handleGoHome}
                            style={{
                                flex: 1,
                                background: 'rgba(255,255,255,0.06)',
                                color: '#94a3b8',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '1rem',
                                padding: '0.85rem 1.5rem',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                transition: 'all 0.2s',
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                                e.currentTarget.style.color = '#e2e8f0';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                                e.currentTarget.style.color = '#94a3b8';
                            }}
                        >
                            Home
                        </button>
                    </div>
                </div>

                {/* Brand footer */}
                <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <p style={{ fontSize: '0.65rem', color: '#475569', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, margin: 0 }}>
                        {BRAND.name} • Flight Operations
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RouteErrorPage;
