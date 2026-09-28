import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api'
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('voterToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Authentication
export const registerVoter = (voterId, password) => API.post('/auth/register', { voterId, password });
export const loginVoter = (voterId, password) => API.post('/auth/login', { voterId, password });

// Voting & Blockchain
export const fetchCandidates = () => API.get('/blockchain/candidates');
export const castVote = (candidateId) => API.post('/vote', { candidateId });
export const mineBlock = () => API.post('/blockchain/mine');
export const fetchChain = () => API.get('/blockchain/chain');
export const fetchResults = () => API.get('/blockchain/results');
export const tamperBlock = (blockIndex, tamperedVotes) => API.post('/blockchain/tamper', { blockIndex, tamperedVotes });
export const verifyBallot = (query) => API.get(`/blockchain/verify-ballot/${encodeURIComponent(query)}`);

// Admin & Governance Controls
export const fetchAdminConfig = () => API.get('/admin/config');
export const updateAdminConfig = (data) => API.post('/admin/config', data);
export const addCandidate = (data) => API.post('/admin/candidates', data);
export const deleteCandidate = (id) => API.delete(`/admin/candidates/${id}`);
export const remineConsensus = () => API.post('/admin/re-mine-consensus');
export const resetElection = () => API.post('/admin/reset-election');