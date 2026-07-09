import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock, Mail, User, ChevronRight, Eye, EyeOff,
  RefreshCw, ShieldCheck, AlertCircle,
  TrendingUp, Users, Activity, X
} from 'lucide-react';
import { useAuth } from '../AuthContext';

type Tab = 'login' | 'register';

interface AuthModalProps {
  /** Pass App's settings so the login page inherits the chosen theme/accent/mode */
  settings?: { theme?: string; accent?: string; font?: string };
  /** Called when user clicks the X to dismiss the modal */
  onClose?: () => void;
}


// ─── CAPTCHA ─────────────────────────────────────────────────────────────────

function generateCaptcha() {
  const ops = ['+', '-', '×'] as const;
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a: number, b: number, answer: number;
  if (op === '+') { a = Math.floor(Math.random() * 15) + 1; b = Math.floor(Math.random() * 15) + 1; answer = a + b; }
  else if (op === '-') { a = Math.floor(Math.random() * 15) + 6; b = Math.floor(Math.random() * (a - 1)) + 1; answer = a - b; }
  else { a = Math.floor(Math.random() * 7) + 2; b = Math.floor(Math.random() * 7) + 2; answer = a * b; }
  return { question: `${a} ${op} ${b}`, answer };
}

function drawCaptcha(canvas: HTMLCanvasElement, question: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = canvas.width, H = canvas.height;

  // Light sage background matching app theme
  ctx.fillStyle = '#edece4';
  ctx.fillRect(0, 0, W, H);

  // Subtle grid
  ctx.strokeStyle = 'rgba(43,51,39,0.07)';
  ctx.lineWidth = 0.6;
  for (let x = 0; x < W; x += 20) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 20) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // Noise lines (emerald tones)
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * W, Math.random() * H);
    ctx.bezierCurveTo(Math.random() * W, Math.random() * H, Math.random() * W, Math.random() * H, Math.random() * W, Math.random() * H);
    ctx.strokeStyle = `hsla(${140 + Math.random() * 40},50%,50%,0.3)`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Noise dots
  for (let i = 0; i < 40; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 1.2, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${120 + Math.random() * 60},40%,45%,0.4)`;
    ctx.fill();
  }

  // Characters
  const chars = Array.from(`${question} = ?`);
  const charW = W / (chars.length + 1.5);
  chars.forEach((ch, i) => {
    ctx.save();
    const x = charW * (i + 1);
    const y = H / 2 + (Math.random() * 6 - 3);
    ctx.translate(x, y);
    ctx.rotate((Math.random() - 0.5) * 0.35);
    ctx.shadowColor = 'rgba(43,51,39,0.3)';
    ctx.shadowBlur = 4;
    ctx.font = `bold 20px 'JetBrains Mono', 'Courier New', monospace`;
    ctx.fillStyle = '#1c211a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  });
}

function CaptchaBox({ onVerify, resetTrigger }: { onVerify: (ok: boolean) => void; resetTrigger: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [captcha, setCaptcha] = useState(() => generateCaptcha());
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'ok' | 'wrong'>('idle');

  const refresh = useCallback(() => {
    setCaptcha(generateCaptcha());
    setInput('');
    setStatus('idle');
    onVerify(false);
  }, [onVerify]);

  useEffect(() => { if (canvasRef.current) drawCaptcha(canvasRef.current, captcha.question); }, [captcha]);
  useEffect(() => { if (resetTrigger > 0) refresh(); }, [resetTrigger, refresh]);

  const check = (val: string) => {
    setInput(val);
    if (!val.trim()) { setStatus('idle'); onVerify(false); return; }
    const num = parseInt(val.trim(), 10);
    if (!isNaN(num) && num === captcha.answer) { setStatus('ok'); onVerify(true); }
    else { setStatus('wrong'); onVerify(false); }
  };

  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--c13)] uppercase tracking-wider">
        <ShieldCheck className="w-3 h-3 text-emerald-600" />
        Security Check
      </label>
      <div className="flex items-stretch gap-2">
        <div className="flex-1 rounded-xl overflow-hidden border border-[var(--c6)] shadow-sm">
          <canvas ref={canvasRef} width={220} height={44} className="w-full h-auto block select-none" />
        </div>
        <button type="button" onClick={refresh} title="New CAPTCHA"
          className="px-2.5 rounded-xl border border-[var(--c6)] bg-[var(--c2)] text-[var(--c13)] hover:text-[var(--c18)] hover:border-[var(--c10)] hover:bg-[var(--c3)] transition-all">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="relative">
        <input
          type="number"
          value={input}
          onChange={(e) => check(e.target.value)}
          placeholder="Type the answer…"
          className={`w-full px-3 py-2 text-sm rounded-xl border bg-[var(--c1)] text-[var(--c18)] placeholder-[var(--c11)] focus:outline-none focus:ring-2 transition-all ${
            status === 'ok'
              ? 'border-emerald-400 focus:ring-emerald-400/20'
              : status === 'wrong'
              ? 'border-red-400 focus:ring-red-400/20'
              : 'border-[var(--c6)] focus:ring-[var(--c10)]/20 focus:border-[var(--c10)]'
          }`}
        />
        {status === 'ok' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 text-xs font-bold">✓</span>}
        {status === 'wrong' && input !== '' && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 text-xs font-bold">✗</span>}
      </div>
    </div>
  );
}

// ─── AuthModal ────────────────────────────────────────────────────────────────

export function AuthModal({ settings, onClose }: AuthModalProps = {}) {
  const { login } = useAuth();
  const [tab, setTab] = useState<Tab>('login');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [captchaOk, setCaptchaOk] = useState(false);
  const [captchaReset, setCaptchaReset] = useState(0);

  const resetCaptcha = () => { setCaptchaOk(false); setCaptchaReset(n => n + 1); };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaOk) { setError('Please solve the security check first.'); return; }
    setError(null); setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: loginEmail, password: loginPassword }) });
      if (!res.ok) { let d = 'Login failed'; try { d = (await res.json()).detail || d; } catch {} resetCaptcha(); throw new Error(d); }
      const data = await res.json();
      login(data.access_token, data.user);
    } catch (err: any) {
      setError(err.name === 'TypeError' ? 'Cannot reach server. Is the backend running?' : err.message || 'Unexpected error.');
    } finally { setIsLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setSuccess(null);
    if (regPassword !== regConfirm) { setError('Passwords do not match.'); return; }
    if (regPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: regEmail, password: regPassword, name: regName, role: 'manager' }) });
      if (!res.ok) { let d = 'Registration failed'; try { d = (await res.json()).detail || d; } catch {} throw new Error(d); }
      setSuccess('Account created! You can now sign in.');
      setRegName(''); setRegEmail(''); setRegPassword(''); setRegConfirm('');
      setTimeout(() => { setTab('login'); setSuccess(null); }, 1800);
    } catch (err: any) {
      setError(err.name === 'TypeError' ? 'Cannot reach server. Is the backend running?' : err.message || 'Registration failed.');
    } finally { setIsLoading(false); }
  };

  const handleGoogle = async () => {
    setError(null); setIsLoading(true);
    try {
      const res = await fetch('/api/auth/social-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider: 'Google', token: 'mock_token_123', email: 'google_user@errp.ai', name: 'Google User' }) });
      if (!res.ok) throw new Error('Google login failed');
      const data = await res.json();
      login(data.access_token, data.user);
    } catch (err: any) {
      setError(err.name === 'TypeError' ? 'Cannot reach server. Is the backend running?' : err.message || 'Google login failed.');
    } finally { setIsLoading(false); }
  };

  // Shared input style — matches App.tsx form fields
  const inputCls = "w-full pl-9 pr-3 py-2.5 text-sm bg-[var(--c1)] border border-[var(--c6)] rounded-xl text-[var(--c18)] placeholder-[var(--c11)] focus:outline-none focus:ring-2 focus:ring-[var(--c16)]/20 focus:border-[var(--c14)] transition-all";

  return (
    // Inherit theme from App settings so theme changes apply to login page too
    <div
      data-theme={settings?.accent || 'emerald'}
      data-mode={settings?.theme === 'dark' ? 'dark' : 'light'}
      className="fixed inset-0 z-50 flex items-stretch bg-[var(--c9)]"
      style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}
    >
      {/* Animated background blobs — same as LandingPage */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--c16)]/20 rounded-full blur-[120px] pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: [0, -90, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none"
      />

      {/* ── LEFT BRAND PANEL ── */}
      <div className="hidden lg:flex flex-col justify-between w-[46%] relative z-10 p-10">

        {/* Logo — same as sidebar in App.tsx */}
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl bg-white overflow-hidden flex items-center justify-center border border-[var(--c5)] p-1 shadow-sm">
            <img src="/logo.png" alt="Logo" className="h-full w-full object-contain scale-[1.3]" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-[var(--c18)] block">Analytics</span>
            <span className="text-[10px] text-[var(--c13)] uppercase tracking-wider font-semibold">HR Intelligence</span>
          </div>
        </div>

        {/* Hero — same typography as LandingPage */}
        <div className="space-y-8">
          <div>
            {/* Status pill — same as LandingPage */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--c2)] border border-[var(--c5)] mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--c13)]">System Operational</span>
            </div>

            <h1 className="text-4xl font-black tracking-tight text-[var(--c18)] leading-tight mb-4">
              Predict turnover.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--c16)] to-emerald-500">
                Retain your best talent.
              </span>
            </h1>
            <p className="text-sm text-[var(--c13)] font-medium leading-relaxed max-w-sm">
              The intelligent HR platform that forecasts employee resignation risk, identifies friction points, and provides AI-driven retention strategies.
            </p>
          </div>

          {/* Feature cards — same style as LandingPage bento grid */}
          <div className="space-y-3">
            {[
              { icon: Activity,   color: 'bg-amber-500/10 text-amber-600',  label: 'Predictive Risk Scoring',  sub: 'ML-powered flight risk per employee' },
              { icon: Users,      color: 'bg-indigo-500/10 text-indigo-600', label: 'Smart Auto-Compare',        sub: 'AI side-by-side employee analysis' },
              { icon: TrendingUp, color: 'bg-emerald-500/10 text-emerald-600', label: 'AI Action Plans',        sub: 'Manager emails & talking points' },
            ].map(({ icon: Icon, color, label, sub }) => (
              <div key={label} className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--c1)]/60 backdrop-blur-xl border border-[var(--c5)] hover:border-[var(--c8)] transition-colors">
                <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--c18)]">{label}</p>
                  <p className="text-[11px] text-[var(--c13)]">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-[var(--c11)]">© 2026 HR Intelligence · Secure · Confidential</p>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10 overflow-y-auto">

        {/* X close button — only shown when modal can be dismissed */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-xl bg-[var(--c2)] border border-[var(--c5)] text-[var(--c13)] hover:text-[var(--c18)] hover:bg-[var(--c3)] transition-all"
            title="Back to home"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Glass card — same style as LandingPage feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className="w-full max-w-sm my-auto"
        >
          <div className="bg-[var(--c1)]/70 backdrop-blur-xl border border-[var(--c5)] rounded-3xl shadow-xl overflow-hidden">

            {/* Card header */}
            <div className="px-7 pt-7 pb-5 border-b border-[var(--c4)]">
              {/* Mobile logo */}
              <div className="lg:hidden flex items-center gap-2 mb-4">
                <div className="h-7 w-7 rounded-lg bg-white overflow-hidden flex items-center justify-center border border-[var(--c5)] p-0.5">
                  <img src="/logo.png" alt="" className="h-full w-full object-contain scale-[1.3]" />
                </div>
                <span className="font-extrabold text-sm text-[var(--c18)]">HR Intelligence</span>
              </div>

              <h2 className="text-xl font-black text-[var(--c18)] mb-0.5">
                {tab === 'login' ? 'Welcome back 👋' : 'Create account'}
              </h2>
              <p className="text-xs text-[var(--c13)]">
                {tab === 'login' ? 'Sign in to your HR workspace' : 'Join the HR Intelligence platform'}
              </p>

              {/* Tab switcher — matches nav pill style from App.tsx */}
              <div className="flex bg-[var(--c2)] rounded-xl p-1 gap-1 mt-4">
                {(['login', 'register'] as Tab[]).map(t => (
                  <button key={t}
                    onClick={() => { setTab(t); setError(null); setSuccess(null); resetCaptcha(); }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      tab === t
                        ? 'bg-[var(--c16)] text-white shadow-sm'
                        : 'text-[var(--c14)] hover:text-[var(--c18)]'
                    }`}>
                    {t === 'login' ? 'Sign In' : 'Register'}
                  </button>
                ))}
              </div>
            </div>

            {/* Card body */}
            <div className="px-7 py-5">
              {/* Alerts */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div key="err"
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mb-4">
                    <div className="flex items-start gap-2.5 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <p>{error}</p>
                    </div>
                  </motion.div>
                )}
                {success && (
                  <motion.div key="ok"
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mb-4">
                    <div className="flex items-start gap-2.5 p-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <p>{success}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {tab === 'login' ? (
                  <motion.form key="login"
                    initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
                    transition={{ duration: 0.15 }} onSubmit={handleLogin} className="space-y-3">

                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--c13)] mb-1.5 uppercase tracking-wider">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--c11)]" />
                        <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className={inputCls} placeholder="admin@errp.ai" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--c13)] mb-1.5 uppercase tracking-wider">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--c11)]" />
                        <input type={showPwd ? 'text' : 'password'} required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className={`${inputCls} pr-9`} placeholder="••••••••" />
                        <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--c11)] hover:text-[var(--c18)] transition-colors">
                          {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <CaptchaBox onVerify={setCaptchaOk} resetTrigger={captchaReset} />

                    {/* Submit — matches App.tsx primary button style */}
                    <button type="submit" disabled={isLoading || !captchaOk}
                      className={`w-full py-2.5 px-4 rounded-xl text-sm font-bold text-white transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                        captchaOk
                          ? 'bg-[var(--c18)] hover:opacity-90 focus:ring-[var(--c16)] shadow-md hover:scale-[1.01] active:scale-[0.99]'
                          : 'bg-[var(--c14)] cursor-not-allowed'
                      }`}>
                      {isLoading
                        ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in…</>
                        : <>Sign In <ChevronRight className="w-4 h-4" /></>}
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3 py-0.5">
                      <div className="flex-1 h-px bg-[var(--c5)]" />
                      <span className="text-[10px] text-[var(--c11)] font-semibold uppercase tracking-widest">or</span>
                      <div className="flex-1 h-px bg-[var(--c5)]" />
                    </div>

                    {/* Google */}
                    <button type="button" onClick={handleGoogle}
                      className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-[var(--c1)] border border-[var(--c6)] rounded-xl text-sm font-semibold text-[var(--c18)] hover:bg-[var(--c2)] hover:border-[var(--c8)] transition-all">
                      <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="" className="w-4 h-4" />
                      Continue with Google
                    </button>

                    {/* Demo creds — matches App info-box style */}
                    <div className="p-3 rounded-xl border border-[var(--c5)] bg-[var(--c2)] text-center">
                      <p className="text-[10px] text-[var(--c13)] font-bold uppercase tracking-wider mb-1">Demo Access</p>
                      <p className="text-[11px] text-[var(--c15)] font-mono">admin@errp.ai · password123</p>
                      <p className="text-[11px] text-[var(--c15)] font-mono">manager@errp.ai · password123</p>
                    </div>
                  </motion.form>
                ) : (
                  <motion.form key="register"
                    initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.15 }} onSubmit={handleRegister} className="space-y-3">

                    {[
                      { label: 'Full Name', type: 'text', val: regName, set: setRegName, ph: 'Jane Doe', Icon: User },
                      { label: 'Email',     type: 'email', val: regEmail, set: setRegEmail, ph: 'jane@company.com', Icon: Mail },
                    ].map(({ label, type, val, set, ph, Icon }) => (
                      <div key={label}>
                        <label className="block text-[11px] font-semibold text-[var(--c13)] mb-1.5 uppercase tracking-wider">{label}</label>
                        <div className="relative">
                          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--c11)]" />
                          <input type={type} required value={val} onChange={e => set(e.target.value)} className={inputCls} placeholder={ph} />
                        </div>
                      </div>
                    ))}

                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--c13)] mb-1.5 uppercase tracking-wider">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--c11)]" />
                        <input type={showPwd ? 'text' : 'password'} required value={regPassword} onChange={e => setRegPassword(e.target.value)} className={`${inputCls} pr-9`} placeholder="Min. 6 characters" />
                        <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--c11)] hover:text-[var(--c18)] transition-colors">
                          {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[var(--c13)] mb-1.5 uppercase tracking-wider">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--c11)]" />
                        <input type={showPwd ? 'text' : 'password'} required value={regConfirm} onChange={e => setRegConfirm(e.target.value)} className={inputCls} placeholder="Re-enter password" />
                      </div>
                    </div>

                    <button type="submit" disabled={isLoading}
                      className="w-full py-2.5 px-4 bg-[var(--c18)] hover:opacity-90 text-white text-sm font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[var(--c16)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]">
                      {isLoading
                        ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating…</>
                        : <>Create Account <ChevronRight className="w-4 h-4" /></>}
                    </button>

                    <p className="text-center text-[11px] text-[var(--c13)]">
                      New accounts get <span className="text-[var(--c16)] font-semibold">Manager</span> role by default.
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
