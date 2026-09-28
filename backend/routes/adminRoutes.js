import express from 'express';
import { getDbConnection } from '../config/db.js';
import { Block } from '../models/Block.js';
import { broadcast } from '../server.js';

const router = express.Router();

// GET /api/admin/config - Get current election status, settings, voter statistics
router.get('/config', async (req, res) => {
  let db;
  try {
    db = await getDbConnection();
    const [cfgRows] = await db.query('SELECT * FROM election_config');
    const config = {};
    cfgRows.forEach(row => {
      config[row.config_key] = row.config_value;
    });

    const [voterStats] = await db.query(`
      SELECT 
        COUNT(*) as totalVoters,
        SUM(CASE WHEN has_voted = 1 THEN 1 ELSE 0 END) as totalVoted
      FROM voters
    `);

    return res.json({
      config,
      stats: {
        totalVoters: voterStats[0].totalVoters || 0,
        totalVoted: voterStats[0].totalVoted || 0
      }
    });
  } catch (error) {
    console.error('Error fetching admin config:', error);
    return res.status(500).json({ error: 'Failed to fetch config' });
  } finally {
    if (db) await db.end();
  }
});

// POST /api/admin/config - Update election settings
router.post('/config', async (req, res) => {
  let db;
  try {
    const { election_title, election_status, auto_mine, difficulty } = req.body;
    db = await getDbConnection();

    const updates = {
      ...(election_title !== undefined && { election_title }),
      ...(election_status !== undefined && { election_status }),
      ...(auto_mine !== undefined && { auto_mine: String(auto_mine) }),
      ...(difficulty !== undefined && { difficulty: String(difficulty) })
    };

    for (const [k, v] of Object.entries(updates)) {
      await db.query(
        'INSERT INTO election_config (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_value = ?',
        [k, v, v]
      );
    }

    broadcast('ELECTION_CONFIG_CHANGED', updates);
    return res.json({ message: 'Configuration updated successfully', updates });
  } catch (error) {
    console.error('Error updating config:', error);
    return res.status(500).json({ error: 'Failed to update config' });
  } finally {
    if (db) await db.end();
  }
});

// POST /api/admin/candidates - Add a new dynamic candidate
router.post('/candidates', async (req, res) => {
  let db;
  try {
    const { name, party, manifesto, avatar } = req.body;
    if (!name || !party) {
      return res.status(400).json({ error: 'Candidate Name and Party are required.' });
    }

    const id = 'cand_' + Date.now();
    db = await getDbConnection();

    await db.query(
      'INSERT INTO candidates (id, name, party, manifesto, avatar) VALUES (?, ?, ?, ?, ?)',
      [
        id,
        name.trim(),
        party.trim(),
        (manifesto || 'Committed to civic progress and open governance.').trim(),
        avatar || '🏛️'
      ]
    );

    const [all] = await db.query('SELECT * FROM candidates');
    broadcast('CANDIDATES_UPDATED', all);

    return res.status(201).json({
      message: `Candidate "${name}" registered successfully!`,
      candidate: { id, name, party, manifesto, avatar }
    });
  } catch (error) {
    console.error('Error adding candidate:', error);
    return res.status(500).json({ error: 'Failed to add candidate' });
  } finally {
    if (db) await db.end();
  }
});

// DELETE /api/admin/candidates/:id - Delete candidate
router.delete('/candidates/:id', async (req, res) => {
  let db;
  try {
    const { id } = req.params;
    db = await getDbConnection();

    await db.query('DELETE FROM candidates WHERE id = ?', [id]);
    const [all] = await db.query('SELECT * FROM candidates');
    broadcast('CANDIDATES_UPDATED', all);

    return res.json({ message: 'Candidate removed successfully' });
  } catch (error) {
    console.error('Error deleting candidate:', error);
    return res.status(500).json({ error: 'Failed to delete candidate' });
  } finally {
    if (db) await db.end();
  }
});

// POST /api/admin/re-mine-consensus - Re-computes Proof-of-Work to heal/re-establish valid chain
router.post('/re-mine-consensus', async (req, res) => {
  let db;
  try {
    db = await getDbConnection();
    const [blocks] = await db.query('SELECT * FROM blocks ORDER BY block_index ASC');

    if (blocks.length === 0) {
      return res.status(400).json({ error: 'No blocks in chain to re-mine.' });
    }

    let previousHash = '0';
    const difficulty = 2;

    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      if (b.block_index === 0) {
        previousHash = b.hash;
        continue;
      }

      const votes = typeof b.votes === 'string' ? JSON.parse(b.votes || '[]') : b.votes;
      const reMinedBlock = new Block(b.block_index, b.timestamp, votes, previousHash);
      reMinedBlock.mineBlock(difficulty);

      await db.query(
        'UPDATE blocks SET previous_hash = ?, hash = ?, nonce = ? WHERE block_index = ?',
        [reMinedBlock.previousHash, reMinedBlock.hash, reMinedBlock.nonce, b.block_index]
      );

      previousHash = reMinedBlock.hash;
    }

    broadcast('CHAIN_HEALED', { message: 'Consensus repaired across all blocks.' });
    return res.json({ message: 'Chain consensus repaired and re-mined successfully!' });
  } catch (error) {
    console.error('Error re-mining chain:', error);
    return res.status(500).json({ error: 'Failed to repair chain' });
  } finally {
    if (db) await db.end();
  }
});

// POST /api/admin/reset-election - Complete reset to clean slate
router.post('/reset-election', async (req, res) => {
  let db;
  try {
    db = await getDbConnection();
    await db.query('DELETE FROM pending_votes');
    await db.query('DELETE FROM blocks WHERE block_index > 0');
    await db.query('UPDATE voters SET has_voted = 0');

    broadcast('ELECTION_RESET', { message: 'Election reset to genesis state.' });
    return res.json({ message: 'Election successfully reset to initial genesis state!' });
  } catch (error) {
    console.error('Error resetting election:', error);
    return res.status(500).json({ error: 'Failed to reset election' });
  } finally {
    if (db) await db.end();
  }
});

export default router;
