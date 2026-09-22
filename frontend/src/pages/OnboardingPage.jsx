import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Check, ChevronLeft } from 'lucide-react';

const T = {
  ivory:'#F7F4EE', cream:'#EEE9E0', white:'#FCFAF7', dark:'#171B2B',
  coral:'#EA6678', blue:'#617BEA', teal:'#57B9AD', lavender:'#9C88D8', amber:'#E8B35B',
  txtPri:'#171925', txtSec:'#5D6170', txtMut:'#9097A8',
  borderH:'rgba(23,25,37,0.07)', borderS:'rgba(23,25,37,0.11)', borderM:'rgba(23,25,37,0.18)',
  display:"'Instrument Serif','DM Serif Display',Georgia,serif",
  ui:"'Manrope',-apple-system,sans-serif", mono:"'IBM Plex Mono','Courier New',monospace",
};

export default function OnboardingPage({ setActiveTab }) {
  const { currentUser, updateUserProfile, showToast } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roleOptions = [
    { id:'I CREATE IDEAS',    label:'Creator',  desc:'Share sparks and conceptual theses', color:T.coral },
    { id:'I REVIEW PROJECTS', label:'Reviewer', desc:'Provide rigorous peer feedback', color:T.teal },
    { id:'I BUILD PRODUCTS',  label:'Builder',  desc:'Architect MVPs and software systems', color:T.blue },
    { id:'I EXPLORE STARTUPS',label:'Explorer', desc:'Discover early-stage prototypes', color:T.lavender },
    { id:'I MENTOR / GUIDE',  label:'Mentor',   desc:'Offer domain mentorship and guidance', color:T.amber },
  ];

  const domainOptions = [
    'Technology','Healthcare','Education','Finance','Sustainability',
    'Entertainment','AI & Machine Learning','Design','Social Impact',
    'Cybersecurity','Productivity','Other'
  ];

  const [selectedRoles, setSelectedRoles] = useState(
    currentUser?.role && Array.isArray(currentUser.role) ? currentUser.role : ['I CREATE IDEAS']
  );
  const [selectedDomains, setSelectedDomains] = useState(currentUser?.interests || []);

  const toggleRole = id => {
    if (selectedRoles.includes(id)) {
      if (selectedRoles.length > 1) setSelectedRoles(selectedRoles.filter(r => r !== id));
    } else {
      setSelectedRoles([...selectedRoles, id]);
    }
  };

  const toggleDomain = d => {
    if (selectedDomains.includes(d)) {
      if (selectedDomains.length > 1) setSelectedDomains(selectedDomains.filter(x => x !== d));
    } else {
      setSelectedDomains([...selectedDomains, d]);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await updateUserProfile({
        role: selectedRoles,
        interests: selectedDomains.length > 0 ? selectedDomains : ['Technology'],
        bio: currentUser?.bio || 'Innovator and peer validator in the INNOVEXA ecosystem.',
        onboarding_completed: true,
      });
      showToast('Welcome to the network!', 'success');
      if (setActiveTab) setActiveTab('dashboard');
    } catch {
      showToast('Could not save preferences. Please try again.', 'error');
    } finally { setIsSubmitting(false); }
  };

  const pageVariants = {
    initial: { opacity:0, x:24 },
    animate: { opacity:1, x:0 },
    exit: { opacity:0, x:-24 },
  };

  return (
    <div style={{ minHeight:'100vh', backgroundColor:T.ivory, fontFamily:T.ui, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'2rem' }}>

      {/* Step indicator */}
      <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'3rem' }}>
        {[1,2,3].map((s, i) => (
          <React.Fragment key={s}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.35rem' }}>
              <div style={{
                width:'28px', height:'28px', borderRadius:'50%',
                backgroundColor: s <= step ? T.dark : T.cream,
                color: s <= step ? T.ivory : T.txtMut,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:T.mono, fontSize:'0.7rem', fontWeight:700,
                border: `1px solid ${s <= step ? T.dark : T.borderM}`,
                transition:'all 0.25s ease'
              }}>
                {s < step ? <Check size={12}/> : `0${s}`}
              </div>
              <span style={{ fontFamily:T.mono, fontSize:'0.65rem', color: s === step ? T.txtPri : T.txtMut, letterSpacing:'0.08em', textTransform:'uppercase', display: s === step ? 'block' : 'none' }}>
                {s === 1 ? 'Your Role' : s === 2 ? 'Your Focus' : 'Ready'}
              </span>
            </div>
            {i < 2 && <div style={{ width:'32px', height:'1px', backgroundColor: s < step ? T.dark : T.borderM, transition:'all 0.3s ease' }} />}
          </React.Fragment>
        ))}
      </div>

      {/* Card */}
      <div style={{ width:'100%', maxWidth:'580px' }}>
        <AnimatePresence mode="wait">

          {/* ── STEP 1 — ROLE ── */}
          {step === 1 && (
            <motion.div key="step1" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration:0.35, ease:[0.16,1,0.3,1] }}>
              <div style={{ fontFamily:T.mono, fontSize:'0.65rem', color:T.coral, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'1rem' }}>Step 01 / 03</div>
              <h1 style={{ fontFamily:T.display, fontWeight:400, fontSize:'clamp(2.2rem,5vw,3.2rem)', color:T.txtPri, letterSpacing:'-0.025em', lineHeight:1.05, marginBottom:'0.65rem' }}>
                WHAT PULLS YOUR<br/><span style={{ color:T.coral, fontStyle:'italic' }}>CURIOSITY?</span>
              </h1>
              <p style={{ fontFamily:T.ui, fontSize:'0.9rem', color:T.txtSec, lineHeight:1.6, marginBottom:'2rem' }}>
                Select how you participate in the network. You can choose multiple.
              </p>

              <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem', marginBottom:'2rem' }}>
                {roleOptions.map(opt => {
                  const isSelected = selectedRoles.includes(opt.id);
                  return (
                    <motion.button
                      key={opt.id}
                      onClick={() => toggleRole(opt.id)}
                      whileHover={{ x:2 }} whileTap={{ scale:0.99 }}
                      style={{
                        display:'flex', alignItems:'center', justifyContent:'space-between',
                        padding:'1rem 1.25rem',
                        backgroundColor: isSelected ? T.white : T.white,
                        border: `1px solid ${isSelected ? opt.color + '50' : T.borderH}`,
                        borderLeft: `3px solid ${isSelected ? opt.color : 'transparent'}`,
                        borderRadius:'10px',
                        cursor:'pointer', textAlign:'left',
                        boxShadow: isSelected ? `0 2px 12px ${opt.color}18` : 'none',
                        transition:'all 0.18s ease'
                      }}
                    >
                      <div>
                        <div style={{ fontFamily:T.ui, fontWeight:700, fontSize:'0.9rem', color: isSelected ? opt.color : T.txtPri, marginBottom:'0.2rem', transition:'color 0.15s ease' }}>{opt.label}</div>
                        <div style={{ fontFamily:T.ui, fontSize:'0.8rem', color:T.txtSec }}>{opt.desc}</div>
                      </div>
                      <div style={{
                        width:'20px', height:'20px', borderRadius:'50%', flexShrink:0,
                        border: `1.5px solid ${isSelected ? opt.color : T.borderM}`,
                        backgroundColor: isSelected ? opt.color : 'transparent',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        transition:'all 0.18s ease'
                      }}>
                        {isSelected && <Check size={11} color="#fff" strokeWidth={3}/>}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <motion.button
                onClick={() => { if (selectedRoles.length > 0) setStep(2); else showToast('Select at least one role.','warning'); }}
                whileHover={{ scale:1.02, y:-1 }} whileTap={{ scale:0.98 }}
                style={{ width:'100%', fontFamily:T.ui, fontWeight:700, fontSize:'0.95rem', backgroundColor:T.dark, color:T.ivory, border:'none', borderRadius:'8px', padding:'0.9rem 1.5rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.45rem', boxShadow:'0 4px 16px rgba(23,25,37,0.14)' }}
              >NEXT STEP <ArrowRight size={15}/></motion.button>
            </motion.div>
          )}

          {/* ── STEP 2 — DOMAINS ── */}
          {step === 2 && (
            <motion.div key="step2" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration:0.35, ease:[0.16,1,0.3,1] }}>
              <div style={{ fontFamily:T.mono, fontSize:'0.65rem', color:T.blue, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'1rem' }}>Step 02 / 03</div>
              <h1 style={{ fontFamily:T.display, fontWeight:400, fontSize:'clamp(2.2rem,5vw,3.2rem)', color:T.txtPri, letterSpacing:'-0.025em', lineHeight:1.05, marginBottom:'0.65rem' }}>
                HOW DO YOU<br/><span style={{ color:T.blue, fontStyle:'italic' }}>PARTICIPATE?</span>
              </h1>
              <p style={{ fontFamily:T.ui, fontSize:'0.9rem', color:T.txtSec, lineHeight:1.6, marginBottom:'2rem' }}>
                Choose the domains that pull your curiosity. Select all that apply.
              </p>

              <div style={{ display:'flex', flexWrap:'wrap', gap:'0.65rem', marginBottom:'2rem' }}>
                {domainOptions.map(d => {
                  const isSelected = selectedDomains.includes(d);
                  return (
                    <motion.button
                      key={d}
                      onClick={() => toggleDomain(d)}
                      whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                      style={{
                        fontFamily:T.ui, fontWeight:600, fontSize:'0.84rem',
                        padding:'0.55rem 1rem',
                        backgroundColor: isSelected ? T.dark : T.white,
                        color: isSelected ? T.ivory : T.txtSec,
                        border: `1px solid ${isSelected ? T.dark : T.borderS}`,
                        borderRadius:'var(--radius-full,9999px)',
                        cursor:'pointer', transition:'all 0.18s ease',
                        boxShadow: isSelected ? '0 2px 8px rgba(23,25,37,0.15)' : 'none',
                      }}
                    >{d}</motion.button>
                  );
                })}
              </div>

              <div style={{ display:'flex', gap:'0.75rem' }}>
                <button onClick={() => setStep(1)} style={{ flex:1, fontFamily:T.ui, fontWeight:600, fontSize:'0.875rem', backgroundColor:'transparent', color:T.txtSec, border:`1px solid ${T.borderM}`, borderRadius:'8px', padding:'0.85rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.35rem', transition:'all 0.15s ease' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor=T.cream}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor='transparent'}
                ><ChevronLeft size={14}/> Back</button>
                <motion.button
                  onClick={() => { if (selectedDomains.length > 0) setStep(3); else showToast('Select at least one domain.','warning'); }}
                  whileHover={{ scale:1.02, y:-1 }} whileTap={{ scale:0.98 }}
                  style={{ flex:3, fontFamily:T.ui, fontWeight:700, fontSize:'0.95rem', backgroundColor:T.dark, color:T.ivory, border:'none', borderRadius:'8px', padding:'0.85rem 1.5rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.45rem', boxShadow:'0 4px 16px rgba(23,25,37,0.14)' }}
                >NEXT STEP <ArrowRight size={15}/></motion.button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3 — READY ── */}
          {step === 3 && (
            <motion.div key="step3" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration:0.35, ease:[0.16,1,0.3,1] }} style={{ textAlign:'center' }}>
              <motion.div
                initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }} transition={{ duration:0.5, ease:[0.16,1,0.3,1] }}
                style={{ width:'72px', height:'72px', borderRadius:'50%', backgroundColor:T.teal, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.5rem' }}
              >
                <Check size={32} color="#fff" strokeWidth={2.5}/>
              </motion.div>

              <div style={{ fontFamily:T.mono, fontSize:'0.65rem', color:T.teal, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'1rem' }}>Step 03 / 03</div>
              <h1 style={{ fontFamily:T.display, fontWeight:400, fontSize:'clamp(2.4rem,5vw,3.4rem)', color:T.txtPri, letterSpacing:'-0.025em', lineHeight:1.05, marginBottom:'0.75rem' }}>
                YOUR SPACE<br/><span style={{ color:T.teal, fontStyle:'italic' }}>IS READY.</span>
              </h1>
              <p style={{ fontFamily:T.ui, fontSize:'0.9rem', color:T.txtSec, lineHeight:1.65, marginBottom:'0.5rem' }}>
                Welcome, <strong style={{ color:T.txtPri }}>{currentUser?.full_name || currentUser?.name || 'Innovator'}</strong>.
              </p>
              <p style={{ fontFamily:T.ui, fontSize:'0.875rem', color:T.txtMut, lineHeight:1.6, marginBottom:'2rem' }}>
                Your profile is configured with {selectedRoles.length} role{selectedRoles.length !== 1 ? 's' : ''} and {selectedDomains.length} domain{selectedDomains.length !== 1 ? 's' : ''}. You can always update this in Settings.
              </p>

              {/* Summary pills */}
              <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem', justifyContent:'center', marginBottom:'2rem' }}>
                {selectedRoles.map(r => (
                  <span key={r} style={{ fontFamily:T.mono, fontSize:'0.64rem', letterSpacing:'0.06em', textTransform:'uppercase', padding:'0.28rem 0.75rem', backgroundColor:T.coral+'18', color:T.coral, borderRadius:'9999px', border:`1px solid ${T.coral}28` }}>{r}</span>
                ))}
                {selectedDomains.slice(0,4).map(d => (
                  <span key={d} style={{ fontFamily:T.mono, fontSize:'0.64rem', letterSpacing:'0.06em', textTransform:'uppercase', padding:'0.28rem 0.75rem', backgroundColor:T.blue+'15', color:T.blue, borderRadius:'9999px', border:`1px solid ${T.blue}25` }}>{d}</span>
                ))}
              </div>

              <div style={{ display:'flex', gap:'0.75rem' }}>
                <button onClick={() => setStep(2)} style={{ flex:1, fontFamily:T.ui, fontWeight:600, fontSize:'0.875rem', backgroundColor:'transparent', color:T.txtSec, border:`1px solid ${T.borderM}`, borderRadius:'8px', padding:'0.85rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.35rem', transition:'all 0.15s ease' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor=T.cream}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor='transparent'}
                ><ChevronLeft size={14}/> Back</button>
                <motion.button
                  onClick={handleComplete}
                  disabled={isSubmitting}
                  whileHover={!isSubmitting ? { scale:1.02, y:-1 } : {}}
                  whileTap={!isSubmitting ? { scale:0.98 } : {}}
                  style={{
                    flex:3, fontFamily:T.ui, fontWeight:700, fontSize:'0.95rem',
                    backgroundColor: isSubmitting ? T.txtMut : T.coral,
                    color:'#fff', border:'none', borderRadius:'8px',
                    padding:'0.85rem 1.5rem', cursor: isSubmitting ? 'wait' : 'pointer',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:'0.45rem',
                    boxShadow: isSubmitting ? 'none' : '0 4px 16px rgba(234,102,120,0.25)',
                    transition:'all 0.18s ease'
                  }}
                >{isSubmitting ? 'Saving...' : <>ENTER THE NETWORK <ArrowRight size={15}/></>}</motion.button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
