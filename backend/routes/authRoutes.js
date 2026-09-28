import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { calculateHash } from '../utils/cryptoUtils.js';
import { getDbConnection } from '../config/db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_blockchain_jwt_key_2026';

router.post('/register', async (req, res) => {
  let db;
  try {
    const { voterId, password } = req.body;
    if (!voterId || !password) {
      return res.status(400).json({ error: "Voter ID and password are required." });
    }

    db = await getDbConnection();
    const [existing] = await db.query('SELECT * FROM voters WHERE voter_id = ?', [voterId]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "Voter ID is already registered." });
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const voterHash = calculateHash(voterId);

    await db.query(
      'INSERT INTO voters (id, voter_id, password_hash, has_voted) VALUES (?, ?, ?, 0)',
      [voterHash, voterId, hashPassword]
    );

    res.status(201).json({ message: "Registration successful", voterHash });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    if (db) await db.end();
  }
});

router.post('/login', async (req, res) => {
  let db;
  try {
    const { voterId, password } = req.body;
    if (!voterId || !password) {
      return res.status(400).json({ error: "Voter ID and password are required." });
    }

    db = await getDbConnection();
    const [rows] = await db.query('SELECT * FROM voters WHERE voter_id = ?', [voterId]);
    const voter = rows[0];

    if (!voter || !(await bcrypt.compare(password, voter.password_hash))) {
      return res.status(401).json({ error: "Invalid Credentials" });
    }

    const token = jwt.sign(
      { voterHash: voter.id, voterId: voter.voter_id, hasVoted: voter.has_voted },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({ token, voterHash: voter.id, hasVoted: Boolean(voter.has_voted) });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    if (db) await db.end();
  }
});

export default router;