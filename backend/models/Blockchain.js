import { getDbConnection } from '../config/db.js';

export class Blockchain {
  constructor() {
    this.chain = [];
    this.pendingVotes = [];
  }

  async initialize() {
    let db;
    try {
      db = await getDbConnection();

      // Use MySQL query method db.query instead of db.all
      const [rows] = await db.query('SELECT * FROM blocks ORDER BY block_index ASC');

      if (rows && rows.length > 0) {
        this.chain = rows.map(row => ({
          index: row.block_index,
          timestamp: row.timestamp,
          votes: typeof row.votes === 'string' ? JSON.parse(row.votes) : row.votes,
          previousHash: row.previous_hash,
          hash: row.hash,
          nonce: row.nonce
        }));
      } else {
        await this.createGenesisBlock(db);
      }
    } catch (error) {
      console.error('Error during Blockchain initialization:', error);
    } finally {
      if (db) await db.end();
    }
  }

  async createGenesisBlock(db) {
    const genesisBlock = {
      index: 0,
      timestamp: new Date().toISOString(),
      votes: [],
      previousHash: '0',
      hash: '0000genesis_hash',
      nonce: 0
    };

    this.chain = [genesisBlock];

    await db.query(
      `INSERT INTO blocks (block_index, timestamp, votes, previous_hash, hash, nonce)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE block_index=block_index`,
      [
        genesisBlock.index,
        genesisBlock.timestamp,
        JSON.stringify(genesisBlock.votes),
        genesisBlock.previousHash,
        genesisBlock.hash,
        genesisBlock.nonce
      ]
    );
  }
}