import React, { useState } from 'react';
import { verifyBallot } from '../services/api';

export default function BallotVerifier() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await verifyBallot(query.trim());
      setResult(res.data);
    } catch (err) {
      setResult({
        found: false,
        message: 'Network error communicating with blockchain node.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: 40 }}>
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <span>🔍</span> Public Ballot Audit & Verifier
          </h2>
          <p className="section-subtitle">
            Zero-knowledge ballot verification: prove your vote was included in the ledger without exposing your choice
          </p>
        </div>
      </div>

      <form onSubmit={handleVerify} style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Paste Receipt ID (e.g. VCT-...) or SHA-256 Digital Signature"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="form-input"
          style={{ flex: 1, minWidth: 260 }}
        />
        <button type="submit" disabled={loading || !query.trim()} className="btn btn-primary" style={{ padding: '12px 24px' }}>
          {loading ? 'Verifying Ledger...' : 'Audit Ballot 🔍'}
        </button>
      </form>

      {result && (
        <div style={{ marginTop: 24 }}>
          {result.found ? (
            <div
              style={{
                background: result.status === 'CONFIRMED' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                border: `1px solid ${result.status === 'CONFIRMED' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                borderRadius: 14,
                padding: 20
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: '1.4rem' }}>{result.status === 'CONFIRMED' ? '✅' : '⏳'}</span>
                <div>
                  <h4 style={{ color: result.status === 'CONFIRMED' ? '#34d399' : '#fbbf24', fontSize: '1.05rem', fontWeight: 700 }}>
                    {result.status === 'CONFIRMED' ? 'Ballot Cryptographically Confirmed On-Chain' : 'Ballot Verified in Mempool Queue'}
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{result.message}</p>
                </div>
              </div>

              {result.block && (
                <div style={{ background: 'rgba(8, 13, 26, 0.7)', borderRadius: 10, padding: 14, marginTop: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, fontSize: '0.82rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Block Height:</span> <strong>#{result.block.index}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Mined Nonce:</span> <strong>{result.block.nonce}</strong>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Block Hash:</span>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: '#38bdf8', wordBreak: 'break-all' }}>
                        {result.block.hash}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                background: 'rgba(244, 63, 94, 0.08)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: 14,
                padding: 18,
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}
            >
              <span style={{ fontSize: '1.4rem' }}>❌</span>
              <div>
                <h4 style={{ color: '#fb7185', fontSize: '0.95rem', fontWeight: 700 }}>Record Not Found</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {result.message} Please verify that your receipt key was typed correctly.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
