import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const QUOTES = [
    'Consistency builds greatness.',
    'Small habits, extraordinary results.',
    'One more step forward.',
    'Progress, not perfection.',
];

export function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [gender, setGender] = useState('');
    const [loading, setLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [codeArray, setCodeArray] = useState(['', '', '', '', '', '']);
    const inputRefs = useRef([]);
    const [sessionError, setSessionError] = useState('');
    const { login, register, verifyEmail, resendVerificationCode } = useAuth();

    const handleCodeChange = (index, value) => {
        if (!/^[0-9]*$/.test(value)) return; // Only allow numbers

        if (value.length > 1) {
            // Handle paste
            const pasted = value.slice(0, 6).split('');
            const newCode = [...codeArray];
            pasted.forEach((char, i) => {
                if (index + i < 6) newCode[index + i] = char;
            });
            setCodeArray(newCode);
            setVerificationCode(newCode.join(''));
            
            const focusIndex = Math.min(index + pasted.length, 5);
            inputRefs.current[focusIndex]?.focus();
            return;
        }

        const newCode = [...codeArray];
        newCode[index] = value;
        setCodeArray(newCode);
        setVerificationCode(newCode.join(''));

        // Auto focus next
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !codeArray[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };
    const navigate = useNavigate();
    const location = useLocation();
    const [ref, setRef] = useState('');
    const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

    useEffect(() => {
        const query = new URLSearchParams(location.search);
        const refToken = query.get('ref');
        if (refToken) {
            setRef(refToken);
            setIsLogin(false); // Default to register if ref is present
            toast.info(`Joining via referral: ${refToken}`);
        }
    }, [location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSessionError('');
        try {
            if (isLogin) { 
                await login(email, password); 
                toast.success('Welcome back!'); 
                navigate('/');
            } else { 
                await register(name, email, password, gender, ref); 
                setIsVerifying(true);
                toast.success('Verification code sent to email!'); 
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Something went wrong';
            if (err.response?.data?.requiresVerification) {
                setIsVerifying(true);
                toast.error('Please verify your email to continue');
            } else {
                setSessionError(errorMsg);
                // Clear error after 6 seconds
                setTimeout(() => setSessionError(''), 6000);
            }
        } finally { setLoading(false); }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await verifyEmail(email, verificationCode);
            toast.success('Account verified! Welcome to the Circle. 🎉');
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Verification failed');
        } finally { setLoading(false); }
    };

    const handleResendCode = async () => {
        try {
            await resendVerificationCode(email);
            toast.success('New code sent!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to resend code');
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg)' }}>

            {/* ── Left panel (desktop only) ── */}
            <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="hidden lg:flex lg:flex-col lg:justify-between"
                style={{
                    width: 480, flexShrink: 0,
                    background: 'linear-gradient(180deg,#1e1b4b 0%,#0f0e2a 100%)',
                    padding: '3rem',
                }}
            >
                <div>
                    <h1 style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 800, fontSize: '1.5rem', color: '#fff' }}>
                        Progress<span style={{ color: '#818cf8' }}>Circle</span>
                    </h1>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Productivity Suite</p>
                </div>

                <div>
                    <div style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 800, fontSize: '2.25rem', lineHeight: 1.25, color: '#fff', marginBottom: '1.25rem' }}>
                        Build better habits.<br />
                        <span style={{ color: '#818cf8' }}>Track your progress.</span><br />
                        Stay consistent.
                    </div>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>"{quote}"</p>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['Tasks', 'Habits', 'Goals', 'Leaderboard'].map((f) => (
                        <span key={f} style={{
                            fontSize: 12, padding: '6px 14px', borderRadius: 9999,
                            background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)',
                        }}>{f}</span>
                    ))}
                </div>
            </motion.div>

            {/* ── Right panel – form ── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>

                {/* Mobile branded header – hidden on desktop */}
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:hidden w-full max-w-sm mb-6"
                    style={{
                        background: 'linear-gradient(135deg,#1e1b4b 0%,#0f0e2a 100%)',
                        borderRadius: '1.25rem', padding: '1.5rem',
                    }}
                >
                    <h1 style={{ fontFamily: 'Manrope,sans-serif', fontWeight: 800, fontSize: '1.4rem', color: '#fff', marginBottom: 4 }}>
                        Progress<span style={{ color: '#818cf8' }}>Circle</span>
                    </h1>
                    <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.9rem' }}>"{quote}"</p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {['Tasks', 'Habits', 'Goals', 'Leaderboard'].map((f) => (
                            <span key={f} style={{
                                fontSize: 11, padding: '4px 10px', borderRadius: 9999,
                                background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)',
                            }}>{f}</span>
                        ))}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    style={{ width: '100%', maxWidth: 440 }}
                >
                    {/* Tab toggle */}
                    <div style={{
                        display: 'flex', gap: 6, padding: 6, borderRadius: '1rem',
                        background: 'var(--surface2)', border: '1px solid var(--border)', marginBottom: '2rem',
                    }}>
                        {['Login', 'Register'].map((tab) => {
                            const active = (tab === 'Login') === isLogin;
                            return (
                                <button
                                    key={tab}
                                    type="button"
                                    onClick={() => setIsLogin(tab === 'Login')}
                                    style={{
                                        flex: 1, padding: '8px', borderRadius: '0.65rem', border: 'none',
                                        fontSize: 14, fontWeight: 600, cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        background: active ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'transparent',
                                        color: active ? '#fff' : 'var(--muted)',
                                        boxShadow: active ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
                                    }}
                                >{tab}</button>
                            );
                        })}
                    </div>

                    {/* Title */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{
                            fontFamily: 'Manrope,sans-serif', fontWeight: 800, fontSize: '1.75rem',
                            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 4,
                        }}>
                            {isLogin ? 'Welcome back' : 'Create an account'}
                        </h2>
                        <p style={{ fontSize: 14, color: 'var(--muted)' }}>
                            {isLogin ? 'Sign in to continue your journey' : 'Start your productivity journey today'}
                        </p>
                    </div>

                    {/* Form */}
                    <AnimatePresence mode="wait">
                    {isVerifying ? (
                        <motion.form 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onSubmit={handleVerify} 
                            style={{ 
                                display: 'flex', flexDirection: 'column', gap: '1.5rem',
                                background: 'rgba(20, 20, 35, 0.4)',
                                backdropFilter: 'blur(20px)',
                                padding: '2.5rem 2rem',
                                borderRadius: '1.5rem',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                            }}
                        >
                            <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                                <motion.div 
                                    animate={{ 
                                        boxShadow: ['0 0 0 0 rgba(99,102,241,0.4)', '0 0 0 20px rgba(99,102,241,0)'],
                                    }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    style={{ 
                                        width: 72, height: 72, borderRadius: '1.25rem', 
                                        background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(79,70,229,0.05))', 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem',
                                        color: '#818cf8',
                                        border: '1px solid rgba(99,102,241,0.3)',
                                        position: 'relative'
                                    }}>
                                    <div style={{position: 'absolute', inset: 0, borderRadius: '1.25rem', boxShadow: 'inset 0 0 20px rgba(99,102,241,0.2)'}} />
                                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M22 17.0022c0-5.0013-5.132-9.071-10-9.071s-10 4.0697-10 9.071c0 4.1209 2.1032 5.1325 3.1205 5.9263.5049.3241.8203.4484 1.4807.1522.7937-.3563 1.1554-1.2917 1.1554-2.1522 0-3-.6745-4-1-4.5"/>
                                        <path d="M15.5 17c0 2.5 1.5 3 2.5 3s2.5-.5 2.5-3-1.5-3-2.5-3-2.5.5-2.5 3z"/>
                                        <circle cx="12" cy="13" r="8"/>
                                    </svg>
                                </motion.div>
                                <h3 style={{ 
                                    fontSize: '1.5rem', fontWeight: 800, 
                                    background: 'linear-gradient(to right, #fff, #a5b4fc)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    marginBottom: 8 
                                }}>Neural Link Verification</h3>
                                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
                                    We've transmitted a 6-digit access code to<br/>
                                    <b style={{ color: '#fff', fontSize: 14 }}>{email}</b>
                                </p>
                            </div>

                            <div style={{ margin: '0.5rem 0' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                    {codeArray.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el) => (inputRefs.current[index] = el)}
                                            type="text"
                                            maxLength={6}
                                            value={digit}
                                            onChange={(e) => handleCodeChange(index, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(index, e)}
                                            style={{
                                                width: '3.2rem', height: '4rem',
                                                textAlign: 'center',
                                                fontSize: '1.75rem', fontWeight: 700, fontFamily: 'monospace',
                                                color: '#fff',
                                                background: 'rgba(255,255,255,0.03)',
                                                border: digit ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '0.75rem',
                                                boxShadow: digit ? '0 0 15px rgba(99,102,241,0.2)' : 'none',
                                                transition: 'all 0.2s ease',
                                                outline: 'none'
                                            }}
                                            onFocus={(e) => Object.assign(e.target.style, { border: '1px solid #818cf8', boxShadow: '0 0 15px rgba(129,140,248,0.4)', background: 'rgba(255,255,255,0.06)' })}
                                            onBlur={(e) => Object.assign(e.target.style, { border: digit ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(255,255,255,0.1)', boxShadow: digit ? '0 0 15px rgba(99,102,241,0.2)' : 'none', background: 'rgba(255,255,255,0.03)' })}
                                        />
                                    ))}
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading || verificationCode.length !== 6}
                                style={{
                                    width: '100%', padding: '1rem',
                                    background: (loading || verificationCode.length !== 6) ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg,#6366f1,#4f46e5)',
                                    color: (loading || verificationCode.length !== 6) ? 'rgba(255,255,255,0.3)' : '#fff', 
                                    border: '1px solid',
                                    borderColor: (loading || verificationCode.length !== 6) ? 'transparent' : 'rgba(255,255,255,0.1)',
                                    borderRadius: '0.75rem',
                                    fontSize: 16, fontWeight: 700, 
                                    cursor: (loading || verificationCode.length !== 6) ? 'not-allowed' : 'pointer',
                                    boxShadow: (loading || verificationCode.length !== 6) ? 'none' : '0 10px 25px rgba(99,102,241,0.4)',
                                    transition: 'all 0.3s',
                                    marginTop: '0.5rem'
                                }}
                            >
                                {loading ? 'Synchronizing...' : 'Establish Link'}
                            </motion.button>

                            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                                <div>
                                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Signal lost?</p>
                                    <button
                                        type="button"
                                        onClick={handleResendCode}
                                        style={{
                                            background: 'transparent', border: 'none', color: '#818cf8',
                                            fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                            transition: 'color 0.2s'
                                        }}
                                        onMouseOver={(e) => e.target.style.color = '#a5b4fc'}
                                        onMouseOut={(e) => e.target.style.color = '#818cf8'}
                                    >
                                        Resend Verification Code
                                    </button>
                                </div>
                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                                    <button
                                        type="button"
                                        onClick={() => setIsVerifying(false)}
                                        style={{
                                            background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)',
                                            fontSize: 12, cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', margin: '0 auto',
                                            transition: 'color 0.2s'
                                        }}
                                        onMouseOver={(e) => e.target.style.color = 'rgba(255,255,255,0.6)'}
                                        onMouseOut={(e) => e.target.style.color = 'rgba(255,255,255,0.3)'}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                                        Abort and Return
                                    </button>
                                </div>
                            </div>
                        </motion.form>
                    ) : (
                        <motion.form 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
                        >
                            <AnimatePresence>
                                {sessionError && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        style={{
                                            padding: '12px 16px',
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            border: '1px solid rgba(239, 68, 68, 0.2)',
                                            borderRadius: '0.75rem',
                                            color: '#fca5a5',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                                        {sessionError}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            {!isLogin && (
                                <>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>Name</label>
                                        <input
                                            className="pc-input"
                                            type="text" value={name} placeholder="Your full name"
                                            onChange={(e) => setName(e.target.value)}
                                            required={!isLogin}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--muted)', marginBottom: 8 }}>Gender</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                            <button
                                                type="button"
                                                onClick={() => setGender('male')}
                                                style={{
                                                    padding: '12px 16px', borderRadius: '0.75rem', border: '2px solid',
                                                    borderColor: gender === 'male' ? '#3b82f6' : 'var(--border)',
                                                    background: gender === 'male' ? 'rgba(59,130,246,0.12)' : 'var(--surface2)',
                                                    color: gender === 'male' ? '#3b82f6' : 'var(--muted)',
                                                    fontWeight: 700, fontSize: 14, cursor: 'pointer',
                                                    transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                                }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={gender === 'male' ? '#3b82f6' : 'currentColor'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="10" cy="14" r="5" />
                                                    <line x1="21" y1="3" x2="15" y2="9" />
                                                    <polyline points="16 3 21 3 21 8" />
                                                </svg>
                                                Male
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setGender('female')}
                                                style={{
                                                    padding: '12px 16px', borderRadius: '0.75rem', border: '2px solid',
                                                    borderColor: gender === 'female' ? '#ec4899' : 'var(--border)',
                                                    background: gender === 'female' ? 'rgba(236,72,153,0.12)' : 'var(--surface2)',
                                                    color: gender === 'female' ? '#ec4899' : 'var(--muted)',
                                                    fontWeight: 700, fontSize: 14, cursor: 'pointer',
                                                    transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                                }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={gender === 'female' ? '#ec4899' : 'currentColor'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="8" r="5" />
                                                    <line x1="12" y1="13" x2="12" y2="21" />
                                                    <line x1="9" y1="18" x2="15" y2="18" />
                                                </svg>
                                                Female
                                            </button>
                                        </div>
                                    </div>
                                    {ref && (
                                        <div style={{
                                            padding: '8px 12px', background: 'rgba(99,102,241,0.1)',
                                            borderRadius: '0.5rem', border: '1px solid rgba(99,102,241,0.2)',
                                            display: 'flex', alignItems: 'center', gap: 8, marginTop: 4
                                        }}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                            </svg>
                                            <span style={{ fontSize: 12, color: '#6366f1', fontWeight: 600 }}>Referred by friend: {ref}</span>
                                        </div>
                                    )}
                                </>
                            )}
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>Email</label>
                                <input
                                    className="pc-input"
                                    type="email" value={email} placeholder="you@email.com"
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--muted)', marginBottom: 6 }}>Password</label>
                                <input
                                    className="pc-input"
                                    type="password" value={password} placeholder="••••••••"
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            {!isLogin && (
                                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: -4, marginBottom: 8, lineHeight: 1.5 }}>
                                    By clicking "Create Account", you acknowledge that you have read and agree to our{' '}
                                    <Link to="/terms" style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}>Terms of Operation</Link>
                                    {' '}and{' '}
                                    <Link to="/privacy" style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}>Privacy Protocol</Link>.
                                </p>
                            )}
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    marginTop: 8, width: '100%', padding: '0.8rem',
                                    background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                                    color: '#fff', border: 'none', borderRadius: '0.75rem',
                                    fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                                    boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                                    transition: 'all 0.2s',
                                    opacity: loading ? 0.7 : 1,
                                }}
                            >
                                {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
                            </button>
                        </motion.form>
                    )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
}