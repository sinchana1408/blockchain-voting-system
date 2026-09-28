import { getDbConnection } from './config/db.js';

export async function initDB() {
  const db = await getDbConnection();

  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS candidates (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        party VARCHAR(255) NOT NULL,
        manifesto TEXT,
        avatar VARCHAR(50) DEFAULT '🏛️'
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS voters (
        id VARCHAR(255) PRIMARY KEY,
        voter_id VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        has_voted TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS pending_votes (
        id VARCHAR(255) PRIMARY KEY,
        voter_hash VARCHAR(255) NOT NULL,
        candidate_id VARCHAR(255) NOT NULL,
        timestamp BIGINT NOT NULL,
        signature TEXT NOT NULL
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS blocks (
        block_index INT PRIMARY KEY,
        timestamp VARCHAR(255) NOT NULL,
        votes LONGTEXT NOT NULL,
        previous_hash VARCHAR(255) NOT NULL,
        hash VARCHAR(255) NOT NULL,
        nonce INT NOT NULL
      );
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS election_config (
        config_key VARCHAR(100) PRIMARY KEY,
        config_value TEXT NOT NULL
      );
    `);

    // Seed initial candidates if table is empty
    const [rows] = await db.query('SELECT COUNT(*) as count FROM candidates');
    if (rows[0].count === 0) {
      await db.query(`
        INSERT INTO candidates (id, name, party, manifesto, avatar) VALUES
        ('cand_1', 'Alice Johnson', 'Progressive Tech Alliance', 'Focusing on digital civic infrastructure, municipal broadband, and algorithmic transparency.', '🏛️'),
        ('cand_2', 'Bob Smith', 'National Decentralized Party', 'Promoting distributed autonomous municipal services, clean energy grid modernization, and tax efficiency.', '🌐'),
        ('cand_3', 'Charlie Davis', 'Cyber Governance Coalition', 'Championing cryptographic privacy rights, independent civic oversight, and transparent public budgeting.', '⚖️')
      `);
    }

    const [cfgRows] = await db.query('SELECT COUNT(*) as count FROM election_config');
    if (cfgRows[0].count === 0) {
      await db.query(`
        INSERT INTO election_config (config_key, config_value) VALUES
        ('election_title', 'National Decentralized Governance Election 2026'),
        ('election_status', 'ACTIVE'),
        ('auto_mine', 'true'),
        ('difficulty', '2')
      `);
    }

    console.log('✅ MySQL Database & Tables Initialized');
  } finally {
    await db.end();
  }
}