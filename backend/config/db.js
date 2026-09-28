import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export async function getDbConnection() {
  return await mysql.createConnection({
    host: '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Sinchi@1408hemashiv',
    database: process.env.DB_NAME || 'blockchain_voting',
    port: 3306
  });
}