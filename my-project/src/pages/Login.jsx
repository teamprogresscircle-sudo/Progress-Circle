import { useState, useEffect, useRef, useCallback, startTransition } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

/* ─── Static data (outside component = no re-creation) ─── */
const QUOTES = [
    'Consistency builds greatness.',
    'Small habits, extraordinary results.',
    'One more step forward.',
    'Progress, not perfection.',
    'Discipline is the bridge between goals and accomplishment.',
];

const FEATURES_LIST = [
    { icon: '⚡', label: 'Focus Protocols' },
    { icon: '📊', label: 'Habit Tracking' },
    { icon: '🏆', label: 'Leaderboard' },
    { icon: '🎯', label: 'Goal System' },
    { icon: '🧠', label: 'Astra AI' },
];

const STATS = [
    { v: '25k+', l: 'Users' },
    { v: '4.9★', l: 'Rating' },
    { v: '82%', l: 'Efficiency' },
];

/* ─── CSS injected once ─── */
const LOGIN_CSS = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-20px); }
  to { opacity: 1; transform: translateX(0); }
}

.ln-fade-in {
  animation: fadeIn 0.4s cubic-bezier(0.2, 0, 0.2, 1) forwards;
}

.ln-slide-in {
  animation: slideInLeft 0.5s cubic-bezier(0.2, 0, 0.2, 1) forwards;
}

.ln-input {
  display:block; width:100%; padding: 12px 16px;
  background: rgba(255,255,255,0.03);
  border: 1.5px solid rgba(255,255,255,0.07);
  border-radius: 0.75rem; color: #fff; font-size: 15px;
  outline: none; transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
  font-family: inherit;
}
.ln-input::placeholder { color: rgba(255,255,255,0.25); }
.ln-input:focus {
  background: rgba(99,102,241,0.06);
  border-color: rgba(99,102,241,0.4);
  box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
}

.ln-tab {
  flex: 1; padding: 10px; border-radius: 0.65rem; border: none;
  font-size: 14px; font-weight: 600; cursor: pointer;
  transition: background 0.18s, color 0.18s, box-shadow 0.18s;
  background: transparent; color: rgba(255,255,255,0.3); font-family: inherit;
}
.ln-tab-active {
  background: linear-gradient(135deg,#6366f1,#4f46e5);
  color: #fff; box-shadow: 0 4px 12px rgba(99,102,241,0.3);
}

.ln-submit {
  width: 100%; padding: 14px; margin-top: 4px; border-radius: 0.85rem; border: none;
  font-size: 15px; font-weight: 700; cursor: pointer; background: linear-gradient(135deg,#6366f1,#4f46e5);
  color: #fff; box-shadow: 0 8px 24px rgba(99,102,241,0.35); transition: opacity 0.15s, transform 0.15s;
}
.ln-submit:active { transform: scale(0.985); }
.ln-submit:disabled { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.2); box-shadow: none; cursor: default; }

.ln-register-fields {
  display: flex; flex-direction: column; gap: 1.1rem;
  transition: opacity 0.25s ease;
}

.ln-gender-btn {
  padding: 11px 16px; border-radius: 0.75rem; border: 1.5px solid rgba(255,255,255,0.07);
  background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.35);
  font-weight: 700; font-size: 14px; cursor: pointer; transition: all 0.15s;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.ln-gender-male.ln-gender-active { border-color: #3b82f6; color: #3b82f6; background: rgba(59,130,246,0.1); }
.ln-gender-female.ln-gender-active { border-color: #ec4899; color: #ec4899; background: rgba(236,72,153,0.1); }

.ln-pw-toggle {
  position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
  background: transparent; border: none; color: rgba(255,255,255,0.3); cursor: pointer;
}

/* Background Gradients (CSS is faster than many small blurred divs) */
.ln-bg-gradient {
  background: 
    radial-gradient(circle at 0% 0%, rgba(99,102,241,0.08) 0%, transparent 40%),
    radial-gradient(circle at 100% 100%, rgba(139,92,246,0.06) 0%, transparent 40%),
    #0B0B0F;
}

.ln-glass-card {
  background: rgba(255,255,255,0.02);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.06); border-radius: 1.5rem;
  padding: 2.25rem 2rem; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
  position: relative; overflow: hidden;
}
`;

export function Login() {
    const [isLogin, setIsLogin]           = useState(true);
    const [name, setName]                 = useState('');
    const [email, setEmail]               = useState('');
    const [password, setPassword]         = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [gender, setGender]             = useState('');
    const [loading, setLoading]           = useState(false);
    const [isVerifying, setIsVerifying]   = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [codeArray, setCodeArray]       = useState(['', '', '', '', '', '']);
    const inputRefs                       = useRef([]);
    const [sessionError, setSessionError] = useState('');
    const [quoteIdx]                      = useState(() => Math.floor(Math.random() * QUOTES.length));
    const errorTimer                      = useRef(null);

    const { login, register, verifyEmail, resendVerificationCode } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [ref, setRef] = useState('');

    useEffect(() => {
        const id = 'login-page-simplified-css';
        if (!document.getElementById(id)) {
            const style = document.createElement('style');
            style.id = id;
            style.textContent = LOGIN_CSS;
            document.head.appendChild(style);
        }
        return () => { clearTimeout(errorTimer.current); };
    }, []);

    useEffect(() => {
        const query = new URLSearchParams(location.search);
        const refToken = query.get('ref');
        if (refToken) { setRef(refToken); setIsLogin(false); }
    }, [location]);

    const handleCodeChange = useCallback((index, value) => {
        if (!/^[0-9]*$/.test(value)) return;
        if (value.length > 1) {
            const pasted  = value.slice(0, 6).split('');
            setCodeArray(prev => {
                const next = [...prev];
                pasted.forEach((c, i) => { if (index + i < 6) next[index + i] = c; });
                setVerificationCode(next.join(''));
                return next;
            });
            inputRefs.current[Math.min(index + value.length, 5)]?.focus();
            return;
        }
        setCodeArray(prev => {
            const next = [...prev];
            next[index] = value;
            setVerificationCode(next.join(''));
            return next;
        });
        if (value && index < 5) inputRefs.current[index + 1]?.focus();
    }, []);

    const handleKeyDown = useCallback((index, e) => {
        if (e.key === 'Backspace' && !codeArray[index] && index > 0)
            inputRefs.current[index - 1]?.focus();
    }, [codeArray]);

    const handleSubmit = useCallback(async (e) => {
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
            const msg = err.response?.data?.message || 'Something went wrong';
            if (err.response?.data?.requiresVerification) {
                setIsVerifying(true);
            } else {
                setSessionError(msg);
                clearTimeout(errorTimer.current);
                errorTimer.current = setTimeout(() => setSessionError(''), 6000);
            }
        } finally { setLoading(false); }
    }, [isLogin, email, password, name, gender, ref, login, register, navigate]);

    const handleVerify = useCallback(async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await verifyEmail(email, verificationCode);
            toast.success('Account verified!');
            navigate('/');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Verification failed');
        } finally { setLoading(false); }
    }, [email, verificationCode, verifyEmail, navigate]);

    const handleResend = useCallback(async () => {
        try { await resendVerificationCode(email); toast.success('New code sent!'); }
        catch (err) { toast.error(err.response?.data?.message || 'Failed to resend code'); }
    }, [email, resendVerificationCode]);

    return (
        <div className="ln-bg-gradient" style={{ height: '100vh', display: 'flex', overflow: 'hidden', position: 'relative' }}>
            
            {/* Left side (Desktop only) */}
            <aside className="hidden lg:flex lg:flex-col lg:justify-between ln-slide-in" style={{ width: 500, flexShrink: 0, padding: '3rem 3.5rem', borderRight: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 60 }}>
                        <div style={{ width: 44, height: 44, borderRadius: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            <img src="/logo.svg" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.4rem', color: '#fff', margin: 0 }}>ProgressCircle</h1>
                    </div>
                    <div style={{ display: 'inline-flex', padding: '6px 14px', borderRadius: 999, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', marginBottom: 24 }}>
                        <span style={{ fontSize: 10, color: '#818cf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>✦ Astra AI Powered</span>
                    </div>
                    <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '2.5rem', color: '#fff', lineHeight: 1.15, marginBottom: 20 }}>
                        Master your time.<br /><span style={{ color: '#818cf8' }}>Expand your circle.</span>
                    </h2>
                    <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', marginBottom: 40 }}>"{QUOTES[quoteIdx]}"</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                        {FEATURES_LIST.map(f => (
                            <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                                <span>{f.icon}</span> {f.label}
                            </div>
                        ))}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 30 }}>
                    {STATS.map(s => (
                        <div key={s.l}>
                            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff', fontFamily: 'Outfit, sans-serif' }}>{s.v}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 600, textTransform: 'uppercase' }}>{s.l}</div>
                        </div>
                    ))}
                </div>
            </aside>

            {/* Right side (Form) */}
            <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem', zIndex: 1, overflowY: 'auto' }}>
                <div style={{ width: '100%', maxWidth: 440 }} className="ln-fade-in">
                    
                    {/* Header for mobile */}
                    <div className="lg:hidden" style={{ textAlign: 'center', marginBottom: 32 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
                            <div style={{ width: 38, height: 38, borderRadius: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                <img src="/logo.svg" alt="Logo" style={{ width: '28px', height: '28px', objectFit: 'contain', borderRadius: '50%' }} />
                            </div>
                            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.25rem', color: '#fff', margin: 0 }}>ProgressCircle</h2>
                        </div>
                    </div>

                    <div className="ln-glass-card">
                        
                        {isVerifying ? (
                            /* Verification Panel (Zero Framer-Motion) */
                            <div>
                                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                                    <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#818cf8' }}>
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                                    </div>
                                    <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: '#fff', margin: '0 0 8px 0' }}>Verify email</h3>
                                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>Code sent to <br/><b style={{ color: '#fff' }}>{email}</b></p>
                                </div>
                                <form onSubmit={handleVerify}>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, margin: '24px 0' }}>
                                        {codeArray.map((digit, i) => (
                                            <input key={i} ref={el => (inputRefs.current[i] = el)} type="text" inputMode="numeric" maxLength={1} value={digit} onChange={e => handleCodeChange(i, e.target.value)} onKeyDown={e => handleKeyDown(i, e)} className="ln-otp-input" style={{ width:'2.8rem', height:'3.6rem', border: digit ? '1.5px solid #6366f1' : '1.5px solid rgba(255,255,255,0.08)' }} />
                                        ))}
                                    </div>
                                    <button type="submit" disabled={loading || verificationCode.length !== 6} className="ln-submit">{loading ? 'Verifying...' : 'Verify & Sign In'}</button>
                                </form>
                                <div style={{ textAlign: 'center', marginTop: 16 }}>
                                    <button type="button" onClick={handleResend} style={{ background: 'transparent', border: 'none', color: '#818cf8', fontSize: 13, cursor: 'pointer' }}>Resend code</button>
                                </div>
                            </div>
                        ) : (
                            /* Login/Register Form */
                            <div style={{ opacity: 1, transition: 'opacity 0.2s' }}>
                                <div style={{ display: 'flex', padding: 4, borderRadius: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '2rem' }}>
                                    <button onClick={() => setIsLogin(true)}  className={`ln-tab ${isLogin  ? 'ln-tab-active' : ''}`}>Sign In</button>
                                    <button onClick={() => setIsLogin(false)} className={`ln-tab ${!isLogin ? 'ln-tab-active' : ''}`}>Register</button>
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.7rem', color: '#fff', margin: '0 0 4px 0' }}>{isLogin ? 'Welcome back.' : 'Create account.'}</h2>
                                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>{isLogin ? 'Ready to resume your progress?' : 'Join the Productivity Circle today.'}</p>
                                </div>

                                {sessionError && <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.75rem', color: '#fca5a5', fontSize: 13, marginBottom: 16 }}>{sessionError}</div>}

                                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                                    {!isLogin && (
                                        <div className="ln-register-fields">
                                            <div>
                                                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginBottom: 6, textTransform: 'uppercase' }}>Full Name</label>
                                                <input className="ln-input" type="text" value={name} onChange={e => setName(e.target.value)} required={!isLogin} placeholder="John Doe" />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginBottom: 6, textTransform: 'uppercase' }}>Gender</label>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                                    <button type="button" onClick={() => setGender('male')} className={`ln-gender-btn ln-gender-male ${gender === 'male' ? 'ln-gender-active' : ''}`}>Male</button>
                                                    <button type="button" onClick={() => setGender('female')} className={`ln-gender-btn ln-gender-female ${gender === 'female' ? 'ln-gender-active' : ''}`}>Female</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginBottom: 6, textTransform: 'uppercase' }}>Email Address</label>
                                        <input className="ln-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginBottom: 6, textTransform: 'uppercase' }}>Password</label>
                                        <div style={{ position: 'relative' }}>
                                            <input className="ln-input" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" style={{ paddingRight: 40 }} />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="ln-pw-toggle" tabIndex={-1}>
                                                {showPassword ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22"/></svg> 
                                                              : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                                            </button>
                                        </div>
                                    </div>

                                    {!isLogin && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', textAlign: 'center', margin: '4px 0' }}>By joining, you agree to our Terms and Privacy Policy.</p>}
                                    
                                    <button type="submit" disabled={loading} className="ln-submit">{loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}</button>
                                    
                                    <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>
                                        {isLogin ? "No account?" : "Already joined?"} <button type="button" onClick={() => setIsLogin(!isLogin)} style={{ background: 'transparent', border: 'none', color: '#818cf8', fontWeight: 600, cursor: 'pointer' }}>{isLogin ? 'Register' : 'Sign In'}</button>
                                    </p>
                                </form>
                            </div>
                        )}
                    </div>
                    <div style={{ textAlign: 'center', marginTop: 24 }}>
                        <Link to="/" style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>← Back to home</Link>
                    </div>
                </div>
            </main>
        </div>
    );
}