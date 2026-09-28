import React, { useState, useEffect } from 'react';
import {
  fetchAdminConfig,
  updateAdminConfig,
  addCandidate,
  deleteCandidate,
  remineConsensus,
  resetElection
} from '../services/api';

export default function AdminPanel({ onConfigUpdated, candidates = [], onCandidateChanged }) {
  const [config, setConfig] = useState({
    election_title: '',
    election_status: 'ACTIVE',
    auto_mine: 'true',
    difficulty: '2'
  });
  const [stats, setStats] = useState({ totalVoters: 0, totalVoted: 0 });

  // New Candidate Form State
  const [candName, setCandName] = useState('');
  const [candParty, setCandParty] = useState('');
  const [candManifesto, setCandManifesto] = useState('');
  const [candAvatar, setCandAvatar] = useState('🏛️');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const loadConfig = async () => {
    try {
      const res = await fetchAdminConfig();
      if (res.data.config) {
        setConfig(prev => ({ ...prev, ...res.data.config }));
      }
      if (res.data.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Error loading admin config:', err);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await updateAdminConfig(config);
      setMessage('✓ Election configuration updated live across all consensus nodes.');
      if (onConfigUpdated) onConfigUpdated(config);
    } catch (err) {
      setMessage('Failed to update configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    if (!candName.trim() || !candParty.trim()) return;

    setLoading(true);
    setMessage('');
    try {
      await addCandidate({
        name: candName,
        party: candParty,
        manifesto: candManifesto,
        avatar: candAvatar
      });
      setCandName('');
      setCandParty('');
      setCandManifesto('');
      setMessage(`✓ Candidate "${candName}" registered on the blockchain.`);
      if (onCandidateChanged) onCandidateChanged();
    } catch (err) {
      setMessage('Error adding candidate.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCandidate = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove candidate "${name}"?`)) return;

    try {
      await deleteCandidate(id);
      setMessage(`✓ Candidate "${name}" removed from the ballot.`);
      if (onCandidateChanged) onCandidateChanged();
    } catch (err) {
      setMessage('Error removing candidate.');
    }
  };

  const handleRemine = async () => {
    if (!window.confirm('Re-compute Proof-of-Work consensus across all ledger blocks?')) return;
    setLoading(true);
    try {
      await remineConsensus();
      setMessage('✓ Blockchain consensus repaired and all block hashes re-validated.');
      if (onConfigUpdated) onConfigUpdated();
    } catch (err) {
      setMessage('Error repairing chain.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('⚠️ WARNING: This will reset all ballots, clear mempool, and reset ledger to Genesis Block. Proceed?')) return;
    setLoading(true);
    try {
      await resetElection();
      setMessage('✓ Election reset to clean genesis state.');
      if (onConfigUpdated) onConfigUpdated();
    } catch (err) {
      setMessage('Error resetting election.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: 40 }}>
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <span>⚙️</span> Election Authority & Admin Node Controls
          </h2>
          <p className="section-subtitle">
            Dynamic governance: manage candidates, election lifecycle, consensus rules, and ledger repair
          </p>
        </div>
      </div>

      {message && (
        <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.25)', color: '#38bdf8', padding: '10px 16px', borderRadius: 10, marginBottom: 20, fontSize: '0.85rem' }}>
          {message}
        </div>
      )}

      {/* Grid: 2 Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
        
        {/* Column 1: Election Lifecycle & Consensus Rules */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>🏛️</span> Governance & Lifecycle
          </h3>

          <form onSubmit={handleSaveConfig}>
            <div className="form-group">
              <label className="form-label">Election Title</label>
              <input
                type="text"
                value={config.election_title || ''}
                onChange={(e) => setConfig({ ...config, election_title: e.target.value })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Election Status</label>
              <select
                value={config.election_status}
                onChange={(e) => setConfig({ ...config, election_status: e.target.value })}
                className="form-input"
                style={{ background: '#080d1a', color: '#fff' }}
              >
                <option value="ACTIVE">🟢 ACTIVE (Voting Open)</option>
                <option value="PAUSED">🟡 PAUSED (Voting Suspended)</option>
                <option value="ENDED">🔴 ENDED (Results Finalized)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Consensus Block Mining Mode</label>
              <select
                value={config.auto_mine}
                onChange={(e) => setConfig({ ...config, auto_mine: e.target.value })}
                className="form-input"
                style={{ background: '#080d1a', color: '#fff' }}
              >
                <option value="true">⚡ Auto-Mine on Ballot Submission (Instant Confirmation)</option>
                <option value="false">⏳ Manual Block Mining (Batch confirmation in Mempool)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Proof-of-Work Difficulty (Leading Zeroes)</label>
              <select
                value={config.difficulty}
                onChange={(e) => setConfig({ ...config, difficulty: e.target.value })}
                className="form-input"
                style={{ background: '#080d1a', color: '#fff' }}
              >
                <option value="1">Level 1 (Fast: 0...)</option>
                <option value="2">Level 2 (Standard: 00...)</option>
                <option value="3">Level 3 (High: 000...)</option>
              </select>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>
              {loading ? 'Propagating Rules...' : 'Save & Propagate Rules'}
            </button>
          </form>

          <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 10 }}>Consensus Maintenance</h4>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleRemine} className="btn btn-secondary" style={{ flex: 1, fontSize: '0.8rem' }}>
                🛠️ Re-Mine / Self-Heal Chain
              </button>
              <button onClick={handleReset} className="btn btn-danger" style={{ fontSize: '0.8rem' }}>
                ⚠️ Reset Election
              </button>
            </div>
          </div>
        </div>

        {/* Column 2: Dynamic Candidate Registration */}
        <div className="card">
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>➕</span> Register Dynamic Candidate
          </h3>

          <form onSubmit={handleAddCandidate}>
            <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label">Symbol</label>
                <select
                  value={candAvatar}
                  onChange={(e) => setCandAvatar(e.target.value)}
                  className="form-input"
                  style={{ background: '#080d1a', color: '#fff', textAlign: 'center', fontSize: '1.2rem', padding: '8px' }}
                >
                  <option value="🏛️">🏛️</option>
                  <option value="🌐">🌐</option>
                  <option value="⚖️">⚖️</option>
                  <option value="🚀">🚀</option>
                  <option value="🌿">🌿</option>
                  <option value="🛡️">🛡️</option>
                  <option value="💡">💡</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Full Candidate Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Maya Patel"
                  value={candName}
                  onChange={(e) => setCandName(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Party / Coalition Affiliation</label>
              <input
                type="text"
                placeholder="e.g. Democratic Innovation Alliance"
                value={candParty}
                onChange={(e) => setCandParty(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Civic Manifesto & Agenda Quote</label>
              <textarea
                rows={3}
                placeholder="Key campaign pledges, reform priorities, and public commitment."
                value={candManifesto}
                onChange={(e) => setCandManifesto(e.target.value)}
                className="form-input"
                style={{ resize: 'vertical' }}
              />
            </div>

            <button type="submit" disabled={loading || !candName.trim() || !candParty.trim()} className="btn btn-success" style={{ width: '100%' }}>
              Add Candidate to Ballot
            </button>
          </form>

          {/* Active Candidates List */}
          <div style={{ marginTop: 20 }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
              Active Ballot Candidates ({candidates.length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
              {candidates.map((c) => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(8, 13, 26, 0.6)', padding: '8px 12px', borderRadius: 8, fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>{c.avatar || '🏛️'}</span>
                    <div>
                      <strong>{c.name}</strong>
                      <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>({c.party})</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteCandidate(c.id, c.name)}
                    style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', fontSize: '0.85rem' }}
                    title="Remove from ballot"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
