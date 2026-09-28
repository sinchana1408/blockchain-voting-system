import React from 'react';

export default function CandidateCard({ candidate, onVote, user, openAuthModal, votesCount = 0 }) {
  const avatar = candidate.avatar || '🏛️';
  const manifesto = candidate.manifesto || 'Committed to public service, ethical leadership, and transparent civic administration.';

  const handleVoteClick = () => {
    if (!user) {
      openAuthModal();
      return;
    }
    onVote(candidate.id, candidate.name);
  };

  const isVoted = user?.hasVoted;

  return (
    <div className="candidate-card">
      <div>
        <div className="candidate-top">
          <div className="candidate-avatar">
            <span>{avatar}</span>
          </div>
          <div className="candidate-info">
            <h3>{candidate.name}</h3>
            <span className="candidate-party">{candidate.party}</span>
          </div>
        </div>

        <p className="candidate-manifesto">
          "{manifesto}"
        </p>
      </div>

      <div>
        <div className="candidate-footer">
          <div className="candidate-stats">
            <span className="candidate-votes">{votesCount}</span>
            <span className="candidate-votes-label">Confirmed Ballots</span>
          </div>

          <button
            disabled={isVoted}
            onClick={handleVoteClick}
            className={`btn ${isVoted ? 'btn-secondary' : 'btn-primary'}`}
            style={{ width: '100%', maxWidth: '170px' }}
          >
            {!user ? (
              'Connect & Vote'
            ) : isVoted ? (
              'Ballot Cast ✓'
            ) : (
              'Cast Ballot 🗳️'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}