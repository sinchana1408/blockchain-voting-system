import crypto from 'crypto';

export function calculateHash(data) {
  return crypto.createHash('sha256').update(String(data)).digest('hex');
}

export function calculateBlockHash(index, previousHash, timestamp, votes, nonce) {
  const votesString = JSON.stringify(votes);
  return calculateHash(`${index}${previousHash}${timestamp}${votesString}${nonce}`);
}