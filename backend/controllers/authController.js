import { getDbConnection } from '../config/db.js';

export const register = async (req, res) => {
  const { voter_id, password } = req.body;

  if (!voter_id || !password) {
    return res.status(400).json({ error: 'Please enter both Voter ID and Password.' });
  }

  let db;
  try {
    db = await getDbConnection();

    // Check existing
    const [existing] = await db.query('SELECT * FROM voters WHERE voter_id = ?', [voter_id]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Voter ID already registered!' });
    }

    // Insert new voter
    await db.query(
      'INSERT INTO voters (voter_id, password, has_voted) VALUES (?, ?, 0)',
      [voter_id, password]
    );

    return res.status(201).json({ message: 'Voter registered successfully!' });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({ error: 'Internal server error during registration.' });
  } finally {
    if (db) await db.end();
  }
};