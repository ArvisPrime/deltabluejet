import React from 'react';
import { Link } from 'react-router';
import { BRAND } from '../../config/brand';
import { ROUTES } from '../../config/routes';

/**
 * 404 — Not Found page.
 * Shown when the user navigates to an undefined route.
 */
const NotFound: React.FC = () => (
    <div
        style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0a1628 0%, #1a2a4a 100%)',
            fontFamily: "'Inter', system-ui, sans-serif",
            color: '#e2e8f0',
            padding: '2rem',
        }}
    >
        <div
            style={{
                maxWidth: '480px',
                textAlign: 'center',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '16px',
                padding: '3rem 2rem',
                border: '1px solid rgba(255,255,255,0.1)',
            }}
        >
            <div style={{ fontSize: '4rem', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '0.5rem' }}>
                404
            </div>

            <h1
                style={{
                    fontSize: '1.3rem',
                    fontWeight: 700,
                    margin: '0 0 0.75rem',
                    letterSpacing: '-0.02em',
                }}
            >
                Page Not Found
            </h1>

            <p
                style={{
                    color: '#94a3b8',
                    fontSize: '0.9rem',
                    lineHeight: 1.6,
                    margin: '0 0 2rem',
                }}
            >
                The page you're looking for doesn't exist or has been moved.
                <br />
                Let's get you back on course.
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link
                    to={ROUTES.HOME}
                    style={{
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.75rem 1.5rem',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                        cursor: 'pointer',
                    }}
                >
                    Go Home
                </Link>
                <Link
                    to={ROUTES.FLIGHT_SEARCH}
                    style={{
                        background: 'rgba(255,255,255,0.1)',
                        color: '#e2e8f0',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        padding: '0.75rem 1.5rem',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        textDecoration: 'none',
                        cursor: 'pointer',
                    }}
                >
                    Search Flights
                </Link>
            </div>

            <p
                style={{
                    color: '#475569',
                    fontSize: '0.75rem',
                    marginTop: '2rem',
                }}
            >
                {BRAND.copyright}
            </p>
        </div>
    </div>
);

export default NotFound;
