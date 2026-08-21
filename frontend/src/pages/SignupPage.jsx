import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowUpRight, ArrowRight, ShieldCheck, Sparkles, CheckCircle2, AlertCircle, Mail } from 'lucide-react';

/**
 * SignupPage — Create Account Flow connected to Supabase Authentication
 * Heading: START SOMETHING NEW.
 * Supporting: Your next idea, product, or startup starts with a conversation.
 * Fields: FULL NAME, EMAIL ADDRESS, PASSWORD, CONFIRM PASSWORD, Terms checkbox
 * Button: CREATE MY ACCOUNT ↗
 * Link: Already part of INNOVEXA? SIGN IN ↗
 */
export default function SignupPage({ setActiveTab }) {
  const { signup, showToast } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmationNotice, setConfirmationNotice] = useState(false);

  // Synchronous lock to prevent duplicate clicks and multi-submissions
  const isSubmittingRef = useRef(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingRef.current || isSubmitting) return;

    setErrorMessage('');

    // 1. Full name is required
    if (!fullName.trim()) {
      const err = 'Full name is required.';
      setErrorMessage(err);
      showToast(err, 'warning');
      return;
    }

    // 2. Email is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      const err = 'Please provide a valid email address.';
      setErrorMessage(err);
      showToast(err, 'warning');
      return;
    }

    // 3. Password is at least 6 characters
    if (password.length < 6) {
      const err = 'Password must be at least 6 characters long.';
      setErrorMessage(err);
      showToast(err, 'warning');
      return;
    }

    // 4. Password and Confirm Password must match
    if (password !== confirmPassword) {
      const err = 'Password and Confirm Password do not match.';
      setErrorMessage(err);
      showToast(err, 'warning');
      return;
    }

    // 5. Terms agreement
    if (!agreedToTerms) {
      const err = 'Please accept the Terms and Privacy Policy to continue.';
      setErrorMessage(err);
      showToast(err, 'warning');
      return;
    }

    // Lock submission immediately to prevent duplicate requests
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const res = await signup({
        name: fullName.trim(),
        email: email.trim(),
        password: password
      });

      if (res.success) {
        if (res.emailConfirmationRequired) {
          setConfirmationNotice(true);
        } else {
          // Direct transition to personalized onboarding
          setActiveTab('onboarding');
        }
      } else {
        setErrorMessage(res.error || 'Failed to create account. Please try again.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '88vh', display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-ivory)', padding: '3rem 0' }}>
      <div className="workspace-container" style={{ maxWidth: '1080px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '4rem', alignItems: 'center' }}>
          
          {/* Left Column: Statement & Value Proposition */}
          <div>
            <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '1rem' }}>
              01 / MEMBERSHIP REGISTRATION
            </div>

            {/* Exact Required Heading */}
            <div style={{ lineHeight: 0.98, marginBottom: '2rem' }}>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(3.2rem, 6.5vw, 5.2rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
                START
              </div>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(3.2rem, 6.5vw, 5.2rem)', fontWeight: 800, color: 'var(--coral)', fontStyle: 'italic', margin: '0.2rem 0' }}>
                SOMETHING
              </div>
              <div style={{ fontFamily: 'var(--font-editorial)', fontSize: 'clamp(3.2rem, 6.5vw, 5.2rem)', fontWeight: 800, color: 'var(--text-primary)' }}>
                NEW.
              </div>
            </div>

            {/* Exact Supporting Text */}
            <p className="editorial-lead" style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
              Your next idea, product, or startup starts with a conversation.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                <span style={{ color: 'var(--coral)', marginTop: '0.15rem' }}>✦</span>
                <span style={{ fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                  <strong>Structured Critique:</strong> Rubric-driven evaluation without social noise.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                <span style={{ color: 'var(--periwinkle)', marginTop: '0.15rem' }}>✦</span>
                <span style={{ fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                  <strong>Fluency Matching:</strong> Connect with validators matched to your problem space.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
                <span style={{ color: 'var(--green)', marginTop: '0.15rem' }}>✦</span>
                <span style={{ fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                  <strong>Reputation Ledger:</strong> Earn credits as you review and refine peer innovations.
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Real Signup Form */}
          <div className="editorial-card" style={{ padding: '3rem', backgroundColor: 'var(--bg-white)', borderLeft: '4px solid var(--coral)' }}>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.85rem', marginBottom: '0.4rem' }}>Create Account</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
                Join the network to publish specimens, review innovations, and access consensus insights.
              </p>
            </div>

            {/* Email Confirmation Notice state */}
            {confirmationNotice ? (
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
                  <Mail size={24} />
                </div>
                <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Account Created</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                  Your account was created. Please verify your email before signing in.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Proceed to Sign In ↗
                </button>
              </div>
            ) : (
              <div>
                {/* Error Banner */}
                {errorMessage && (
                  <div style={{ backgroundColor: 'rgba(231, 111, 130, 0.1)', border: '1px solid rgba(231, 111, 130, 0.3)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'flex-start', gap: '0.65rem', color: 'var(--red)', fontSize: '0.86rem', lineHeight: 1.45, marginBottom: '1.25rem' }}>
                    <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                    <div>{errorMessage}</div>
                  </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>

                {/* FULL NAME */}
                <div className="form-group">
                  <label className="form-label">FULL NAME</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => {
                      setFullName(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="e.g. Maya Lin"
                    className="form-input"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {/* EMAIL ADDRESS */}
                <div className="form-group">
                  <label className="form-label">EMAIL ADDRESS</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="name@organization.com"
                    className="form-input"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {/* PASSWORD */}
                <div className="form-group">
                  <label className="form-label">PASSWORD</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="••••••••"
                    className="form-input"
                    required
                    minLength={6}
                    disabled={isSubmitting}
                  />
                </div>

                {/* CONFIRM PASSWORD */}
                <div className="form-group">
                  <label className="form-label">CONFIRM PASSWORD</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => {
                      setConfirmPassword(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    placeholder="••••••••"
                    className="form-input"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {/* TERMS CHECKBOX */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.25rem' }}>
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    checked={agreedToTerms}
                    onChange={e => setAgreedToTerms(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--coral)', cursor: 'pointer' }}
                    required
                    disabled={isSubmitting}
                  />
                  <label htmlFor="agreeTerms" style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    I agree to the <span style={{ textDecoration: 'underline', color: 'var(--text-primary)' }}>Terms</span> and <span style={{ textDecoration: 'underline', color: 'var(--text-primary)' }}>Privacy Policy</span>.
                  </label>
                </div>

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-coral btn-lg"
                  style={{ width: '100%', marginTop: '0.75rem', gap: '0.5rem', opacity: isSubmitting ? 0.65 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
                >
                  {isSubmitting ? 'CREATING ACCOUNT...' : 'CREATE MY ACCOUNT ↗'}
                </button>

                {/* LINK TO SIGN IN */}
                <div style={{ textAlign: 'center', marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-hairline)', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  Already part of INNOVEXA?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--coral)', fontWeight: 700, padding: '0.2rem 0.4rem' }}
                  >
                    SIGN IN ↗
                  </button>
                </div>
              </form>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
