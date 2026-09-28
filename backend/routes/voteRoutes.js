import express from 'express';
import jwt from 'jsonwebtoken';
import { calculateHash } from '../utils/cryptoUtils.js';
import { getDbConnection } from '../config/db.js';
import { Block } from '../models/Block.js';
import { broadcast } from '../server.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_blockchain_jwt_key_2026';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Access token required. Please authenticate your Voter ID." });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Session expired. Please log in again." });
    req.user = user;
    next();
  });
}

router.post('/', authenticateToken, async (req, res) => {
  let db;
  try {
    const { candidateId } = req.body;
    const { voterHash } = req.user;

    if (!candidateId) {
      return res.status(400).json({ error: "Candidate ID is required to cast a ballot." });
    }

    db = await getDbConnection();

    // Check election status
    const [cfgRows] = await db.query('SELECT * FROM election_config');
    const config = {};
    cfgRows.forEach(r => config[r.config_key] = r.config_value);

    if (config.election_status === 'PAUSED') {
      return res.status(403).json({ error: "Voting is temporarily paused by the Election Authority." });
    }
    if (config.election_status === 'ENDED') {
      return res.status(403).json({ error: "The election has concluded. Ballots are finalized." });
    }

    // Check if voter already cast ballot
    const [voters] = await db.query('SELECT * FROM voters WHERE id = ?', [voterHash]);
    if (!voters || voters.length === 0) {
      return res.status(404).json({ error: "Voter identity not found in database." });
    }

    if (voters[0].has_voted) {
      return res.status(400).json({ error: "Your ballot has already been permanently recorded on the blockchain!" });
    }

    // Verify candidate exists
    const [candidates] = await db.query('SELECT * FROM candidates WHERE id = ?', [candidateId]);
    if (!candidates || candidates.length === 0) {
      return res.status(404).json({ error: "Candidate does not exist." });
    }
    const candidate = candidates[0];

    const timestamp = Date.now();
    const signature = calculateHash(`${voterHash}:${candidateId}:${timestamp}`);
    const receiptId = `VCT-${timestamp.toString(36).toUpperCase()}-${signature.substring(0, 6).toUpperCase()}`;
    
    const voteObj = { 
      voterHash, 
      candidateId, 
      candidateName: candidate.name, 
      timestamp, 
      signature,
      receiptId
    };

    // Queue vote into pending_votes mempool
    await db.query(
      'INSERT INTO pending_votes (id, voter_hash, candidate_id, timestamp, signature) VALUES (?, ?, ?, ?, ?)',
      [signature, voterHash, candidateId, timestamp, signature]
    );

    // Mark voter as having voted
    await db.query('UPDATE voters SET has_voted = 1 WHERE id = ?', [voterHash]);

    // Check if auto_mine is enabled
    let minedBlock = null;
    if (config.auto_mine === 'true') {
      const [pendingRows] = await db.query('SELECT * FROM pending_votes ORDER BY timestamp ASC');
      const [latestRows] = await db.query('SELECT * FROM blocks ORDER BY block_index DESC LIMIT 1');
      const latestBlock = latestRows[0];

      const nextIndex = latestBlock ? latestBlock.block_index + 1 : 1;
      const previousHash = latestBlock ? latestBlock.hash : '0';
      const blockTimestamp = new Date().toISOString();

      const votesToMine = pendingRows.map(r => ({
        receiptId: receiptId || `VCT-${Number(r.timestamp).toString(36).toUpperCase()}-${r.signature.substring(0, 6).toUpperCase()}`,
        signature: r.signature,
        voterHash: r.voter_hash,
        candidateId: r.candidate_id,
        candidateName: candidate.name,
        timestamp: r.timestamp
      }));

      const difficulty = parseInt(config.difficulty, 10) || 2;
      const newBlock = new Block(nextIndex, blockTimestamp, votesToMine, previousHash);
      newBlock.mineBlock(difficulty);

      await db.query(
        `INSERT INTO blocks (block_index, timestamp, votes, previous_hash, hash, nonce)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          newBlock.index,
          newBlock.timestamp,
          JSON.stringify(newBlock.votes),
          newBlock.previousHash,
          newBlock.hash,
          newBlock.nonce
        ]
      );

      await db.query('DELETE FROM pending_votes');
      minedBlock = newBlock;
    }

    // Broadcast real-time WebSocket event to all connected users
    broadcast('VOTE_RECORDED', {
      vote: voteObj,
      autoMined: Boolean(minedBlock),
      minedBlock
    });

    res.json({ 
      message: minedBlock 
        ? `Ballot verified and automatically mined into Block #${minedBlock.index}!` 
        : "Ballot cryptographically signed and queued in mempool.",
      vote: voteObj,
      receipt: {
        receiptId,
        voterHash,
        candidateName: candidate.name,
        timestamp,
        signature,
        blockIndex: minedBlock ? minedBlock.index : 'Pending Mempool Confirmation'
      }
    });
  } catch (err) {
    console.error("Voting error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    if (db) await db.end();
  }
});

export default router;