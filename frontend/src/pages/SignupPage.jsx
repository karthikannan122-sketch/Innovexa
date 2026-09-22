import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ArrowUpRight, Eye, EyeOff, ArrowLeft, Mail, Lock, User, AlertCircle } from 'lucide-react';

const T = {
  ivory:'#F7F4EE', cream:'#EEE9E0', white:'#FCFAF7', dark:'#171B2B',
  coral:'#EA6678', blue:'#617BEA', teal:'#57B9AD', amber:'#E8B35B',
  txtPri:'#171925', txtSec:'#5D6170', txtMut:'#9097A8',
  borderH:'rgba(23,25,37,0.07)', borderS:'rgba(23,25,37,0.11)', borderM:'rgba(23,25,37,0.18)',
  display:"'Instrument Serif','DM Serif Display',Georgia,serif",
  ui:"'Manrope',-apple-system,sans-serif", mono:"'IBM Plex Mono','Courier New',monospace",
};

export default function SignupPage({ setActiveTab }) {
  const navigate = useNavigate();
  const { signup, showToast } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const go = (path, tab) => { if (navigate) navigate(path); else if (setActiveTab) setActiveTab(tab); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      const err = 'Please fill in all fields.';
      setErrorMessage(err); showToast(err, 'warning'); return;
    }
    if (password !== confirmPassword) {
      const err = 'Passwords do not match.';
      setErrorMessage(err); showToast(err, 'warning'); return;
    }
    if (password.length < 8) {
      const err = 'Password must be at least 8 characters.';
      setErrorMessage(err); showToast(err, 'warning'); return;
    }
    setIsSubmitting(true);
    try {
      const res = await signup({ email: email.trim(), password, fullName: fullName.trim() });
      if (res.success) {
        showToast('Account created! Let\'s set up your profile.', 'success');
        go('/onboarding', 'onboarding');
      } else {
        const err = res.error || 'Could not create account. Please try again.';
        setErrorMessage(err); showToast(err, 'error');
      }
    } catch {
      const err = 'Something went wrong. Please try again.';
      setErrorMessage(err); showToast(err, 'error');
    } finally { setIsSubmitting(false); }
  };

  const fieldStyle = {
    width:'100%', fontFamily:T.ui, fontSize:'0.9rem', color:T.txtPri,
    backgroundColor:T.white, border:`1px solid ${T.borderS}`, borderRadius:'7px',
    padding:'0.72rem 0.9rem 0.72rem 2.4rem', outline:'none', transition:'all 0.18s ease'
  };
  const labelStyle = { fontFamily:T.mono, fontSize:'0.68rem', letterSpacing:'0.09em', textTransform:'uppercase', color:T.txtPri, display:'block', marginBottom:'0.4rem' };
  const handleFocus = e => { e.target.style.borderColor=T.coral; e.target.style.boxShadow='0 0 0 3px rgba(234,102,120,0.12)'; };
  const handleBlur  = e => { e.target.style.borderColor=T.borderS; e.target.style.boxShadow='none'; };

  return (
    <div style={{ minHeight:'100vh', backgroundColor:T.ivory, display:'grid', gridTemplateColumns:'1fr 1fr', fontFamily:T.ui }}>

      {/* Left — editorial panel */}
      <motion.div
        initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ duration:0.65, ease:[0.16,1,0.3,1] }}
        style={{ backgroundColor:T.dark, padding:'3rem', display:'flex', flexDirection:'column', position:'relative', overflow:'hidden', minHeight:'100vh' }}
        className="hidden md:flex"
      >
        <div style={{ position:'absolute', bottom:'-1.5rem', right:'-1rem', fontFamily:T.display, fontStyle:'italic', fontSize:'clamp(10rem,18vw,22rem)', color:'rgba(255,255,255,0.025)', letterSpacing:'-0.05em', lineHeight:1, userSelect:'none' }}>
          IX
        </div>

        <div style={{ display:'flex', alignItems:'baseline', gap:'0.4rem', marginBottom:'auto' }}>
          <span style={{ fontFamily:T.mono, fontSize:'0.6rem', color:T.coral }}>✦</span>
          <span style={{ fontFamily:T.display, fontSize:'1.25rem', color:'#FFFFFF', letterSpacing:'-0.02em' }}>INNOVEXA</span>
        </div>

        <div style={{ marginBottom:'auto', paddingTop:'4rem' }}>
          <div style={{ fontFamily:T.mono, fontSize:'0.65rem', color:T.coral, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'1.25rem' }}>
            01 / JOIN THE NETWORK
          </div>
          <h1 style={{ fontFamily:T.display, fontWeight:400, fontSize:'clamp(2.5rem,5vw,4.2rem)', color:'#FFFFFF', letterSpacing:'-0.025em', lineHeight:0.97, marginBottom:'1.25rem' }}>
            JOIN<br/>THE<br/><span style={{ color:T.coral, fontStyle:'italic' }}>NETWORK.</span>
          </h1>
          <p style={{ fontFamily:T.ui, fontSize:'0.92rem', color:'rgba(255,255,255,0.48)', lineHeight:1.65, maxWidth:'340px' }}>
            Create your place in a global community of innovators, validators, and builders.
          </p>
        </div>

        {/* Feature list */}
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:'1.5rem', display:'flex', flexDirection:'column', gap:'0.65rem' }}>
          {[
            { dot:T.coral, text:'Structured innovation framework' },
            { dot:T.teal, text:'Peer rubric review network' },
            { dot:T.amber, text:'AI market analysis telemetry' },
            { dot:T.blue, text:'Global discovery registry' },
          ].map(({ dot, text }) => (
            <div key={text} style={{ display:'flex', alignItems:'center', gap:'0.65rem' }}>
              <div style={{ width:'6px', height:'6px', borderRadius:'50%', backgroundColor:dot, flexShrink:0 }} />
              <span style={{ fontFamily:T.ui, fontSize:'0.84rem', color:'rgba(255,255,255,0.5)' }}>{text}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Right — form */}
      <motion.div
        initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.6, delay:0.1, ease:[0.16,1,0.3,1] }}
        style={{ display:'flex', flexDirection:'column', justifyContent:'center', padding:'3rem 2.5rem', minHeight:'100vh', backgroundColor:T.ivory }}
      >
        <div style={{ maxWidth:'400px', width:'100%', margin:'0 auto' }}>
          <button onClick={() => go('/','landing')} style={{ display:'flex', alignItems:'center', gap:'0.4rem', fontFamily:T.mono, fontSize:'0.65rem', color:T.txtMut, letterSpacing:'0.08em', textTransform:'uppercase', background:'none', border:'none', cursor:'pointer', marginBottom:'2.5rem', transition:'color 0.15s ease' }}
            onMouseEnter={e => e.currentTarget.style.color=T.txtSec}
            onMouseLeave={e => e.currentTarget.style.color=T.txtMut}
          ><ArrowLeft size={13}/> Back to home</button>

          <div style={{ fontFamily:T.mono, fontSize:'0.65rem', color:T.coral, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'0.85rem' }}>Create Account</div>
          <h2 style={{ fontFamily:T.display, fontSize:'clamp(1.9rem,3.5vw,2.6rem)', color:T.txtPri, letterSpacing:'-0.025em', lineHeight:1.05, marginBottom:'0.55rem' }}>
            Start building today.
          </h2>
          <p style={{ fontFamily:T.ui, fontSize:'0.875rem', color:T.txtSec, lineHeight:1.6, marginBottom:'1.85rem' }}>
            Already a member?{' '}
            <button onClick={() => go('/login','login')} style={{ background:'none', border:'none', cursor:'pointer', fontFamily:T.ui, fontSize:'0.875rem', color:T.coral, fontWeight:600, textDecoration:'underline', textUnderlineOffset:'2px' }}>Sign in</button>
          </p>

          {errorMessage && (
            <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', padding:'0.8rem 1rem', backgroundColor:'#FEF0F2', border:'1px solid rgba(234,102,120,0.25)', borderRadius:'8px', marginBottom:'1.25rem' }}>
              <AlertCircle size={15} color={T.coral} style={{ flexShrink:0 }}/>
              <span style={{ fontFamily:T.ui, fontSize:'0.82rem', color:'#C03048' }}>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            {/* Full Name */}
            <div>
              <label style={labelStyle}>Full Name</label>
              <div style={{ position:'relative' }}>
                <User size={15} color={T.txtMut} style={{ position:'absolute', left:'0.85rem', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Ada Lovelace" required style={fieldStyle} onFocus={handleFocus} onBlur={handleBlur}/>
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>Email Address</label>
              <div style={{ position:'relative' }}>
                <Mail size={15} color={T.txtMut} style={{ position:'absolute', left:'0.85rem', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ada@example.com" required style={fieldStyle} onFocus={handleFocus} onBlur={handleBlur}/>
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position:'relative' }}>
                <Lock size={15} color={T.txtMut} style={{ position:'absolute', left:'0.85rem', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" required style={{ ...fieldStyle, paddingRight:'2.8rem' }} onFocus={handleFocus} onBlur={handleBlur}/>
                <button type="button" onClick={() => setShowPw(p => !p)} style={{ position:'absolute', right:'0.85rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:T.txtMut, display:'flex' }}>
                  {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label style={labelStyle}>Confirm Password</label>
              <div style={{ position:'relative' }}>
                <Lock size={15} color={T.txtMut} style={{ position:'absolute', left:'0.85rem', top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat password" required style={fieldStyle} onFocus={handleFocus} onBlur={handleBlur}/>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileHover={!isSubmitting ? { scale:1.02, y:-1 } : {}}
              whileTap={!isSubmitting ? { scale:0.98 } : {}}
              style={{
                width:'100%', fontFamily:T.ui, fontWeight:700, fontSize:'0.95rem',
                backgroundColor: isSubmitting ? T.txtMut : T.coral,
                color:'#fff', border:'none', borderRadius:'8px',
                padding:'0.9rem 1.5rem', cursor: isSubmitting ? 'wait' : 'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', gap:'0.45rem',
                boxShadow: isSubmitting ? 'none' : '0 4px 16px rgba(234,102,120,0.25)',
                transition:'all 0.18s ease', marginTop:'0.2rem'
              }}
            >
              {isSubmitting ? 'Creating account...' : <>CREATE ACCOUNT <ArrowUpRight size={15}/></>}
            </motion.button>
          </form>

          <p style={{ textAlign:'center', marginTop:'1.25rem', fontFamily:T.ui, fontSize:'0.76rem', color:T.txtMut, lineHeight:1.5 }}>
            By creating an account, you agree to our{' '}
            <span style={{ color:T.txtSec, textDecoration:'underline', cursor:'pointer', textUnderlineOffset:'2px' }}>Terms of Service</span>{' '}and{' '}
            <span style={{ color:T.txtSec, textDecoration:'underline', cursor:'pointer', textUnderlineOffset:'2px' }}>Privacy Policy</span>.
          </p>

          <div style={{ textAlign:'center', marginTop:'1rem', fontFamily:T.mono, fontSize:'0.62rem', color:T.txtMut, letterSpacing:'0.07em' }}>
            SECURED · SUPABASE AUTHENTICATION
          </div>
        </div>
      </motion.div>
    </div>
  );
}
