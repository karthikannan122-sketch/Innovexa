import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowUpRight, ArrowRight, Key, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * LoginPage — Real User Authentication Flow connected to Supabase
 * Heading: WELCOME BACK.
 * Supporting: The network is waiting for your perspective.
 * Fields: EMAIL ADDRESS, PASSWORD, Forgot Password?
 * Button: ENTER THE NETWORK ↗
 * Link: New to INNOVEXA? CREATE ACCOUNT ↗
 */
export default function LoginPage({ setActiveTab }) {
  const { login, resetPassword, redirectPath, setRedirectPath, showToast } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Forgot password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);
  const [resetSuccessNotice, setResetSuccessNotice] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password.trim()) {
      const err = 'Please enter your email and password.';
      setErrorMessage(err);
      showToast(err, 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login({ email: email.trim(), password: password });

      if (res.success) {
        const isDone = res.onboarding_completed ?? res.user?.onboarding_completed;
        if (!isDone) {
          setActiveTab('onboarding');
        } else if (redirectPath) {
          const dest = redirectPath;
          setRedirectPath(null);
          setActiveTab(dest);
        } else {
          setActiveTab('dashboard');
        }
      } else {
        setErrorMessage(res.error || 'Invalid credentials. Please verify your email and password.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'An unexpected error occurred during login.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      showToast('Please enter your registered email address.', 'warning');
      return;
    }

    setIsResetSubmitting(true);
    try {
      const res = await resetPassword(forgotEmail.trim());
      if (res.success) {
        setResetSuccessNotice(true);
      }
    } finally {
      setIsResetSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '88vh', display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-ivory)', padding: '3rem 0' }}>
      <div className="workspace-container" style={{ maxWidth: '1080px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '4rem', alignItems: 'center' }}>
          
          {/* Left Column: Statement */}
          <div>
            <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '1rem' }}>
              01 / VALIDATOR GATEWAY
            </div>

            {/* Exact Required Heading */}
            <div style={{ lineHeight: 0.98, marginBottom: '2rem' }}>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(3.5rem, 7vw, 5.6rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
                WELCOME
              </div>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(3.5rem, 7vw, 5.6rem)', fontWeight: 800, color: 'var(--coral)', fontStyle: 'italic', margin: '0.2rem 0' }}>
                BACK.
              </div>
            </div>

            {/* Exact Supporting Text */}
            <p className="editorial-lead" style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
              The network is waiting for your perspective.
            </p>

            <div style={{ padding: '1.75rem', backgroundColor: 'var(--bg-cream)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.45rem' }}>
                ✦ CITIZEN LEDGER
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5 }}>
                Log in with your verified credentials to review assigned innovations, inspect validation reports, and track peer feedback.
              </p>
            </div>
          </div>

          {/* Right Column: Real Login Form */}
          <div className="editorial-card" style={{ padding: '3rem', backgroundColor: 'var(--bg-white)', borderLeft: '4px solid var(--coral)' }}>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.85rem', marginBottom: '0.4rem' }}>Sign In</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                Enter your account email and password to access the network.
              </p>
            </div>

            {/* Error Message Banner */}
            {errorMessage && (
              <div style={{ backgroundColor: 'rgba(231, 111, 130, 0.1)', border: '1px solid rgba(231, 111, 130, 0.3)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--red)', fontSize: '0.86rem', marginBottom: '1.25rem' }}>
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
              {/* EMAIL ADDRESS */}
              <div className="form-group">
                <label className="form-label">EMAIL ADDRESS</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className="form-input"
                  required
                  autoFocus
                />
              </div>

              {/* PASSWORD + Forgot Link */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>PASSWORD</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotModalOpen(true);
                      setForgotEmail(email);
                      setResetSuccessNotice(false);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      fontSize: '0.78rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--coral)',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="form-input"
                  required
                />
              </div>

              {/* Exact Primary Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-coral btn-lg"
                style={{
                  width: '100%',
                  marginTop: '0.5rem',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {isSubmitting ? 'AUTHENTICATING...' : 'ENTER THE NETWORK ↗'}
              </button>
            </form>

            {/* Exact Required Footer Link */}
            <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              New to INNOVEXA?{' '}
              <button
                type="button"
                onClick={() => setActiveTab('signup')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--coral)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0,
                  fontFamily: 'var(--font-sans)',
                  fontSize: '0.9rem'
                }}
              >
                CREATE ACCOUNT ↗
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(32, 33, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.5rem'
        }}>
          <div className="editorial-card" style={{
            maxWidth: '480px',
            width: '100%',
            backgroundColor: 'var(--bg-white)',
            padding: '2.5rem',
            borderTop: '4px solid var(--coral)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
          }}>
            <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '0.5rem' }}>
              ✦ CREDENTIAL RECOVERY
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Reset Your Password</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Enter the email address registered with your INNOVEXA account to receive password reset instructions.
            </p>

            {resetSuccessNotice ? (
              <div>
                <div style={{
                  padding: '1.25rem',
                  backgroundColor: 'rgba(105, 184, 154, 0.12)',
                  border: '1px solid rgba(105, 184, 154, 0.3)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  marginBottom: '1.5rem'
                }}>
                  <CheckCircle2 size={20} color="var(--green)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--green)', fontSize: '0.92rem', marginBottom: '0.2rem' }}>
                      Instructions Transmitted
                    </div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      A secure recovery link has been dispatched to <strong>{forgotEmail}</strong>. Follow the link in that email to choose a new password.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword}>
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">REGISTERED EMAIL</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@organization.com"
                    className="form-input"
                    required
                    autoFocus
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="btn btn-secondary"
                    disabled={isResetSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-coral"
                    disabled={isResetSubmitting}
                  >
                    {isResetSubmitting ? 'DISPATCHING...' : 'SEND RECOVERY EMAIL ↗'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
