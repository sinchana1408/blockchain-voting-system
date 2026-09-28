import React, { useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import Header from './components/Header';
import CandidateCard from './components/CandidateCard';
import BlockExplorer from './components/BlockExplorer';
import AnalyticsChart from './components/AnalyticsChart';
import TamperTester from './components/TamperTester';
import VoteModal from './components/VoteModal';
import BallotReceiptModal from './components/BallotReceiptModal';
import BallotVerifier from './components/BallotVerifier';
import AdminPanel from './components/AdminPanel';
import { AuthContext } from './context/AuthContext';
import {
  fetchCandidates,
  fetchChain,
  fetchResults,
  castVote,
  mineBlock,
  tamperBlock,
  fetchAdminConfig
} from './services/api';

export default function App() {
  const { user, markVoted, openAuthModal } = useContext(AuthContext);

  const [candidates, setCandidates] = useState([]);
  const [chain, setChain] = useState([]);
  const [mempool, setMempool] = useState([]);
  const [results, setResults] = useState([]);
  const [chainValid, setChainValid] = useState({ valid: true });
  const [electionTitle, setElectionTitle] = useState('National Decentralized Governance Election 2026');
  const [electionStatus, setElectionStatus] = useState('ACTIVE');

  const [activeTab, setActiveTab] = useState('all');
  const [isMining, setIsMining] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [ballotReceipt, setBallotReceipt] = useState(null);

  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const loadData = async () => {
    try {
      const [candRes, chainRes, resRes, cfgRes] = await Promise.all([
        fetchCandidates(),
        fetchChain(),
        fetchResults(),
        fetchAdminConfig()
      ]);

      setCandidates(candRes.data || []);
      setChain(chainRes.data?.chain || []);
      setMempool(chainRes.data?.mempool || []);
      setChainValid(chainRes.data?.status || { valid: true });
      setResults(resRes.data || []);

      if (cfgRes.data?.config) {
        if (cfgRes.data.config.election_title) {
          setElectionTitle(cfgRes.data.config.election_title);
        }
        if (cfgRes.data.config.election_status) {
          setElectionStatus(cfgRes.data.config.election_status);
        }
      }
    } catch (err) {
      console.error('Error loading blockchain data:', err);
    }
  };

  // Initial load & real-time WebSocket connection
  useEffect(() => {
    loadData();

    const socket = io('http://localhost:5000');

    socket.on('VOTE_RECORDED', (data) => {
      addToast(
        `⚡ Live Vote Recorded: Ballot signed & ${
          data.autoMined
            ? `instantly mined into Block #${data.minedBlock?.index}!`
            : 'queued in mempool!'
        }`,
        'info'
      );
      loadData();
    });

    socket.on('BLOCK_MINED', (data) => {
      addToast(`⛏️ New Block #${data.block?.index} mined and confirmed on-chain!`, 'success');
      loadData();
    });

    socket.on('CHAIN_TAMPERED', () => {
      addToast('🚨 SECURITY AUDIT: Ledger payload altered! Consensus mismatch flagged.', 'error');
      loadData();
    });

    socket.on('CHAIN_HEALED', () => {
      addToast('🛡️ Chain consensus re-computed and restored across network.', 'success');
      loadData();
    });

    socket.on('CANDIDATES_UPDATED', (allCandidates) => {
      if (allCandidates) setCandidates(allCandidates);
      loadData();
    });

    socket.on('ELECTION_CONFIG_CHANGED', () => {
      loadData();
    });

    socket.on('ELECTION_RESET', () => {
      addToast('Election reset to initial genesis block.', 'info');
      loadData();
    });

    // Fallback polling every 8s
    const pollInterval = setInterval(loadData, 8000);

    return () => {
      socket.disconnect();
      clearInterval(pollInterval);
    };
  }, []);

  const handleVote = async (id, candidateName) => {
    if (!user) {
      openAuthModal();
      return;
    }

    try {
      const res = await castVote(id);
      markVoted();

      if (res.data.receipt) {
        setBallotReceipt(res.data.receipt);
      }

      addToast(res.data.message || 'Ballot submitted successfully!', 'success');
      loadData();
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Failed to submit ballot.';
      addToast(errMsg, 'error');
    }
  };

  const handleMine = async () => {
    if (mempool.length === 0) return;
    setIsMining(true);
    addToast('Computing Proof-of-Work nonce...', 'info');

    try {
      const res = await mineBlock();
      addToast(`Block #${res.data?.block?.index || ''} mined successfully!`, 'success');
      loadData();
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Block mining failed.';
      addToast(errMsg, 'error');
    } finally {
      setIsMining(false);
    }
  };

  const handleTamper = async (index, votes) => {
    try {
      await tamperBlock(index, votes);
      addToast(`Block #${index} payload tampered. Security audit active.`, 'error');
      loadData();
    } catch (err) {
      addToast('Error simulating block tampering.', 'error');
    }
  };

  // KPI Metrics Calculation
  const totalVotesCast = results.reduce((sum, r) => sum + (r.voteCount || r.votes || 0), 0);
  const totalBlocks = chain.length;
  const pendingTransactions = mempool.length;
  const isChainSecure = Boolean(chainValid?.valid);

  return (
    <div className="app-container">
      <Header />
      <VoteModal />
      <BallotReceiptModal receipt={ballotReceipt} onClose={() => setBallotReceipt(null)} />

      {/* Election Title Banner */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#fff' }}>
            {electionTitle}
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Official Decoupled Ledger • SHA-256 Proof-of-Work Consensus • Zero-Knowledge Receipts
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: '0.8rem',
              fontWeight: 700,
              background:
                electionStatus === 'ACTIVE'
                  ? 'rgba(16, 185, 129, 0.15)'
                  : electionStatus === 'PAUSED'
                  ? 'rgba(245, 158, 11, 0.15)'
                  : 'rgba(244, 63, 94, 0.15)',
              color:
                electionStatus === 'ACTIVE'
                  ? '#34d399'
                  : electionStatus === 'PAUSED'
                  ? '#fbbf24'
                  : '#fb7185',
              border: `1px solid ${
                electionStatus === 'ACTIVE'
                  ? 'rgba(16, 185, 129, 0.3)'
                  : electionStatus === 'PAUSED'
                  ? 'rgba(245, 158, 11, 0.3)'
                  : 'rgba(244, 63, 94, 0.3)'
              }`
            }}
          >
            {electionStatus === 'ACTIVE'
              ? '● Voting Open'
              : electionStatus === 'PAUSED'
              ? '⏸ Voting Paused'
              : '🛑 Voting Concluded'}
          </span>
        </div>
      </div>

      {/* Network Overview / KPI Metrics Banner */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span>Total Ledger Height</span>
            <span>⛓️</span>
          </div>
          <div className="stat-value">{totalBlocks} Blocks</div>
          <div className="stat-desc">Genesis Root + Mined Records</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Confirmed Ballots</span>
            <span>🗳️</span>
          </div>
          <div className="stat-value">{totalVotesCast}</div>
          <div className="stat-desc">Permanently recorded on-chain</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Mempool Backlog</span>
            <span>⏳</span>
          </div>
          <div className="stat-value" style={{ color: pendingTransactions > 0 ? 'var(--accent-amber)' : 'inherit' }}>
            {pendingTransactions} Pending
          </div>
          <div className="stat-desc">Awaiting Proof-of-Work validation</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Network Security</span>
            <span>🛡️</span>
          </div>
          <div
            className="stat-value"
            style={{
              fontSize: '1.25rem',
              color: isChainSecure ? 'var(--accent-emerald)' : 'var(--accent-rose)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 4
            }}
          >
            <span>{isChainSecure ? '100% Immutable' : 'Tamper Alert'}</span>
          </div>
          <div className="stat-desc">
            {isChainSecure ? 'Consensus chain verified' : 'Hash collision detected'}
          </div>
        </div>
      </div>

      {/* Tab Filter Controls */}
      <div className="nav-tabs">
        <button
          className={`nav-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <span>🌐</span> Dashboard
        </button>
        <button
          className={`nav-tab ${activeTab === 'vote' ? 'active' : ''}`}
          onClick={() => setActiveTab('vote')}
        >
          <span>🗳️</span> Ballot Booth ({candidates.length})
        </button>
        <button
          className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <span>📊</span> Live Tally
        </button>
        <button
          className={`nav-tab ${activeTab === 'verify' ? 'active' : ''}`}
          onClick={() => setActiveTab('verify')}
        >
          <span>🔍</span> Verify Ballot
        </button>
        <button
          className={`nav-tab ${activeTab === 'explorer' ? 'active' : ''}`}
          onClick={() => setActiveTab('explorer')}
        >
          <span>⛓️</span> Explorer ({totalBlocks})
        </button>
        <button
          className={`nav-tab ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <span>🛡️</span> Security Lab
        </button>
        <button
          className={`nav-tab ${activeTab === 'admin' ? 'active' : ''}`}
          onClick={() => setActiveTab('admin')}
        >
          <span>⚙️</span> Election Authority
        </button>
      </div>

      {/* View 1: Ballot Booth (Candidates) */}
      {(activeTab === 'all' || activeTab === 'vote') && (
        <section style={{ marginBottom: 40 }}>
          <div className="section-header">
            <div>
              <h2 className="section-title">
                <span>🏛️</span> Official Election Candidates
              </h2>
              <p className="section-subtitle">
                Cast your confidential cryptographic ballot. Votes are signed with private identity tokens and verified by network consensus.
              </p>
            </div>
          </div>

          <div className="candidate-grid">
            {candidates.map((c) => {
              const candResult = results.find((r) => r.id === c.id);
              const votesCount = candResult ? (candResult.voteCount || candResult.votes || 0) : 0;

              return (
                <CandidateCard
                  key={c.id}
                  candidate={c}
                  onVote={handleVote}
                  user={user}
                  openAuthModal={openAuthModal}
                  votesCount={votesCount}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* View 2: Analytics & Live Results */}
      {(activeTab === 'all' || activeTab === 'analytics') && (
        <AnalyticsChart results={results} />
      )}

      {/* View 3: Ballot Verifier Tool */}
      {(activeTab === 'all' || activeTab === 'verify') && (
        <BallotVerifier />
      )}

      {/* View 4: Blockchain Ledger Explorer */}
      {(activeTab === 'all' || activeTab === 'explorer') && (
        <BlockExplorer
          chain={chain}
          mempool={mempool}
          onMine={handleMine}
          isMining={isMining}
        />
      )}

      {/* View 5: Security Audit & Tamper Tester */}
      {(activeTab === 'all' || activeTab === 'security') && (
        <TamperTester
          onTamper={handleTamper}
          chainValid={chainValid}
          maxBlockIndex={chain.length - 1}
        />
      )}

      {/* View 6: Election Authority / Admin Controls */}
      {(activeTab === 'all' || activeTab === 'admin') && (
        <AdminPanel
          onConfigUpdated={loadData}
          candidates={candidates}
          onCandidateChanged={loadData}
        />
      )}

      {/* Toast Notification Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <span>
              {toast.type === 'success' && '✅'}
              {toast.type === 'error' && '⚠️'}
              {toast.type === 'info' && 'ℹ️'}
            </span>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}