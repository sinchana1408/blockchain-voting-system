import { getDbConnection } from './config/db.js';

async function upgrade() {
  const db = await getDbConnection();

  try {
    const [cols] = await db.query('DESCRIBE candidates');
    const colNames = cols.map(col => col.Field);

    if (!colNames.includes('manifesto')) {
      await db.query('ALTER TABLE candidates ADD COLUMN manifesto TEXT');
      console.log('Added manifesto column');
    }
    if (!colNames.includes('avatar')) {
      await db.query('ALTER TABLE candidates ADD COLUMN avatar VARCHAR(50) DEFAULT "🏛️"');
      console.log('Added avatar column');
    }

    await db.query('UPDATE candidates SET manifesto = ?, avatar = ? WHERE id = ?', [
      'Focusing on digital civic infrastructure, municipal broadband, and algorithmic transparency.',
      '🏛️',
      'cand_1'
    ]);
    await db.query('UPDATE candidates SET manifesto = ?, avatar = ? WHERE id = ?', [
      'Promoting distributed autonomous municipal services, clean energy grid modernization, and tax efficiency.',
      '🌐',
      'cand_2'
    ]);
    await db.query('UPDATE candidates SET manifesto = ?, avatar = ? WHERE id = ?', [
      'Championing cryptographic privacy rights, independent civic oversight, and transparent public budgeting.',
      '⚖️',
      'cand_3'
    ]);

    await db.query(`
      CREATE TABLE IF NOT EXISTS election_config (
        config_key VARCHAR(100) PRIMARY KEY,
        config_value TEXT NOT NULL
      )
    `);

    const defaults = [
      ['election_title', 'National Decentralized Governance Election 2026'],
      ['election_status', 'ACTIVE'],
      ['auto_mine', 'true'],
      ['difficulty', '2']
    ];

    for (const [k, v] of defaults) {
      await db.query(
        'INSERT INTO election_config (config_key, config_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE config_key=config_key',
        [k, v]
      );
    }

    console.log('✅ Database upgraded successfully');
  } catch (err) {
    console.error('Upgrade error:', err);
  } finally {
    await db.end();
  }
}

upgrade();
