import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Header() {
  const { user, logout, openAuthModal } = useContext(AuthContext);

  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-icon">
          <span>🗳️</span>
        </div>
        <div>
          <div className="brand-title">VoteChain Core</div>
          <div className="brand-subtitle">Decentralized Governance Protocol</div>
        </div>
      </div>

      <div className="header-status-badge">
        <span className="pulse-dot"></span>
        <span>Consensus Network Active</span>
      </div>

      <div className="header-actions">
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="voter-badge">
              <span style={{ color: 'var(--text-muted)' }}>Voter:</span>
              <span className="voter-hash" title={user.voterHash}>
                {user.voterId || (user.voterHash ? `${user.voterHash.substring(0, 10)}...` : 'Voter')}
              </span>
              {user.hasVoted ? (
                <span style={{ fontSize: '0.72rem', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                  VOTED ✓
                </span>
              ) : (
                <span style={{ fontSize: '0.72rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                  ELIGIBLE
                </span>
              )}
            </div>
            <button onClick={logout} className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
              Disconnect
            </button>
          </div>
        ) : (
          <button onClick={openAuthModal} className="btn btn-primary" style={{ padding: '8px 18px' }}>
            <span>🔑 Connect Voter ID</span>
          </button>
        )}
      </div>
    </header>
  );
}