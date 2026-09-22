import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ArrowUpRight, Eye, EyeOff, ArrowLeft, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

const T = {
  ivory:'#F7F4EE', cream:'#EEE9E0', white:'#FCFAF7', dark:'#171B2B',
  coral:'#EA6678', blue:'#617BEA', teal:'#57B9AD',
  txtPri:'#171925', txtSec:'#5D6170', txtMut:'#9097A8',
  borderH:'rgba(23,25,37,0.07)', borderS:'rgba(23,25,37,0.11)', borderM:'rgba(23,25,37,0.18)',
  display:"'Instrument Serif','DM Serif Display',Georgia,serif",
  ui:"'Manrope',-apple-system,sans-serif", mono:"'IBM Plex Mono','Courier New',monospace",
};

export default function LoginPage({ setActiveTab }) {
  const navigate = useNavigate();
  const { login, resetPassword, redirectPath, setRedirectPath, showToast } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const go = (path, tab) => { if (navigate) navigate(path); else if (setActiveTab) setActiveTab(tab); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email.trim() || !password.trim()) {
      const err = 'Please enter your email and password.';
      setErrorMessage(err); showToast(err, 'warning'); return;
    }
    setIsSubmitting(true);
    try {
      const res = await login({ email: email.trim(), password });
      if (res.success) {
        const isDone = res.onboarding_completed ?? res.user?.onboarding_completed;
        if (!isDone) { go('/onboarding', 'onboarding'); }
        else if (redirectPath) { const d = redirectPath; setRedirectPath(null); go(d, d.slice(1)); }
        else { go('/home', 'dashboard'); }
      } else {
        const err = res.error || 'Invalid credentials. Please try again.';
        setErrorMessage(err); showToast(err, 'error');
      }
    } catch (err) {
      const msg = 'Something went wrong. Please try again.';
      setErrorMessage(msg); showToast(msg, 'error');
    } finally { setIsSubmitting(false); }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) { showToast('Please enter your email.', 'warning'); return; }
    setIsResetSubmitting(true);
    try {
      const res = await resetPassword(forgotEmail.trim());
      if (res.success) { setResetSuccess(true); showToast('Reset link sent to your email.', 'success'); }
      else { showToast(res.error || 'Could not send reset link.', 'error'); }
    } catch { showToast('Something went wrong.', 'error'); }
    finally { setIsResetSubmitting(false); }
  };

  return (
    <div style={{ minHeight:'100vh', backgroundColor:T.ivory, display:'grid', gridTemplateColumns:'1fr 1fr', fontFamily:T.ui }}>

      {/* Left — editorial panel */}
      <motion.div
        initial={{ opacity:0, x:-20 }}
        animate={{ opacity:1, x:0 }}
        transition={{ duration:0.65, ease:[0.16,1,0.3,1] }}
        style={{ backgroundColor:T.dark, padding:'3rem', display:'flex', flexDirection:'column', position:'relative', overflow:'hidden', minHeight:'100vh' }}
        className="hidden md:flex"
      >
        {/* Watermark */}
        <div style={{ position:'absolute', bottom:'-1rem', right:'-1rem', fontFamily:T.display, fontStyle:'italic', fontSize:'clamp(10rem,18vw,20rem)', color:'rgba(255,255,255,0.03)', letterSpacing:'-0.05em', lineHeight:1, userSelect:'none' }}>
          IX
        </div>

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'baseline', gap:'0.4rem', marginBottom:'auto' }}>
          <span style={{ fontFamily:T.mono, fontSize:'0.6rem', color:T.coral }}>✦</span>
          <span style={{ fontFamily:T.display, fontSize:'1.25rem', color:'#FFFFFF', letterSpacing:'-0.02em' }}>INNOVEXA</span>
        </div>

        {/* Main copy */}
        <div style={{ marginBottom:'auto', paddingTop:'4rem' }}>
          <div style={{ fontFamily:T.mono, fontSize:'0.65rem', color:T.coral, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'1.25rem' }}>
            02 / WELCOME BACK
          </div>
          <h1 style={{ fontFamily:T.display, fontWeight:400, fontSize:'clamp(2.5rem,5vw,4rem)', color:'#FFFFFF', letterSpacing:'-0.025em', lineHeight:1.0, marginBottom:'1.25rem' }}>
            WELCOME<br/>BACK TO<br/><span style={{ color:T.coral, fontStyle:'italic' }}>THE CONVERSATION.</span>
          </h1>
          <p style={{ fontFamily:T.ui, fontSize:'0.95rem', color:'rgba(255,255,255,0.5)', lineHeight:1.65, maxWidth:'360px' }}>
            Your ideas, your reviews, your community — all waiting where you left them.
          </p>
        </div>

        {/* Bottom strip */}
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:'1.5rem', display:'flex', gap:'2rem' }}>
          {[
            { v:'100%', l:'Validation integrity' },
            { v:'Open', l:'Registry access' },
          ].map(({ v, l }) => (
            <div key={l}>
              <div style={{ fontFamily:T.display, fontStyle:'italic', fontSize:'1.5rem', color:T.coral }}>{v}</div>
              <div style={{ fontFamily:T.mono, fontSize:'0.62rem', color:'rgba(255,255,255,0.3)', letterSpacing:'0.08em', textTransform:'uppercase', marginTop:'0.2rem' }}>{l}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Right — form panel */}
      <motion.div
        initial={{ opacity:0, y:18 }}
        animate={{ opacity:1, y:0 }}
        transition={{ duration:0.6, delay:0.1, ease:[0.16,1,0.3,1] }}
        style={{ display:'flex', flexDirection:'column', justifyContent:'center', padding:'3rem 2.5rem', minHeight:'100vh', backgroundColor:T.ivory }}
      >
        <div style={{ maxWidth:'400px', width:'100%', margin:'0 auto' }}>
          {/* Back link */}
          <button onClick={() => go('/','landing')} style={{ display:'flex', alignItems:'center', gap:'0.4rem', fontFamily:T.mono, fontSize:'0.65rem', color:T.txtMut, letterSpacing:'0.08em', textTransform:'uppercase', background:'none', border:'none', cursor:'pointer', marginBottom:'2.5rem', transition:'color 0.15s ease' }}
            onMouseEnter={e => e.currentTarget.style.color=T.txtSec}
            onMouseLeave={e => e.currentTarget.style.color=T.txtMut}
          >
            <ArrowLeft size={13}/> Back to home
          </button>

          <div style={{ fontFamily:T.mono, fontSize:'0.65rem', color:T.coral, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'1rem' }}>Login</div>
          <h2 style={{ fontFamily:T.display, fontSize:'clamp(2rem,3.5vw,2.75rem)', color:T.txtPri, letterSpacing:'-0.025em', lineHeight:1.05, marginBottom:'0.65rem' }}>
            Sign in to your account.
          </h2>
          <p style={{ fontFamily:T.ui, fontSize:'0.9rem', color:T.txtSec, lineHeight:1.6, marginBottom:'2rem' }}>
            Don't have an account?{' '}
            <button onClick={() => go('/signup','signup')} style={{ background:'none', border:'none', cursor:'pointer', fontFamily:T.ui, fontSize:'0.9rem', color:T.coral, fontWeight:600, textDecoration:'underline', textUnderlineOffset:'2px' }}>
              Create one free
            </button>
          </p>

          {errorMessage && (
            <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', padding:'0.8rem 1rem', backgroundColor:'#FEF0F2', border:'1px solid rgba(234,102,120,0.25)', borderRadius:'8px', marginBottom:'1.25rem' }}>
              <AlertCircle size={15} color={T.coral} style={{ flexShrink:0 }}/>
              <span style={{ fontFamily:T.ui, fontSize:'0.82rem', color:'#C03048' }}>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1.1rem' }}>
            {/* Email */}
            <div>
              <label style={{ fontFamily:T.mono, fontSize:'0.68rem', letterSpacing:'0.09em', textTransform:'uppercase', color:T.txtPri, display:'block', marginBottom:'0.4rem' }}>Email Address</label>
              <div style={{ position:'relative' }}>
                <Mail size={15} color={T.txtMut} style={{ position:'absolute', left:'0.85rem', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
                  style={{ width:'100%', fontFamily:T.ui, fontSize:'0.9rem', color:T.txtPri, backgroundColor:T.white, border:`1px solid ${T.borderS}`, borderRadius:'7px', padding:'0.72rem 0.9rem 0.72rem 2.4rem', outline:'none', transition:'all 0.18s ease' }}
                  onFocus={e => { e.target.style.borderColor=T.coral; e.target.style.boxShadow='0 0 0 3px rgba(234,102,120,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor=T.borderS; e.target.style.boxShadow='none'; }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.4rem' }}>
                <label style={{ fontFamily:T.mono, fontSize:'0.68rem', letterSpacing:'0.09em', textTransform:'uppercase', color:T.txtPri }}>Password</label>
                <button type="button" onClick={() => setIsForgotModalOpen(true)} style={{ background:'none', border:'none', cursor:'pointer', fontFamily:T.mono, fontSize:'0.62rem', color:T.blue, letterSpacing:'0.05em', textTransform:'uppercase', transition:'color 0.15s ease' }}
                  onMouseEnter={e => e.currentTarget.style.color=T.coral}
                  onMouseLeave={e => e.currentTarget.style.color=T.blue}
                >Forgot?</button>
              </div>
              <div style={{ position:'relative' }}>
                <Lock size={15} color={T.txtMut} style={{ position:'absolute', left:'0.85rem', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                  style={{ width:'100%', fontFamily:T.ui, fontSize:'0.9rem', color:T.txtPri, backgroundColor:T.white, border:`1px solid ${T.borderS}`, borderRadius:'7px', padding:'0.72rem 2.8rem 0.72rem 2.4rem', outline:'none', transition:'all 0.18s ease' }}
                  onFocus={e => { e.target.style.borderColor=T.coral; e.target.style.boxShadow='0 0 0 3px rgba(234,102,120,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor=T.borderS; e.target.style.boxShadow='none'; }}
                />
                <button type="button" onClick={() => setShowPw(p => !p)} style={{ position:'absolute', right:'0.85rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:T.txtMut, display:'flex' }}>
                  {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={!isSubmitting ? { scale:1.02, y:-1 } : {}}
              whileTap={!isSubmitting ? { scale:0.98 } : {}}
              style={{
                width:'100%', fontFamily:T.ui, fontWeight:700, fontSize:'0.95rem',
                backgroundColor: isSubmitting ? T.txtMut : T.dark,
                color:T.ivory, border:'none', borderRadius:'8px',
                padding:'0.9rem 1.5rem', cursor: isSubmitting ? 'wait' : 'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:'0.45rem',
                boxShadow: isSubmitting ? 'none' : '0 4px 16px rgba(23,25,37,0.15)',
                transition:'all 0.18s ease', marginTop:'0.25rem'
              }}
            >
              {isSubmitting ? 'Signing in...' : <>ENTER THE NETWORK <ArrowUpRight size={15}/></>}
            </motion.button>
          </form>

          <div style={{ textAlign:'center', marginTop:'1.5rem', fontFamily:T.mono, fontSize:'0.63rem', color:T.txtMut, letterSpacing:'0.07em' }}>
            SECURED · SUPABASE AUTHENTICATION
          </div>
        </div>
      </motion.div>

      {/* Forgot password modal */}
      {isForgotModalOpen && (
        <div style={{ position:'fixed', inset:0, backgroundColor:'rgba(23,25,37,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, backdropFilter:'blur(4px)' }}
          onClick={() => { setIsForgotModalOpen(false); setResetSuccess(false); setForgotEmail(''); }}>
          <motion.div
            initial={{ opacity:0, scale:0.95, y:12 }}
            animate={{ opacity:1, scale:1, y:0 }}
            exit={{ opacity:0, scale:0.95 }}
            transition={{ duration:0.25 }}
            onClick={e => e.stopPropagation()}
            style={{ backgroundColor:T.white, borderRadius:'16px', border:`1px solid ${T.borderS}`, boxShadow:'0 24px 72px rgba(23,25,37,0.18)', padding:'2rem', width:'100%', maxWidth:'400px' }}
          >
            {!resetSuccess ? (
              <>
                <h3 style={{ fontFamily:T.display, fontSize:'1.6rem', color:T.txtPri, letterSpacing:'-0.02em', marginBottom:'0.5rem' }}>Reset Password</h3>
                <p style={{ fontFamily:T.ui, fontSize:'0.875rem', color:T.txtSec, lineHeight:1.55, marginBottom:'1.5rem' }}>Enter your email and we'll send a reset link.</p>
                <form onSubmit={handleForgot} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                  <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="you@example.com" required
                    style={{ fontFamily:T.ui, fontSize:'0.9rem', color:T.txtPri, backgroundColor:T.ivory, border:`1px solid ${T.borderS}`, borderRadius:'7px', padding:'0.72rem 1rem', outline:'none', width:'100%', transition:'all 0.18s ease' }}
                    onFocus={e => { e.target.style.borderColor=T.coral; e.target.style.boxShadow='0 0 0 3px rgba(234,102,120,0.12)'; }}
                    onBlur={e => { e.target.style.borderColor=T.borderS; e.target.style.boxShadow='none'; }}
                  />
                  <div style={{ display:'flex', gap:'0.75rem' }}>
                    <button type="button" onClick={() => setIsForgotModalOpen(false)} style={{ flex:1, fontFamily:T.ui, fontWeight:600, fontSize:'0.875rem', backgroundColor:'transparent', color:T.txtSec, border:`1px solid ${T.borderM}`, borderRadius:'7px', padding:'0.72rem', cursor:'pointer', transition:'all 0.15s ease' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor=T.cream}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor='transparent'}
                    >Cancel</button>
                    <button type="submit" disabled={isResetSubmitting}
                      style={{ flex:2, fontFamily:T.ui, fontWeight:700, fontSize:'0.875rem', backgroundColor:T.coral, color:'#fff', border:'none', borderRadius:'7px', padding:'0.72rem', cursor: isResetSubmitting ? 'wait' : 'pointer', opacity: isResetSubmitting ? 0.7 : 1 }}
                    >{isResetSubmitting ? 'Sending...' : 'Send Reset Link'}</button>
                  </div>
                </form>
              </>
            ) : (
              <div style={{ textAlign:'center', padding:'0.5rem 0' }}>
                <CheckCircle2 size={40} color={T.teal} style={{ margin:'0 auto 1rem' }}/>
                <h3 style={{ fontFamily:T.display, fontSize:'1.5rem', color:T.txtPri, letterSpacing:'-0.02em', marginBottom:'0.5rem' }}>Reset link sent!</h3>
                <p style={{ fontFamily:T.ui, fontSize:'0.875rem', color:T.txtSec, marginBottom:'1.5rem' }}>Check your inbox for {forgotEmail}.</p>
                <button onClick={() => { setIsForgotModalOpen(false); setResetSuccess(false); setForgotEmail(''); }} style={{ fontFamily:T.ui, fontWeight:700, fontSize:'0.875rem', backgroundColor:T.dark, color:T.ivory, border:'none', borderRadius:'7px', padding:'0.72rem 1.5rem', cursor:'pointer' }}>Done</button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
