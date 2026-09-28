import React from 'react';

export default function AnalyticsChart({ results = [] }) {
  const totalVotes = results.reduce((sum, r) => sum + (r.voteCount || r.votes || 0), 0);
  const maxVotes = Math.max(...results.map(r => r.voteCount || r.votes || 0), 1);

  // Determine leader if votes > 0
  const leader = totalVotes > 0 
    ? [...results].sort((a, b) => (b.voteCount || b.votes || 0) - (a.voteCount || a.votes || 0))[0] 
    : null;

  return (
    <div className="card analytics-card">
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <span>📊</span> Live Election Analytics & Tally
          </h2>
          <p className="section-subtitle">
            Cryptographically audited tallies directly computed from immutable ledger blocks
          </p>
        </div>

        {totalVotes > 0 && (
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Ballots</span>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{totalVotes}</div>
          </div>
        )}
      </div>

      {results.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>Loading candidate analytics...</p>
      ) : (
        <div>
          {results.map((item) => {
            const count = item.voteCount || item.votes || 0;
            const percentage = totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(1) : 0;
            const isLeader = leader && leader.id === item.id && count > 0;

            return (
              <div key={item.id} className="tally-row">
                <div className="tally-header">
                  <div className="tally-name">
                    <span>{item.name}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>({item.party})</span>
                    {isLeader && <span className="leader-badge">★ Projected Leader</span>}
                  </div>
                  <div className="tally-count">
                    <span>{count} {count === 1 ? 'Vote' : 'Votes'}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 8 }}>({percentage}%)</span>
                  </div>
                </div>

                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${totalVotes > 0 ? (count / maxVotes) * 100 : 0}%`,
                      background: isLeader 
                        ? 'linear-gradient(90deg, #10b981, #06b6d4)' 
                        : 'linear-gradient(90deg, #0284c7, #3b82f6)'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}