import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-primary)',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '560px',
        textAlign: 'center',
        padding: '3.5rem 2.5rem',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div className="editorial-mono-label" style={{ color: 'var(--coral)', marginBottom: '1rem', letterSpacing: '0.12em' }}>
          404 / ERROR
        </div>
        <h1 style={{
          fontFamily: 'var(--font-editorial)',
          fontSize: 'clamp(2.4rem, 5vw, 3.4rem)',
          lineHeight: 1.1,
          color: 'var(--text-primary)',
          marginBottom: '1rem',
          textTransform: 'uppercase'
        }}>
          Specimen Not Located.
        </h1>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: '1rem',
          lineHeight: 1.6,
          marginBottom: '2rem'
        }}>
          The coordinate or archive resource you attempted to reach has either migrated, been consolidated, or never existed in the ecosystem.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
            style={{ gap: '0.5rem' }}
          >
            <ArrowLeft size={16} /> Return Back
          </button>
          <button
            onClick={() => navigate('/home')}
            className="btn btn-coral"
            style={{ gap: '0.5rem' }}
          >
            <Compass size={16} /> Workspace Home
          </button>
        </div>
      </div>
    </div>
  );
}