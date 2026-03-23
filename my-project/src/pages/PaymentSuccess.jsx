import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PaymentSuccess() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('verifying'); // verifying | success | failed
    const [subscriptionData, setSubscriptionData] = useState(null);
    const { refreshUser } = useAuth();
    const token = localStorage.getItem('token');
    const navigate = useNavigate();

    useEffect(() => {
        const orderId = searchParams.get('order_id') || searchParams.get('orderId');

        if (!orderId) {
            setStatus('failed');
            return;
        }

        const verify = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                const res = await fetch(`${apiUrl}/subscription/verify/${orderId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();

                if (data.success && data.verified) {
                    setStatus('success');
                    setSubscriptionData(data.subscription);
                    if (refreshUser) refreshUser(); // update auth context with new plan
                } else {
                    setStatus('failed');
                }
            } catch {
                setStatus('failed');
            }
        };

        verify();
    }, [searchParams, token]); // eslint-disable-line

    const periodEnd = subscriptionData?.currentPeriodEnd
        ? new Date(subscriptionData.currentPeriodEnd).toLocaleDateString('en-EG', {
              year: 'numeric', month: 'long', day: 'numeric',
          })
        : '';

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                {status === 'verifying' && (
                    <>
                        <div style={styles.spinner} />
                        <h2 style={styles.title}>Verifying your payment…</h2>
                        <p style={styles.subtitle}>Please wait, do not close this page.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div style={styles.successIcon}>🎉</div>
                        <h2 style={styles.title}>Welcome to Premium!</h2>
                        <p style={styles.subtitle}>
                            Your subscription is active
                            {periodEnd ? ` until <strong>${periodEnd}</strong>` : ''}.
                            Enjoy all premium features — no ads, unlimited habits, and more.
                        </p>
                        <div style={styles.perks}>
                            <span>✨ No Ads</span>
                            <span>♾️ Unlimited Habits</span>
                            <span>📊 Advanced Analytics</span>
                            <span>🏆 Premium Badge</span>
                        </div>
                        <button style={styles.btn} onClick={() => navigate('/dashboard')}>
                            Go to Dashboard
                        </button>
                    </>
                )}

                {status === 'failed' && (
                    <>
                        <div style={styles.failIcon}>❌</div>
                        <h2 style={styles.title}>Payment Not Confirmed</h2>
                        <p style={styles.subtitle}>
                            We couldn't verify your payment. If you were charged, please contact support.
                            Your order may still be processing — check back in a few minutes.
                        </p>
                        <div style={styles.btnRow}>
                            <button style={styles.btn} onClick={() => navigate('/pricing')}>
                                Try Again
                            </button>
                            <Link to="/dashboard" style={styles.link}>Back to Dashboard</Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
        fontFamily: "'Inter', sans-serif",
        padding: '2rem',
    },
    card: {
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px',
        padding: '3rem 2.5rem',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
    },
    title: { color: '#fff', fontSize: '1.8rem', fontWeight: 700, margin: '1rem 0 0.5rem' },
    subtitle: { color: 'rgba(255,255,255,0.65)', fontSize: '1rem', lineHeight: 1.6 },
    successIcon: { fontSize: '4rem', animation: 'pop 0.5s ease' },
    failIcon: { fontSize: '4rem' },
    perks: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
        justifyContent: 'center',
        margin: '1.5rem 0',
    },
    btn: {
        background: 'linear-gradient(135deg, #6c63ff, #a855f7)',
        color: '#fff',
        border: 'none',
        borderRadius: '12px',
        padding: '0.85rem 2rem',
        fontSize: '1rem',
        fontWeight: 600,
        cursor: 'pointer',
        marginTop: '1rem',
        width: '100%',
    },
    btnRow: { display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' },
    link: { color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', textDecoration: 'underline' },
    spinner: {
        width: '48px',
        height: '48px',
        border: '4px solid rgba(255,255,255,0.1)',
        borderTop: '4px solid #a855f7',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        margin: '0 auto 1rem',
    },
};
