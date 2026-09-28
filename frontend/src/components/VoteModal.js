import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { loginVoter, registerVoter } from '../services/api';

export default function VoteModal() {
  const { user, login, isAuthModalOpen, closeAuthModal } = useContext(AuthContext);
  const [voterId, setVoterId] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in or modal is explicitly closed, do not render
  if (user || !isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!voterId.trim() || !password.trim()) {
      setError('Please provide both Voter ID and Password.');
      return;
    }

    setLoading(true);

    try {
      if (isRegistering) {
        await registerVoter(voterId, password);
      }
      const res = await loginVoter(voterId, password);
      login(res.data.token, res.data.voterHash, Boolean(res.data.hasVoted), voterId);
      setVoterId('');
      setPassword('');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Authentication error. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={closeAuthModal}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={closeAuthModal}
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            fontSize: '1.2rem',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>

        <div className="modal-header">
          <div className="modal-icon">
            <span>🗳️</span>
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
            {isRegistering ? 'Register Voter Identity' : 'Voter Authentication'}
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Zero-knowledge cryptographic signature verification
          </p>
        </div>

        <div className="modal-tabs">
          <button
            type="button"
            className={`modal-tab-btn ${!isRegistering ? 'active' : ''}`}
            onClick={() => { setIsRegistering(false); setError(''); }}
          >
            Login
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${isRegistering ? 'active' : ''}`}
            onClick={() => { setIsRegistering(true); setError(''); }}
          >
            Register New ID
          </button>
        </div>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Voter Identification Key</label>
            <input
              type="text"
              placeholder="e.g. VOTER-2026-9042"
              value={voterId}
              onChange={(e) => setVoterId(e.target.value)}
              className="form-input"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Secret Passphrase</label>
            <input
              type="password"
              placeholder="Enter your confidential passphrase"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 8, padding: '12px' }}
          >
            {loading ? (
              'Processing Cryptographic Key...'
            ) : isRegistering ? (
              'Create Identity & Enter Booth'
            ) : (
              'Authenticate & Sign In'
            )}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {isRegistering ? 'Already possess a registered key?' : "Haven't registered your voter ID yet?"}{' '}
          </span>
          <button
            type="button"
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-cyan)',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isRegistering ? 'Sign In Here' : 'Register Here'}
          </button>
        </div>
      </div>
    </div>
  );
}