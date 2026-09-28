import express from 'express';
import { getDbConnection } from '../config/db.js';
import { Block } from '../models/Block.js';
import { calculateBlockHash } from '../utils/cryptoUtils.js';
import { broadcast } from '../server.js';

const router = express.Router();

// GET /api/blockchain/candidates - Returns all dynamic candidates with avatar and manifesto
router.get('/candidates', async (req, res) => {
  let db;
  try {
    db = await getDbConnection();
    const [candidates] = await db.query('SELECT * FROM candidates ORDER BY id ASC');
    return res.json(candidates);
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return res.status(500).json({ error: 'Failed to fetch candidates' });
  } finally {
    if (db) await db.end();
  }
});

// GET /api/blockchain/chain - Returns chain, mempool, and security audit status
router.get('/chain', async (req, res) => {
  let db;
  try {
    db = await getDbConnection();
    const [blocks] = await db.query('SELECT * FROM blocks ORDER BY block_index ASC');
    const [mempoolRows] = await db.query('SELECT * FROM pending_votes ORDER BY timestamp ASC');

    const formattedBlocks = blocks.map(block => ({
      index: block.block_index,
      timestamp: block.timestamp,
      votes: typeof block.votes === 'string' ? JSON.parse(block.votes || '[]') : block.votes,
      previousHash: block.previous_hash,
      hash: block.hash,
      nonce: block.nonce
    }));

    const formattedMempool = mempoolRows.map(row => ({
      id: row.id,
      voterHash: row.voter_hash,
      candidateId: row.candidate_id,
      timestamp: row.timestamp,
      signature: row.signature
    }));

    // Verify blockchain integrity
    let status = { valid: true };
    for (let i = 1; i < formattedBlocks.length; i++) {
      const current = formattedBlocks[i];
      const previous = formattedBlocks[i - 1];

      // Check linkage
      if (current.previousHash !== previous.hash) {
        status = {
          valid: false,
          reason: `Broken chain link at Block #${current.index}: Previous hash pointer mismatch.`
        };
        break;
      }

      // Check recalculated hash
      const recomputedHash = calculateBlockHash(
        current.index,
        current.previousHash,
        current.timestamp,
        current.votes,
        current.nonce
      );

      if (current.hash !== recomputedHash) {
        status = {
          valid: false,
          reason: `Hash mismatch at Block #${current.index}. Block payload was tampered!`
        };
        break;
      }
    }

    return res.json({
      chain: formattedBlocks,
      mempool: formattedMempool,
      status
    });
  } catch (error) {
    console.error('Error fetching chain:', error);
    return res.status(500).json({ error: 'Failed to fetch blockchain data' });
  } finally {
    if (db) await db.end();
  }
});

// GET /api/blockchain/verify-ballot/:query - Look up ballot by receipt ID, signature, or voter hash
router.get('/verify-ballot/:query', async (req, res) => {
  let db;
  try {
    const query = req.params.query.trim().toLowerCase();
    db = await getDbConnection();

    // Check mempool first
    const [mempoolRows] = await db.query('SELECT * FROM pending_votes');
    for (const row of mempoolRows) {
      if (
        (row.signature && row.signature.toLowerCase() === query) ||
        (row.voter_hash && row.voter_hash.toLowerCase() === query) ||
        (row.id && row.id.toLowerCase() === query)
      ) {
        return res.json({
          found: true,
          status: 'MEMPOOL',
          message: 'Ballot verified in Mempool. Awaiting next block mining.',
          details: {
            voterHash: row.voter_hash,
            candidateId: row.candidate_id,
            timestamp: row.timestamp,
            signature: row.signature
          }
        });
      }
    }

    // Check confirmed blocks
    const [blocks] = await db.query('SELECT * FROM blocks ORDER BY block_index ASC');
    for (const block of blocks) {
      const votes = typeof block.votes === 'string' ? JSON.parse(block.votes || '[]') : block.votes;
      if (Array.isArray(votes)) {
        for (const vote of votes) {
          const computedReceipt = vote.signature 
            ? `VCT-${Number(vote.timestamp).toString(36).toUpperCase()}-${vote.signature.substring(0, 6).toUpperCase()}`.toLowerCase()
            : '';

          if (
            (vote.receiptId && vote.receiptId.toLowerCase() === query) ||
            computedReceipt === query ||
            (vote.signature && vote.signature.toLowerCase() === query) ||
            (vote.voterHash && vote.voterHash.toLowerCase() === query)
          ) {
            return res.json({
              found: true,
              status: 'CONFIRMED',
              message: `Ballot cryptographically confirmed on-chain in Block #${block.block_index}!`,
              block: {
                index: block.block_index,
                hash: block.hash,
                previousHash: block.previous_hash,
                timestamp: block.timestamp,
                nonce: block.nonce
              },
              vote
            });
          }
        }
      }
    }

    return res.json({
      found: false,
      message: 'No cryptographic ballot found matching your receipt key.'
    });
  } catch (error) {
    console.error('Error verifying ballot:', error);
    return res.status(500).json({ error: 'Failed to verify ballot' });
  } finally {
    if (db) await db.end();
  }
});

// POST /api/blockchain/mine - Mines pending votes into a new block
router.post('/mine', async (req, res) => {
  let db;
  try {
    db = await getDbConnection();
    const [pendingRows] = await db.query('SELECT * FROM pending_votes ORDER BY timestamp ASC');

    if (!pendingRows || pendingRows.length === 0) {
      return res.status(400).json({ error: 'No pending votes in the mempool to mine!' });
    }

    const [latestRows] = await db.query('SELECT * FROM blocks ORDER BY block_index DESC LIMIT 1');
    const latestBlock = latestRows[0];

    const nextIndex = latestBlock ? latestBlock.block_index + 1 : 1;
    const previousHash = latestBlock ? latestBlock.hash : '0';
    const timestamp = new Date().toISOString();

    const votesToMine = pendingRows.map(r => ({
      receiptId: `VCT-${Number(r.timestamp).toString(36).toUpperCase()}-${r.signature.substring(0, 6).toUpperCase()}`,
      signature: r.signature,
      voterHash: r.voter_hash,
      candidateId: r.candidate_id,
      timestamp: r.timestamp
    }));

    const difficulty = parseInt(process.env.MINING_DIFFICULTY, 10) || 2;
    const newBlock = new Block(nextIndex, timestamp, votesToMine, previousHash);
    newBlock.mineBlock(difficulty);

    // Save block to database
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

    // Clear mined votes from pending_votes
    await db.query('DELETE FROM pending_votes');

    broadcast('BLOCK_MINED', {
      block: newBlock
    });

    return res.json({
      message: `Block #${newBlock.index} mined and added to blockchain successfully!`,
      block: newBlock
    });
  } catch (error) {
    console.error('Error mining block:', error);
    return res.status(500).json({ error: error.message || 'Failed to mine block' });
  } finally {
    if (db) await db.end();
  }
});

// POST /api/blockchain/tamper - Simulates a hack by altering stored votes without remining
router.post('/tamper', async (req, res) => {
  let db;
  try {
    const { blockIndex, tamperedVotes } = req.body;
    if (blockIndex === undefined || blockIndex === null) {
      return res.status(400).json({ error: 'blockIndex is required' });
    }

    db = await getDbConnection();
    const [rows] = await db.query('SELECT * FROM blocks WHERE block_index = ?', [blockIndex]);
    if (rows.length === 0) {
      return res.status(404).json({ error: `Block #${blockIndex} does not exist.` });
    }

    const votesPayload = JSON.stringify(tamperedVotes || ['TAMPERED_ILLEGAL_BALLOT']);
    await db.query('UPDATE blocks SET votes = ? WHERE block_index = ?', [votesPayload, blockIndex]);

    broadcast('CHAIN_TAMPERED', { blockIndex });

    return res.json({ message: `Block #${blockIndex} votes tampered successfully!` });
  } catch (error) {
    console.error('Error tampering block:', error);
    return res.status(500).json({ error: 'Failed to simulate tamper' });
  } finally {
    if (db) await db.end();
  }
});

// GET /api/blockchain/results - Tallies votes from all mined blocks
router.get('/results', async (req, res) => {
  let db;
  try {
    db = await getDbConnection();
    const [candidates] = await db.query('SELECT * FROM candidates ORDER BY id ASC');
    const [blocks] = await db.query('SELECT * FROM blocks ORDER BY block_index ASC');

    const tally = {};
    candidates.forEach(c => {
      tally[c.id] = { 
        id: c.id, 
        name: c.name, 
        party: c.party, 
        avatar: c.avatar || '🏛️',
        manifesto: c.manifesto || '',
        votes: 0, 
        voteCount: 0 
      };
    });

    blocks.forEach(block => {
      const votes = typeof block.votes === 'string' ? JSON.parse(block.votes || '[]') : block.votes;
      if (Array.isArray(votes)) {
        votes.forEach(vote => {
          const candId = vote.candidate_id || vote.candidateId;
          if (candId && tally[candId]) {
            tally[candId].votes += 1;
            tally[candId].voteCount += 1;
          }
        });
      }
    });

    return res.json(Object.values(tally));
  } catch (error) {
    console.error('Error computing election results:', error);
    return res.status(500).json({ error: 'Failed to compute results' });
  } finally {
    if (db) await db.end();
  }
});

export default router;