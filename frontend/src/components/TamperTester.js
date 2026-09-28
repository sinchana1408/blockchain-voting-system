import React, { useState } from 'react';

export default function TamperTester({ onTamper, chainValid, maxBlockIndex = 1 }) {
  const [blockIndex, setBlockIndex] = useState(1);
  const isValid = Boolean(chainValid?.valid);

  const handleTamperClick = () => {
    onTamper(blockIndex, [
      {
        voterHash: 'MALICIOUS_INJECTED_NODE',
        candidateId: 'cand_1',
        candidateName: 'ILLEGAL_BALLOT_TAMPERED',
        timestamp: Date.now(),
        signature: 'INVALID_CRYPTOGRAPHIC_SIGNATURE'
      }
    ]);
  };

  return (
    <div className={`card audit-card ${isValid ? 'valid' : 'invalid'}`}>
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <span>🛡️</span> Cryptographic Security & Tamper Audit
          </h2>
          <p className="section-subtitle">
            Demonstrate blockchain immutability by altering block data and observing SHA-256 consensus failure
          </p>
        </div>
      </div>

      <div className={`audit-status-banner ${isValid ? 'valid' : 'invalid'}`}>
        <span style={{ fontSize: '1.4rem' }}>{isValid ? '🛡️' : '🚨'}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
            {isValid ? 'Network Status: 100% Secure & Immutable' : 'CRITICAL ALERT: Block Tampering Detected'}
          </div>
          <div style={{ fontSize: '0.82rem', marginTop: 2 }}>
            {isValid
              ? 'All block hashes, previous hash pointers, and transaction signatures match cryptographic consensus.'
              : chainValid?.reason || 'A block payload does not match its recorded SHA-256 hash!'}
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(8, 13, 26, 0.4)', borderRadius: 12, padding: 18, marginTop: 16 }}>
        <h4 style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
          Simulate Adversarial Attack (51% / Tamper Simulation)
        </h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 14 }}>
          In traditional databases, an administrator can secretly alter records. In this blockchain, changing even a single byte in a block causes the SHA-256 hash to mismatch, immediately alerting all nodes in the network.
        </p>

        <div className="tamper-form">
          <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Target Block Index:
          </label>
          <input
            type="number"
            min={1}
            max={Math.max(maxBlockIndex, 1)}
            value={blockIndex}
            onChange={(e) => setBlockIndex(Math.max(1, Number(e.target.value)))}
            className="tamper-input"
          />
          <button
            onClick={handleTamperClick}
            className="btn btn-danger"
          >
            <span>⚡ Inject Tampered Ballot into Block #{blockIndex}</span>
          </button>
        </div>
      </div>
    </div>
  );
}