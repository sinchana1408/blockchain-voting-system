import React, { useState } from 'react';

export default function BallotReceiptModal({ receipt, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!receipt) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(receipt.receiptId || receipt.signature);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <button
          onClick={onClose}
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
          <div className="modal-icon" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))' }}>
            <span>📜</span>
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>
            Cryptographic Ballot Receipt
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
            ✓ Permanently Secured by SHA-256 Consensus
          </p>
        </div>

        <div style={{ background: 'rgba(8, 13, 26, 0.7)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <div style={{ marginBottom: 14 }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Official Receipt Key
            </span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', color: '#38bdf8', fontWeight: 700, marginTop: 2 }}>
              {receipt.receiptId}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Candidate</span>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{receipt.candidateName}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ledger Placement</span>
              <div style={{ fontWeight: 700, color: 'var(--accent-emerald)', fontSize: '0.9rem' }}>
                {typeof receipt.blockIndex === 'number' ? `Block #${receipt.blockIndex}` : receipt.blockIndex}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Timestamp</span>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {new Date(receipt.timestamp).toLocaleString()}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Digital Signature (Hash)</span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)', wordBreak: 'break-all', marginTop: 3 }}>
              {receipt.signature}
            </div>
          </div>
        </div>

        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 18, lineHeight: 1.4 }}>
          Keep this receipt ID. You can verify this ballot at any time in the <strong>Ballot Verifier</strong> tab without compromising voter secrecy.
        </p>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleCopy} className="btn btn-secondary" style={{ flex: 1 }}>
            {copied ? '✓ Copied to Clipboard' : '📋 Copy Receipt ID'}
          </button>
          <button onClick={onClose} className="btn btn-primary" style={{ flex: 1 }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
