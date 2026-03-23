import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import './Pricing.css';

const FEATURES = [
    { label: 'Daily Progress Circle', free: true, premium: true },
    { label: 'Task Management', free: 'Basic', premium: 'Advanced' },
    { label: 'Neural Immersion (Video)', free: false, premium: 'Full Ecosystem' },
    { label: 'Focus Clock Protocols', free: 'Pomodoro & Flow', premium: 'All Advanced Protocols' },
    { label: 'Streak Tracking', free: 'Basic', premium: 'Advanced analytics' },
    { label: 'Habit Tracking', free: '5 habits max', premium: 'Unlimited habits' },
    { label: 'Habit Categories', free: false, premium: true },
    { label: 'Progress Statistics', free: 'Basic', premium: 'Detailed charts' },
    { label: 'Reminders', free: false, premium: 'Smart reminders' },
    { label: 'Data Export (PDF)', free: false, premium: true },
    { label: 'Themes / Customization', free: false, premium: true },
    { label: 'AI Habit Insights', free: false, premium: true },
    { label: 'Premium Profile Badge', free: false, premium: true },
    { label: 'Priority Support', free: false, premium: true },
    { label: 'Ads', free: 'Google AdSense ads', premium: 'No ads' },
];

const FeatureValue = ({ value, isPremium }) => {
    if (value === true) return <span className="feat-check">✓</span>;
    if (value === false) return <span className="feat-cross">✕</span>;
    return <span className={`feat-text ${isPremium ? 'feat-premium' : 'feat-free'}`}>{value}</span>;
};

export default function Pricing() {
    const [cycle, setCycle] = useState('monthly');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [promoCode, setPromoCode] = useState('');
    const [loadingPromo, setLoadingPromo] = useState(false);
    const [promoMessage, setPromoMessage] = useState('');
    const [monthlyPrice, setMonthlyPrice] = useState(149);
    const [yearlyPrice, setYearlyPrice] = useState(1299);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [copiedMethod, setCopiedMethod] = useState('');
    const { user, refreshUser } = useAuth();
    const token = localStorage.getItem('token');
    const navigate = useNavigate();

    const INSTAPAY_HANDLE = "progresscircle@instapay"; // Placeholder, change as needed
    const TELDA_HANDLE = "@progresscircle"; // Placeholder, change as needed
    const INSTAGRAM_URL = "https://instagram.com/progress_circle"; // Placeholder

    useEffect(() => {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        fetch(`${apiUrl}/subscription/pricing`)
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    setMonthlyPrice(Math.round(data.monthlyPriceCents / 100));
                    setYearlyPrice(Math.round(data.yearlyPriceCents / 100));
                }
            })
            .catch(() => { });
    }, []);

    const yearlyPerMonth = (yearlyPrice / 12).toFixed(0);
    const savings = Math.round(((monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12)) * 100);

    const handleUpgradeClick = () => {
        if (!user) { navigate('/login'); return; }
        setShowPaymentModal(true);
    };

    const copyToClipboard = (text, method) => {
        navigator.clipboard.writeText(text);
        setCopiedMethod(method);
        toast.success(`${method} handle copied to clipboard!`);
        setTimeout(() => setCopiedMethod(''), 2000);
    };

    const handleCancelSubscription = async () => {
        if (!window.confirm('Are you sure you want to cancel your Premium subscription? You will lose access to premium features at the end of your billing cycle.')) {
            return;
        }

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const res = await fetch(`${apiUrl}/subscription/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message || 'Failed to cancel subscription.');

            toast.success(data.message);
            await refreshUser();
        } catch (err) {
            toast.error(err.message);
        }
    };

    const handleRedeemPromo = async () => {
        if (!promoCode) return;
        setLoadingPromo(true);
        setPromoMessage('');
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const res = await fetch(`${apiUrl}/users/redeem-promo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ code: promoCode }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message || 'Failed to redeem promo code');
            setPromoMessage(data.message);
            toast.success(data.message);
            await refreshUser();
        } catch (err) {
            setPromoMessage(err.message);
            toast.error(err.message);
        } finally {
            setLoadingPromo(false);
        }
    };

    const handleRemovePromo = async () => {
        if (loadingPromo) return;
        setLoadingPromo(true);
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
            const res = await fetch(`${apiUrl}/users/remove-promo`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message || 'Failed to remove promo');
            toast.success('Promo discount removed.');
            await refreshUser();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoadingPromo(false);
        }
    };

    return (
        <div className="pricing-page">
            <div className="pricing-hero">
                <span className="pricing-badge">💎 Go Premium</span>
                <h1>Unlock Your Full Potential</h1>
                <p>Choose the plan that powers your productivity journey.</p>

                <div className="billing-toggle">
                    <button
                        className={cycle === 'monthly' ? 'active' : ''}
                        onClick={() => setCycle('monthly')}
                    >Monthly</button>
                    <button
                        className={cycle === 'yearly' ? 'active' : ''}
                        onClick={() => setCycle('yearly')}
                    >
                        Yearly
                        <span className="savings-chip">Save {savings}%</span>
                    </button>
                </div>
            </div>

            <div className="pricing-cards">
                {/* Free Card */}
                <div className="pricing-card free-card">
                    <div className="card-header">
                        <span className="plan-icon">🌱</span>
                        <h2>Free</h2>
                        <p className="plan-desc">Great for getting started</p>
                    </div>
                    <div className="price-display">
                        <span className="price-amount">0</span>
                        <span className="price-currency">EGP</span>
                        <span className="price-period">/ forever</span>
                    </div>
                    <button className="cta-btn free-btn" onClick={() => navigate('/dashboard')}>
                        Get Started Free
                    </button>
                    <ul className="feature-list">
                        {FEATURES.map((f) => (
                            <li key={f.label} className={!f.free ? 'feat-unavailable' : ''}>
                                <FeatureValue value={f.free} isPremium={false} />
                                <span className="feat-label">{f.label}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Premium Card */}
                <div className="pricing-card premium-card">
                    <div className="popular-badge">Most Popular</div>
                    <div className="card-header">
                        <span className="plan-icon">⭐</span>
                        <h2>Premium</h2>
                        <p className="plan-desc">For serious achievers</p>
                    </div>
                    <div className="price-display">
                        <span className="price-amount">
                            {cycle === 'monthly' ? monthlyPrice : yearlyPerMonth}
                        </span>
                        <span className="price-currency">EGP</span>
                        <span className="price-period">/ month</span>
                    </div>
                    {cycle === 'yearly' && (
                        <p className="yearly-note">Billed annually ({yearlyPrice} EGP/year)</p>
                    )}

                    {user?.plan === 'premium' ? (
                        <div className="premium-active-state">
                            <div className="premium-badge-large">
                                💎 {user?.subscription?.status === 'cancelled' ? 'Cancelled Subscription' : 'Active Subscription'}
                            </div>

                            {user?.subscription && (user.subscription.status === 'active' || user.subscription.status === 'cancelled') ? (
                                <div className="subscription-details">
                                    <p>
                                        {user.subscription.status === 'cancelled'
                                            ? 'Your subscription is cancelled but remains active until the end of the billing period.'
                                            : 'Your subscription is active.'}
                                    </p>
                                    {user.subscription.currentPeriodEnd && (
                                        <p className="renewal-date">
                                            {user.subscription.status === 'cancelled' ? 'Ends on:' : 'Renews on:'} <strong>{new Date(user.subscription.currentPeriodEnd).toLocaleDateString()}</strong>
                                        </p>
                                    )}
                                    {user.subscription.status === 'active' && (
                                        <button
                                            className="cancel-btn"
                                            onClick={handleCancelSubscription}
                                        >
                                            Cancel Subscription
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="subscription-details">
                                    <p>You have lifetime premium access.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            {user?.subscriptionPriceOverrideCents && (
                                <div style={{
                                    background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.1))',
                                    border: '1px solid rgba(34,197,94,0.3)',
                                    borderRadius: '12px',
                                    padding: '12px 16px',
                                    marginBottom: '12px',
                                    position: 'relative',
                                    textAlign: 'center'
                                }}>
                                    <button
                                        onClick={handleRemovePromo}
                                        style={{
                                            position: 'absolute',
                                            top: '8px',
                                            right: '8px',
                                            background: 'rgba(255,255,255,0.1)',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '20px',
                                            height: '20px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#ef4444',
                                            fontSize: '14px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer'
                                        }}
                                        title="Remove promo"
                                    >
                                        ×
                                    </button>
                                    <p style={{ color: '#4ade80', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
                                        🎉 Promo Applied!
                                    </p>
                                    <p style={{ color: 'white', fontSize: '20px', fontWeight: 900 }}>
                                        {Math.round(user.subscriptionPriceOverrideCents / 100)} EGP
                                        <span style={{ color: '#9ca3af', fontSize: '12px', fontWeight: 500, marginLeft: '6px' }}>one-time</span>
                                    </p>
                                </div>
                            )}
                            <button
                                className="cta-btn premium-btn"
                                onClick={handleUpgradeClick}
                                style={{
                                    background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                                    boxShadow: '0 0 20px rgba(168,85,247,0.4)'
                                }}
                            >
                                Upgrade Premium
                            </button>
                            <p className="payment-note" style={{ opacity: 0.7, marginTop: '12px' }}>🔒 Manual Secure Payment · Cancel anytime</p>
                        </>
                    )}

                    <ul className="feature-list">
                        {FEATURES.map((f) => (
                            <li key={f.label}>
                                <FeatureValue value={f.premium} isPremium={true} />
                                <span className="feat-label">{f.label}</span>
                            </li>
                        ))}
                    </ul>

                    {/* Promo Code Redemption Section */}
                    {user && user.plan !== 'premium' && (
                        <div className="promo-code-section mt-6 p-4 border border-indigo-500/20 rounded-xl bg-indigo-500/5">
                            <h4 className="text-sm font-black text-indigo-400 mb-2 uppercase tracking-widest text-center">Have a Promo Code?</h4>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Enter Code"
                                    value={promoCode}
                                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none uppercase"
                                />
                                <button
                                    onClick={handleRedeemPromo}
                                    disabled={!promoCode || loadingPromo}
                                    className="px-4 py-2 bg-indigo-500 text-white font-bold rounded-lg text-sm hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                                >
                                    {loadingPromo ? '...' : 'Redeem'}
                                </button>
                            </div>
                            {promoMessage && (
                                <p className={`text-xs text-center mt-2 ${promoMessage.includes('Wait') || promoMessage.includes('Invalid') || promoMessage.includes('expired') || promoMessage.includes('usage') || promoMessage.includes('already') ? 'text-red-400' : 'text-green-400'}`}>
                                    {promoMessage}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="pricing-footer">
                <p>🔒 Manual Payment Process · Guaranteed secure unlocks</p>
            </div>

            {/* Manual Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div 
                        className="bg-[#111318] p-8 w-full max-w-md rounded-3xl relative overflow-hidden"
                        style={{ boxShadow: '0 0 40px rgba(0,0,0,0.8), inset 0 1px 1px rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                        {/* Glow effects */}
                        <div className="absolute -left-20 -top-20 w-40 h-40 bg-purple-500/10 blur-[60px] pointer-events-none"></div>
                        <div className="absolute -right-20 -bottom-20 w-40 h-40 bg-indigo-500/10 blur-[60px] pointer-events-none"></div>

                        <div className="relative z-10">
                            <h3 className="text-2xl font-black mb-2 text-white tracking-tight">Unlock Premium</h3>
                            <p className="text-sm text-white/60 mb-8 font-medium leading-relaxed">
                                Transfer <strong className="text-white">{cycle === 'monthly' ? monthlyPrice : yearlyPrice} EGP</strong> to either method below, then send us a screenshot on Instagram to instantly receive your unlock Promo Code.
                            </p>

                            <div className="space-y-4 mb-8">
                                {/* Instapay Card */}
                                <div className="p-4 rounded-2xl bg-white/5 border border-purple-500/20 hover:border-purple-500/40 transition-colors backdrop-blur-sm group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-black tracking-widest text-purple-400 mb-0.5">Instapay</p>
                                                <p className="text-sm font-bold text-white tracking-wide">{INSTAPAY_HANDLE}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => copyToClipboard(INSTAPAY_HANDLE, 'Instapay')}
                                            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
                                        >
                                            {copiedMethod === 'Instapay' ? 'Copied' : 'Copy'}
                                        </button>
                                    </div>
                                </div>

                                {/* Telda Card */}
                                <div className="p-4 rounded-2xl bg-white/5 border border-sky-500/20 hover:border-sky-500/40 transition-colors backdrop-blur-sm group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-sky-500/20 flex items-center justify-center border border-sky-500/30">
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-400"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-black tracking-widest text-sky-400 mb-0.5">Telda</p>
                                                <p className="text-sm font-bold text-white tracking-wide">{TELDA_HANDLE}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => copyToClipboard(TELDA_HANDLE, 'Telda')}
                                            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors"
                                        >
                                            {copiedMethod === 'Telda' ? 'Copied' : 'Copy'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <a 
                                href={INSTAGRAM_URL} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block w-full py-4 text-center rounded-2xl font-black text-sm text-white tracking-wide shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:scale-[1.02] transition-transform"
                                style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}
                            >
                                Send Screenshot via Instagram
                            </a>
                            
                            <button 
                                onClick={() => setShowPaymentModal(false)}
                                className="w-full mt-4 py-3 text-center text-[11px] font-bold text-white/50 hover:text-white uppercase tracking-widest transition-colors"
                            >
                                Close & Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
