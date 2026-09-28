import React, { useState } from 'react';

export default function BlockExplorer({ chain = [], mempool = [], onMine, isMining = false }) {
  const [copiedHash, setCopiedHash] = useState(null);
  const [expandedBlock, setExpandedBlock] = useState(null);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const toggleExpand = (index) => {
    setExpandedBlock(expandedBlock === index ? null : index);
  };

  return (
    <div style={{ marginBottom: 40 }}>
      <div className="explorer-controls">
        <div>
          <h2 className="section-title">
            <span>🔗</span> Blockchain Ledger Explorer
          </h2>
          <p className="section-subtitle">
            Cryptographic ledger containing immutable proof-of-work blocks and verified ballots
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="mempool-banner">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: mempool.length > 0 ? '#f59e0b' : '#10b981' }}></span>
            <span>Mempool: <strong>{mempool.length}</strong> Pending</span>
          </div>

          <button
            onClick={onMine}
            disabled={mempool.length === 0 || isMining}
            className="btn btn-success"
          >
            {isMining ? (
              <span>⛏️ Computing Nonce...</span>
            ) : (
              <span>⛏️ Mine Block ({mempool.length})</span>
            )}
          </button>
        </div>
      </div>

      {/* Mempool Preview if any */}
      {mempool.length > 0 && (
        <div className="card" style={{ marginBottom: 20, borderColor: 'rgba(245, 158, 11, 0.3)' }}>
          <h4 style={{ fontSize: '0.9rem', color: '#fbbf24', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⏳</span> Unconfirmed Ballot Pool (Mempool)
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {mempool.map((tx, idx) => (
              <div key={tx.id || idx} className="tx-item">
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-cyan)' }}>
                  Voter: {tx.voterHash ? `${tx.voterHash.substring(0, 14)}...` : 'Unknown'}
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  Ballot: Candidate #{tx.candidateId}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {new Date(Number(tx.timestamp)).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chain of Blocks */}
      <div className="blocks-flow">
        {chain.map((block) => {
          const isGenesis = block.index === 0;
          const votesCount = Array.isArray(block.votes) ? block.votes.length : 0;
          const isExpanded = expandedBlock === block.index;

          return (
            <div
              key={block.index}
              className={`block-card ${isGenesis ? 'genesis' : 'standard'}`}
            >
              <div className="block-header">
                <div className="block-tag">
                  <span className="block-number">
                    {isGenesis ? 'Genesis Block #0' : `Block #${block.index}`}
                  </span>
                  <span className="block-badge">Nonce: {block.nonce}</span>
                  <span className="block-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399' }}>
                    {votesCount} {votesCount === 1 ? 'Transaction' : 'Transactions'}
                  </span>
                </div>

                <div className="block-time">
                  {new Date(block.timestamp).toLocaleString()}
                </div>
              </div>

              <div className="block-hashes">
                <div className="hash-box">
                  <div className="hash-label">Block Hash (SHA-256)</div>
                  <div className="hash-value">
                    <span>{block.hash}</span>
                    <button
                      className="copy-btn"
                      onClick={() => handleCopy(block.hash)}
                      title="Copy Hash"
                    >
                      {copiedHash === block.hash ? '✓ Copied' : '📋'}
                    </button>
                  </div>
                </div>

                <div className="hash-box">
                  <div className="hash-label">Previous Block Hash</div>
                  <div className="hash-value" style={{ color: 'var(--text-muted)' }}>
                    <span>{block.previousHash}</span>
                    <button
                      className="copy-btn"
                      onClick={() => handleCopy(block.previousHash)}
                      title="Copy Previous Hash"
                    >
                      {copiedHash === block.previousHash ? '✓ Copied' : '📋'}
                    </button>
                  </div>
                </div>
              </div>

              {votesCount > 0 ? (
                <div className="transactions-section">
                  <div
                    onClick={() => toggleExpand(block.index)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <span className="tx-header">
                      Payload Ballots ({votesCount})
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
                      {isExpanded ? 'Collapse ▲' : 'Inspect Transactions ▼'}
                    </span>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {block.votes.map((vote, vIdx) => {
                        const isObject = typeof vote === 'object' && vote !== null;
                        return (
                          <div key={vIdx} className="tx-item">
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#93c5fd' }}>
                              {isObject ? `Voter: ${vote.voterHash ? vote.voterHash.substring(0, 12) + '...' : 'Anonymous'}` : String(vote)}
                            </span>
                            {isObject && (
                              <span style={{ color: '#38bdf8' }}>
                                Candidate: {vote.candidateName || vote.candidateId}
                              </span>
                            )}
                            {isObject && vote.signature && (
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }} title={`Sig: ${vote.signature}`}>
                                Sig: {vote.signature.substring(0, 8)}...
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  {isGenesis ? 'Genesis Block — Network Root Anchor' : 'No transactions recorded in this block.'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}