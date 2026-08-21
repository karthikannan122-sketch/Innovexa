import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { StorageService } from '../services/storage';
import { Sparkles, Key, Check, AlertCircle, X, Shield } from 'lucide-react';

/**
 * ApiKeyModal — Gemini AI Engine Configurator
 */
export default function ApiKeyModal() {
  const { isApiKeyModalOpen, setIsApiKeyModalOpen, apiKey, setApiKey, showToast } = useAuth();
  const [inputVal, setInputVal] = useState(apiKey || '');

  if (!isApiKeyModalOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    setApiKey(inputVal.trim());
    StorageService.setGeminiApiKey(inputVal.trim());
    setIsApiKeyModalOpen(false);
    showToast(inputVal.trim() ? 'Gemini AI API Key configured!' : 'Using local rule-based clustering engine.', 'success');
  };

  return (
    <div className="modal-backdrop" onClick={() => setIsApiKeyModalOpen(false)}>
      <div
        className="command-dialog"
        onClick={e => e.stopPropagation()}
        style={{ padding: '2.5rem', maxWidth: '540px', borderRadius: 'var(--radius-lg)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <div className="editorial-mono-label" style={{ color: 'var(--rose-pink)', marginBottom: '0.25rem' }}>
              INTELLIGENCE ENGINE
            </div>
            <h2 style={{ fontSize: '1.65rem' }}>Configure Gemini AI</h2>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setIsApiKeyModalOpen(false)}>✕</button>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
          Provide your Google Gemini API key to enable live LLM synthesis of peer review critique. If omitted, INNOVEXA uses our built-in local clustering heuristics.
        </p>

        <form onSubmit={handleSave}>
          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label className="form-label">GEMINI API KEY</label>
            <input
              type="password"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder="AIzaSy..."
              className="form-input"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" onClick={() => setIsApiKeyModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ gap: '0.45rem' }}>
              <Key size={14} /> Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
